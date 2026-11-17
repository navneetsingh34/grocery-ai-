const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadReceipt, listReceipts, getReceipt, reprocessReceipt } = require('../controllers/receiptController');

const router = express.Router();

router.use(protect);
router.post('/upload', upload.single('receipt'), uploadReceipt);
router.get('/', listReceipts);
router.post('/:id/reprocess', reprocessReceipt);
router.get('/:id', getReceipt);

module.exports = router;
