const fs = require('fs');
const path = require('path');
const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const { normalizeProduct } = require('./normalizeProduct');
const { updatePatternsForUser } = require('./patternEngine');
const { generateRecommendations } = require('./recommendationService');
const { uploadDir } = require('../middleware/upload');

const SAMPLE_DIR = path.join(__dirname, '..', '..', 'sample-receipts');

// [name, qty, unit price, category]
const RECEIPTS = [
  {
    file: 'receipt_1_freshmart_03-02-2026.png',
    store: 'Freshmart Supermarket',
    daysAgo: 15,
    items: [
      ['Whole Milk 1GAL', 1, 3.89, 'dairy'], ['Large Eggs 12CT', 1, 4.29, 'dairy'],
      ['Bananas', 2.14, 0.59, 'produce'], ['White Bread', 1, 2.49, 'bakery'],
      ['Unsalted Butter', 1, 4.99, 'dairy'], ['Chicken Breast', 1.85, 5.49, 'meat'],
      ['Roma Tomatoes', 1.2, 1.99, 'produce'], ['Yellow Onions 3LB', 1, 2.79, 'produce'],
      ['Greek Yogurt', 2, 1.29, 'dairy'],
    ],
  },
  {
    file: 'receipt_2_green_03-05-2026.png',
    store: 'Green Valley Market',
    daysAgo: 11,
    items: [
      ['Organic Spinach', 1, 3.49, 'produce'], ['Avocado', 4, 1.25, 'produce'],
      ['Basmati Rice 5LB', 1, 8.99, 'pantry'], ['Olive Oil 500ML', 1, 9.49, 'pantry'],
      ['Whole Milk 1GAL', 1, 3.95, 'dairy'], ['Bananas', 1.76, 0.59, 'produce'],
      ['Fresh Salmon Fillet', 1.1, 12.99, 'meat'], ['Lemons', 3, 0.69, 'produce'],
      ['Sparkling Water 6PK', 1, 4.99, 'beverages'],
    ],
  },
  {
    file: 'receipt_3_city_03-09-2026.png',
    store: 'City Grocers',
    daysAgo: 8,
    items: [
      ['Whole Milk 1GAL', 1, 4.19, 'dairy'], ['Large Eggs 12CT', 1, 4.59, 'dairy'],
      ['White Bread', 1, 2.69, 'bakery'], ['Bananas', 2.3, 0.65, 'produce'],
      ['Coffee Ground 12OZ', 1, 8.49, 'beverages'], ['Cheddar Cheese 8OZ', 1, 3.99, 'dairy'],
      ['Apples Gala', 2.6, 1.89, 'produce'], ['Peanut Butter', 1, 3.79, 'pantry'],
      ['Orange Juice 52OZ', 1, 4.29, 'beverages'],
    ],
  },
  {
    file: 'receipt_4_freshmart_03-12-2026.png',
    store: 'Freshmart Supermarket',
    daysAgo: 4,
    items: [
      ['Whole Milk 1GAL', 1, 3.89, 'dairy'], ['Greek Yogurt', 4, 1.29, 'dairy'],
      ['Bananas', 1.9, 0.59, 'produce'], ['Pasta Spaghetti', 2, 1.69, 'pantry'],
      ['Tomato Sauce 24OZ', 2, 2.49, 'pantry'], ['Ground Beef 1LB', 1, 6.99, 'meat'],
      ['Mozzarella 8OZ', 1, 3.49, 'dairy'], ['Roma Tomatoes', 1.4, 1.99, 'produce'],
      ['Baby Carrots 1LB', 1, 1.99, 'produce'],
    ],
  },
  {
    file: 'receipt_5_sunrise_03-16-2026.png',
    store: 'Sunrise Food Mart',
    daysAgo: 1,
    items: [
      ['Whole Milk 1GAL', 1, 3.99, 'dairy'], ['Large Eggs 12CT', 1, 4.39, 'dairy'],
      ['Unsalted Butter', 1, 5.19, 'dairy'], ['Bananas', 2.05, 0.59, 'produce'],
      ['White Bread', 1, 2.59, 'bakery'], ['Chicken Breast', 2.1, 5.29, 'meat'],
      ['Yellow Onions 3LB', 1, 2.89, 'produce'], ['Orange Juice 52OZ', 1, 4.19, 'beverages'],
      ['Dish Soap', 1, 3.29, 'household'],
    ],
  },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ---- Older history (generated, deterministic) -------------------------------
// [name, category, base price, typical days between purchases]
const CATALOG = [
  ['Whole Milk 1GAL', 'dairy', 3.9, 4], ['Large Eggs 12CT', 'dairy', 4.4, 7],
  ['White Bread', 'bakery', 2.6, 6], ['Bananas', 'produce', 1.2, 5],
  ['Greek Yogurt', 'dairy', 5.2, 8], ['Unsalted Butter', 'dairy', 4.9, 18],
  ['Chicken Breast', 'meat', 9.8, 10], ['Ground Beef 1LB', 'meat', 6.9, 16],
  ['Roma Tomatoes', 'produce', 2.4, 9], ['Yellow Onions 3LB', 'produce', 2.8, 14],
  ['Apples Gala', 'produce', 4.6, 11], ['Baby Carrots 1LB', 'produce', 2.0, 12],
  ['Orange Juice 52OZ', 'beverages', 4.2, 13], ['Coffee Ground 12OZ', 'beverages', 8.5, 24],
  ['Sparkling Water 6PK', 'beverages', 4.9, 15], ['Pasta Spaghetti', 'pantry', 3.4, 20],
  ['Tomato Sauce 24OZ', 'pantry', 4.9, 24], ['Basmati Rice 5LB', 'pantry', 9.0, 45],
  ['Olive Oil 500ML', 'pantry', 9.5, 50], ['Peanut Butter', 'pantry', 3.8, 28],
  ['Cheddar Cheese 8OZ', 'dairy', 4.0, 17], ['Potato Chips', 'snacks', 3.5, 14],
  ['Chocolate Cookies', 'snacks', 3.2, 19], ['Frozen Pizza', 'frozen', 6.8, 21],
  ['Dish Soap', 'household', 3.3, 35], ['Paper Towels 6PK', 'household', 8.9, 40],
];
const STORES = ['Freshmart Supermarket', 'Green Valley Market', 'City Grocers', 'Sunrise Food Mart'];
const HISTORY_START_DAYS_AGO = 160;
const HISTORY_END_DAYS_AGO = 18; // recent hand-written receipts take over after this

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHistory() {
  const rand = rng(42);
  const lastBought = new Map();
  const trips = [];
  let day = HISTORY_START_DAYS_AGO;
  let tripNo = 0;
  while (day > HISTORY_END_DAYS_AGO) {
    const items = [];
    for (const [name, category, base, every] of CATALOG) {
      const since = lastBought.has(name) ? lastBought.get(name) - day : every * rand();
      if (since >= every * (0.75 + rand() * 0.4)) {
        const inflation = 1 + ((HISTORY_START_DAYS_AGO - day) / HISTORY_START_DAYS_AGO) * 0.06;
        const price = round2(base * inflation * (0.94 + rand() * 0.12));
        const qty = ['Bananas', 'Apples Gala', 'Chicken Breast'].includes(name)
          ? round2(1 + rand() * 1.6)
          : rand() < 0.15 ? 2 : 1;
        items.push([name, qty, price, category]);
        lastBought.set(name, day);
      }
    }
    if (items.length >= 3) {
      trips.push({ store: STORES[tripNo % STORES.length], daysAgo: day, items });
      tripNo += 1;
    }
    day -= 3 + Math.floor(rand() * 4); // next trip in 3–6 days
  }
  return trips;
}

/**
 * Seeds sample history for the quick-login account only.
 * Skipped if that account already has receipts, so it runs once per DB.
 */
async function seedQuickUser(user) {
  if (await Receipt.exists({ userId: user._id })) return;

  fs.mkdirSync(uploadDir, { recursive: true });

  const history = buildHistory().map((t, i) => ({
    ...t,
    file: RECEIPTS[i % RECEIPTS.length].file,
  }));

  for (const r of [...history, ...RECEIPTS]) {
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - r.daysAgo);
    purchaseDate.setHours(12, 0, 0, 0);

    let imageUrl = '';
    const src = path.join(SAMPLE_DIR, r.file);
    if (fs.existsSync(src)) {
      const dest = path.join(uploadDir, `quick-${r.file}`);
      if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
      imageUrl = `/uploads/quick-${r.file}`;
    }

    const receipt = await Receipt.create({
      userId: user._id,
      imageUrl: imageUrl || '/uploads/missing.png',
      store: r.store,
      purchaseDate,
      rawOcrText: '',
      status: 'parsed',
    });

    await ReceiptItem.insertMany(
      r.items.map(([name, quantity, unitPrice, category]) => ({
        receiptId: receipt._id,
        userId: user._id,
        productName: name,
        normalizedName: normalizeProduct(name),
        quantity,
        unitPrice,
        totalPrice: round2(quantity * unitPrice),
        category,
        purchaseDate,
      }))
    );
  }

  await updatePatternsForUser(user._id);
  await generateRecommendations(user._id);
  console.log('Sample history loaded for the quick-login account');
}

module.exports = { seedQuickUser };
