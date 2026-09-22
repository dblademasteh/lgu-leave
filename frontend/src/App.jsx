import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Settings from './pages/Settings.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyLeaves from './pages/MyLeaves.jsx';
import Approvals from './pages/Approvals.jsx';
import Reports from './pages/Reports.jsx';

function Protected({ children, roles }) {
  const user = useAuth(s => s.user);
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/my-leaves" element={<Protected><MyLeaves /></Protected>} />
          <Route path="/approvals" element={<Protected roles={['DEPARTMENT_HEAD','HR_MANAGER','ADMIN']}><Approvals /></Protected>} />
          <Route path="/reports" element={<Protected roles={['ADMIN','HR_MANAGER','DEPARTMENT_HEAD']}><Reports /></Protected>} />
          <Route path="/settings" element={<Protected roles={['ADMIN','HR_MANAGER']}><Settings /></Protected>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
