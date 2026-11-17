const ProductPattern = require('../models/ProductPattern');
const ReceiptItem = require('../models/ReceiptItem');

function daysBetween(a, b) {
  const ms = Math.abs(new Date(b) - new Date(a));
  return ms / (1000 * 60 * 60 * 24);
}

/**
 * Recompute purchase frequency patterns for a user (deterministic, no AI).
 */
async function updatePatternsForUser(userId) {
  const items = await ReceiptItem.find({ userId }).sort({ purchaseDate: 1 }).lean();
  const byProduct = new Map();

  for (const item of items) {
    const key = item.normalizedName;
    if (!byProduct.has(key)) {
      byProduct.set(key, []);
    }
    byProduct.get(key).push(item);
  }

  const upserts = [];

  for (const [normalizedName, productItems] of byProduct.entries()) {
    const dates = productItems
      .map((i) => i.purchaseDate)
      .filter(Boolean)
      .map((d) => new Date(d))
      .sort((a, b) => a - b);

    // Deduplicate same-day purchases for interval calc
    const uniqueDays = [];
    for (const d of dates) {
      const day = d.toISOString().slice(0, 10);
      if (!uniqueDays.length || uniqueDays[uniqueDays.length - 1] !== day) {
        uniqueDays.push(day);
      }
    }

    let avgDays = null;
    if (uniqueDays.length >= 2) {
      const gaps = [];
      for (let i = 1; i < uniqueDays.length; i++) {
        gaps.push(daysBetween(uniqueDays[i - 1], uniqueDays[i]));
      }
      avgDays = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    }

    const lastPurchaseDate = dates.length ? dates[dates.length - 1] : null;
    let predictedNextPurchaseDate = null;
    if (lastPurchaseDate && avgDays) {
      predictedNextPurchaseDate = new Date(lastPurchaseDate.getTime() + avgDays * 86400000);
    }

    const prices = productItems.map((i) => i.totalPrice || i.unitPrice || 0).filter((p) => p > 0);
    const avgPrice = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;

    upserts.push(
      ProductPattern.findOneAndUpdate(
        { userId, normalizedName },
        {
          userId,
          normalizedName,
          purchaseCount: productItems.length,
          avgDaysBetweenPurchases: avgDays,
          lastPurchaseDate,
          predictedNextPurchaseDate,
          avgPrice,
        },
        { upsert: true, new: true }
      )
    );
  }

  await Promise.all(upserts);
  return ProductPattern.find({ userId }).lean();
}

module.exports = { updatePatternsForUser };
