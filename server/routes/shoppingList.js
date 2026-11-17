const express = require('express');
const { protect } = require('../middleware/auth');
const { getShoppingList } = require('../controllers/shoppingListController');

const router = express.Router();

router.get('/', protect, getShoppingList);

module.exports = router;
