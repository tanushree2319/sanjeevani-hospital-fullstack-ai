import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';

type Appointment = { id: string; department: string; status: string; date: string };

export default function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Appointment[]>('/api/appointments')
      .then(setAppointments)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const upcoming = appointments.filter((appointment) => appointment.date >= today && appointment.status !== 'cancelled').length;
  const confirmed = appointments.filter((appointment) => appointment.status === 'confirmed').length;

  return (
    <>
      <PageHeader title="Patient Dashboard" subtitle="Track appointments and care journey" />

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="stat-card">
                <h3>{appointments.length.toString().padStart(2, '0')}</h3>
                <p>Total Appointments</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <h3>{confirmed.toString().padStart(2, '0')}</h3>
                <p>Confirmed</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <h3>{upcoming.toString().padStart(2, '0')}</h3>
                <p>Upcoming</p>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-5 p-4">
            <h4 className="mb-4">My Appointments</h4>
            {loading && <p role="status">Loading appointments...</p>}
            {error && <p className="text-danger" role="alert">{error}</p>}
            {!loading && !error && appointments.length === 0 && <p className="text-muted">No appointment requests are linked to this account yet.</p>}
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.id.slice(0, 8).toUpperCase()}</td>
                      <td>{appointment.department}</td>
                      <td>{appointment.date}</td>
                      <td>
                        <span className={`badge ${appointment.status === 'confirmed' ? 'text-bg-success' : appointment.status === 'pending' ? 'text-bg-warning' : 'text-bg-secondary'}`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
