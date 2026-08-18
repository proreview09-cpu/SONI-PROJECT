export default function StatCard({ label, value, hint }) {
  return (
    <div className="dash-card">
      <small>{label}</small>
      <strong>{value}</strong>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
