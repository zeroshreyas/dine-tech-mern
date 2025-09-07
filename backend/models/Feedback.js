const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: {
    type: String,
    enum: ['Food Quality', 'Hygiene', 'Service', 'Price', 'Other'],
    default: 'Other',
  },
  vendorName: { type: String },
  orderId: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  message: { type: String, required: true, minlength: 10, maxlength: 2000 },
  status: { type: String, enum: ['open', 'reviewing', 'resolved'], default: 'open' },
  attachments: [{
    url: String,
    name: String,
  }],
  contactInfo: { type: String, maxlength: 200 },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema); 