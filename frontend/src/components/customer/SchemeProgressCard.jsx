import { formatINR } from '../../utils/format';

export default function SchemeProgressCard({ enrollment }) {
  const paid = enrollment.installmentsPaid || 0;
  const total = enrollment.totalInstallments || 11;

  return (
    <div className="client-card">
      <h4>My Scheme</h4>
      <div className="big-progress">
        {paid} / {total}
      </div>
      <small>Installments completed</small>
      <div className="client-steps" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={i < paid ? 'done' : ''} />
        ))}
      </div>
      <div className="client-foot">
        Monthly EMI: {formatINR(enrollment.monthlyAmount)} • Total Paid: {formatINR(enrollment.totalPaid)}
      </div>
    </div>
  );
}
