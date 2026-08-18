const AuditLog = require('../models/AuditLog');

async function writeAudit(userId, action, targetType, targetId, details = {}) {
  return AuditLog.create({
    user: userId || null,
    action,
    targetType,
    targetId: targetId || null,
    details,
    timestamp: new Date(),
  });
}

module.exports = { writeAudit };
