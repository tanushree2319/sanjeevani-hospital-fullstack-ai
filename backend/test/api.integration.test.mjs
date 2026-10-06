import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';

const integrationTest = process.env.DATABASE_URL ? test : test.skip;

integrationTest('patient, admin, appointment, and AI API flows', async () => {
  const port = Number(process.env.TEST_PORT || 4311);
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      JWT_SECRET: process.env.JWT_SECRET || 'integration-test-secret-at-least-32-chars',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'integration-admin-password',
    },
    stdio: 'ignore',
  });

  async function fetchJson(path, options = {}, token) {
    const headers = new Headers(options.headers);
    if (options.body) headers.set('content-type', 'application/json');
    if (token) headers.set('authorization', `Bearer ${token}`);
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    return { response, body: await response.json() };
  }

  try {
    let healthy = false;
    for (let attempt = 0; attempt < 60 && !healthy; attempt += 1) {
      try {
        healthy = (await fetch(`${baseUrl}/api/health`)).ok;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    assert.equal(healthy, true, 'API should become healthy');

    const email = `patient-${Date.now()}@example.com`;
    const registration = await fetchJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Patient', email, phone: '07123456789', password: 'patient-password-123' }),
    });
    assert.equal(registration.response.status, 201);
    const patientToken = registration.body.token;

    const appointment = await fetchJson('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Patient', phone: '07123456789', email, date: '2099-04-20', departmentId: 'general-medicine', message: 'Routine consultation' }),
    }, patientToken);
    assert.equal(appointment.response.status, 201);

    const patientAppointments = await fetchJson('/api/appointments', {}, patientToken);
    assert.equal(patientAppointments.response.status, 200);
    assert.equal(patientAppointments.body.some((item) => item.id === appointment.body.appointment.id), true);

    const patientDenied = await fetchJson('/api/admin/summary', {}, patientToken);
    assert.equal(patientDenied.response.status, 403);

    const adminLogin = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'admin@example.com', password: process.env.ADMIN_PASSWORD || 'integration-admin-password' }),
    });
    assert.equal(adminLogin.response.status, 200);

    const summary = await fetchJson('/api/admin/summary', {}, adminLogin.body.token);
    assert.equal(summary.response.status, 200);
    assert.ok(summary.body.total_appointments >= 1);

    const updated = await fetchJson(`/api/admin/appointments/${appointment.body.appointment.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    }, adminLogin.body.token);
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.appointment.status, 'confirmed');

    const guidance = await fetchJson('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'I have chest pain and need emergency help.' }),
    });
    assert.equal(guidance.response.status, 200);
    assert.equal(guidance.body.success, true);
    assert.match(guidance.body.reply, /emergency services/i);
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
}, { timeout: 45000 });