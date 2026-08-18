const Customer = require('../models/Customer');
const Scheme = require('../models/Scheme');
const Enrollment = require('../models/Enrollment');
const Settings = require('../models/Settings');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');
const { writeAudit } = require('../services/auditService');
const { sendMessage } = require('../services/whatsappService');
const {
  generateInstallmentsForEnrollment,
  cancelEnrollment,
} = require('../services/installmentService');

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customerId) filter.customer = req.query.customerId;
  if (req.query.status) filter.status = req.query.status;

  const enrollments = await Enrollment.find(filter)
    .populate('customer', 'fullName phone')
    .populate('scheme', 'name monthlyAmount durationMonths bonusType bonusValue')
    .sort({ createdAt: -1 });

  return ok(res, enrollments);
});

exports.getById = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('customer', 'fullName phone')
    .populate('scheme', 'name monthlyAmount durationMonths bonusType bonusValue');
  if (!enrollment) return fail(res, 'Enrollment not found', 404);

  const Installment = require('../models/Installment');
  const installments = await Installment.find({ enrollment: enrollment._id })
    .populate('recordedBy', 'name')
    .sort({ installmentNumber: 1 });

  return ok(res, { enrollment, installments });
});

exports.create = asyncHandler(async (req, res) => {
  const { customerId, schemeId, startDate, dueDay, monthlyAmount } = req.body;
  if (!customerId || !schemeId) return fail(res, 'customerId and schemeId are required');

  const [customer, scheme] = await Promise.all([
    Customer.findById(customerId),
    Scheme.findById(schemeId),
  ]);
  if (!customer) return fail(res, 'Customer not found', 404);
  if (!scheme) return fail(res, 'Scheme not found', 404);
  if (!scheme.isActive) return fail(res, 'This scheme is inactive', 400);

  const settings = await Settings.getSingleton();

  const enrollment = new Enrollment({
    customer: customerId,
    scheme: schemeId,
    startDate: startDate ? new Date(startDate) : new Date(),
    dueDay: dueDay !== undefined ? Number(dueDay) : settings.defaultDueDay,
    monthlyAmount: monthlyAmount !== undefined ? Number(monthlyAmount) : scheme.monthlyAmount,
    totalInstallments: scheme.durationMonths || 11,
    installmentsPaid: 0,
    totalPaid: 0,
    status: 'active',
    rewardStatus: 'not_applicable',
  });
  await enrollment.save();

  await generateInstallmentsForEnrollment(enrollment, customer._id);

  await sendMessage(customer, 'welcome', {
    monthlyAmount: enrollment.monthlyAmount,
    dueDay: enrollment.dueDay,
    duration: enrollment.totalInstallments,
  });

  await writeAudit(req.user._id, 'ENROLLMENT_CREATED', 'Enrollment', enrollment._id, {
    customer: customer.fullName,
    scheme: scheme.name,
    monthlyAmount: enrollment.monthlyAmount,
    totalInstallments: enrollment.totalInstallments,
  });

  const populated = await enrollment.populate([
    { path: 'customer', select: 'fullName phone' },
    { path: 'scheme', select: 'name monthlyAmount' },
  ]);

  return ok(res, populated, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return fail(res, 'Enrollment not found', 404);

  if (req.body.status === 'cancelled') {
    await cancelEnrollment(enrollment, req.user);
  }

  return ok(res, enrollment);
});

exports.updateReward = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return fail(res, 'Enrollment not found', 404);
  if (enrollment.status !== 'completed') {
    return fail(res, 'Only completed enrollments have a reward', 400);
  }

  const { rewardStatus, redeemedDate, redeemedValue, redemptionNotes } = req.body;
  const validStatuses = ['eligible', 'pending', 'claimed', 'closed'];

  if (rewardStatus !== undefined) {
    if (!validStatuses.includes(rewardStatus)) return fail(res, 'Invalid reward status');
    enrollment.rewardStatus = rewardStatus;
  }
  if (rewardStatus === 'claimed' && !redeemedDate && !enrollment.redeemedDate) {
    return fail(res, 'redeemedDate is required when claiming a reward');
  }
  if (redeemedDate !== undefined) enrollment.redeemedDate = new Date(redeemedDate);
  if (redeemedValue !== undefined) enrollment.redeemedValue = Number(redeemedValue);
  if (redemptionNotes !== undefined) enrollment.redemptionNotes = redemptionNotes;
  if (enrollment.rewardStatus === 'claimed') enrollment.redeemedBy = req.user._id;

  await enrollment.save();

  await writeAudit(req.user._id, 'REWARD_UPDATED', 'Enrollment', enrollment._id, {
    rewardStatus: enrollment.rewardStatus,
    redeemedValue: enrollment.redeemedValue,
  });

  return ok(res, enrollment);
});
