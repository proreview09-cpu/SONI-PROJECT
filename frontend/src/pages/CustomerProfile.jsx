import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, MapPin } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Pagination, { paginate } from '../components/common/Pagination';
import SchemeProgressCard from '../components/customer/SchemeProgressCard';
import NextEmiCard from '../components/customer/NextEmiCard';
import PaymentHistoryCard from '../components/customer/PaymentHistoryCard';
import SchemeStatusCard from '../components/customer/SchemeStatusCard';
import { formatINR, formatDate, formatTime, methodLabel, rewardLabel } from '../utils/format';

function PayModal({ installment, onClose, onPaid }) {
  const [form, setForm] = useState({ method: 'cash', reference: '', remarks: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.put(`/installments/${installment._id}/pay`, form);
      onPaid(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Record Payment</h3>
        <p className="text-soft" style={{ fontSize: 12, margin: '-8px 0 14px' }}>
          Installment #{installment.installmentNumber} · {formatINR(installment.amount)}
        </p>
        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label>Payment Method</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Reference Number</label>
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="UTR / receipt no. (optional)" />
          </div>
          <div className="field">
            <label>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
          {error && <div className="login-error" style={{ marginTop: 0 }}>{error}</div>}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={busy}>{busy ? 'Saving…' : 'Mark as Paid'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RewardModal({ enrollment, onClose, onSaved }) {
  const [form, setForm] = useState({
    rewardStatus: enrollment.rewardStatus,
    redeemedDate: enrollment.redeemedDate ? new Date(enrollment.redeemedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    redeemedValue: enrollment.redeemedValue ?? enrollment.monthlyAmount,
    redemptionNotes: enrollment.redemptionNotes || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        rewardStatus: form.rewardStatus,
        redemptionNotes: form.redemptionNotes,
      };
      if (form.rewardStatus === 'claimed') {
        payload.redeemedDate = form.redeemedDate;
        payload.redeemedValue = Number(form.redeemedValue) || enrollment.monthlyAmount;
      }
      const res = await api.put(`/enrollments/${enrollment._id}/reward`, payload);
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reward');
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Reward / Redemption</h3>
        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label>Reward Status</label>
            <select value={form.rewardStatus} onChange={(e) => setForm({ ...form, rewardStatus: e.target.value })}>
              <option value="eligible">Eligible</option>
              <option value="pending">Pending</option>
              <option value="claimed">Claimed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {form.rewardStatus === 'claimed' && (
            <>
              <div className="form-row">
                <div className="field">
                  <label>Redeemed Date *</label>
                  <input type="date" value={form.redeemedDate} onChange={(e) => setForm({ ...form, redeemedDate: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Redeemed Value (₹)</label>
                  <input type="number" value={form.redeemedValue} onChange={(e) => setForm({ ...form, redeemedValue: e.target.value })} />
                </div>
              </div>
            </>
          )}
          <div className="field">
            <label>Redemption Notes</label>
            <textarea value={form.redemptionNotes} onChange={(e) => setForm({ ...form, redemptionNotes: e.target.value })} />
          </div>
          {error && <div className="login-error" style={{ marginTop: 0 }}>{error}</div>}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EnrollModal({ customer, onClose, onEnrolled }) {
  const [schemes, setSchemes] = useState([]);
  const [form, setForm] = useState({
    schemeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDay: 5,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/schemes').then((res) => {
      const active = res.data.data.filter((s) => s.isActive);
      setSchemes(active);
      if (active.length) setForm((f) => ({ ...f, schemeId: active[0]._id }));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/enrollments', {
        customerId: customer._id,
        schemeId: form.schemeId,
        startDate: form.startDate,
        dueDay: Number(form.dueDay),
      });
      onEnrolled(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll customer');
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Enroll in Scheme</h3>
        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label>Scheme Plan *</label>
            <select value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })} required>
              <option value="">Select a scheme…</option>
              {schemes.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.durationMonths} months)
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div className="field">
              <label>Due Day (1–28)</label>
              <input type="number" min="1" max="28" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} required />
            </div>
          </div>
          <p className="hint-text" style={{ marginTop: 0 }}>
            11 installments will be auto-generated, and a welcome WhatsApp message will be sent.
          </p>
          {error && <div className="login-error" style={{ marginTop: 0 }}>{error}</div>}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={busy}>{busy ? 'Enrolling…' : 'Enroll Customer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [payTarget, setPayTarget] = useState(null);
  const [rewardTarget, setRewardTarget] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', alternatePhone: '', address: '', notes: '' });
  const [actionError, setActionError] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);

  const load = () =>
    api.get(`/customers/${id}`).then((res) => {
      setData(res.data.data);
      const active = res.data.data.enrollments.find((e) => e.status === 'active') || res.data.data.enrollments[0];
      if (active) setSelectedEnrollmentId(active._id);
      setLoading(false);
    });

  useEffect(() => {
    setLoading(true);
    setLedgerPage(1);
    setLogPage(1);
    load().catch(() => {
      setLoading(false);
      setData(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const enrollment = useMemo(
    () => data?.enrollments.find((e) => e._id === selectedEnrollmentId) || data?.enrollments[0] || null,
    [data, selectedEnrollmentId]
  );

  const enrollmentInstallments = useMemo(
    () => (enrollment ? data.installments.filter((i) => i.enrollment === enrollment._id) : []),
    [data, enrollment]
  );

  const nextInstallment = useMemo(
    () => enrollmentInstallments.filter((i) => i.status !== 'paid').sort((a, b) => a.installmentNumber - b.installmentNumber)[0] || null,
    [enrollmentInstallments]
  );

  const paidInstallments = useMemo(
    () => (data ? data.installments.filter((i) => i.status === 'paid').sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)) : []),
    [data]
  );

  if (loading) return <div className="page">Loading customer…</div>;
  if (!data) {
    return (
      <div className="page">
        <Button variant="ghost" onClick={() => navigate('/customers')}>
          <ChevronLeft size={14} /> Back to Customers
        </Button>
        <p>Customer not found.</p>
      </div>
    );
  }

  const customer = data.customer;

  const refreshAfterPay = () => {
    setPayTarget(null);
    load();
  };

  const cancelEnrollment = async () => {
    if (!enrollment) return;
    if (!window.confirm('Cancel this enrollment? Future installments and reminders will be stopped.')) return;
    setActionError('');
    try {
      await api.put(`/enrollments/${enrollment._id}`, { status: 'cancelled' });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to cancel enrollment');
    }
  };

  const openEdit = () => {
    setEditForm({
      fullName: customer.fullName,
      phone: customer.phone,
      alternatePhone: customer.alternatePhone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setShowEdit(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.put(`/customers/${customer._id}`, editForm);
      setShowEdit(false);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update customer');
    }
  };

  const ledgerColumns = [
    { key: 'installmentNumber', label: '#', render: (row) => row.installmentNumber },
    { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) },
    { key: 'amount', label: 'Amount', render: (row) => formatINR(row.amount) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'paymentDate', label: 'Paid On', render: (row) => (row.paymentDate ? formatDate(row.paymentDate) : '—') },
    { key: 'paymentMethod', label: 'Method', render: (row) => (row.paymentMethod ? methodLabel(row.paymentMethod) : '—') },
    { key: 'referenceNumber', label: 'Reference', render: (row) => row.referenceNumber || '—' },
    { key: 'remarks', label: 'Remarks', render: (row) => row.remarks || '—' },
    { key: 'recordedBy', label: 'Recorded By', render: (row) => row.recordedBy?.name || '—' },
    {
      key: 'action',
      label: '',
      render: (row) =>
        row.status !== 'paid' && enrollment?.status === 'active' ? (
          <Button size="sm" variant="gold" onClick={() => setPayTarget(row)}>
            Record Payment
          </Button>
        ) : null,
    },
  ];

  const logColumns = [
    { key: 'templateType', label: 'Type', render: (row) => row.templateType.replace(/_/g, ' ') },
    { key: 'messageContent', label: 'Message', render: (row) => <span className="text-soft">{row.messageContent}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'sentAt', label: 'Sent At', render: (row) => `${formatDate(row.sentAt)} ${formatTime(row.sentAt)}` },
  ];

  return (
    <div className="page">
      <div className="dash-top" style={{ marginBottom: 14 }}>
        <div>
          <Link to="/customers" className="text-soft" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={12} /> Back to Customers
          </Link>
          <h1 className="dash-title">Customer 360°</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={openEdit}>Edit Details</Button>
          <Button variant="dark" size="sm" onClick={() => setShowEnroll(true)}>Enroll in Scheme</Button>
        </div>
      </div>

      {actionError && <div className="login-error" style={{ marginBottom: 12 }}>{actionError}</div>}

      <div className="client-preview">
        <div className="client-head">
          <div className="client-brand">Suvarn Bachat</div>
          <div className="client-user">Welcome, {customer.fullName}</div>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 12 }} className="text-soft">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={12} /> {customer.phone}</span>
          {customer.alternatePhone && <span>Alt: {customer.alternatePhone}</span>}
          {customer.address && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={12} /> {customer.address}</span>}
        </div>

        {data.enrollments.length > 1 && (
          <div className="filter-bar" style={{ marginTop: 12, marginBottom: 0 }}>
            <select value={selectedEnrollmentId} onChange={(e) => setSelectedEnrollmentId(e.target.value)}>
              {data.enrollments.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.scheme?.name || 'Scheme'} — {e.status} ({e.installmentsPaid}/{e.totalInstallments})
                </option>
              ))}
            </select>
          </div>
        )}

        {enrollment ? (
          <>
            <div className="client-grid">
              <SchemeProgressCard enrollment={enrollment} />
              <NextEmiCard installment={nextInstallment} onPay={() => nextInstallment && setPayTarget(nextInstallment)} />
              <PaymentHistoryCard payments={paidInstallments} />
              <SchemeStatusCard enrollment={enrollment} />
            </div>

            <div className="profile-actions">
              {enrollment.status === 'active' && nextInstallment && (
                <Button variant="gold" onClick={() => setPayTarget(nextInstallment)}>Record Payment</Button>
              )}
              {enrollment.status === 'active' && (
                <Button variant="danger" size="sm" onClick={cancelEnrollment}>Cancel Enrollment</Button>
              )}
              {enrollment.status === 'completed' && (
                <Button variant="dark" onClick={() => setRewardTarget(true)}>
                  Reward: {rewardLabel(enrollment.rewardStatus)}
                </Button>
              )}
              {enrollment.status === 'completed' && enrollment.redeemedDate && (
                <span className="text-soft" style={{ fontSize: 12 }}>
                  Redeemed on {formatDate(enrollment.redeemedDate)}
                  {enrollment.redeemedValue ? ` · ${formatINR(enrollment.redeemedValue)}` : ''}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="client-grid">
            <div className="client-card">
              <h4>No Active Scheme</h4>
              <small>This customer is not enrolled in any scheme yet.</small>
              <div style={{ marginTop: 12 }}>
                <Button variant="dark" size="sm" onClick={() => setShowEnroll(true)}>Enroll in Scheme</Button>
              </div>
            </div>
          </div>
        )}

        <div className="section-gap card">
          <h4>Payment Ledger{enrollment ? ` — ${enrollment.scheme?.name || ''}` : ''}</h4>
          <DataTable columns={ledgerColumns} rows={paginate(enrollmentInstallments, ledgerPage, ledgerPageSize)} emptyText="No installments yet" />
          <Pagination
            total={enrollmentInstallments.length}
            page={ledgerPage}
            pageSize={ledgerPageSize}
            onPageChange={setLedgerPage}
            onPageSizeChange={setLedgerPageSize}
          />
        </div>

        <div className="section-gap card">
          <h4>Communication History (WhatsApp)</h4>
          <DataTable columns={logColumns} rows={paginate(data.communicationHistory, logPage, logPageSize)} emptyText="No messages sent yet" />
          <Pagination
            total={data.communicationHistory.length}
            page={logPage}
            pageSize={logPageSize}
            onPageChange={setLogPage}
            onPageSizeChange={setLogPageSize}
          />
        </div>
      </div>

      {payTarget && (
        <PayModal installment={payTarget} onClose={() => setPayTarget(null)} onPaid={refreshAfterPay} />
      )}
      {rewardTarget && (
        <RewardModal enrollment={enrollment} onClose={() => setRewardTarget(false)} onSaved={() => { setRewardTarget(false); load(); }} />
      )}
      {showEnroll && (
        <EnrollModal customer={customer} onClose={() => setShowEnroll(false)} onEnrolled={() => { setShowEnroll(false); load(); }} />
      )}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Customer</h3>
            <form className="form-grid" onSubmit={saveEdit}>
              <div className="field">
                <label>Full Name *</label>
                <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>WhatsApp Number *</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Alternate Phone</label>
                  <input value={editForm.alternatePhone} onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Address</label>
                <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" variant="gold">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
