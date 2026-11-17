const Recommendation = require('../models/Recommendation');

async function dismissRecommendation(req, res, next) {
  try {
    const rec = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { dismissed: true },
      { new: true }
    );
    if (!rec) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    res.json({ recommendation: rec });
  } catch (err) {
    next(err);
  }
}

module.exports = { dismissRecommendation };
