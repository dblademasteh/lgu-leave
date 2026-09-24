import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { BarChart3 } from 'lucide-react';

export default function Reports(){
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    setLoading(true);
    api.get('/api/v1/leaves').then(r=>setLeaves(Array.isArray(r.data)?r.data:[])).catch(()=>setLeaves([])).finally(()=>setLoading(false));
  },[]);
  const totals = leaves.reduce((acc,l)=>{ acc[l.status]=(acc[l.status]||0)+1; return acc; },{});
  const exportCSC = () => {
    const year = new Date().getFullYear();
    window.open(`http://localhost:4200/api/v1/reports/csc?year=${year}`, '_blank');
  };
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl flex items-center gap-2"><BarChart3 size={22}/>Reports</h1>
        <button className="btn btn-outline" onClick={exportCSC}>Export CSC Leave Monitoring</button>
      </div>
      {loading ? <div className="grid grid-cols-3 gap-4 animate-pulse"><div className="h-24 bg-bg rounded"/><div className="h-24 bg-bg rounded"/><div className="h-24 bg-bg rounded"/></div> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {['PENDING','APPROVED','REJECTED'].map(s=>(
              <div key={s} className="card p-4">
                <p className="text-xs text-muted uppercase tracking-wide">{s}</p>
                <p className="text-3xl font-bold mt-1">{totals[s]||0}</p>
              </div>
            ))}
          </div>
          <div className="card p-4">
            <p className="font-semibold mb-3">Recent Requests</p>
            {leaves.length===0 ? <p className="text-sm text-muted">No data</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted border-b"><th className="py-2">Employee</th><th>Type</th><th>Days</th><th>Status</th></tr></thead>
                  <tbody>
                    {leaves.slice(0,10).map(l=>(
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2">{l.employee?.fullName}</td>
                        <td>{l.leaveType?.code}</td>
                        <td>{l.days}{l.isHalfDay?'½':''}</td>
                        <td><span className="px-2 py-0.5 rounded-full text-[11px] bg-accent/10 text-accent">{l.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
