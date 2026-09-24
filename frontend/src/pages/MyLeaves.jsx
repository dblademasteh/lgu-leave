import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../hooks/useToast.jsx';
import { useAuth } from '../stores/auth.js';
import { Plus, Calendar, Pencil, XCircle, User, Building2 } from 'lucide-react';

export default function MyLeaves() {
  const user = useAuth(s=>s.user);
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leaveTypeCode: 'VL', startDate: '', endDate: '', reason: '', isHalfDay: false });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '', reason: '', isHalfDay: false });
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: leavesData }, { data: balData }, { data: typesData }] = await Promise.all([
        api.get('/api/v1/leaves'),
        api.get('/api/v1/leaves/balances'),
        api.get('/api/v1/leaves/types')
      ]);
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
      setBalances(Array.isArray(balData) ? balData : []);
      setLeaveTypes(Array.isArray(typesData) ? typesData : []);
      if (typesData?.length && !form.leaveTypeCode) {
        setForm(f=>({...f, leaveTypeCode: typesData[0].code}));
      }
    } catch {
      toast('Failed to load data', 'error');
      setLeaves([]);
      setBalances([]);
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

  const startEdit = (l) => {
    setEditing(l.id);
    setEditForm({ startDate: l.startDate.slice(0,10), endDate: l.endDate.slice(0,10), reason: l.reason || '', isHalfDay: l.isHalfDay });
  };

  const saveEdit = async () => {
    try {
      await api.patch(`/api/v1/leaves/${editing}`, editForm);
      toast('Request updated', 'success');
      setEditing(null);
      load();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to update', 'error');
    }
  };

  const cancelRequest = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await api.post(`/api/v1/leaves/${id}/cancel`);
      toast('Request cancelled', 'success');
      load();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to cancel', 'error');
    }
  };

  const selectedBalance = balances.find(b=>b.leaveTypeCode===form.leaveTypeCode);
  const daysPreview = () => {
    if (!form.startDate || !form.endDate) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return 'Invalid range';
    let days = 0;
    for (let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) {
      const dow = d.getDay();
      if (dow===0 || dow===6) continue;
      days++;
    }
    if (form.isHalfDay) days = days>0 ? days-0.5 : 0.5;
    return days;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Calendar size={22}/>My Leaves</h1>
        <span className="text-xs text-muted">Create and track requests</span>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent grid place-items-center"><User size={20}/></div>
        <div>
          <p className="font-medium">{user?.name || user?.employeeNumber || 'Employee'}</p>
          <p className="mono-label text-[10px]">{user?.employeeNumber} • {user?.role || ''}</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2 text-sm text-muted"><Building2 size={16}/> Office / Department</div>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Plus size={16}/>New Request</h2>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {balances.map(b=>(
              <div key={b.leaveTypeCode} className={`p-2 rounded-lg border text-center ${b.leaveTypeCode===form.leaveTypeCode?'border-accent bg-accent/5':''}`}>
                <p className="mono-label text-[10px]">{b.leaveTypeCode}</p>
                <p className="text-sm font-medium">{b.remaining.toFixed(1)} / {b.balance}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="mono-label">Leave Type</label>
              <select className="input mt-1" value={form.leaveTypeCode} onChange={e=>setForm({...form, leaveTypeCode:e.target.value})}>
                {leaveTypes.map(t => (
                  <option key={t.code} value={t.code}>{t.code} - {t.name}</option>
                ))}
              </select>
              {selectedBalance && (
                <p className="text-[11px] text-muted mt-1">Available: {selectedBalance.remaining.toFixed(1)} days • Used: {selectedBalance.used}</p>
              )}
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
            <div className="text-[11px] text-muted">Estimated working days: <span className="font-medium text-ink">{daysPreview() ?? '-'}</span></div>
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
                <thead><tr className="text-left text-muted border-b"><th className="py-2">Type</th><th>Period</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaves.map(l=>(
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2">{l.leaveType?.code}</td>
                      <td>
                        {editing===l.id ? (
                          <div className="flex gap-2">
                            <input type="date" className="input" value={editForm.startDate} onChange={e=>setEditForm({...editForm,startDate:e.target.value})}/>
                            <input type="date" className="input" value={editForm.endDate} onChange={e=>setEditForm({...editForm,endDate:e.target.value})}/>
                          </div>
                        ) : (
                          `${l.startDate?.slice(0,10)} → ${l.endDate?.slice(0,10)}`
                        )}
                      </td>
                      <td>{l.days}{l.isHalfDay?'½':''}</td>
                      <td><span className="px-2 py-0.5 rounded-full text-[11px] bg-accent/10 text-accent">{l.status}</span></td>
                      <td className="py-2">
                        {editing===l.id ? (
                          <div className="flex gap-2">
                            <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                            <button className="btn btn-ghost" onClick={()=>setEditing(null)}>Cancel</button>
                          </div>
                        ) : l.status==='PENDING' ? (
                          <div className="flex gap-2">
                            <button className="btn btn-ghost" onClick={()=>startEdit(l)}><Pencil size={14}/>Edit</button>
                            <button className="btn btn-ghost" onClick={()=>cancelRequest(l.id)}><XCircle size={14}/>Cancel</button>
                          </div>
                        ) : null}
                      </td>
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
