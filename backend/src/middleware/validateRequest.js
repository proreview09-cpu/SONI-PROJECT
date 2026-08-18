const { fail } = require('../utils/responseHelper');

function validateBody(rules) {
  return (req, res, next) => {
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];
      if (rule.required && (value === undefined || value === null || value === '')) {
        return fail(res, `${field} is required`);
      }
      if (value !== undefined && value !== null && value !== '' && rule.type && typeof value !== rule.type) {
        return fail(res, `${field} must be a ${rule.type}`);
      }
      if (value !== undefined && rule.min !== undefined && Number(value) < rule.min) {
        return fail(res, `${field} must be at least ${rule.min}`);
      }
    }
    next();
  };
}

module.exports = { validateBody };
