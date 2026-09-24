import { NavLink } from 'react-router-dom';
import { Landmark, LayoutDashboard, CalendarDays, CheckSquare, BarChart3, Settings as SettingsIcon, User } from 'lucide-react';
import { useAuth } from '../stores/auth.js';

const GROUPS = [
  {
    label: 'Leave',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/my-leaves', label: 'My Leave Requests', icon: CalendarDays },
      { to: '/approvals', label: 'Approvals', icon: CheckSquare, badge: true },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

function Brand({ expanded }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-4 border-b border-line ${expanded ? '' : 'justify-center'}`}>
      <div className="w-11 h-11 rounded-[14px] bg-ink text-bg grid place-items-center shrink-0 shadow-sm">
        <Landmark size={22} aria-hidden="true" />
      </div>
      {expanded && (
        <div className="min-w-0">
          <p className="font-display font-bold text-ink leading-tight truncate text-[15px]">LGU Leave</p>
          <p className="mono-label text-[10px]">Management & Reporting</p>
        </div>
      )}
    </div>
  );
}

function Nav({ expanded, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto hide-scrollbar py-5" aria-label="Main navigation">
      {GROUPS.map((group, gi) => (
        <div key={group.label} className={`px-2 ${gi > 0 ? 'mt-6' : ''}`}>
          {expanded && (
            <div className="px-3 pb-2 pt-1 mono-label text-[10px] uppercase tracking-wider text-muted">{group.label}</div>
          )}
          <div className="space-y-1">
            {group.items.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all border-l-2 ${isActive ? 'bg-accent/10 text-accent font-semibold border-accent' : 'text-ink hover:bg-bg/70 border-transparent'}
                  ${expanded ? 'pr-3' : 'justify-center'}
                `
                }
              >
                <span className={`grid place-items-center w-8 h-8 rounded-[8px] transition-colors ${expanded ? 'group-hover:bg-bg/60' : ''}`}>
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
                {expanded && <span className="truncate text-sm flex-1">{label}</span>}
                {expanded && badge && (
                  <span className="ml-auto shrink-0">
                    <span className="badge badge-accent">Pending</span>
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Footer({ expanded }) {
  const user = useAuth(state => state.user);
  return (
    <div className="border-t border-line p-3">
      <div className={`flex items-center gap-3 px-1 py-2 rounded-[10px] ${expanded ? '' : 'justify-center'}`}>
        <div className="w-9 h-9 rounded-full bg-accent/10 text-accent grid place-items-center shrink-0">
          <User size={18} />
        </div>
        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{user?.name || user?.employeeNumber || 'User'}</p>
            <p className="mono-label text-[10px] truncate">{user?.role || 'Employee'}</p>
          </div>
        )}
      </div>
      {expanded && (
        <p className="mono-label text-[10px] text-center mt-2 text-muted">On-prem • RA 10173 • v1.0</p>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const expanded = !collapsed;
  const drawerContent = (
    <>
      <Brand expanded={expanded} />
      <Nav expanded={expanded} onNavigate={onMobileClose} />
      <Footer expanded={expanded} />
    </>
  );
  return (
    <>
      <aside className={`bg-surface border-r border-line hidden md:flex flex-col shrink-0 transition-[width] duration-200 ${collapsed ? 'w-[80px]' : 'w-[268px]'}`}>
        {drawerContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onMobileClose} aria-label="Close navigation" />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-surface border-r border-line flex flex-col shadow-xl animate-[slideIn_200ms_ease]">
            {drawerContent}
          </aside>
        </div>
      )}
      <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}
