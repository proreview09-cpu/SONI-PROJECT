import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardShell from './components/layout/DashboardShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Schemes from './pages/Schemes';
import EmiSchedule from './pages/EmiSchedule';
import PendingEmis from './pages/PendingEmis';
import Reports from './pages/Reports';
import WhatsAppCenter from './pages/WhatsAppCenter';
import Settings from './pages/Settings';

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerProfile />} />
        <Route path="/emi-schedule" element={<EmiSchedule />} />
        <Route path="/pending-emis" element={<PendingEmis />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/whatsapp" element={<WhatsAppCenter />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
