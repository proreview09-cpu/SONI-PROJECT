const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { fail } = require('../utils/responseHelper');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return fail(res, 'Authentication required', 401);

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return fail(res, 'Invalid or expired token', 401);
    }

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) return fail(res, 'Account not found or inactive', 401);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
