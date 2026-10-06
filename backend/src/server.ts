import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { aiChatController } from './controllers/aiController.js';
import { AppointmentEmailConfigurationError, sendAppointmentEmail } from './appointmentEmail.js';
import { optionalAuth, requireAdmin, requireAuth, signToken } from './auth.js';
import { initializeDatabase, pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim());
let databaseReady = false;

function requireDatabase(_req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!databaseReady) {
    return res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'The hospital database is unavailable. Start PostgreSQL and configure DATABASE_URL.' },
    });
  }
  return next();
}

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '32kb' }));

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(8).max(30),
  password: z.string().min(10).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const appointmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(30),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  date: z.string().date(),
  departmentId: z.string().min(2),
  message: z.string().trim().max(2000).optional().default(''),
});

const appointmentStatusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']) });

app.get('/api/health', (_req, res) => {
  if (!databaseReady) return res.status(503).json({ status: 'degraded', service: 'sanjeevani-backend', database: 'disconnected' });
  return res.json({ status: 'ok', service: 'sanjeevani-backend', database: 'connected' });
});

app.get('/api/doctors', requireDatabase, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.qualification, d.specialty, dep.name AS department
       FROM doctors d JOIN departments dep ON dep.id = d.department_id ORDER BY d.name`,
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/services', requireDatabase, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, title, description, icon FROM services ORDER BY title');
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/faqs', requireDatabase, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT question, answer FROM faqs ORDER BY id');
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/departments', requireDatabase, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, focus, description FROM departments ORDER BY name');
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/register', requireDatabase, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Provide a name, valid email, phone number, and password of at least 10 characters.' });

  try {
    const { name, phone } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'patient')
       RETURNING id, name, email, role`,
      [name, email, phone, passwordHash],
    );
    const user = result.rows[0];
    return res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    return next(error);
  }
});

app.post('/api/auth/login', requireDatabase, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' });

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
      [parsed.data.email.toLowerCase()],
    );
    const account = result.rows[0];
    if (!account || !(await bcrypt.compare(parsed.data.password, account.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const user = { id: account.id, name: account.name, email: account.email, role: account.role };
    return res.json({ token: signToken(user), user });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: res.locals.user });
});

app.post('/api/appointments', requireDatabase, optionalAuth, async (req, res, next) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Check the appointment details and try again.' });

  try {
    const data = parsed.data;
    const email = (data.email || res.locals.user?.email || '').toLowerCase();
    const patientId = res.locals.user?.role === 'patient' ? res.locals.user.id : null;
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, name, phone, email, appointment_date, department_id, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, phone, email, appointment_date AS date, department_id, message, status, created_at AS "createdAt"`,
      [patientId, data.name, data.phone, email, data.date, data.departmentId, data.message],
    );
    try {
      await sendAppointmentEmail({ ...data, email });
    } catch (error) {
      if (error instanceof AppointmentEmailConfigurationError) {
        console.error('Appointment notification email is not configured.');
        return res.status(503).json({ error: 'The appointment email service is not configured. Please contact the hospital directly.' });
      }
      console.error('Appointment notification email could not be delivered.');
      return res.status(502).json({ error: 'Unable to send your booking request right now. Please try again or contact the hospital directly.' });
    }
    return res.status(201).json({ appointment: result.rows[0], message: 'Appointment request received. The hospital team will contact you to confirm.' });
  } catch (error) {
    if ((error as { code?: string }).code === '23503') return res.status(400).json({ error: 'Select a valid department.' });
    return next(error);
  }
});

app.get('/api/appointments', requireAuth, requireDatabase, async (req, res, next) => {
  try {
    const user = res.locals.user!;
    const isAdmin = user.role === 'admin';
    const result = await pool.query(
      `SELECT a.id, a.name, a.phone, a.email, a.appointment_date AS date,
              a.department_id AS "departmentId", dep.name AS department,
              a.message, a.status, a.created_at AS "createdAt"
       FROM appointments a JOIN departments dep ON dep.id = a.department_id
      WHERE ($1::boolean OR a.patient_id = $2)
       ORDER BY a.appointment_date DESC, a.created_at DESC`,
          [isAdmin, user.id],
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/summary', requireAdmin, requireDatabase, async (_req, res, next) => {
  try {
    const [counts, recent] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_appointments,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_appointments,
                COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed_appointments,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_appointments,
                (SELECT COUNT(*)::int FROM doctors) AS doctor_count,
                (SELECT COUNT(*)::int FROM services) AS service_count
         FROM appointments`,
      ),
      pool.query(
        `SELECT a.id, a.name, a.phone, a.email, a.appointment_date AS date,
                dep.name AS department, a.status
         FROM appointments a JOIN departments dep ON dep.id = a.department_id
         ORDER BY a.created_at DESC LIMIT 8`,
      ),
    ]);
    return res.json({ ...counts.rows[0], recentAppointments: recent.rows });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/appointments/:id', requireAdmin, requireDatabase, async (req, res, next) => {
  const parsed = appointmentStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Select a valid appointment status.' });
  try {
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id, status',
      [parsed.data.status, req.params.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Appointment not found.' });
    return res.json({ appointment: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/ai/chat', optionalAuth, aiChatController);

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

async function start() {
  try {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
    await initializeDatabase();
    databaseReady = true;
    console.log('Database initialized.');
  } catch (error) {
    console.error('Database unavailable; starting API in degraded mode:', error instanceof Error ? error.message : error);
  }

  if (databaseReady) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      try {
        if (adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await pool.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ('Hospital Admin', $1, $2, 'admin')
           ON CONFLICT (email) DO NOTHING`,
          [adminEmail, passwordHash],
        );
      } catch (error) {
        console.error('Admin account bootstrap failed:', error instanceof Error ? error.message : error);
      }
    }
  }

  app.listen(port, () => console.log(`Sanjeevani API listening on port ${port}`));
}

start();