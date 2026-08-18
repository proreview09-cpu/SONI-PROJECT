import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function Settings() {
  const { isOwner } = useAuth();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings').then((res) => setForm(res.data.data)).catch(() => {});
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        businessName: form.businessName,
        defaultDueDay: Number(form.defaultDueDay),
        reminderDaysBefore: Number(form.reminderDaysBefore),
        gracePeriodDays: Number(form.gracePeriodDays),
        whatsappProvider: form.whatsappProvider,
        followupReNotifyDays: Number(form.followupReNotifyDays),
        monthlyCollectionTarget: Number(form.monthlyCollectionTarget),
      };
      const res = await api.put('/settings', payload);
      setForm(res.data.data);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setBusy(false);
    }
  };

  if (!form) return <div className="page">Loading settings…</div>;

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">Settings</h1>
          <p className="dash-subtitle">Global business configuration{!isOwner ? ' (view only — owner can edit)' : ''}</p>
        </div>
      </div>

      <form className="form-grid" style={{ maxWidth: 620 }} onSubmit={save}>
        <div className="card">
          <h4>Business</h4>
          <div className="form-grid">
            <div className="field">
              <label>Business Name</label>
              <input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} disabled={!isOwner} />
              <div className="hint-text">Replace with the actual shop name once confirmed.</div>
            </div>
            <div className="field">
              <label>Monthly Collection Target (₹)</label>
              <input type="number" min="0" value={form.monthlyCollectionTarget} onChange={(e) => set('monthlyCollectionTarget', e.target.value)} disabled={!isOwner} />
            </div>
          </div>
        </div>

        <div className="card">
          <h4>Scheme Rules</h4>
          <div className="form-row">
            <div className="field">
              <label>Default Due Day (1–28)</label>
              <input type="number" min="1" max="28" value={form.defaultDueDay} onChange={(e) => set('defaultDueDay', e.target.value)} disabled={!isOwner} />
            </div>
            <div className="field">
              <label>Reminder Days Before Due</label>
              <input type="number" min="1" value={form.reminderDaysBefore} onChange={(e) => set('reminderDaysBefore', e.target.value)} disabled={!isOwner} />
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Grace Period (days before overdue)</label>
              <input type="number" min="0" value={form.gracePeriodDays} onChange={(e) => set('gracePeriodDays', e.target.value)} disabled={!isOwner} />
            </div>
            <div className="field">
              <label>Overdue Re-notify Interval (days)</label>
              <input type="number" min="1" value={form.followupReNotifyDays} onChange={(e) => set('followupReNotifyDays', e.target.value)} disabled={!isOwner} />
            </div>
          </div>
          <p className="hint-text">Grace period = 0 means overdue the day after the due date. Late penalties are not applied automatically.</p>
        </div>

        <div className="card">
          <h4>WhatsApp</h4>
          <div className="field">
            <label>Provider</label>
            <select value={form.whatsappProvider} onChange={(e) => set('whatsappProvider', e.target.value)} disabled={!isOwner}>
              <option value="stub">Stub (console log — local development)</option>
              <option value="custom">Custom API (configure WHATSAPP_API_URL in backend/.env)</option>
            </select>
            <div className="hint-text">Messages are written to the WhatsApp Log either way. No paid account is required for local runs.</div>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}
        {message && <div className="text-green" style={{ fontSize: 12 }}>{message}</div>}

        {isOwner && (
          <div>
            <Button type="submit" variant="gold" disabled={busy}>
              <Save size={14} /> {busy ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
