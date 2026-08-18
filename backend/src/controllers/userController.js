const User = require('../models/User');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');
const { writeAudit } = require('../services/auditService');

exports.list = asyncHandler(async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: 1 });
  return ok(res, users);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password) return fail(res, 'name, email and password are required');

  const normalizedEmail = String(email).toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) return fail(res, 'Email already exists', 409);

  const user = new User({
    name: String(name).trim(),
    email: normalizedEmail,
    phone: phone || '',
    role: role === 'owner' ? 'owner' : 'staff',
  });
  user.setPassword(password);
  await user.save();

  await writeAudit(req.user._id, 'STAFF_CREATED', 'User', user._id, {
    email: user.email,
    role: user.role,
  });

  return ok(res, user.toSafeJSON(), 201);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 'User not found', 404);

  const { name, phone, password, role, isActive } = req.body;
  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined && ['owner', 'staff'].includes(role)) user.role = role;
  if (isActive !== undefined && user._id.toString() !== req.user._id.toString()) {
    user.isActive = Boolean(isActive);
  }
  if (password) user.setPassword(password);
  await user.save();

  await writeAudit(req.user._id, 'STAFF_UPDATED', 'User', user._id, {
    email: user.email,
  });

  return ok(res, user.toSafeJSON());
});

exports.remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 'User not found', 404);
  if (user._id.toString() === req.user._id.toString()) {
    return fail(res, 'You cannot deactivate your own account', 400);
  }

  user.isActive = false;
  await user.save();

  await writeAudit(req.user._id, 'STAFF_DEACTIVATED', 'User', user._id, {
    email: user.email,
  });

  return ok(res, { message: 'User deactivated' });
});
