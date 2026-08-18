import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import { formatINR, bonusDescription } from '../utils/format';

function SchemeModal({ scheme, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: scheme?.name || '',
    monthlyAmount: scheme?.monthlyAmount || 2000,
    durationMonths: scheme?.durationMonths || 11,
    bonusType: scheme?.bonusType || 'free_installment',
    bonusValue: scheme?.bonusValue ?? 1,
    isActive: scheme?.isActive ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, monthlyAmount: Number(form.monthlyAmount), durationMonths: Number(form.durationMonths), bonusValue: Number(form.bonusValue) };
      const res = scheme ? await api.put(`/schemes/${scheme._id}`, payload) : await api.post('/schemes', payload);
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scheme');
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{scheme ? 'Edit Scheme' : 'New Scheme Plan'}</h3>
        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label>Plan Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="₹2,000 Monthly Plan" required />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Monthly Amount (₹) *</label>
              <input type="number" min="1" value={form.monthlyAmount} onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value })} required />
            </div>
            <div className="field">
              <label>Duration (months)</label>
              <input type="number" min="1" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Bonus Type</label>
              <select value={form.bonusType} onChange={(e) => setForm({ ...form, bonusType: e.target.value })}>
                <option value="free_installment">Free Installment (11+1)</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="percentage">Percentage of Total</option>
              </select>
            </div>
            <div className="field">
              <label>Bonus Value</label>
              <input type="number" step="0.01" value={form.bonusValue} onChange={(e) => setForm({ ...form, bonusValue: e.target.value })} />
              <div className="hint-text">
                {form.bonusType === 'free_installment' ? 'Multiplier — 1 means one free installment' : form.bonusType === 'percentage' ? 'Percentage — e.g. 10 for 10%' : 'Fixed ₹ amount'}
              </div>
            </div>
          </div>
          <div className="field">
            <label>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active plan
            </label>
          </div>
          {error && <div className="login-error" style={{ marginTop: 0 }}>{error}</div>}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={busy}>{busy ? 'Saving…' : 'Save Plan'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Schemes() {
  const { isOwner } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [modal, setModal] = useState(null);

  const load = () => api.get('/schemes').then((res) => setSchemes(res.data.data));

  useEffect(() => {
    load().catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">Scheme Plans</h1>
          <p className="dash-subtitle">Plan templates — 11+1 reward shown on completion</p>
        </div>
        {isOwner && (
          <Button variant="dark" onClick={() => setModal({ scheme: null })}>
            <Plus size={14} /> New Plan
          </Button>
        )}
      </div>

      <div className="scheme-grid">
        {schemes.map((s) => (
          <div key={s._id} className="card scheme-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ margin: 0 }}>{s.name}</h4>
              <StatusBadge status={s.isActive ? 'active' : 'cancelled'} label={s.isActive ? 'Active' : 'Inactive'} />
            </div>
            <div className="scheme-amount">{formatINR(s.monthlyAmount)} / month</div>
            <small>{s.durationMonths} monthly installments</small>
            <div className="reward-line" style={{ marginTop: 8, fontSize: 11 }}>{bonusDescription(s)}</div>
            {isOwner && (
              <div style={{ marginTop: 12 }}>
                <Button size="sm" variant="ghost" onClick={() => setModal({ scheme: s })}>
                  <Pencil size={12} /> Edit
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <SchemeModal
          scheme={modal.scheme}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
