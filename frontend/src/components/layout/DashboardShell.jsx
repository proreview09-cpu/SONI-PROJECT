import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="shell-main">
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <Outlet />
      </div>
    </div>
  );
}
