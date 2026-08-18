import { ChevronLeft, ChevronRight } from 'lucide-react';

export function paginate(rows, page, pageSize) {
  if (!rows || pageSize === 'all' || !pageSize) return rows || [];
  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * size;
  return rows.slice(start, start + size);
}

export default function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  options = [10, 15, 50, 'all'],
}) {
  const size = pageSize === 'all' ? 'all' : Number(pageSize) || 10;
  const totalPages = size === 'all' ? 1 : Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : size === 'all' ? 1 : (current - 1) * size + 1;
  const end = size === 'all' ? total : Math.min(current * size, total);

  const pageNumbers = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== '…') {
      pageNumbers.push('…');
    }
  }

  return (
    <div className="pagination">
      <div className="page-info">
        Showing {start}–{end} of {total}
      </div>
      <div className="page-controls">
        <select
          value={String(pageSize)}
          onChange={(e) => {
            onPageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value));
            onPageChange(1);
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o === 'all' ? 'All' : `${o} per page`}
            </option>
          ))}
        </select>
        <button className="page-btn" disabled={current === 1} onClick={() => onPageChange(current - 1)} aria-label="Previous page">
          <ChevronLeft size={13} />
        </button>
        {pageNumbers.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="page-ellipsis">…</span>
          ) : (
            <button key={p} className={`page-btn ${p === current ? 'active' : ''}`} onClick={() => onPageChange(p)}>
              {p}
            </button>
          )
        )}
        <button className="page-btn" disabled={current === totalPages} onClick={() => onPageChange(current + 1)} aria-label="Next page">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
