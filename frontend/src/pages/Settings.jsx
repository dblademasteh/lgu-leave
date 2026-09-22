import { useState } from 'react';
import { Palette, Bell, User, Server, Moon, Sun, Check, Ban, Layout, Type } from 'lucide-react';
import { useTheme, applyTheme } from '../theme.js';
import { ACCENT_PRESETS, FONT_OPTIONS, presetValue, getAccent, applyAccent, getUiScale, applyUiScale, getFont, applyFont } from '../appearance.js';
import { useToast } from '../hooks/useToast.jsx';

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
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

  const pickAccent = (v, label='Accent updated') => { applyAccent(v); setAccent(v); toast(label,'success'); };
  const resetAppearance = () => { applyAccent(null); applyUiScale(100); applyFont('Inter'); setAccent(null); setUiScale(100); setFont('Inter'); toast('Appearance restored','success'); };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-display font-bold text-ink text-lg mb-5">Settings</h2>
      <div className="tabbar">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`tab flex items-center gap-1.5 ${tab===t.id?'tab-active':''}`}>{<t.icon size={14}/>}{t.label}</button>
        ))}
      </div>
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
      {tab==='notifications' && <div className="card p-5 mt-4">Notifications settings placeholder</div>}
      {tab==='account' && <div className="card p-5 mt-4">Account information placeholder</div>}
      {tab==='system' && <div className="card p-5 mt-4">System information placeholder</div>}
    </div>
  );
}
