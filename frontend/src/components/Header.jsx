import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, ChevronDown, LogOut, Landmark, Clock } from 'lucide-react';
import { useAuth } from '../stores/auth.js';
import { useTheme, toggleTheme } from '../theme.js';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/my-leaves': 'My Leave Requests',
  '/approvals': 'Approvals',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [now, setNow] = useState(() => new Date());
  const theme = useTheme();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userOpen) return;
    const onDown = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [userOpen]);

  const title = TITLES[location.pathname] ?? 'LGU Leave';
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const date = shifted.toISOString().slice(0,10);
  const time = shifted.toISOString().slice(11,19);
  const initial = (user?.fullName ?? user?.username ?? 'U').trim()[0]?.toUpperCase() ?? 'U';

  const signOut = () => { logout(); setUserOpen(false); navigate('/'); };

  return (
    <header className="h-16 shrink-0 bg-surface/90 backdrop-blur-md border-b border-line" style={{zIndex:50}}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" className="btn btn-ghost p-2 md:p-2.5" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-ink text-lg leading-tight truncate">{title}</h1>
            <p className="hidden sm:flex items-center gap-1.5 text-xs text-muted truncate">
              <Clock size={12} />
              <span className="font-mono">{time} PHT · {date}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleTheme} className="btn btn-ghost px-2 md:px-3" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="dropdown" ref={userRef}>
            <button type="button" className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-[12px] hover:bg-bg/60 border border-transparent hover:border-line" onClick={() => setUserOpen(o=>!o)}>
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-accent/20 to-accent/5 text-accent grid place-items-center ring-1 ring-accent/10">
                <span className="font-display font-bold text-[13px]">{initial}</span>
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-sm font-semibold text-ink truncate max-w-28">{user?.fullName ?? user?.username ?? 'Account'}</p>
                <p className="text-[10px] mono-label text-muted">{user?.role?.replaceAll('_',' ') ?? '—'}</p>
              </div>
              <ChevronDown size={14} className="text-muted hidden lg:block" />
            </button>
            {userOpen && (
              <div className="dropdown-panel w-64 shadow-lg">
                <div className="px-4 py-4 border-b border-line">
                  <p className="font-semibold text-ink text-sm">{user?.fullName ?? user?.username}</p>
                  <p className="mono-label text-[11px] text-muted">{user?.role?.replaceAll('_',' ')}</p>
                </div>
                <div className="border-t border-line py-1">
                  <button type="button" className="dropdown-item text-error" onClick={signOut}><LogOut size={16}/> Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
