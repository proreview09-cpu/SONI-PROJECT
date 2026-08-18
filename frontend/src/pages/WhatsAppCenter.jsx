import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Pagination, { paginate } from '../components/common/Pagination';
import { formatDate, formatTime } from '../utils/format';

const TEMPLATE_INFO = [
  { key: 'welcome', title: 'Welcome (on enrollment)', hint: 'Placeholders: {{customerName}}, {{monthlyAmount}}, {{dueDay}}, {{duration}}' },
  { key: '5day_reminder', title: '5-Day Advance Reminder', hint: 'Placeholders: {{customerName}}, {{amount}}, {{dueDate}}' },
  { key: 'due_today', title: 'Due Today Reminder', hint: 'Placeholders: {{customerName}}, {{amount}}' },
  { key: 'pending_followup', title: 'Pending Follow-up', hint: 'Placeholders: {{customerName}}, {{amount}}, {{dueDate}}' },
  { key: 'payment_confirmation', title: 'Payment Confirmation', hint: 'Placeholders: {{amount}}, {{installmentNumber}}, {{totalPaid}}' },
  { key: 'completion', title: 'Completion (reward eligible)', hint: 'Placeholders: {{customerName}}' },
];

function AnnouncementsTab() {
  const [customers, setCustomers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', audience: 'all', selectedCustomers: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(10);

  useEffect(() => {
    api.get('/customers').then((res) => setCustomers(res.data.data)).catch(() => {});
    api.get('/whatsapp/announcements').then((res) => setAnnouncements(res.data.data)).catch(() => {});
  }, []);

  const toggleCustomer = (id) => {
    setForm((f) => ({
      ...f,
      selectedCustomers: f.selectedCustomers.includes(id)
        ? f.selectedCustomers.filter((c) => c !== id)
        : [...f.selectedCustomers, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/whatsapp/announcements', form);
      setMessage(`Announcement sent to ${res.data.data.sent} of ${res.data.data.total} customers.`);
      setForm({ title: '', message: '', audience: 'all', selectedCustomers: [] });
      api.get('/whatsapp/announcements').then((r) => setAnnouncements(r.data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setBusy(false);
    }
  };

  const historyColumns = [
    { key: 'title', label: 'Title', render: (row) => row.title || '—' },
    { key: 'message', label: 'Message', render: (row) => <span className="text-soft">{row.message}</span> },
    { key: 'audience', label: 'Audience', render: (row) => row.audience },
    { key: 'deliveryCount', label: 'Delivered', render: (row) => row.deliveryCount },
    { key: 'sentBy', label: 'Sent By', render: (row) => row.sentBy?.name || '—' },
    { key: 'sentAt', label: 'Sent At', render: (row) => (row.sentAt ? `${formatDate(row.sentAt)} ${formatTime(row.sentAt)}` : '—') },
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h4>Compose Announcement</h4>
        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label>Title (optional)</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Festive Offer" />
          </div>
          <div className="field">
            <label>Message *</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <div className="field">
            <label>Audience *</label>
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">All customers</option>
              <option value="active">Active scheme members</option>
              <option value="completed">Completed members</option>
              <option value="pending">Customers with pending EMIs</option>
              <option value="selected">Selected customers…</option>
            </select>
          </div>
          {form.audience === 'selected' && (
            <div className="field">
              <label>Select customers ({form.selectedCustomers.length} selected)</label>
              <div className="audience-picker">
                {customers.map((c) => (
                  <label key={c._id}>
                    <input type="checkbox" checked={form.selectedCustomers.includes(c._id)} onChange={() => toggleCustomer(c._id)} />
                    {c.fullName} · {c.phone}
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <div className="login-error" style={{ marginTop: 0 }}>{error}</div>}
          {message && <div className="text-green" style={{ fontSize: 12 }}>{message}</div>}
          <div>
            <Button type="submit" variant="gold" disabled={busy}>
              <Send size={14} /> {busy ? 'Sending…' : 'Send Announcement'}
            </Button>
          </div>
        </form>
      </div>

      <div className="card">
        <h4>Past Announcements</h4>
        <DataTable columns={historyColumns} rows={paginate(announcements, histPage, histPageSize)} emptyText="No announcements yet" />
        <Pagination
          total={announcements.length}
          page={histPage}
          pageSize={histPageSize}
          onPageChange={setHistPage}
          onPageSizeChange={setHistPageSize}
        />
      </div>
    </div>
  );
}

function TemplatesTab() {
  const [templates, setTemplates] = useState({});
  const [keys, setKeys] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/whatsapp/templates').then((res) => {
      setTemplates(res.data.data.templates);
      setKeys(res.data.data.keys);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.put('/whatsapp/templates', { templates });
      setMessage('Templates saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save templates');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="page-sub">Edit the exact text sent for each automated message. {'{{placeholders}}'} are filled automatically.</p>
      <div className="form-grid" style={{ maxWidth: 720 }}>
        {TEMPLATE_INFO.filter((t) => keys.includes(t.key)).map((t) => (
          <div className="card" key={t.key} style={{ padding: 14 }}>
            <h4 style={{ margin: 0 }}>{t.title}</h4>
            <div className="hint-text" style={{ margin: '4px 0 8px' }}>{t.hint}</div>
            <textarea
              style={{ width: '100%', minHeight: 90 }}
              value={templates[t.key] || ''}
              onChange={(e) => setTemplates({ ...templates, [t.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      {error && <div className="login-error" style={{ maxWidth: 720 }}>{error}</div>}
      {message && <div className="text-green" style={{ fontSize: 12, marginTop: 8 }}>{message}</div>}
      <div style={{ marginTop: 14 }}>
        <Button variant="gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save Templates'}</Button>
      </div>
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    api.get('/whatsapp/logs').then((res) => setLogs(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'customer', label: 'Customer', render: (row) => row.customer?.fullName || '—' },
    { key: 'templateType', label: 'Type', render: (row) => row.templateType.replace(/_/g, ' ') },
    { key: 'messageContent', label: 'Message', render: (row) => <span className="text-soft">{row.messageContent}</span> },
    { key: 'provider', label: 'Provider', render: (row) => row.provider },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'sentAt', label: 'Sent At', render: (row) => `${formatDate(row.sentAt)} ${formatTime(row.sentAt)}` },
  ];

  return (
    <div className="card">
      <h4>Message Log ({logs.length} messages)</h4>
      <DataTable columns={columns} rows={paginate(logs, page, pageSize)} emptyText={loading ? 'Loading…' : 'No messages yet'} />
      <Pagination
        total={logs.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

export default function WhatsAppCenter() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState('announcements');

  return (
    <div className="page">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">WhatsApp Center</h1>
          <p className="dash-subtitle">Announcements, message templates and delivery log</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'announcements' ? 'active' : ''}`} onClick={() => setTab('announcements')}>
          Announcements
        </button>
        {isOwner && (
          <button className={`tab ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>
            Templates
          </button>
        )}
        <button className={`tab ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
          Logs
        </button>
      </div>

      {tab === 'announcements' && <AnnouncementsTab />}
      {tab === 'templates' && isOwner && <TemplatesTab />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
}
