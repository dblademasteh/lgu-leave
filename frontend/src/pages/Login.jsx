import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, CalendarCheck, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../stores/auth.js';
import { useToast } from '../hooks/useToast.jsx';
import { login } from '../api/auth.js';

const HIGHLIGHTS = [
  { icon: CalendarCheck, title: 'Self-service leave', desc: 'Request leave from any trusted browser � approvals in minutes.' },
  { icon: Building2, title: 'Policy aware', desc: 'Balance, entitlements, and blackout dates enforced automatically.' },
];

const DEMO_ACCOUNTS = [{u:'1001',p:'password123'}];

export default function Login() {
  const user = useAuth(s => s.user);
  const setSession = useAuth(s => s.setSession);
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const data = await login(username, password);
      setSession(data);
      toast(`Welcome, ${data.user.fullName}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid employee number or password');
      toast('Login failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col md:flex-row md:h-dvh md:overflow-hidden">
      <aside className="relative overflow-hidden border-b border-line bg-surface md:border-b-0 md:border-r md:w-[44%] lg:w-[48%] md:h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent" />
        <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent text-accent-ink grid place-items-center shadow-lg">
              <Building2 size={22} />
            </div>
            <div>
              <p className="font-display font-bold text-ink text-lg">LGU Leave</p>
              <p className="mono-label mt-0.5">Management & Reporting System</p>
            </div>
          </div>
          <div className="hidden md:block">
            <h1 className="font-display font-bold text-ink text-3xl lg:text-4xl leading-tight">
              Time off.<br/>Tracked.
            </h1>
            <p className="text-sm text-muted mt-3 max-w-md">Request, approve, and report leave with full audit trail and HRMS sync.</p>
            <ul className="mt-8 space-y-5">
              {HIGHLIGHTS.map(h => (
                <li key={h.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0 ring-1 ring-accent/10">
                    <h.icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{h.title}</p>
                    <p className="text-xs text-muted mt-0.5">{h.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="hidden md:flex items-center gap-2 text-xs text-muted">
            <ShieldCheck size={14} /> Role-scoped access � Fully audited � RA 10173
          </p>
        </div>
      </aside>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8 md:h-full md:overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="card p-6 sm:p-7">
            <h2 className="font-display font-bold text-ink text-xl">Sign in</h2>
            <p className="text-xs text-muted mt-1">Use your workspace credentials.</p>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-3.5">
              <div>
                <label className="mono-label" htmlFor="username">Username</label>
                <input id="username" className="input mt-1.5 min-h-11" value={username} onChange={e=>setUsername(e.target.value)} autoFocus required />
              </div>
              <div>
                <label className="mono-label" htmlFor="password">Password</label>
                <div className="relative mt-1.5">
                  <input id="password" type={showPassword?'text':'password'} className="input min-h-11 pr-11" value={password} onChange={e=>setPassword(e.target.value)} required />
                  <button type="button" onClick={()=>setShowPassword(v=>!v)} className="btn-ghost btn absolute right-1 inset-y-0 my-auto h-8 px-2">
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">{error}</p>}
              <button type="submit" className="btn btn-primary w-full min-h-11 mt-1" disabled={busy}>
                {busy && <Loader2 size={15} className="animate-spin"/>}{busy?'Signing in�':'Sign in'}
              </button>
            </form>
            <details className="mt-4 rounded-xl border border-line bg-bg/60 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-muted">Demo accounts</summary>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-muted">
                {DEMO_ACCOUNTS.map(a=> <li key={a.u}>{a.u} <span className="opacity-70">/ {a.p}</span></li>)}
              </ul>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
