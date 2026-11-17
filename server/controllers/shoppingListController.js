const ProductPattern = require('../models/ProductPattern');
const Recommendation = require('../models/Recommendation');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function classifyBucket(item) {
  const avg = item.avgDaysBetweenPurchases;
  if (avg != null && avg <= 1.5) return 'daily';

  if (!item.predictedDate) return 'later';

  const predicted = startOfDay(new Date(item.predictedDate));
  const today = startOfDay();
  const in3 = startOfDay();
  in3.setDate(in3.getDate() + 3);

  if (predicted <= in3) return 'next3Days';
  return 'later';
}

async function getShoppingList(req, res, next) {
  try {
    const userId = req.user._id;
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 14);

    const due = await ProductPattern.find({
      userId,
      predictedNextPurchaseDate: { $ne: null, $lte: horizon },
    })
      .sort({ predictedNextPurchaseDate: 1 })
      .lean();

    const pairing = await Recommendation.find({
      userId,
      dismissed: false,
      type: 'pairing',
    }).lean();

    const list = [
      ...due.map((p) => ({
        source: 'prediction',
        product: p.normalizedName,
        reason: p.avgDaysBetweenPurchases
          ? p.avgDaysBetweenPurchases <= 1.5
            ? 'Usually daily'
            : `Usually every ~${Math.round(p.avgDaysBetweenPurchases)} days`
          : 'Predicted restock',
        predictedDate: p.predictedNextPurchaseDate,
        avgDaysBetweenPurchases: p.avgDaysBetweenPurchases,
        avgPrice: p.avgPrice,
      })),
      ...pairing.map((r) => ({
        source: 'pairing',
        product: r.relatedProduct || 'suggested item',
        reason: r.message,
        predictedDate: null,
        avgDaysBetweenPurchases: null,
        avgPrice: null,
      })),
    ];

    const seen = new Set();
    const unique = [];
    for (const item of list) {
      const key = (item.product || '').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const bucket = item.source === 'pairing' ? 'pairing' : classifyBucket(item);
      unique.push({ ...item, bucket });
    }

    const grouped = {
      daily: unique.filter((i) => i.bucket === 'daily'),
      next3Days: unique.filter((i) => i.bucket === 'next3Days'),
      later: unique.filter((i) => i.bucket === 'later'),
      pairing: unique.filter((i) => i.bucket === 'pairing'),
    };

    res.json({ items: unique, grouped });
  } catch (err) {
    next(err);
  }
}

module.exports = { getShoppingList };
