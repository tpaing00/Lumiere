const mongoose = require('mongoose')
const {Schema} = mongoose

const NotificationSchema = new Schema({
  stockKeepingUnit: { type: Object, maxLength: 30 },
  inventoryId: { type: Schema.Types.ObjectId, maxLength: 30 },
  message: { type: String, default: "default message" },
  isLowStockAlert: { type: Boolean },
  lowStockThreshold: { type: Number, default: 0 },
  isExpirationReminder: { type: Boolean, required: true },
  expirationReminderTime: { type: Number, required: true, default: 0 },
  read: {type: Boolean, default: false}
});

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification