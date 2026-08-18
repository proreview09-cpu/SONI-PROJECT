const Customer = require('../models/Customer');
const Enrollment = require('../models/Enrollment');
const Installment = require('../models/Installment');
const WhatsAppLog = require('../models/WhatsAppLog');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');
const { writeAudit } = require('../services/auditService');

exports.list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) {
    const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ fullName: regex }, { phone: regex }];
  }

  const customers = await Customer.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: 'enrollments',
      populate: { path: 'scheme', select: 'name monthlyAmount' },
      options: { sort: { createdAt: -1 } },
    });

  return ok(res, customers);
});

exports.getById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).populate('createdBy', 'name');
  if (!customer) return fail(res, 'Customer not found', 404);

  const [enrollments, installments, communicationHistory] = await Promise.all([
    Enrollment.find({ customer: customer._id })
      .populate('scheme', 'name monthlyAmount durationMonths bonusType bonusValue')
      .sort({ createdAt: -1 }),
    Installment.find({ customer: customer._id })
      .populate('recordedBy', 'name')
      .sort({ installmentNumber: -1 }),
    WhatsAppLog.find({ customer: customer._id })
      .populate('installment', 'installmentNumber')
      .sort({ sentAt: -1 })
      .limit(50),
  ]);

  return ok(res, { customer, enrollments, installments, communicationHistory });
});

exports.create = asyncHandler(async (req, res) => {
  const { fullName, phone, alternatePhone, address, notes } = req.body;
  if (!fullName || !phone) return fail(res, 'fullName and phone are required');

  const existing = await Customer.findOne({ phone: String(phone).trim() });
  if (existing) return fail(res, 'A customer with this phone number already exists', 409);

  const customer = await Customer.create({
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    alternatePhone: alternatePhone || '',
    address: address || '',
    notes: notes || '',
    createdBy: req.user._id,
  });

  await writeAudit(req.user._id, 'CUSTOMER_CREATED', 'Customer', customer._id, {
    fullName: customer.fullName,
    phone: customer.phone,
  });

  return ok(res, customer, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return fail(res, 'Customer not found', 404);

  const { fullName, phone, alternatePhone, address, notes } = req.body;
  if (fullName !== undefined) customer.fullName = String(fullName).trim();
  if (phone !== undefined) customer.phone = String(phone).trim();
  if (alternatePhone !== undefined) customer.alternatePhone = alternatePhone;
  if (address !== undefined) customer.address = address;
  if (notes !== undefined) customer.notes = notes;
  await customer.save();

  await writeAudit(req.user._id, 'CUSTOMER_UPDATED', 'Customer', customer._id, {
    fullName: customer.fullName,
  });

  return ok(res, customer);
});

exports.remove = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return fail(res, 'Customer not found', 404);

  const enrollmentCount = await Enrollment.countDocuments({ customer: customer._id });
  if (enrollmentCount > 0) {
    return fail(res, 'Customer has enrollments — cancel them before deleting', 400);
  }

  await writeAudit(req.user._id, 'CUSTOMER_DELETED', 'Customer', customer._id, {
    fullName: customer.fullName,
  });

  await customer.deleteOne();
  return ok(res, { message: 'Customer deleted' });
});
