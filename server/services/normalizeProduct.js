const KEYWORD_MAP = [
  { match: /\bmilk\b/, name: 'milk' },
  { match: /\bbread\b/, name: 'bread' },
  { match: /\beggs?\b/, name: 'eggs' },
  { match: /\bbutter\b/, name: 'butter' },
  { match: /\bcheese\b/, name: 'cheese' },
  { match: /\byogurt\b|\bcurd\b/, name: 'yogurt' },
  { match: /\brice\b/, name: 'rice' },
  { match: /\bpasta\b|\bspaghetti\b|\bmacaroni\b/, name: 'pasta' },
  { match: /\bsauce\b/, name: 'sauce' },
  { match: /\boil\b/, name: 'oil' },
  { match: /\bsugar\b/, name: 'sugar' },
  { match: /\bflour\b|\bata\b/, name: 'flour' },
  { match: /\btea\b/, name: 'tea' },
  { match: /\bcoffee\b/, name: 'coffee' },
  { match: /\bbanana/, name: 'banana' },
  { match: /\bapple/, name: 'apple' },
  { match: /\btomato/, name: 'tomato' },
  { match: /\bonion/, name: 'onion' },
  { match: /\bpotato/, name: 'potato' },
  { match: /\bchicken\b/, name: 'chicken' },
  { match: /\begg\b/, name: 'eggs' },
  { match: /\bchips?\b|\bcrisps?\b/, name: 'chips' },
  { match: /\bcookies?\b|\bbiscuits?\b/, name: 'biscuits' },
  { match: /\bjuice\b/, name: 'juice' },
  { match: /\bwash\b|\bdetergent\b/, name: 'detergent' },
];

const BRANDS = [
  'amul', 'nestle', 'britannia', 'parle', 'haldiram', 'fortune', 'saffola',
  'dabur', 'patanjali', 'mother dairy', 'heritage', 'kwality', 'tropicana',
  'coca cola', 'pepsi', 'lays', 'kurkure', 'maggi', 'knorr', 'heinz',
];

const UNIT_RE = /\b(\d+(\.\d+)?)\s?(ml|l|ltr|liter|litre|g|gm|kg|oz|lb|pcs|pk|pack|x)\b/gi;

/**
 * Normalize product names so variants link together.
 * e.g. "Amul Milk 1L" → "milk"
 */
function normalizeProduct(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'unknown';

  let name = rawName.toLowerCase().trim();
  name = name.replace(UNIT_RE, ' ');
  for (const brand of BRANDS) {
    name = name.replace(new RegExp(`\\b${brand}\\b`, 'gi'), ' ');
  }
  name = name.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  for (const rule of KEYWORD_MAP) {
    if (rule.match.test(name)) {
      return rule.name;
    }
  }

  // Fallback: first 1–2 meaningful tokens
  const tokens = name.split(' ').filter((t) => t.length > 2);
  if (tokens.length === 0) return name || 'unknown';
  return tokens.slice(0, 2).join(' ');
}

const ALLOWED_CATEGORIES = new Set([
  'dairy', 'produce', 'snacks', 'beverages', 'bakery', 'meat', 'pantry', 'frozen', 'household', 'other',
]);

function normalizeCategory(category) {
  const c = (category || 'other').toLowerCase().trim();
  return ALLOWED_CATEGORIES.has(c) ? c : 'other';
}

module.exports = { normalizeProduct, normalizeCategory };
