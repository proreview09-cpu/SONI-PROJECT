import { useState } from 'react';
import api from '../../api/axiosClient';
import Button from './Button';
import { formatINR } from '../../utils/format';

export default function PayModal({ installment, onClose, onPaid }) {
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
          {installment.customer?.fullName} · Installment #{installment.installmentNumber} ·{' '}
          {formatINR(installment.amount)}
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
