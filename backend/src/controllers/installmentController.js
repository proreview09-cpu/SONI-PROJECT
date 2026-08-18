const Installment = require('../models/Installment');
const Customer = require('../models/Customer');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');
const { recordPayment } = require('../services/installmentService');

exports.list = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) {
    const statuses = String(req.query.status).split(',');
    filter.status = { $in: statuses };
  }
  if (req.query.from || req.query.to) {
    filter.dueDate = {};
    if (req.query.from) filter.dueDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.dueDate.$lte = new Date(new Date(req.query.to).setHours(23, 59, 59, 999));
  }
  if (req.query.customer) filter.customer = req.query.customer;
  if (req.query.enrollment) filter.enrollment = req.query.enrollment;

  if (req.query.search) {
    const regex = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const customers = await Customer.find({ $or: [{ fullName: regex }, { phone: regex }] }).select('_id');
    filter.customer = { $in: customers.map((c) => c._id) };
  }

  const installments = await Installment.find(filter)
    .populate('customer', 'fullName phone')
    .populate('recordedBy', 'name')
    .populate('enrollment', 'monthlyAmount totalInstallments installmentsPaid')
    .sort({ dueDate: -1 });

  return ok(res, installments);
});

exports.pay = asyncHandler(async (req, res) => {
  const installment = await recordPayment(req.params.id, req.body, req.user);
  const populated = await installment.populate([
    { path: 'customer', select: 'fullName phone' },
    { path: 'recordedBy', select: 'name' },
  ]);
  return ok(res, populated);
});

exports.update = asyncHandler(async (req, res) => {
  const installment = await Installment.findById(req.params.id);
  if (!installment) return fail(res, 'Installment not found', 404);
  if (installment.status !== 'paid') {
    return fail(res, 'Only paid installments can be edited', 400);
  }

  const { referenceNumber, remarks } = req.body;
  if (referenceNumber !== undefined) installment.referenceNumber = referenceNumber;
  if (remarks !== undefined) installment.remarks = remarks;
  await installment.save();

  return ok(res, installment);
});
