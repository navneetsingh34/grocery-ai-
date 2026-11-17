const mongoose = require('mongoose');

const productPatternSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    normalizedName: { type: String, required: true },
    purchaseCount: { type: Number, default: 0 },
    avgDaysBetweenPurchases: { type: Number, default: null },
    lastPurchaseDate: { type: Date },
    predictedNextPurchaseDate: { type: Date },
    avgPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productPatternSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model('ProductPattern', productPatternSchema);
