const { Schema, model } = require('mongoose');

const announcementSchema = new Schema(
  {
    title: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ['all', 'active', 'completed', 'pending', 'selected'],
      required: true,
    },
    selectedCustomers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
    sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: null },
    deliveryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('Announcement', announcementSchema);
