import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import api from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import LiveClock from '../common/LiveClock';

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('Suvarn Bachat Yojana');

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        if (res.data.data?.businessName) setBusinessName(res.data.data.businessName);
      })
      .catch(() => {});
  }, []);

  const initial = (user?.name || '?').charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="topbar-brand">{businessName}</div>
      <LiveClock />
      <div className="topbar-user">
        <span className="avatar">{initial}</span>
        <span>
          {user?.name} · {user?.role === 'owner' ? 'Owner' : 'Staff'}
        </span>
      </div>
    </header>
  );
}
