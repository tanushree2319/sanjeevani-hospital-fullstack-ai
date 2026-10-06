import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function AuthPage({ register = false }: { register?: boolean }) {
  const { authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState({ name: '', email: '', phone: '', password: '' });
  const requestedPath = (location.state as { from?: string } | null)?.from;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const session = await authenticate(register ? '/api/auth/register' : '/api/auth/login', fields);
      navigate(requestedPath || (session.user.role === 'admin' ? '/admin-dashboard' : '/patient-dashboard'), { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="py-5 auth-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-7 col-lg-5">
            <div className="card border-0 shadow-sm p-4 p-md-5">
              <p className="text-uppercase small fw-semibold text-primary mb-2">Sanjeevani Hospital</p>
              <h1 className="h2 mb-2">{register ? 'Create patient account' : 'Sign in'}</h1>
              <p className="text-muted mb-4">{register ? 'Manage your appointment requests securely.' : 'Access your hospital workspace.'}</p>
              <form onSubmit={submit}>
                {register && <div className="mb-3">
                  <label className="form-label" htmlFor="auth-name">Full name</label>
                  <input id="auth-name" className="form-control" autoComplete="name" required minLength={2} maxLength={100} value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} />
                </div>}
                <div className="mb-3">
                  <label className="form-label" htmlFor="auth-email">Email</label>
                  <input id="auth-email" className="form-control" type="email" autoComplete="email" required value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} />
                </div>
                {register && <div className="mb-3">
                  <label className="form-label" htmlFor="auth-phone">Phone</label>
                  <input id="auth-phone" className="form-control" type="tel" autoComplete="tel" minLength={8} required value={fields.phone} onChange={(event) => setFields({ ...fields, phone: event.target.value })} />
                </div>}
                <div className="mb-3">
                  <label className="form-label" htmlFor="auth-password">Password</label>
                  <input id="auth-password" className="form-control" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 10 : 1} required value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} />
                </div>
                {error && <p className="text-danger mb-3" role="alert">{error}</p>}
                <button className="btn btn-primary w-100" type="submit" disabled={busy}>{busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'}</button>
              </form>
              <p className="small text-muted mt-4 mb-0">
                {register ? 'Already registered?' : 'New patient?'}{' '}
                <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}