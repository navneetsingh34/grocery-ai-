const express = require('express');
const { protect } = require('../middleware/auth');
const { dismissRecommendation } = require('../controllers/recommendationController');

const router = express.Router();

router.use(protect);
router.post('/:id/dismiss', dismissRecommendation);

module.exports = router;
