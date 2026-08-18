import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  IndianRupee,
  CalendarClock,
  Hourglass,
  LayoutGrid,
  FileText,
  MessageCircle,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/emi-schedule?tab=collections', label: 'Collections', icon: IndianRupee, special: 'collections' },
  { to: '/emi-schedule', label: 'EMI Schedule', icon: CalendarClock, special: 'schedule' },
  { to: '/pending-emis', label: 'Pending EMIs', icon: Hourglass },
  { to: '/schemes', label: 'Schemes', icon: LayoutGrid },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isItemActive = (item) => {
    if (item.end) return location.pathname === item.to;
    if (item.special === 'collections') {
      return location.pathname === '/emi-schedule' && location.search.includes('tab=collections');
    }
    if (item.special === 'schedule') {
      return location.pathname === '/emi-schedule' && !location.search.includes('tab=collections');
    }
    return location.pathname.startsWith(item.to) && item.to !== '/';
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="side-logo">Suvarn Bachat</div>
      <nav>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={() => `side-item ${isItemActive(item) ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="side-foot">
        <div className="side-user">
          <strong>{user?.name}</strong>
          {user?.role === 'owner' ? 'Owner' : 'Staff'}
        </div>
        <button
          className="side-item"
          style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
          onClick={logout}
        >
          <LogOut />
          Sign out
        </button>
      </div>
    </aside>
  );
}
