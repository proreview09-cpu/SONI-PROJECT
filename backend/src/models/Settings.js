const { Schema, model } = require('mongoose');

const settingsSchema = new Schema(
  {
    businessName: { type: String, default: 'Suvarn Bachat Yojana', trim: true },
    defaultDueDay: { type: Number, default: 5, min: 1, max: 28 },
    reminderDaysBefore: { type: Number, default: 5, min: 1 },
    gracePeriodDays: { type: Number, default: 0, min: 0 },
    whatsappProvider: { type: String, default: 'stub' },
    followupReNotifyDays: { type: Number, default: 7, min: 1 },
    monthlyCollectionTarget: { type: Number, default: 150000, min: 0 },
    whatsappTemplates: { type: Schema.Types.Mixed, default: {} },
    automationLastRunAt: { type: Date, default: null },
    automationLastStatus: { type: String, enum: ['never', 'success', 'failed'], default: 'never' },
    automationMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = model('Settings', settingsSchema);
