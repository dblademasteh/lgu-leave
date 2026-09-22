import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../hooks/useToast.jsx';
import { Check, X, Clock } from 'lucide-react';

export default function Approvals(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/leaves');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  };
  useEffect(()=>{load()},[]);

  const decide = async (id, decision) => {
    try {
      await api.post(`/api/v1/leaves/${id}/approve`, { decision });
      toast(`Request ${decision.toLowerCase()}ed`, 'success');
      load();
    } catch {
      toast('Action failed', 'error');
    }
  };

  const pending = items.filter(i=>i.status==='PENDING');
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="font-display text-2xl flex items-center gap-2"><Clock size={22}/>Approvals</h1>
      <div className="card p-4">
        {loading ? <div className="animate-pulse h-24 bg-bg rounded"/> : pending.length===0 ? <div className="text-sm text-muted py-10 text-center">No pending requests</div> : (
          <div className="space-y-3">
            {pending.map(i=>(
              <div key={i.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{i.employee?.fullName} <span className="text-muted font-normal">• {i.leaveType?.code}</span></p>
                  <p className="text-xs text-muted">{i.startDate?.slice(0,10)} to {i.endDate?.slice(0,10)} • {i.days}{i.isHalfDay?'½':''} days</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary flex items-center gap-1" onClick={()=>decide(i.id,'APPROVE')}><Check size={14}/>Approve</button>
                  <button className="btn flex items-center gap-1" onClick={()=>decide(i.id,'REJECT')}><X size={14}/>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
