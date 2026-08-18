import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import PayModal from '../components/common/PayModal';
import Pagination, { paginate } from '../components/common/Pagination';
import { formatINR, formatDate, methodLabel } from '../utils/format';

export default function EmiSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'collections' ? 'collections' : 'schedule';

  const [installments, setInstallments] = useState([]);
  const [status, setStatus] = useState(tab === 'collections' ? 'paid' : '');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    if (from) params.from = from;
    if (to) params.to = to;
    api
      .get('/installments', { params })
      .then((res) => setInstallments(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, search, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setStatus(tab === 'collections' ? 'paid' : '');
  }, [tab]);

  useEffect(() => {
    setPage(1);
  }, [status, search, from, to, tab]);

  const setTab = (next) => {
    setSearchParams(next === 'collections' ? { tab: 'collections' } : {});
  };

  const columns = [
    { key: 'customer', label: 'Customer', render: (row) => row.customer?.fullName || '—' },
    { key: 'phone', label: 'Phone', render: (row) => row.customer?.phone || '—' },
    { key: 'installmentNumber', label: '#', render: (row) => `${row.installmentNumber}/${row.enrollment?.totalInstallments || 11}` },
    { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) },
    { key: 'amount', label: 'Amount', render: (row) => formatINR(row.amount) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'paymentDate', label: 'Paid On', render: (row) => (row.paymentDate ? formatDate(row.paymentDate) : '—') },
    { key: 'paymentMethod', label: 'Method', render: (row) => (row.paymentMethod ? methodLabel(row.paymentMethod) : '—') },
    { key: 'remarks', label: 'Remarks', render: (row) => row.remarks || '—' },
    {
      key: 'action',
      label: '',
      render: (row) =>
        row.status !== 'paid' ? (
          <Button size="sm" variant="gold" onClick={() => setPayTarget(row)}>
            Mark Paid
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">EMI Schedule</h1>
          <p className="dash-subtitle">Full installment ledger — filter by status and date</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>
          EMI Schedule
        </button>
        <button className={`tab ${tab === 'collections' ? 'active' : ''}`} onClick={() => setTab('collections')}>
          Collections (Paid)
        </button>
      </div>

      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="upcoming">Upcoming</option>
          <option value="due_today">Due Today</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <div className="search-box">
          <Search />
          <input placeholder="Search customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From due date" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To due date" />
        <span className="text-soft" style={{ fontSize: 11 }}>{installments.length} records</span>
      </div>

      <div className="card">
        <DataTable columns={columns} rows={paginate(installments, page, pageSize)} emptyText={loading ? 'Loading…' : 'No installments found'} />
        <Pagination
          total={installments.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {payTarget && (
        <PayModal
          installment={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={() => {
            setPayTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
