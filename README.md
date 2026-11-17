# SmartCart — AI-Powered Grocery Recommendation Engine

SmartCart turns **photos of grocery receipts** into a structured purchase history, learns **how often you buy each item**, and uses that to tell you **what you are about to run out of**, build a **smart shopping list**, and suggest **complementary items**.

> Upload receipt → OCR reads it → AI structures it → a deterministic engine finds your buying rhythm → you get restock predictions and a shopping list.

---

## Table of contents

1. [What problem it solves](#1-what-problem-it-solves)
2. [Feature overview](#2-feature-overview)
3. [How it works (end to end)](#3-how-it-works-end-to-end)
4. [Design decisions and why](#4-design-decisions-and-why)
5. [Tech stack](#5-tech-stack)
6. [Project structure](#6-project-structure)
7. [Data model](#7-data-model)
8. [The pattern engine in detail](#8-the-pattern-engine-in-detail)
9. [Product normalization](#9-product-normalization)
10. [Recommendations and the shopping list](#10-recommendations-and-the-shopping-list)
11. [API reference](#11-api-reference)
12. [Frontend](#12-frontend)
13. [Setup and running locally](#13-setup-and-running-locally)
14. [Configuration](#14-configuration)
15. [Trying it with the sample receipts](#15-trying-it-with-the-sample-receipts)
16. [Deployment](#16-deployment)
17. [Security notes](#17-security-notes)
18. [Limitations and ideas for the future](#18-limitations-and-ideas-for-the-future)

---

## 1. What problem it solves

People rarely track what they buy. They run out of milk on a Monday morning, buy pasta without the sauce, and have no idea how much they spend on snacks. Receipts hold all of that information, but it is locked in crumpled paper and unreadable photos.

SmartCart unlocks it:

- **No manual data entry.** You photograph a receipt; the app does the rest.
- **Personal restock timing.** Instead of generic advice, predictions come from *your* own buying intervals.
- **Spending visibility.** See where money goes by category and by month.
- **Gentle nudges.** Natural-language suggestions such as "You usually buy milk every 4 days — it may be time to restock."

---

## 2. Feature overview

| Area | What you get |
|------|--------------|
| **Accounts** | Register / log in with email and password (JWT sessions). A one-click "Quick login" button exists on the login page for the fixed local test account. |
| **Receipt upload** | Drag-and-drop or browse for a JPG / PNG / WebP / GIF image up to 10 MB. |
| **OCR + AI parsing** | Tesseract.js reads the text; Google Gemini turns it into structured JSON (store, date, line items, quantities, prices, categories). A heuristic parser takes over if Gemini is unavailable. |
| **Receipt detail** | The original image next to the extracted line items; live status (processing / parsed / failed) with automatic refresh and a **Retry** button on failure. |
| **Dashboard** | Total tracked spend, count of items due soon, number of suggestions, spending-by-category bar chart, monthly trend area chart, a "likely due soon" list, and recommendation cards you can dismiss. |
| **Smart shopping list** | Predicted restocks grouped into **Daily**, **Next 3 days**, **Later**, and **Pairing ideas**, with filter chips and average prices. |
| **Recommendations** | 3–5 suggestions per refresh: restock reminders, pairing ideas, and trend observations. |

Everything shown in the UI is computed from the receipts you upload. There is no pre-loaded sample data.

---

## 3. How it works (end to end)

```
User uploads receipt image
        │
        ▼
Frontend (React)  ──  POST /api/receipts/upload  (multipart, JWT)
        │
        ▼
Backend (Express)
   1. multer validates + saves the image to uploads/
   2. A Receipt document is created with status = "processing"
   3. The HTTP response returns immediately (201) — the client is redirected
      to the receipt page, which polls every 2.5 s
   4. A background job (processReceipt) runs:
        ├─► OCR  (Tesseract.js)            image → raw text
        ├─► Parse (Gemini, temperature 0)   raw text → JSON
        │        └─ fallback: regex heuristic parser if Gemini fails/missing
        ├─► Normalize each product name     "Amul Milk 1L" → "milk"
        ├─► Save ReceiptItems → MongoDB
        ├─► Pattern engine (pure code)      → ProductPattern per product
        └─► Recommendation step (Gemini, temperature 0.7)
                 └─ fallback: rule-based suggestions
        │
        ▼
Receipt status becomes "parsed" (or "failed" with an error message)
        │
        ▼
Dashboard + Shopping list read the stored patterns and recommendations
```

### Step by step

1. **Upload.** [receiptController.js](server/controllers/receiptController.js) stores the file, creates a `Receipt` with `status: processing`, and schedules the job with `setImmediate` so the user is never left waiting on slow OCR.
2. **OCR.** [ocrService.js](server/services/ocrService.js) runs Tesseract.js (English model, `eng.traineddata`). Empty output raises an error ("try a clearer photo").
3. **Parsing.** [aiParsingService.js](server/services/aiParsingService.js) sends the OCR text to `gemini-2.0-flash` at **temperature 0** with `responseMimeType: application/json` and a strict schema, asking it to ignore subtotal, tax, change and payment lines. The result is validated (quantity, prices, category whitelist). If there is no API key, or the call or JSON parsing fails, [heuristicParse](server/services/aiParsingService.js) extracts lines that end in a price using regular expressions and skips lines such as `subtotal`, `tax`, `total`, `visa`.
4. **Normalization.** [normalizeProduct.js](server/services/normalizeProduct.js) maps messy names to a canonical key so that repeated purchases of the same product are linked together.
5. **Pattern computation.** [patternEngine.js](server/services/patternEngine.js) recomputes every product's purchase interval and predicted next date for the user.
6. **Recommendations.** [recommendationService.js](server/services/recommendationService.js) summarizes the patterns and asks Gemini (temperature 0.7) for 3–5 natural suggestions, falling back to rules if the AI call fails.
7. **Status.** The receipt is marked `parsed`. Pattern/recommendation failures are logged but do **not** fail the receipt; only OCR/parsing failures set `status: failed` with an `errorMessage`.

---

## 4. Design decisions and why

| Decision | Reason |
|----------|--------|
| **Frequency math is code, not an LLM.** | Averages and date arithmetic must be correct, repeatable, and explainable. An LLM can hallucinate numbers. The pattern engine is deterministic and testable. |
| **Two different AI prompt styles.** | *Parsing* needs accuracy → temperature `0`, JSON mode, strict schema. *Recommendations* benefit from natural, varied wording → temperature `~0.7`. |
| **Graceful fallbacks everywhere.** | The app works without a Gemini key (heuristic parser + rule-based recommendations), so it is demo-able and resilient to API outages or quota limits. |
| **Async background processing.** | OCR can take several seconds. Responding immediately and polling keeps the UI responsive. |
| **Product normalization layer.** | "Amul Milk 1L", "WHOLE MILK 1GAL" and "milk 500ml" must all count as *milk*, otherwise no purchase history can accumulate. |
| **Per-user data isolation.** | Every query filters by `userId`; every route except register/login requires a valid JWT. |
| **In-memory MongoDB fallback.** | If no MongoDB is reachable, the server boots an in-memory instance so the project runs with zero setup (data resets on restart). |
| **Local image storage for the MVP.** | Simple and free. For production, swap for S3 or Cloudinary. |

---

## 5. Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4, Recharts, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose (in-memory fallback via `mongodb-memory-server`) |
| OCR | Tesseract.js |
| AI | Google Gemini (`gemini-2.0-flash`) via `@google/generative-ai` |
| Auth | JWT (7-day expiry) + bcryptjs password hashing |
| Uploads | multer (disk storage, image-only filter, 10 MB limit) |
| Fonts | Fraunces (headings) + DM Sans (body) |

---

## 6. Project structure

```
smartcart/
├── client/                      # React single-page app
│   └── src/
│       ├── api/                 # Axios wrappers (auth, receipts, dashboard)
│       ├── components/          # Navbar, Layout, RecCard, ReceiptCard,
│       │                        # SpendingCharts, StatusBadge, UploadForm, AuthShell
│       ├── context/AuthContext  # Login state, token handling
│       ├── pages/               # Landing, Login, Register, Dashboard, Upload,
│       │                        # Receipts, ReceiptDetail, ShoppingList
│       └── index.css            # Theme tokens + shared component styles
├── server/
│   ├── server.js                # App bootstrap, routes, error handler
│   ├── config/db.js             # Mongo connection + in-memory fallback
│   ├── middleware/              # auth (JWT), upload (multer), errorHandler
│   ├── models/                  # User, Receipt, ReceiptItem, ProductPattern, Recommendation
│   ├── controllers/             # auth, receipt, dashboard, recommendation, shoppingList
│   ├── routes/                  # Express routers
│   ├── jobs/processReceipt.js   # The async pipeline
│   ├── services/                # ocr, aiParsing, normalizeProduct, patternEngine,
│   │                            # recommendation, ensureStaticUser
│   └── uploads/                 # Saved receipt images
├── sample-receipts/             # 5 generated receipt images for testing
├── .env.example
├── render.yaml                  # Render deployment blueprint (API)
└── README.md
```

---

## 7. Data model

```
User ──< Receipt ──< ReceiptItem
  │
  ├──< ProductPattern     (one per user + normalized product)
  └──< Recommendation
```

| Collection | Key fields |
|-----------|-----------|
| **User** | `name`, `email` (unique, lowercased), `passwordHash` |
| **Receipt** | `userId`, `imageUrl`, `store`, `purchaseDate`, `rawOcrText`, `status` (`processing` / `parsed` / `failed`), `errorMessage` |
| **ReceiptItem** | `receiptId`, `userId`, `productName` (as printed), `normalizedName`, `quantity`, `unitPrice`, `totalPrice`, `category`, `purchaseDate` |
| **ProductPattern** | `userId`, `normalizedName`, `purchaseCount`, `avgDaysBetweenPurchases`, `lastPurchaseDate`, `predictedNextPurchaseDate`, `avgPrice` — unique on `(userId, normalizedName)` |
| **Recommendation** | `userId`, `type` (`restock` / `pairing` / `trend`), `message`, `relatedProduct`, `dismissed` |

Categories: `dairy`, `produce`, `snacks`, `beverages`, `bakery`, `meat`, `pantry`, `frozen`, `household`, `other`.

---

## 8. The pattern engine in detail

[patternEngine.js](server/services/patternEngine.js) is the heart of the project. After each receipt is parsed it rebuilds every pattern for that user:

1. Load all of the user's `ReceiptItem`s, oldest first, and group them by `normalizedName`.
2. For each product, collect the purchase dates and **deduplicate same-day purchases** (buying milk twice in one trip counts once for interval purposes).
3. With **two or more distinct purchase days**, compute the gap in days between each consecutive pair and take the **average** → `avgDaysBetweenPurchases`.
4. `predictedNextPurchaseDate = lastPurchaseDate + avgDaysBetweenPurchases`.
5. `avgPrice` is the mean of the item totals.
6. Upsert one `ProductPattern` per product.

**Worked example:** milk bought on Mar 2, Mar 5, Mar 9, Mar 12 → gaps 3, 4, 3 → average 3.33 days → predicted next purchase ≈ Mar 15.

A product bought only once has no interval, so it gets no prediction until it is bought again. This is why uploading receipts over time improves the app.

---

## 9. Product normalization

[normalizeProduct.js](server/services/normalizeProduct.js) makes different spellings of the same product collapse into one key:

1. Lower-case the name.
2. Strip sizes and units (`1L`, `500ml`, `12CT`, `5lb`, `6pk`, …).
3. Strip known brand names (Amul, Nestle, Maggi, Tropicana, …).
4. Remove punctuation.
5. Match against a keyword map (`milk`, `bread`, `eggs`, `banana`, `tomato`, `chicken`, `juice`, …) and return the canonical name.
6. If nothing matches, fall back to the first one or two meaningful words.

Example: `WHOLE MILK 1GAL` → `milk`, `Amul Milk 1L` → `milk`, `ROMA TOMATOES` → `tomato`.

To teach the app new products or brands, extend `KEYWORD_MAP` and `BRANDS` in that file.

---

## 10. Recommendations and the shopping list

### Recommendations

[recommendationService.js](server/services/recommendationService.js) builds a compact summary of the user's top 40 products (count, average gap, days since last purchase, predicted next date, average price) and asks Gemini for 3–5 suggestions of three types:

- **restock** — items likely due soon
- **pairing** — complementary items the user buys inconsistently (for example, pasta often, sauce rarely)
- **trend** — spending or habit observations

If Gemini is unavailable, **rule-based fallbacks** apply: a restock reminder when `daysSinceLastPurchase ≥ 85% of the average gap`, a pasta→sauce pairing hint, and a "most frequent item" trend note. Active (non-dismissed) recommendations are replaced on each refresh; dismissed ones are kept.

### Shopping list

[shoppingListController.js](server/controllers/shoppingListController.js) combines predictions due within the next **14 days** with pairing recommendations, removes duplicates, and sorts them into buckets:

| Bucket | Rule |
|--------|------|
| **Daily** | Average gap ≤ 1.5 days |
| **Next 3 days** | Predicted date within 3 days |
| **Later** | Predicted date beyond 3 days |
| **Pairing** | Comes from a pairing recommendation |

Each item shows a reason ("Usually every ~4 days") and its average price.

---

## 11. API reference

All routes are prefixed with `/api`. Everything except health, register and login requires the header `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Liveness check |
| POST | `/auth/register` | Create account → `{ token, user }` (password ≥ 6 chars) |
| POST | `/auth/login` | Log in → `{ token, user }` |
| GET | `/auth/me` | Current user |
| POST | `/receipts/upload` | Multipart field `receipt`; creates a receipt and starts the pipeline |
| GET | `/receipts` | List the user's receipts (newest first) |
| GET | `/receipts/:id` | Receipt plus its line items |
| POST | `/receipts/:id/reprocess` | Re-run the pipeline on an existing receipt |
| GET | `/dashboard/spending` | `totalSpent`, `byCategory`, `byMonth`, `dueSoon` |
| GET | `/dashboard/recommendations` | Active (non-dismissed) recommendations |
| POST | `/recommendations/:id/dismiss` | Dismiss a suggestion |
| GET | `/shopping-list` | `items` plus `grouped` (`daily`, `next3Days`, `later`, `pairing`) |

Uploaded images are served statically from `/uploads/<filename>`.

---

## 12. Frontend

- **Routing** ([App.jsx](client/src/App.jsx)): public pages (`/`, `/login`, `/register`) and protected pages (`/dashboard`, `/upload`, `/receipts`, `/receipts/:id`, `/shopping-list`). `ProtectedLayout` redirects to `/login` when there is no session.
- **Auth** ([AuthContext.jsx](client/src/context/AuthContext.jsx)): stores the JWT in `localStorage` (`smartcart_token`); an Axios interceptor adds it to every request.
- **Live status:** the receipt detail page polls the API every 2.5 seconds while a receipt is `processing`.
- **Charts:** Recharts with gradient bars (category) and an area chart (monthly trend).
- **Styling:** Tailwind CSS 4 with a custom green "leaf" palette and shared component classes (`card`, `btn-primary`, `btn-secondary`, `input`, `page-title`, `empty-state`) defined in [index.css](client/src/index.css).
- **Dev proxy:** Vite proxies `/api` and `/uploads` to `http://localhost:5000`, so no CORS setup is needed in development.

---

## 13. Setup and running locally

### Prerequisites

- Node.js 18+
- *(Optional)* MongoDB locally or an Atlas URI — without it, the server uses a temporary in-memory database
- *(Optional)* A [Gemini API key](https://aistudio.google.com/apikey) — without it, heuristic parsing and rule-based recommendations are used

### 1. Environment

```bash
cp .env.example server/.env
```

Edit `server/.env` (see [Configuration](#14-configuration)).

### 2. Install and run

```bash
# API
cd server
npm install
npm run dev          # http://localhost:5000

# Client (new terminal)
cd client
npm install
npm run dev          # http://localhost:5173
```

Or from the repo root: `npm run install:all`, then `npm run dev:server` and `npm run dev:client` in two terminals.

- App: http://localhost:5173
- API health: http://localhost:5000/api/health

### 3. Sign in

Register on the Sign up page, or use **Quick login** on the login page (fixed local test account `navneet@gmail.com`, created automatically at server start with an empty history).

---

## 14. Configuration

Variables live in `server/.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/smartcart` | Mongo connection string (use Atlas for persistence) |
| `JWT_SECRET` | — | **Required.** Long random string used to sign tokens |
| `GEMINI_API_KEY` | empty | Enables Gemini parsing and recommendations |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `UPLOAD_DIR` | `uploads` | Where receipt images are stored |
| `ALLOW_MEMORY_DB` | `true` | Set to `false` to disable the in-memory fallback and fail if Mongo is unreachable |

Client (build-time): `VITE_API_URL` — API base URL in production (for example `https://your-api.onrender.com/api`). Defaults to `/api`.

---

## 15. Trying it with the sample receipts

The [sample-receipts/](sample-receipts/) folder contains 5 generated receipt images from fictional stores, dated March 2–16, 2026. Milk, eggs, bananas, bread, butter and chicken repeat across them at 3–7 day intervals.

1. Log in.
2. Go to **Upload** and upload the receipts **in date order (oldest first)**.
3. Open each receipt to see the extracted items.
4. Check the **Dashboard** and **Shopping list** — predictions appear once a product has been bought on at least two different days.

> Predicted dates are relative to the purchase dates on the receipts. Because these samples are dated in the past, some predictions will already be overdue and show up as "due soon".

---

## 16. Deployment

### Frontend (Vercel)

1. Root directory: `client`
2. Build command: `npm run build`
3. Environment: `VITE_API_URL=https://your-api.onrender.com/api`
4. [vercel.json](client/vercel.json) rewrites all routes to `index.html` so client-side routing works.

### Backend (Render / Railway)

1. Root directory: `server`, start command: `npm start` (see [render.yaml](render.yaml))
2. Environment: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL` (your Vercel URL)
3. Use a persistent disk, S3 or Cloudinary for uploads in production — the MVP stores images on the local filesystem.

### Database (MongoDB Atlas)

Create a free cluster and set `MONGODB_URI` to its connection string.

---

## 17. Security notes

- Passwords are hashed with bcrypt (10 rounds); tokens expire after 7 days.
- Every data query is scoped to the authenticated user; receipts and recommendations of other users are never returned.
- Uploads are restricted to image MIME types, limited to 10 MB, and filenames are sanitized.
- **Remove the Quick login before any public deployment.** Its credentials are hard-coded in [Login.jsx](client/src/pages/Login.jsx) and [ensureStaticUser.js](server/services/ensureStaticUser.js).
- Always set a strong, unique `JWT_SECRET` in production.
- Receipt text is sent to the Gemini API when a key is configured; do not enable it if that is a concern.

---

## 18. Limitations and ideas for the future

**Current limitations**

- The in-memory database loses all data when the server stops — use a real MongoDB for persistence.
- OCR accuracy depends on photo quality; crumpled, blurry or poorly lit receipts may parse badly (use **Retry** or upload a clearer photo).
- The heuristic fallback cannot detect categories, quantities or dates.
- The product keyword map is small and tuned to common items; unfamiliar products fall back to their first words.
- Predictions need at least two purchase days per product and assume a stable rhythm.
- The pipeline runs in the API process (no job queue), and images live on local disk.
- No automated tests yet.

**Ideas**

- Send the receipt image directly to a vision model instead of OCR + text parsing.
- Smarter intervals (median, recency weighting, outlier removal) and confidence scores.
- A job queue (BullMQ) for processing, and object storage for images.
- Manual correction of parsed items and categories.
- Budgets, price-change alerts and per-store price comparison.
- Export the shopping list; share it with household members.
- Unit and integration tests for the pattern engine and normalizer.

---

## License

MIT
