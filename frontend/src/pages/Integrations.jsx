import { useState, useEffect } from 'react';
import { Link2, Eye, EyeOff, RefreshCw, ExternalLink, Server } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api/client.js';
import { integrationsApi } from '../api/integrations.js';

export default function Integrations() {
  const toast = useToast();
  const [settings, setSettings] = useState({});
  const [revealHrmsKey, setRevealHrmsKey] = useState(false);
  const [testing, setTesting] = useState({ hrms: false, attendance: false });
  const [testResults, setTestResults] = useState({});
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/settings/system');
      setSettings(data || {});
    } catch { toast('Failed to load settings','error'); }
    try {
      const logs = await integrationsApi.syncLogs(20);
      setSyncLogs(Array.isArray(logs) ? logs : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const hrms = {
    baseUrl: settings.HRMS_BASE_URL || '',
    apiKey: settings.HRMS_API_KEY || '',
    enabled: settings.HRMS_ENABLED === 'true'
  };
  const attendance = {
    enabled: settings.ATTENDANCE_ENABLED === 'true',
    webhookUrl: settings.ATTENDANCE_WEBHOOK_URL || '',
    pollInterval: Number(settings.ATTENDANCE_POLL_INTERVAL || 15)
  };

  const saveHrms = async () => {
    await api.patch('/api/v1/settings/system', { HRMS_BASE_URL: hrms.baseUrl, HRMS_API_KEY: hrms.apiKey, HRMS_ENABLED: String(hrms.enabled) });
    toast('HRMS settings saved','success'); loadAll();
  };
  const saveAttendance = async () => {
    await api.patch('/api/v1/settings/system', { ATTENDANCE_ENABLED: String(attendance.enabled), ATTENDANCE_WEBHOOK_URL: attendance.webhookUrl, ATTENDANCE_POLL_INTERVAL: String(attendance.pollInterval) });
    toast('Attendance settings saved','success'); loadAll();
  };

  const testHrms = async () => {
    setTesting(s => ({ ...s, hrms: true }));
    setTestResults(r => ({ ...r, hrms: null }));
    try {
      const data = await integrationsApi.testHrms();
      setTestResults(r => ({ ...r, hrms: data }));
      toast(data.ok ? 'HRMS connection successful' : 'HRMS connection failed', data.ok ? 'success' : 'error');
    } catch (e) {
      setTestResults(r => ({ ...r, hrms: { ok: false, error: e?.response?.data?.error?.message || String(e) } }));
      toast('HRMS test failed','error');
    } finally { setTesting(s => ({ ...s, hrms: false })); }
  };

  const testAttendance = async () => {
    setTesting(s => ({ ...s, attendance: true }));
    setTestResults(r => ({ ...r, attendance: null }));
    try {
      const data = await integrationsApi.testAttendance();
      setTestResults(r => ({ ...r, attendance: data }));
      toast(data.ok ? 'Attendance webhook reachable' : 'Attendance webhook failed', data.ok ? 'success' : 'error');
    } catch (e) {
      setTestResults(r => ({ ...r, attendance: { ok: false, error: e?.response?.data?.error?.message || String(e) } }));
      toast('Attendance test failed','error');
    } finally { setTesting(s => ({ ...s, attendance: false })); }
  };

  const syncAllToAttendance = async () => {
    setSyncing(true);
    try {
      const data = await integrationsApi.syncAllToAttendance();
      toast(`Synced ${data.synced} approved leaves to Attendance, ${data.failed} failed`, data.failed ? 'error' : 'success');
      loadAll();
    } catch { toast('Sync failed','error'); }
    setSyncing(false);
  };

  const syncAllToHrms = async () => {
    setSyncing(true);
    try {
      const data = await integrationsApi.syncAllToHrms();
      toast(`Synced ${data.synced} leaves to HRMS, ${data.failed} failed`, data.failed ? 'error' : 'success');
      loadAll();
    } catch { toast('Sync failed','error'); }
    setSyncing(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-ink text-xl flex items-center gap-2"><Link2 size={22} className="text-accent"/> Integrations</h2>
        <span className="mono-label text-[10px]">System links</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="card p-5 animate-pulse space-y-3">
            <div className="h-5 bg-bg rounded w-1/3"/>
            <div className="h-4 bg-bg rounded w-2/3"/>
            <div className="h-10 bg-bg rounded"/>
          </div>
          <div className="card p-5 animate-pulse space-y-3">
            <div className="h-5 bg-bg rounded w-1/3"/>
            <div className="h-4 bg-bg rounded w-2/3"/>
            <div className="h-10 bg-bg rounded"/>
          </div>
        </div>
      ) : (
        <>
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">HRMS Integration</h3>
              <span className={`badge ${hrms.enabled ? 'badge-success' : 'badge-error'}`}>{hrms.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <p className="text-xs text-muted">Push leave applications to HRMS on create, approve, cancel, or edit. Configure the target URL and API key below.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="mono-label">Base URL</span>
                <input className="input mt-1" value={hrms.baseUrl} onChange={e => setSettings(s => ({ ...s, HRMS_BASE_URL: e.target.value }))} placeholder="https://hrms.example.com"/>
              </label>
              <label className="block">
                <span className="mono-label">API Key</span>
                <div className="flex gap-2 mt-1">
                  <input className="input flex-1" type={revealHrmsKey ? 'text' : 'password'} value={hrms.apiKey} onChange={e => setSettings(s => ({ ...s, HRMS_API_KEY: e.target.value }))} placeholder="xxxx"/>
                  <button type="button" className="btn btn-ghost" onClick={() => setRevealHrmsKey(v => !v)} aria-label={revealHrmsKey ? 'Hide API key' : 'Show API key'}>
                    {revealHrmsKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={hrms.enabled} onChange={e => setSettings(s => ({ ...s, HRMS_ENABLED: String(e.target.checked) }))}/> Enable sync
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={saveHrms}>Save HRMS Settings</button>
              <button className="btn btn-outline" onClick={testHrms} disabled={testing.hrms || !hrms.baseUrl || !hrms.apiKey}>
                {testing.hrms ? <RefreshCw size={16} className="animate-spin"/> : <ExternalLink size={16}/>}
                {testing.hrms ? 'Testing...' : 'Test Connection'}
              </button>
              <button className="btn btn-outline" onClick={syncAllToHrms} disabled={syncing}>
                {syncing ? <RefreshCw size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                {syncing ? 'Syncing...' : 'Sync All Leaves'}
              </button>
            </div>
            {testResults.hrms && (
              <div className={`border rounded-xl p-3 text-xs ${testResults.hrms.ok ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
                <p className="font-semibold mb-1">{testResults.hrms.ok ? 'Connection successful' : 'Connection failed'}</p>
                <p className="text-muted">Status: {testResults.hrms.status || 'error'}</p>
                {testResults.hrms.body && <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px]">{testResults.hrms.body}</pre>}
                {testResults.hrms.error && <p className="mt-1 text-error">{testResults.hrms.error}</p>}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Attendance Sync</h3>
              <span className={`badge ${attendance.enabled ? 'badge-success' : 'badge-error'}`}>{attendance.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <p className="text-xs text-muted">Push approved leaves to the Attendance webhook. Use the sync button to backfill existing approved leaves.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={attendance.enabled} onChange={e => setSettings(s => ({ ...s, ATTENDANCE_ENABLED: String(e.target.checked) }))}/> Enable attendance sync
              </label>
              <label className="block sm:col-span-2">
                <span className="mono-label">Webhook URL</span>
                <input className="input mt-1" value={attendance.webhookUrl} onChange={e => setSettings(s => ({ ...s, ATTENDANCE_WEBHOOK_URL: e.target.value }))} placeholder="https://attendance.example.com/webhook"/>
              </label>
              <label className="block">
                <span className="mono-label">Poll Interval (minutes)</span>
                <input type="number" className="input mt-1" value={attendance.pollInterval} onChange={e => setSettings(s => ({ ...s, ATTENDANCE_POLL_INTERVAL: String(e.target.value) }))}/>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={saveAttendance}>Save Attendance Settings</button>
              <button className="btn btn-outline" onClick={testAttendance} disabled={testing.attendance || !attendance.webhookUrl}>
                {testing.attendance ? <RefreshCw size={16} className="animate-spin"/> : <ExternalLink size={16}/>}
                {testing.attendance ? 'Testing...' : 'Test Webhook'}
              </button>
              <button className="btn btn-outline" onClick={syncAllToAttendance} disabled={syncing}>
                {syncing ? <RefreshCw size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                {syncing ? 'Syncing...' : 'Sync All Approved Leaves'}
              </button>
            </div>
            {testResults.attendance && (
              <div className={`border rounded-xl p-3 text-xs ${testResults.attendance.ok ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
                <p className="font-semibold mb-1">{testResults.attendance.ok ? 'Webhook reachable' : 'Webhook test failed'}</p>
                <p className="text-muted">Status: {testResults.attendance.status || 'error'}</p>
                {testResults.attendance.body && <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px]">{testResults.attendance.body}</pre>}
                {testResults.attendance.error && <p className="mt-1 text-error">{testResults.attendance.error}</p>}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Server size={16}/> Sync Logs</h3>
              <button className="btn btn-ghost text-xs" onClick={loadAll} aria-label="Refresh sync logs"><RefreshCw size={14}/> Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted border-b">
                  <tr><th className="text-left py-2">Time</th><th>Direction</th><th>Entity</th><th>Status</th><th>Message</th></tr>
                </thead>
                <tbody>
                  {syncLogs.length===0 ? <tr><td colSpan="5" className="py-6 text-center text-muted">No sync logs yet</td></tr> : syncLogs.slice(0,20).map(l=>(
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 mono-label text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                      <td>{l.direction}</td>
                      <td>{l.entity}{l.entityId ? ` #${l.entityId.slice(0,8)}` : ''}</td>
                      <td><span className={`badge ${l.status==='SUCCESS'?'badge-success':l.status==='FAILED'?'badge-error':'badge-warning'}`}>{l.status}</span></td>
                      <td className="text-xs text-muted max-w-[200px] truncate">{l.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
