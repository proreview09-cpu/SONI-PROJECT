import { formatINR, formatDate } from '../../utils/format';

export default function PaymentHistoryCard({ payments }) {
  const latest = payments[0];

  return (
    <div className="client-card">
      <h4>Payment History</h4>
      <div className="big-progress" style={{ fontSize: '22px' }}>
        {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
      </div>
      <small>successfully recorded</small>
      {latest && (
        <div className="client-foot">
          Latest payment {formatINR(latest.amount)}
          <br />
          Received on {formatDate(latest.paymentDate)}
        </div>
      )}
    </div>
  );
}
