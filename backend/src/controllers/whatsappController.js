const Announcement = require('../models/Announcement');
const WhatsAppLog = require('../models/WhatsAppLog');
const Customer = require('../models/Customer');
const Enrollment = require('../models/Enrollment');
const Installment = require('../models/Installment');
const Settings = require('../models/Settings');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');
const { sendMessage, getEffectiveTemplates } = require('../services/whatsappService');
const { defaultTemplates, TEMPLATE_KEYS } = require('../templates/whatsappTemplates');
const { writeAudit } = require('../services/auditService');

exports.getTemplates = asyncHandler(async (req, res) => {
  const templates = await getEffectiveTemplates();
  return ok(res, { templates, defaults: defaultTemplates, keys: TEMPLATE_KEYS });
});

exports.updateTemplates = asyncHandler(async (req, res) => {
  const { templates } = req.body;
  if (!templates || typeof templates !== 'object') {
    return fail(res, 'templates object is required');
  }

  const settings = await Settings.getSingleton();
  const current = { ...(settings.whatsappTemplates || {}) };
  for (const key of TEMPLATE_KEYS) {
    if (templates[key] !== undefined) current[key] = String(templates[key]);
  }
  settings.whatsappTemplates = current;
  await settings.save();

  await writeAudit(req.user._id, 'WHATSAPP_TEMPLATES_UPDATED', 'Settings', settings._id, {
    keys: Object.keys(current),
  });

  return ok(res, { templates: await getEffectiveTemplates() });
});

exports.getLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customer) filter.customer = req.query.customer;
  if (req.query.templateType) filter.templateType = req.query.templateType;

  const logs = await WhatsAppLog.find(filter)
    .populate('customer', 'fullName phone')
    .sort({ sentAt: -1 });

  return ok(res, logs);
});

exports.listAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find()
    .populate('sentBy', 'name')
    .sort({ sentAt: -1 });
  return ok(res, announcements);
});

async function resolveAudience(audience, selectedCustomers) {
  switch (audience) {
    case 'all':
      return Customer.find();
    case 'active': {
      const ids = await Enrollment.distinct('customer', { status: 'active' });
      return Customer.find({ _id: { $in: ids } });
    }
    case 'completed': {
      const ids = await Enrollment.distinct('customer', { status: 'completed' });
      return Customer.find({ _id: { $in: ids } });
    }
    case 'pending': {
      const ids = await Installment.distinct('customer', {
        status: { $in: ['pending', 'due_today', 'overdue'] },
      });
      return Customer.find({ _id: { $in: ids } });
    }
    case 'selected':
      return Customer.find({ _id: { $in: selectedCustomers || [] } });
    default:
      return [];
  }
}

exports.sendAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, audience, selectedCustomers } = req.body;
  if (!message) return fail(res, 'message is required');
  if (!['all', 'active', 'completed', 'pending', 'selected'].includes(audience)) {
    return fail(res, 'Invalid audience');
  }
  if (audience === 'selected' && (!selectedCustomers || !selectedCustomers.length)) {
    return fail(res, 'Select at least one customer for a selected audience');
  }

  const customers = await resolveAudience(audience, selectedCustomers);
  if (!customers.length) return fail(res, 'No customers match this audience', 400);

  let sent = 0;
  for (const customer of customers) {
    try {
      await sendMessage(customer, 'announcement', { message });
      sent++;
    } catch (err) {
      console.error('[announcement] failed for', customer.fullName, err.message);
    }
  }

  const announcement = await Announcement.create({
    title: title || '',
    message,
    audience,
    selectedCustomers: audience === 'selected' ? selectedCustomers : [],
    sentBy: req.user._id,
    sentAt: new Date(),
    deliveryCount: sent,
  });

  await writeAudit(req.user._id, 'ANNOUNCEMENT_SENT', 'Announcement', announcement._id, {
    audience,
    deliveryCount: sent,
  });

  return ok(res, { announcement, sent, total: customers.length }, 201);
});
