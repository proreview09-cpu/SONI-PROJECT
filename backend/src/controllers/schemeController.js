const Scheme = require('../models/Scheme');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');
const { writeAudit } = require('../services/auditService');

exports.list = asyncHandler(async (req, res) => {
  const schemes = await Scheme.find().sort({ monthlyAmount: 1 });
  return ok(res, schemes);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, monthlyAmount, durationMonths, bonusType, bonusValue } = req.body;
  if (!name || !monthlyAmount) return fail(res, 'name and monthlyAmount are required');
  if (Number(monthlyAmount) <= 0) return fail(res, 'monthlyAmount must be greater than 0');

  const scheme = await Scheme.create({
    name: String(name).trim(),
    monthlyAmount: Number(monthlyAmount),
    durationMonths: durationMonths !== undefined ? Number(durationMonths) : 11,
    bonusType: bonusType || 'free_installment',
    bonusValue: bonusValue !== undefined ? Number(bonusValue) : 1,
    isActive: true,
  });

  await writeAudit(req.user._id, 'SCHEME_CREATED', 'Scheme', scheme._id, {
    name: scheme.name,
    monthlyAmount: scheme.monthlyAmount,
  });

  return ok(res, scheme, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const scheme = await Scheme.findById(req.params.id);
  if (!scheme) return fail(res, 'Scheme not found', 404);

  const { name, monthlyAmount, durationMonths, bonusType, bonusValue, isActive } = req.body;
  if (name !== undefined) scheme.name = String(name).trim();
  if (monthlyAmount !== undefined) scheme.monthlyAmount = Number(monthlyAmount);
  if (durationMonths !== undefined) scheme.durationMonths = Number(durationMonths);
  if (bonusType !== undefined) scheme.bonusType = bonusType;
  if (bonusValue !== undefined) scheme.bonusValue = Number(bonusValue);
  if (isActive !== undefined) scheme.isActive = Boolean(isActive);
  await scheme.save();

  await writeAudit(req.user._id, 'SCHEME_UPDATED', 'Scheme', scheme._id, {
    name: scheme.name,
  });

  return ok(res, scheme);
});

exports.remove = asyncHandler(async (req, res) => {
  const scheme = await Scheme.findById(req.params.id);
  if (!scheme) return fail(res, 'Scheme not found', 404);

  scheme.isActive = false;
  await scheme.save();

  await writeAudit(req.user._id, 'SCHEME_DEACTIVATED', 'Scheme', scheme._id, {
    name: scheme.name,
  });

  return ok(res, { message: 'Scheme deactivated' });
});
