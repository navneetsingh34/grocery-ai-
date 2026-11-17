import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthShell, Field } from '../components/AuthShell';

const QUICK_EMAIL = 'navneet@gmail.com';
const QUICK_PASSWORD = 'Qwerty@123';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(em, pw) {
    setLoading(true);
    setError('');
    try {
      await login(em, pw);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit(email, password);
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to view receipts and recommendations."
      footer={
        <>
          No account?{' '}
          <Link to="/register" className="font-semibold text-leaf-600 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-sand" />
        or
        <span className="h-px flex-1 bg-sand" />
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => submit(QUICK_EMAIL, QUICK_PASSWORD)}
        className="btn-secondary w-full !py-3"
      >
        ⚡ Quick login
      </button>
    </AuthShell>
  );
}
