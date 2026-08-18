const { Schema, model } = require('mongoose');

const enrollmentSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    scheme: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    startDate: { type: Date, required: true },
    dueDay: { type: Number, default: 5, min: 1, max: 28 },
    monthlyAmount: { type: Number, required: true, min: 1 },
    totalInstallments: { type: Number, default: 11, min: 1 },
    installmentsPaid: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    rewardStatus: {
      type: String,
      enum: ['not_applicable', 'eligible', 'pending', 'claimed', 'closed'],
      default: 'not_applicable',
    },
    redeemedDate: { type: Date, default: null },
    redeemedValue: { type: Number, default: null },
    redeemedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    redemptionNotes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = model('Enrollment', enrollmentSchema);
