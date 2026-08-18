import { formatShortDate, formatINR } from '../../utils/format';

export default function NextEmiCard({ installment, onPay }) {
  if (!installment) {
    return (
      <div className="client-card">
        <h4>Next EMI</h4>
        <small>No upcoming installment</small>
      </div>
    );
  }

  return (
    <div className="client-card">
      <h4>Next EMI</h4>
      <div className="next-emi-date">{formatShortDate(installment.dueDate)}</div>
      <small>Amount due: {formatINR(installment.amount)}</small>
      <button className="cta-block" onClick={onPay}>
        Payment / Contact Store
      </button>
    </div>
  );
}
