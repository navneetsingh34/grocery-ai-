const express = require('express');
const { protect } = require('../middleware/auth');
const { getSpending, getRecommendations } = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);
router.get('/spending', getSpending);
router.get('/recommendations', getRecommendations);

module.exports = router;
