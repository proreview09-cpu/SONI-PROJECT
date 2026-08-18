const { Schema, model } = require('mongoose');

const installmentSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    installmentNumber: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['upcoming', 'due_today', 'pending', 'overdue', 'paid'],
      default: 'upcoming',
    },
    paymentDate: { type: Date, default: null },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'other'],
      default: null,
    },
    referenceNumber: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reminderSent5Day: { type: Boolean, default: false },
    reminderSentDueDate: { type: Boolean, default: false },
    lastFollowupSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

installmentSchema.index({ status: 1, dueDate: 1 });
installmentSchema.index({ customer: 1, dueDate: -1 });

module.exports = model('Installment', installmentSchema);
