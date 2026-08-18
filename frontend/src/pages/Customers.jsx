import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Pagination, { paginate } from '../components/common/Pagination';
import { formatINR } from '../utils/format';

function AddCustomerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ fullName: '', phone: '', alternatePhone: '', address: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/customers', form);
      onCreated(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer');
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Customer</h3>
        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label>Full Name *</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="field">
              <label>WhatsApp Number *</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" required />
            </div>
            <div className="field">
              <label>Alternate Phone</label>
              <input value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error && <div className="login-error" style={{ marginTop: 0 }}>{error}</div>}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={busy}>{busy ? 'Saving…' : 'Save Customer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get('/customers', { params: { search: search || undefined } })
        .then((res) => setCustomers(res.data.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const primaryEnrollment = (customer) => {
    const enrollments = customer.enrollments || [];
    return enrollments.find((e) => e.status === 'active') || enrollments[0] || null;
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div className="text-soft" style={{ fontSize: 11 }}>{row.phone}</div>
        </div>
      ),
    },
    {
      key: 'scheme',
      label: 'Scheme',
      render: (row) => {
        const enr = primaryEnrollment(row);
        return enr ? (
          <div>
            <div>{enr.scheme?.name || '—'}</div>
            <div className="text-soft" style={{ fontSize: 11 }}>
              {enr.installmentsPaid}/{enr.totalInstallments} paid
            </div>
          </div>
        ) : (
          <span className="text-soft">No scheme</span>
        );
      },
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => {
        const enr = primaryEnrollment(row);
        if (!enr) return '—';
        const pct = enr.totalInstallments ? (enr.installmentsPaid / enr.totalInstallments) * 100 : 0;
        return (
          <div style={{ minWidth: 90 }}>
            <div className="bar" style={{ margin: '2px 0 4px' }}>
              <i style={{ width: `${pct}%` }} />
            </div>
            <span className="text-soft" style={{ fontSize: 10 }}>{Math.round(pct)}%</span>
          </div>
        );
      },
    },
    {
      key: 'totalPaid',
      label: 'Total Paid',
      render: (row) => {
        const enr = primaryEnrollment(row);
        return enr ? formatINR(enr.totalPaid) : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const enr = primaryEnrollment(row);
        return <StatusBadge status={enr ? enr.status : 'upcoming'} />;
      },
    },
  ];

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">Customers</h1>
          <p className="dash-subtitle">All customer records and their scheme progress</p>
        </div>
        <Button variant="dark" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Customer
        </Button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search />
          <input placeholder="Search name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="text-soft" style={{ fontSize: 11 }}>{customers.length} customers</span>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          rows={paginate(customers, page, pageSize)}
          onRowClick={(row) => navigate(`/customers/${row._id}`)}
          emptyText={loading ? 'Loading…' : 'No customers found'}
        />
        <Pagination
          total={customers.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={(customer) => {
            setShowAdd(false);
            navigate(`/customers/${customer._id}`);
          }}
        />
      )}
    </div>
  );
}
