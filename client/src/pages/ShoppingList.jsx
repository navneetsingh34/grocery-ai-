import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getShoppingList } from '../api/dashboard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'next3Days', label: '3 days' },
  { id: 'pairing', label: 'Pairing' },
];

const SECTION_META = {
  daily: { title: 'Daily', blurb: 'Items you typically buy every day' },
  next3Days: { title: 'Next 3 days', blurb: 'Due within the next 3 days' },
  later: { title: 'Later this week', blurb: 'Coming up after 3 days' },
  pairing: { title: 'Pairing ideas', blurb: 'Complements based on your habits' },
};

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    const data = await getShoppingList();
    setItems(data.items || []);
    setGrouped(data.grouped || null);
  }

  useEffect(() => {
    refresh()
      .catch(() => setError('Could not load shopping list.'))
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => {
    if (grouped) {
      if (filter === 'all') {
        return ['daily', 'next3Days', 'later', 'pairing']
          .map((key) => ({ key, items: grouped[key] || [] }))
          .filter((s) => s.items.length);
      }
      return [{ key: filter, items: grouped[filter] || [] }];
    }

    const fallback = items.map((i) => ({ ...i, bucket: i.bucket || 'later' }));
    if (filter === 'all') {
      return [{ key: 'later', items: fallback }];
    }
    return [{ key: filter, items: fallback.filter((i) => i.bucket === filter) }];
  }, [grouped, items, filter]);

  const totalVisible = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">
            Smart shopping list
          </h1>
          <p className="mt-2 max-w-lg text-muted">
            Auto-built from restock predictions — daily, next 3 days, and pairing ideas.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.id
                ? 'bg-leaf-600 text-white shadow-md shadow-leaf-600/25'
                : 'border border-sand bg-white text-muted hover:border-leaf-300 hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-10 text-muted">Building your list…</p>}
      {error && <p className="mt-10 text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="mt-12 empty-state">
          <p className="text-3xl">🛒</p><p className="mt-3 font-semibold text-ink">List is empty</p>
          <p className="mt-2 text-sm text-muted">
            Upload a few receipts and your restock predictions will show up here.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link to="/upload" className="btn-primary">
              Upload a receipt
            </Link>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && totalVisible === 0 && (
        <p className="mt-10 text-sm text-muted">No items in this filter.</p>
      )}

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.key}>
            <div className="mb-3">
              <h2 className="font-semibold text-ink">{SECTION_META[section.key]?.title || section.key}</h2>
              <p className="text-sm text-muted">{SECTION_META[section.key]?.blurb}</p>
            </div>
            <ul className="card divide-y divide-sand overflow-hidden">
              {section.items.map((item, i) => (
                <li
                  key={`${section.key}-${item.product}-${i}`}
                  className="flex items-start justify-between gap-4 px-4 py-4"
                >
                  <div>
                    <p className="font-medium capitalize text-ink">{item.product}</p>
                    <p className="mt-1 text-sm text-muted">{item.reason}</p>
                    <span className="mt-2 inline-block rounded-full bg-leaf-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-leaf-700">
                      {item.bucket || item.source}
                    </span>
                  </div>
                  {item.avgPrice != null && item.avgPrice > 0 && (
                    <p className="tabular-nums text-sm text-muted">~{Number(item.avgPrice).toFixed(2)}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
