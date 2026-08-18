export default function ProgressBar({ percent }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="bar">
      <i style={{ width: `${p}%` }} />
    </div>
  );
}
