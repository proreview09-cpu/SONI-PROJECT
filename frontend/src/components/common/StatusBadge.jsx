const MAP = {
  paid: { cls: 'paid', label: 'Paid' },
  pending: { cls: 'pending', label: 'Pending' },
  due_today: { cls: 'pending', label: 'Due Today' },
  overdue: { cls: 'overdue', label: 'Overdue' },
  upcoming: { cls: 'upcoming', label: 'Upcoming' },
  active: { cls: 'paid', label: 'Active' },
  completed: { cls: 'paid', label: 'Completed' },
  cancelled: { cls: 'overdue', label: 'Cancelled' },
  sent: { cls: 'paid', label: 'Sent' },
  failed: { cls: 'overdue', label: 'Failed' },
  queued: { cls: 'pending', label: 'Queued' },
  eligible: { cls: 'paid', label: 'Eligible' },
  claimed: { cls: 'paid', label: 'Claimed' },
  closed: { cls: 'overdue', label: 'Closed' },
  not_applicable: { cls: 'upcoming', label: 'N/A' },
};

export default function StatusBadge({ status, label }) {
  const entry = MAP[status] || { cls: 'upcoming', label: status || '—' };
  return <span className={`status ${entry.cls}`}>{label || entry.label}</span>;
}
