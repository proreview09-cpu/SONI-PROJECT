const Settings = require('../models/Settings');
const { asyncHandler, ok } = require('../utils/responseHelper');
const { writeAudit } = require('../services/auditService');

const EDITABLE_FIELDS = [
  'businessName',
  'defaultDueDay',
  'reminderDaysBefore',
  'gracePeriodDays',
  'whatsappProvider',
  'followupReNotifyDays',
  'monthlyCollectionTarget',
];

exports.get = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  return ok(res, settings);
});

exports.update = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();

  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      settings[field] = field === 'businessName' || field === 'whatsappProvider'
        ? String(req.body[field])
        : Number(req.body[field]);
    }
  }
  await settings.save();

  await writeAudit(req.user._id, 'SETTINGS_UPDATED', 'Settings', settings._id, {
    fields: EDITABLE_FIELDS.filter((f) => req.body[f] !== undefined),
  });

  return ok(res, settings);
});
