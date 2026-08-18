const Installment = require('../models/Installment');
const Enrollment = require('../models/Enrollment');
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const { monthStart, monthEnd, formatDate } = require('../utils/dateHelpers');

function parseRange(query) {
  const from = query.from ? new Date(query.from) : monthStart(new Date());
  const to = query.to ? new Date(query.to) : monthEnd(new Date());
  return { from, to };
}

async function collectionsReport(query) {
  const { from, to } = parseRange(query);
  const rows = await Installment.find({
    status: 'paid',
    paymentDate: { $gte: from, $lte: to },
  })
    .populate('customer', 'fullName phone')
    .populate('enrollment', 'installmentNumber monthlyAmount')
    .populate('recordedBy', 'name')
    .sort({ paymentDate: -1 });

  return rows.map((i) => ({
    date: formatDate(i.paymentDate),
    customer: i.customer?.fullName || '',
    phone: i.customer?.phone || '',
    installmentNumber: i.installmentNumber,
    amount: i.amount,
    method: i.paymentMethod || '',
    reference: i.referenceNumber || '',
    staff: i.recordedBy?.name || '',
  }));
}

async function pendingReport(query) {
  const filter = { status: { $in: ['pending', 'due_today'] } };
  if (query.customer) filter.customer = query.customer;
  const rows = await Installment.find(filter)
    .populate('customer', 'fullName phone')
    .sort({ dueDate: 1 });

  return rows.map((i) => ({
    customer: i.customer?.fullName || '',
    phone: i.customer?.phone || '',
    installmentNumber: i.installmentNumber,
    dueDate: formatDate(i.dueDate),
    amount: i.amount,
    status: i.status,
  }));
}

async function overdueReport(query) {
  const filter = { status: 'overdue' };
  if (query.customer) filter.customer = query.customer;
  const rows = await Installment.find(filter)
    .populate('customer', 'fullName phone')
    .sort({ dueDate: 1 });

  return rows.map((i) => ({
    customer: i.customer?.fullName || '',
    phone: i.customer?.phone || '',
    installmentNumber: i.installmentNumber,
    dueDate: formatDate(i.dueDate),
    amount: i.amount,
    daysOverdue: Math.max(0, Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000)),
  }));
}

async function schemeWiseReport() {
  const schemes = await Scheme.find();
  const enrollments = await Enrollment.find();

  const map = {};
  for (const s of schemes) {
    map[s._id.toString()] = {
      scheme: s.name,
      monthlyAmount: s.monthlyAmount,
      enrollments: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      totalPaid: 0,
    };
  }

  for (const e of enrollments) {
    const key = e.scheme?.toString?.() || String(e.scheme);
    if (!map[key]) continue;
    map[key].enrollments++;
    map[key].totalPaid += e.totalPaid || 0;
    if (e.status === 'active') map[key].active++;
    else if (e.status === 'completed') map[key].completed++;
    else if (e.status === 'cancelled') map[key].cancelled++;
  }

  return Object.values(map).sort((a, b) => b.totalPaid - a.totalPaid);
}

async function staffWiseReport() {
  const users = await User.find({ role: { $in: ['owner', 'staff'] } });
  const installments = await Installment.find({ status: 'paid', recordedBy: { $ne: null } });

  const map = {};
  for (const u of users) {
    map[u._id.toString()] = { staff: u.name, role: u.role, payments: 0, collected: 0 };
  }

  for (const i of installments) {
    const key = String(i.recordedBy);
    if (!map[key]) continue;
    map[key].payments++;
    map[key].collected += i.amount;
  }

  return Object.values(map).sort((a, b) => b.collected - a.collected);
}

async function buildReportData(type, query) {
  switch (type) {
    case 'collections':
      return { rows: await collectionsReport(query), label: 'Collections' };
    case 'pending':
      return { rows: await pendingReport(query), label: 'Pending EMI' };
    case 'overdue':
      return { rows: await overdueReport(query), label: 'Overdue EMI' };
    case 'scheme-wise':
      return { rows: await schemeWiseReport(), label: 'Scheme-wise' };
    case 'staff-wise':
      return { rows: await staffWiseReport(), label: 'Staff-wise' };
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

module.exports = { buildReportData, parseRange };
