import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const COLLAPSE_KEY = 'lgu-leave-sidebar-collapsed';
const MD_QUERY = '(min-width: 768px)';

export default function Layout({ maxWidth = 'max-w-6xl' }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, String(collapsed)); } catch {} }, [collapsed]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY);
    const onChange = () => { if (mq.matches) setMobileOpen(false); };
    onChange(); mq.addEventListener('change', onChange); return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleToggleSidebar = () => {
    if (window.matchMedia(MD_QUERY).matches) setCollapsed(c => !c); else setMobileOpen(o => !o);
  };

  return (
    <div className="h-screen flex bg-bg">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-auto p-3 sm:p-6 flex items-start justify-center">
          <div className={`w-full ${maxWidth}`}><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
