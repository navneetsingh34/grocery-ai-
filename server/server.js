require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { uploadDir } = require('./middleware/upload');
const { ensureStaticUser } = require('./services/ensureStaticUser');

const authRoutes = require('./routes/auth');
const receiptRoutes = require('./routes/receipts');
const dashboardRoutes = require('./routes/dashboard');
const recommendationRoutes = require('./routes/recommendations');
const shoppingListRoutes = require('./routes/shoppingList');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'smartcart' });
});

app.use('/api/auth', authRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/shopping-list', shoppingListRoutes);

app.use(errorHandler);

async function start() {
  await connectDB();
  await ensureStaticUser();
  app.listen(PORT, () => {
    console.log(`SmartCart API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
