import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../stores/auth.js';
import { CalendarDays } from 'lucide-react';

export default function Dashboard() {
  const user = useAuth(s => s.user);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/leaves/balances')
      .then(r => setBalances(r.data))
      .catch(() => setBalances([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><CalendarDays size={24}/>Dashboard</h1>
        <p className="text-sm text-muted">Welcome, {user?.name || user?.employeeNumber || 'User'}</p>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Leave Balances {new Date().getFullYear()}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({length:3}).map((_,i)=><div key={i} className="card p-4 h-24 animate-pulse bg-bg"/>)
          ) : balances.length===0 ? (
            <div className="text-sm text-muted">No balances found.</div>
          ) : balances.map(b => (
            <div key={b.leaveTypeCode} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.leaveTypeName}</span>
                <span className="badge badge-accent">{b.leaveTypeCode}</span>
              </div>
              <div className="stat-value mt-2">{b.remaining.toFixed(1)}</div>
              <p className="mono-label text-[10px] mt-1">Remaining of {b.balance} • Used {b.used}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
