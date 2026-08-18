import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import PayModal from '../components/common/PayModal';
import Pagination, { paginate } from '../components/common/Pagination';
import { formatINR, formatDate } from '../utils/format';

export default function PendingEmis() {
  const navigate = useNavigate();
  const [view, setView] = useState('pending');
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(() => {
    setLoading(true);
    const status = view === 'overdue' ? 'overdue' : 'pending,due_today';
    api
      .get('/installments', { params: { status } })
      .then((res) => setInstallments(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [view]);

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.customer?.fullName || '—'}</div>
          <div className="text-soft" style={{ fontSize: 11 }}>{row.customer?.phone || ''}</div>
        </div>
      ),
    },
    { key: 'installmentNumber', label: '#', render: (row) => `${row.installmentNumber}/${row.enrollment?.totalInstallments || 11}` },
    { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) },
    { key: 'amount', label: 'Amount', render: (row) => formatINR(row.amount) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'overdueBy', label: 'Days Late', render: (row) => (row.status === 'overdue' ? Math.max(0, Math.floor((Date.now() - new Date(row.dueDate).getTime()) / 86400000)) : '—') },
    {
      key: 'action',
      label: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="gold" onClick={() => setPayTarget(row)}>Mark Paid</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/customers/${row.customer?._id}`)}>View</Button>
        </div>
      ),
    },
  ];

  const counts = {
    pending: installments.filter((i) => i.status === 'pending' || i.status === 'due_today').length,
    overdue: installments.filter((i) => i.status === 'overdue').length,
  };

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">Pending EMIs</h1>
          <p className="dash-subtitle">Follow up on unpaid installments</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${view === 'pending' ? 'active' : ''}`} onClick={() => setView('pending')}>
          Pending ({counts.pending})
        </button>
        <button className={`tab ${view === 'overdue' ? 'active' : ''}`} onClick={() => setView('overdue')}>
          Overdue ({counts.overdue})
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} rows={paginate(installments, page, pageSize)} emptyText={loading ? 'Loading…' : 'Nothing pending — great job!'} />
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
