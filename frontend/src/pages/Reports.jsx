import { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import Pagination, { paginate } from '../components/common/Pagination';
import { formatINR } from '../utils/format';

const REPORT_TYPES = [
  { value: 'collections', label: 'Collections', endpoint: '/reports/collections' },
  { value: 'pending', label: 'Pending EMI', endpoint: '/reports/pending' },
  { value: 'overdue', label: 'Overdue EMI', endpoint: '/reports/overdue' },
  { value: 'scheme-wise', label: 'Scheme-wise', endpoint: '/reports/scheme-wise' },
  { value: 'staff-wise', label: 'Staff-wise', endpoint: '/reports/staff-wise' },
];

const LABELS = {
  date: 'Date',
  customer: 'Customer',
  phone: 'Phone',
  installmentNumber: 'EMI #',
  amount: 'Amount',
  method: 'Method',
  reference: 'Reference',
  staff: 'Staff',
  dueDate: 'Due Date',
  status: 'Status',
  daysOverdue: 'Days Overdue',
  scheme: 'Scheme',
  monthlyAmount: 'Monthly Amount',
  enrollments: 'Enrollments',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  totalPaid: 'Total Paid',
  role: 'Role',
  payments: 'Payments',
  collected: 'Collected',
};

function humanize(key) {
  return LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export default function Reports() {
  const [type, setType] = useState('collections');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const config = REPORT_TYPES.find((t) => t.value === type);
  const isRangeType = type === 'collections';

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (isRangeType && from) params.from = from;
    if (isRangeType && to) params.to = to;
    api
      .get(config.endpoint, { params })
      .then((res) => setRows(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [config.endpoint, isRangeType, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [type, from, to]);

  const columns = rows.length
    ? Object.keys(rows[0]).map((key) => ({
        key,
        label: humanize(key),
        render: (row) =>
          ['amount', 'totalPaid', 'collected', 'monthlyAmount'].includes(key)
            ? formatINR(row[key])
            : row[key] ?? '—',
      }))
    : [{ key: 'empty', label: '' }];

  const exportFile = async (format) => {
    const params = { type, format };
    if (isRangeType && from) params.from = from;
    if (isRangeType && to) params.to = to;
    const res = await api.get('/reports/export', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    const ext = format === 'xlsx' ? 'xlsx' : 'csv';
    link.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || Number(r.totalPaid) || 0), 0);

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">Reports</h1>
          <p className="dash-subtitle">Filter, review and export business data</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => exportFile('csv')}>
            <Download size={14} /> Export CSV
          </Button>
          <Button variant="dark" onClick={() => exportFile('xlsx')}>
            <Download size={14} /> Export Excel
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {isRangeType && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
          </>
        )}
        {rows.length > 0 && total > 0 && (
          <span className="text-soft" style={{ fontSize: 11 }}>
            Total: {formatINR(total)} · {rows.length} rows
          </span>
        )}
      </div>

      {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card">
        <DataTable columns={columns} rows={paginate(rows, page, pageSize)} emptyText={loading ? 'Loading…' : 'No data for this selection'} />
        <Pagination
          total={rows.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
