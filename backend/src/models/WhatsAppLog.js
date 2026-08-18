const { Schema, model } = require('mongoose');

const whatsappLogSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    installment: { type: Schema.Types.ObjectId, ref: 'Installment', default: null },
    templateType: {
      type: String,
      enum: [
        'welcome',
        '5day_reminder',
        'due_today',
        'pending_followup',
        'payment_confirmation',
        'completion',
        'announcement',
        'custom',
      ],
      required: true,
    },
    messageContent: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'queued'], default: 'sent' },
    provider: { type: String, default: 'stub' },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

whatsappLogSchema.index({ customer: 1, sentAt: -1 });

module.exports = model('WhatsAppLog', whatsappLogSchema);
