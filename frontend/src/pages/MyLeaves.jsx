import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../hooks/useToast.jsx';
import { Plus, Calendar } from 'lucide-react';

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leaveTypeCode: 'VL', startDate: '', endDate: '', reason: '', isHalfDay: false });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/leaves');
      setLeaves(Array.isArray(data) ? data : []);
    } catch {
      toast('Failed to load leaves', 'error');
      setLeaves([]);
    } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/leaves', form);
      toast('Leave request submitted', 'success');
      setForm({ leaveTypeCode: 'VL', startDate: '', endDate: '', reason: '', isHalfDay: false });
      load();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to submit';
      toast(msg, 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Calendar size={22}/>My Leaves</h1>
        <span className="text-xs text-muted">Create and track requests</span>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Plus size={16}/>New Request</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="mono-label">Leave Type</label>
              <select className="input mt-1" value={form.leaveTypeCode} onChange={e=>setForm({...form, leaveTypeCode:e.target.value})}>
                <option>VL</option><option>SL</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mono-label">Start</label>
                <input className="input mt-1" type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} required/>
              </div>
              <div>
                <label className="mono-label">End</label>
                <input className="input mt-1" type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} required/>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isHalfDay} onChange={e=>setForm({...form,isHalfDay:e.target.checked})}/>
              Half day
            </label>
            <div>
              <label className="mono-label">Reason</label>
              <input className="input mt-1" placeholder="Optional reason" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
            </div>
            <button className="btn btn-primary w-full" disabled={submitting}>{submitting?'Submitting...':'Submit Request'}</button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Requests</h2>
          {loading ? <div className="animate-pulse space-y-2"><div className="h-10 bg-bg rounded"></div><div className="h-10 bg-bg rounded"></div></div> : leaves.length===0 ? <div className="text-sm text-muted py-8 text-center">No requests yet. Create your first one.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted border-b"><th className="py-2">Type</th><th>Period</th><th>Days</th><th>Status</th></tr></thead>
                <tbody>
                  {leaves.map(l=>(
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2">{l.leaveType?.code}</td>
                      <td>{l.startDate?.slice(0,10)} → {l.endDate?.slice(0,10)}</td>
                      <td>{l.days}{l.isHalfDay?'½':''}</td>
                      <td><span className="px-2 py-0.5 rounded-full text-[11px] bg-accent/10 text-accent">{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
