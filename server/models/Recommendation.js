const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['restock', 'pairing', 'trend'], required: true },
    message: { type: String, required: true },
    relatedProduct: { type: String, default: '' },
    dismissed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
