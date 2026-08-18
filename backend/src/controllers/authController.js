const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !user.isActive || !user.comparePassword(password)) {
    return fail(res, 'Invalid email or password', 401);
  }

  const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return ok(res, { token, user: user.toSafeJSON() });
});

exports.me = asyncHandler(async (req, res) => {
  return ok(res, req.user.toSafeJSON());
});
