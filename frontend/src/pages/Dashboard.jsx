import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import { formatLakh, formatINR, greeting, formatTime } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setSummary(res.data.data)).catch(() => setError('Failed to load dashboard'));
    api.get('/dashboard/automation-queue').then((res) => setQueue(res.data.data)).catch(() => {});
  }, []);

  const paidToday = summary?.recentPayments || [];
  const unpaidToday = summary?.dueTodayUnpaid || [];
  const target = summary?.monthlyTarget || 150000;
  const percent = summary ? Math.min(100, (summary.thisMonth / target) * 100) : 0;

  const miniRows = [
    ...unpaidToday.map((i) => ({
      _id: `u-${i._id}`,
      customer: i.customer?.fullName || '—',
      amount: i.amount,
      status: i.status,
      label: i.status === 'due_today' ? 'Pending' : i.status,
    })),
    ...paidToday.map((i) => ({
      _id: `p-${i._id}`,
      customer: i.customer?.fullName || '—',
      amount: i.amount,
      status: 'paid',
      label: 'Paid',
    })),
  ];

  const automationRunning = queue?.lastStatus === 'success';
  const automationNever = queue?.lastStatus === 'never';
  const automationStatus = automationRunning
    ? 'Automation Running'
    : queue?.lastStatus === 'failed'
      ? 'Automation Error'
      : 'Automation Scheduled';

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="dash-subtitle">{summary ? 'Suvarn Bachat Yojana overview' : 'Loading overview…'}</p>
        </div>
        <div className="avatar">{(user?.name || '?').charAt(0).toUpperCase()}</div>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="dash-cards">
        <StatCard label="Active Members" value={summary ? summary.activeMembers : '—'} />
        <StatCard label="This Month" value={summary ? formatLakh(summary.thisMonth) : '—'} />
        <StatCard label="Pending EMI" value={summary ? summary.pendingEmi : '—'} />
        <StatCard label="Completed" value={summary ? summary.completed : '—'} />
      </div>

      <div className="dash-content">
        <div className="dash-panel">
          <h4>Today&apos;s Collection &amp; Recent Payments</h4>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>EMI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {miniRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">No payments or dues today</td>
                </tr>
              ) : (
                miniRows.slice(0, 8).map((row) => (
                  <tr key={row._id}>
                    <td>{row.customer}</td>
                    <td>{formatINR(row.amount)}</td>
                    <td>
                      <StatusBadge status={row.status} label={row.label} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>Monthly Collection Target</h4>
            <ProgressBar percent={percent} />
            <div className="bar-caption">
              {summary ? `${formatLakh(summary.thisMonth)} collected • ${Math.round(percent)}% of ${formatLakh(target)} target` : 'Loading…'}
            </div>
          </div>
        </div>

        <div className="dash-panel">
          <h4>Automation Queue</h4>
          <div className="queue-row">
            <span className="queue-label">5-day reminders</span>
            <span className="queue-number">{queue ? queue.reminders5Day : '—'}</span>
          </div>
          <div className="queue-row">
            <span className="queue-label">Due today</span>
            <span className="queue-number">{queue ? queue.dueToday : '—'}</span>
          </div>
          <div className="queue-row">
            <span className="queue-label">Pending follow-ups</span>
            <span className="queue-number">{queue ? queue.pendingFollowups : '—'}</span>
          </div>
          <hr className="queue-divider" />
          <div className={`automation-status ${automationRunning ? 'text-green' : automationNever ? 'text-soft' : 'text-red'}`}>
            <span className={`dot ${automationRunning ? '' : automationNever ? 'never' : 'failed'}`} />{automationStatus}
          </div>
          {queue?.lastRunAt && (
            <div className="automation-detail">Last job ran at {formatTime(queue.lastRunAt)}</div>
          )}
          {!queue?.lastRunAt && (
            <div className="automation-detail">Daily job runs at 08:00 IST — will run automatically</div>
          )}
        </div>
      </div>
    </div>
  );
}
