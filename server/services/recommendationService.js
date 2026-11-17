const Recommendation = require('../models/Recommendation');
const ProductPattern = require('../models/ProductPattern');
const { getModel, safeParseJson } = require('./aiParsingService');

/**
 * Generate restock/pairing suggestions from pattern summary (higher temperature).
 */
async function generateRecommendations(userId) {
  const patterns = await ProductPattern.find({ userId }).sort({ purchaseCount: -1 }).limit(40).lean();

  if (patterns.length === 0) {
    return [];
  }

  const summary = patterns.map((p) => {
    const daysSince = p.lastPurchaseDate
      ? Math.round((Date.now() - new Date(p.lastPurchaseDate).getTime()) / 86400000)
      : null;
    return {
      product: p.normalizedName,
      purchaseCount: p.purchaseCount,
      avgDaysBetween: p.avgDaysBetweenPurchases
        ? Math.round(p.avgDaysBetweenPurchases)
        : null,
      daysSinceLastPurchase: daysSince,
      predictedNext: p.predictedNextPurchaseDate
        ? new Date(p.predictedNextPurchaseDate).toISOString().slice(0, 10)
        : null,
      avgPrice: p.avgPrice ? Number(p.avgPrice.toFixed(2)) : 0,
    };
  });

  const prompt = `Here is a user's grocery purchase history summary (product, frequency, days since last purchase):
${JSON.stringify(summary, null, 2)}

Generate 3-5 natural, specific recommendations:
- Items likely due for restock (based on frequency)
- Complementary items they buy inconsistently (e.g. buys pasta often, rarely buys sauce)
- Optional spending/trend observations

Return as JSON array only:
[{ "type": "restock"|"pairing"|"trend", "product": "string", "message": "string" }]`;

  let parsed;
  try {
    const model = getModel(0.7);
    const result = await model.generateContent(prompt);
    parsed = safeParseJson(result.response.text());
  } catch (err) {
    console.error('Recommendation AI failed, using rule-based fallback:', err.message);
    parsed = buildRuleBasedRecs(summary);
  }

  if (!Array.isArray(parsed)) {
    parsed = buildRuleBasedRecs(summary);
  }

  // Keep dismissed history; replace active (non-dismissed) recommendations
  await Recommendation.deleteMany({ userId, dismissed: false });

  const docs = parsed
    .filter((r) => r && r.message)
    .slice(0, 5)
    .map((r) => ({
      userId,
      type: ['restock', 'pairing', 'trend'].includes(r.type) ? r.type : 'restock',
      message: String(r.message),
      relatedProduct: String(r.product || ''),
      dismissed: false,
    }));

  if (docs.length) {
    await Recommendation.insertMany(docs);
  }

  return Recommendation.find({ userId, dismissed: false }).sort({ createdAt: -1 }).lean();
}

function buildRuleBasedRecs(summary) {
  const recs = [];
  for (const p of summary) {
    if (p.avgDaysBetween && p.daysSinceLastPurchase != null) {
      if (p.daysSinceLastPurchase >= p.avgDaysBetween * 0.85) {
        recs.push({
          type: 'restock',
          product: p.product,
          message: `You usually buy ${p.product} about every ${p.avgDaysBetween} days — it may be time to restock.`,
        });
      }
    }
  }
  const names = new Set(summary.map((s) => s.product));
  if (names.has('pasta') && !names.has('sauce')) {
    recs.push({
      type: 'pairing',
      product: 'sauce',
      message: 'You buy pasta often but sauce rarely shows up — consider adding pasta sauce next trip.',
    });
  }
  if (recs.length === 0 && summary[0]) {
    recs.push({
      type: 'trend',
      product: summary[0].product,
      message: `${summary[0].product} is one of your most frequent purchases — keep an eye on its price.`,
    });
  }
  return recs.slice(0, 5);
}

module.exports = { generateRecommendations };
