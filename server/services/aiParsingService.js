const { GoogleGenerativeAI } = require('@google/generative-ai');
const { normalizeCategory } = require('./normalizeProduct');

const PARSE_PROMPT = `You will receive raw, messy OCR text from a grocery receipt.
Extract structured data as JSON with this exact shape:
{
  "store_name": "string or empty",
  "purchase_date": "YYYY-MM-DD or empty string if unknown",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit_price": number,
      "total_price": number,
      "category": "dairy|produce|snacks|beverages|bakery|meat|pantry|frozen|household|other"
    }
  ]
}
Ignore subtotals, tax lines, change due, payment methods, and promotional text.
Return ONLY valid JSON, no explanation or markdown.`;

function getModel(temperature) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  });
}

function safeParseJson(text) {
  let cleaned = (text || '').trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

function mapParsedItems(data) {
  if (!data || !Array.isArray(data.items)) {
    throw new Error('AI parsing returned invalid structure');
  }

  const items = data.items
    .filter((item) => item && item.name)
    .map((item) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || 0;
      const totalPrice = Number(item.total_price) || quantity * unitPrice;
      return {
        name: String(item.name).trim(),
        quantity,
        unitPrice,
        totalPrice,
        category: normalizeCategory(item.category),
      };
    });

  if (items.length === 0) {
    throw new Error('No line items found in receipt');
  }

  let purchaseDate = null;
  if (data.purchase_date) {
    const d = new Date(data.purchase_date);
    if (!Number.isNaN(d.getTime())) purchaseDate = d;
  }

  return {
    store: data.store_name || '',
    purchaseDate,
    items,
  };
}

/** Heuristic fallback when Gemini is unavailable — extracts lines ending with a price. */
function heuristicParse(rawOcrText) {
  const lines = String(rawOcrText).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const priceRe = /^(.*?)[\s.]*(\d+[.,]\d{2})\s*$/;
  const skip = /^(subtotal|total|tax|cash|change|visa|mastercard|debit|credit|thank|gst|cgst|sgst|balance)/i;
  const items = [];
  let store = '';

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].length > 2 && lines[i].length < 40 && !priceRe.test(lines[i]) && !/\d{2}\/\d{2}/.test(lines[i])) {
      store = lines[i];
      break;
    }
  }

  for (const line of lines) {
    if (skip.test(line)) continue;
    const m = line.match(priceRe);
    if (!m) continue;
    const name = m[1].replace(/[.\s]+$/g, '').trim();
    if (!name || name.length < 2) continue;
    const totalPrice = Number(m[2].replace(',', '.'));
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) continue;
    items.push({
      name,
      quantity: 1,
      unit_price: totalPrice,
      total_price: totalPrice,
      category: 'other',
    });
  }

  return mapParsedItems({
    store_name: store,
    purchase_date: '',
    items,
  });
}

/**
 * Parse OCR text into structured receipt data via Gemini (low temperature).
 * Falls back to heuristic parsing if GEMINI_API_KEY is missing or the call fails.
 */
async function parseReceiptText(rawOcrText) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing — using heuristic receipt parser');
    return heuristicParse(rawOcrText);
  }

  try {
    const model = getModel(0);
    const result = await model.generateContent([
      { text: PARSE_PROMPT },
      { text: `OCR text:\n${rawOcrText}` },
    ]);
    const raw = result.response.text();
    return mapParsedItems(safeParseJson(raw));
  } catch (err) {
    console.error('Gemini parse failed, using heuristic fallback:', err.message);
    return heuristicParse(rawOcrText);
  }
}

module.exports = { parseReceiptText, getModel, safeParseJson };
