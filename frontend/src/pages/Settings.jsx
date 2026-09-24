import { useState, useEffect } from 'react';
import { Palette, Bell, User, Server, Moon, Sun, Check, Ban, Layout, Type, Calendar, Clock, Settings2, Link2 } from 'lucide-react';
import { useTheme, applyTheme } from '../theme.js';
import { ACCENT_PRESETS, FONT_OPTIONS, presetValue, getAccent, applyAccent, getUiScale, applyUiScale, getFont, applyFont } from '../appearance.js';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api/client.js';

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'hrms', label: 'HRMS Integration', icon: Link2 },
  { id: 'attendance', label: 'Attendance Sync', icon: Clock },
  { id: 'leave-rules', label: 'Leave Rules', icon: Settings2 },
  { id: 'office-hours', label: 'Office Hours', icon: Clock },
  { id: 'holidays', label: 'Holidays', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: User },
  { id: 'system', label: 'System', icon: Server },
];

export default function Settings() {
  const [tab, setTab] = useState('appearance');
  const theme = useTheme();
  const toast = useToast();
  const [accent, setAccent] = useState(getAccent());
  const [uiScale, setUiScale] = useState(getUiScale());
  const [font, setFont] = useState(getFont());
  const [rules, setRules] = useState([]);
  const [officeHours, setOfficeHours] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '' });
  const [hrms, setHrms] = useState({ baseUrl:'', apiKey:'', enabled:false });
  const [attendance, setAttendance] = useState({ enabled:false, webhookUrl:'', pollInterval:15 });

  const pickAccent = (v, label='Accent updated') => { applyAccent(v); setAccent(v); toast(label,'success'); };
  const resetAppearance = () => { applyAccent(null); applyUiScale(100); applyFont('Inter'); setAccent(null); setUiScale(100); setFont('Inter'); toast('Appearance restored','success'); };

  const loadRules = async () => { const { data } = await api.get('/api/v1/settings/leave-rules'); setRules(data); };
  const loadOffice = async () => { const { data } = await api.get('/api/v1/settings/office-hours'); setOfficeHours(data); };
  const loadHolidays = async () => { const { data } = await api.get('/api/v1/settings/holidays'); setHolidays(data); };
  const loadHrms = async () => { const { data } = await api.get('/api/v1/settings/system'); setHrms({ baseUrl: data.HRMS_BASE_URL||'', apiKey: data.HRMS_API_KEY||'', enabled: data.HRMS_ENABLED==='true' }); };
  const loadAttendance = async () => { const { data } = await api.get('/api/v1/settings/system'); setAttendance({ enabled: data.ATTENDANCE_ENABLED==='true', webhookUrl: data.ATTENDANCE_WEBHOOK_URL||'', pollInterval: Number(data.ATTENDANCE_POLL_INTERVAL||15) }); };

  useEffect(()=>{ if(tab==='leave-rules') loadRules(); },[tab]);
  useEffect(()=>{ if(tab==='office-hours') loadOffice(); },[tab]);
  useEffect(()=>{ if(tab==='holidays') loadHolidays(); },[tab]);
  useEffect(()=>{ if(tab==='hrms') loadHrms(); },[tab]);
  useEffect(()=>{ if(tab==='attendance') loadAttendance(); },[tab]);

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-ink text-xl">Settings</h2>
        <span className="mono-label text-[10px]">Admin controls</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`btn btn-ghost flex items-center gap-2 ${tab===t.id?'!bg-accent/10 text-accent border-accent':''}`}>{<t.icon size={16}/>}{t.label}</button>
        ))}
      </div>
      {tab==='hrms' && (
        <div className="card p-5 mt-4 space-y-4">
          <h3 className="font-semibold">HRMS Integration</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="mono-label">Base URL</span>
              <input className="input mt-1" value={hrms.baseUrl} onChange={e=>setHrms(h=>({...h,baseUrl:e.target.value}))} placeholder="https://hrms.example.com"/>
            </label>
            <label className="block">
              <span className="mono-label">API Key</span>
              <input className="input mt-1" value={hrms.apiKey} onChange={e=>setHrms(h=>({...h,apiKey:e.target.value}))} placeholder="xxxx"/>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hrms.enabled} onChange={e=>setHrms(h=>({...h,enabled:e.target.checked}))}/> Enable sync
            </label>
          </div>
          <button className="btn btn-primary" onClick={async()=>{
            await api.patch('/api/v1/settings/system', { HRMS_BASE_URL: hrms.baseUrl, HRMS_API_KEY: hrms.apiKey, HRMS_ENABLED: String(hrms.enabled) });
            toast('HRMS settings saved','success');
          }}>Save HRMS Settings</button>
        </div>
      )}
      {tab==='attendance' && (
        <div className="card p-5 mt-4 space-y-4">
          <h3 className="font-semibold">Attendance Sync</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={attendance.enabled} onChange={e=>setAttendance(a=>({...a,enabled:e.target.checked}))}/> Enable attendance sync
            </label>
            <label className="block">
              <span className="mono-label">Webhook URL</span>
              <input className="input mt-1" value={attendance.webhookUrl} onChange={e=>setAttendance(a=>({...a,webhookUrl:e.target.value}))} placeholder="https://hrms.example.com/webhooks/attendance"/>
            </label>
            <label className="block">
              <span className="mono-label">Poll Interval Minutes</span>
              <input type="number" className="input mt-1" value={attendance.pollInterval} onChange={e=>setAttendance(a=>({...a,pollInterval:e.target.value}))}/>
            </label>
          </div>
          <button className="btn btn-primary" onClick={async()=>{
            await api.patch('/api/v1/settings/system', { ATTENDANCE_ENABLED: String(attendance.enabled), ATTENDANCE_WEBHOOK_URL: attendance.webhookUrl, ATTENDANCE_POLL_INTERVAL: String(attendance.pollInterval) });
            toast('Attendance settings saved','success');
          }}>Save Attendance Settings</button>
        </div>
      )}
      {tab==='appearance' && (
        <div className="space-y-4 mt-4">
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Theme</h3>
            <div className="flex gap-3">
              {['light','dark'].map(m=>(
                <button key={m} onClick={()=>applyTheme(m)} className={`flex-1 rounded-xl border px-4 py-4 ${theme===m?'border-accent bg-accent/5':'border-line'}`}>{m==='dark'?<Moon/>:<Sun/>}<span>{m}</span></button>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Accent</h3>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map(p=>(
                <button key={p.id} onClick={()=>pickAccent(presetValue(p.token))} className="w-8 h-8 rounded-full ring-1 ring-line" style={{backgroundColor:`var(${p.token})`}}/>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-3">UI Density</h3>
            <input type="range" min="80" max="120" step="5" value={uiScale} onChange={e=>{applyUiScale(e.target.value); setUiScale(Number(e.target.value));}} className="w-full"/>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Font</h3>
            <div className="grid sm:grid-cols-3 gap-2">
              {FONT_OPTIONS.map(f=>(
                <button key={f.id} onClick={()=>{applyFont(f.id); setFont(f.id);}} className={`rounded-xl border p-3 text-left ${font===f.id?'border-accent bg-accent/5':''}`}>{f.label}</button>
              ))}
            </div>
          </div>
          <button onClick={resetAppearance} className="btn btn-outline">Restore defaults</button>
        </div>
      )}
      {tab==='leave-rules' && (
        <div className="card p-5 mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Leave Rules</h3>
            <span className="mono-label text-[10px]">CSC compliance</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted border-b">
                <tr><th className="text-left py-2">Code</th><th>Max Consecutive</th><th>Notify Before</th><th>Attachment</th><th></th></tr>
              </thead>
              <tbody>
                {rules.map(r=>(
                  <tr key={r.leaveTypeCode} className="border-b last:border-0">
                    <td className="py-2 font-medium">{r.leaveTypeCode}</td>
                    <td>{r.maxConsecutiveDays} days</td>
                    <td>{r.notifyDaysBefore} days</td>
                    <td>{r.requiresAttachment?'Required':'Optional'}</td>
                    <td className="text-right py-2">
                      <button className="btn btn-ghost" onClick={async()=>{
                        const max = prompt('Max consecutive days', r.maxConsecutiveDays);
                        if(max==null) return;
                        const att = confirm('Require attachment?');
                        await api.put(`/api/v1/settings/leave-rules/${r.leaveTypeCode}`, { maxConsecutiveDays: Number(max), requiresAttachment: att });
                        toast('Rule updated','success'); loadRules();
                      }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab==='office-hours' && (
        <div className="card p-5 mt-4 space-y-4">
          <h3 className="font-semibold">Office Hours</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {officeHours.map(h=>(
              <div key={h.dayOfWeek} className={`border rounded-xl p-4 ${h.isWorkDay?'':'opacity-60'}`}>
                <p className="font-medium">{dayNames[h.dayOfWeek]}</p>
                <p className="text-xs text-muted mb-2">{h.isWorkDay?'Work day':'Rest day'}</p>
                <div className="flex items-center gap-2">
                  <input className="input" type="time" value={h.startTime} onChange={e=>{
                    const updated = officeHours.map(o=> o.dayOfWeek===h.dayOfWeek? {...o,startTime:e.target.value}:o);
                    setOfficeHours(updated);
                  }}/>
                  <span>–</span>
                  <input className="input" type="time" value={h.endTime} onChange={e=>{
                    const updated = officeHours.map(o=> o.dayOfWeek===h.dayOfWeek? {...o,endTime:e.target.value}:o);
                    setOfficeHours(updated);
                  }}/>
                </div>
                <button className="btn btn-primary w-full mt-3" onClick={async()=>{
                  await api.put('/api/v1/settings/office-hours', officeHours);
                  toast('Office hours saved','success');
                }}>Save</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==='holidays' && (
        <div className="card p-5 mt-4 space-y-4">
          <h3 className="font-semibold">Holidays</h3>
          <form onSubmit={async e=>{e.preventDefault(); await api.post('/api/v1/settings/holidays', holidayForm); toast('Holiday added','success'); setHolidayForm({date:'',name:''}); loadHolidays();}} className="flex gap-2 flex-wrap">
            <input type="date" className="input w-auto" value={holidayForm.date} onChange={e=>setHolidayForm(f=>({...f,date:e.target.value}))} required/>
            <input className="input flex-1 min-w-[200px]" placeholder="Holiday name" value={holidayForm.name} onChange={e=>setHolidayForm(f=>({...f,name:e.target.value}))} required/>
            <button className="btn btn-primary">Add Holiday</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted border-b"><tr><th className="text-left py-2">Date</th><th>Name</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {holidays.map(h=>(
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(h.date).toLocaleDateString()}</td>
                    <td>{h.name}</td>
                    <td className="text-right py-2">
                      <button className="btn btn-ghost" onClick={async()=>{ await api.delete(`/api/v1/settings/holidays/${h.id}`); toast('Removed','success'); loadHolidays(); }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab==='notifications' && <div className="card p-5 mt-4">Notifications settings placeholder</div>}
      {tab==='account' && <div className="card p-5 mt-4">Account information placeholder</div>}
      {tab==='system' && <div className="card p-5 mt-4">System information placeholder</div>}
    </div>
  );
}
