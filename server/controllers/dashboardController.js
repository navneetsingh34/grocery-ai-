const mongoose = require('mongoose');
const ReceiptItem = require('../models/ReceiptItem');
const ProductPattern = require('../models/ProductPattern');
const Recommendation = require('../models/Recommendation');

async function getSpending(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(String(req.user._id));

    const byCategory = await ReceiptItem.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: { $round: ['$total', 2] },
          count: 1,
        },
      },
    ]);

    const byMonth = await ReceiptItem.aggregate([
      { $match: { userId, purchaseDate: { $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: '$purchaseDate' },
            month: { $month: '$purchaseDate' },
          },
          total: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          label: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          total: { $round: ['$total', 2] },
        },
      },
    ]);

    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 7);

    const dueSoon = await ProductPattern.find({
      userId,
      predictedNextPurchaseDate: { $ne: null, $lte: horizon },
    })
      .sort({ predictedNextPurchaseDate: 1 })
      .lean();

    const totalSpent = byCategory.reduce((s, c) => s + (c.total || 0), 0);

    res.json({
      totalSpent: Math.round(totalSpent * 100) / 100,
      byCategory,
      byMonth,
      dueSoon,
    });
  } catch (err) {
    next(err);
  }
}

async function getRecommendations(req, res, next) {
  try {
    const recommendations = await Recommendation.find({
      userId: req.user._id,
      dismissed: false,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ recommendations });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSpending, getRecommendations };
