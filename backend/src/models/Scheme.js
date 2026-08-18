const { Schema, model } = require('mongoose');

const schemeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    monthlyAmount: { type: Number, required: true, min: 1 },
    durationMonths: { type: Number, default: 11, min: 1 },
    bonusType: {
      type: String,
      enum: ['free_installment', 'fixed_amount', 'percentage'],
      default: 'free_installment',
    },
    bonusValue: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Scheme', schemeSchema);
