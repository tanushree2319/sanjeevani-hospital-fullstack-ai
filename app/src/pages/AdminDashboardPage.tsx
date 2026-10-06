import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';

type RecentAppointment = { id: string; name: string; phone: string; date: string; department: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled' };
type AdminSummary = {
  total_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  doctor_count: number;
  service_count: number;
  recentAppointments: RecentAppointment[];
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const refresh = () => apiRequest<AdminSummary>('/api/admin/summary').then(setSummary);

  useEffect(() => {
    refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load admin summary.'));
  }, []);

  const changeStatus = async (id: string, status: RecentAppointment['status']) => {
    setUpdating(id);
    setError('');
    try {
      await apiRequest(`/api/admin/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update appointment.');
    } finally {
      setUpdating('');
    }
  };

  const dailyStats = summary ? [
    { label: 'Total appointments', value: summary.total_appointments },
    { label: 'Pending', value: summary.pending_appointments },
    { label: 'Confirmed', value: summary.confirmed_appointments },
    { label: 'Completed', value: summary.completed_appointments },
  ] : [];

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Operational overview for appointments and care workflows" />

      <section className="py-5">
        <div className="container">
          {error && <p className="alert alert-danger" role="alert">{error}</p>}
          {!summary && !error && <p role="status">Loading admin data...</p>}
          <div className="row g-4">
            {dailyStats.map((stat) => (
              <div key={stat.label} className="col-md-6 col-lg-3">
                <div className="stat-card">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4 mt-1">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h4 className="mb-3">Latest Appointments</h4>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Department</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.recentAppointments.map((appointment) => <tr key={appointment.id}>
                        <td>{appointment.name}<div className="small text-muted">{appointment.phone}</div></td>
                        <td>{appointment.department}<div className="small text-muted">{appointment.date}</div></td>
                        <td>
                          <select className="form-select form-select-sm" aria-label={`Update status for ${appointment.name}`} value={appointment.status} disabled={updating === appointment.id} onChange={(event) => void changeStatus(appointment.id, event.target.value as RecentAppointment['status'])}>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h4 className="mb-3">Department Activity</h4>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">Registered specialists: {summary?.doctor_count ?? '—'}</li>
                  <li className="mb-2">Available services: {summary?.service_count ?? '—'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
