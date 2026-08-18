import { rewardLabel } from '../../utils/format';

export default function SchemeStatusCard({ enrollment }) {
  const remaining = Math.max(0, (enrollment.totalInstallments || 11) - (enrollment.installmentsPaid || 0));

  const line =
    enrollment.status === 'active'
      ? `Active • ${remaining} installments remaining`
      : enrollment.status === 'completed'
        ? 'Completed'
        : 'Cancelled';

  return (
    <div className="client-card">
      <h4>Scheme Status</h4>
      <div className="scheme-status-line">{line}</div>
      <div className="reward-line">Reward: {rewardLabel(enrollment.rewardStatus)}</div>
    </div>
  );
}
