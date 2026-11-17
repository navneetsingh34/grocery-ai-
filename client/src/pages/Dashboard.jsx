import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getSpending,
  getRecommendations,
  dismissRecommendation,
} from '../api/dashboard';
import { CategoryChart, MonthlyChart } from '../components/SpendingCharts';
import RecCard from '../components/RecCard';

function Stat({ label, value, icon }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-leaf-50 text-2xl">{icon}</span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [spending, setSpending] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissing, setDismissing] = useState(null);

  const refresh = useCallback(async () => {
    const [spend, recData] = await Promise.all([getSpending(), getRecommendations()]);
    setSpending(spend);
    setRecs(recData.recommendations || []);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setError('Could not load dashboard.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleDismiss(id) {
    setDismissing(id);
    try {
      await dismissRecommendation(id);
      setRecs((prev) => prev.filter((r) => r._id !== id));
    } catch {
      /* ignore */
    } finally {
      setDismissing(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-36 rounded-3xl bg-sand" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 rounded-2xl bg-sand/70" />
          <div className="h-24 rounded-2xl bg-sand/70" />
          <div className="h-24 rounded-2xl bg-sand/70" />
        </div>
        <div className="h-64 rounded-2xl bg-sand/60" />
      </div>
    );
  }

  if (error && !spending) return <p className="text-red-600">{error}</p>;

  const empty = !spending?.totalSpent && !spending?.dueSoon?.length && !recs.length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-leaf-700 via-leaf-800 to-leaf-900 p-7 text-white shadow-lift sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-leaf-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-sun/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-leaf-200">Welcome back</p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Hi, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="mt-2 max-w-md text-leaf-100/80">
              Spending trends, restock predictions, and AI suggestions in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/upload" className="btn bg-white text-leaf-800 shadow-md hover:bg-leaf-50">
              + Upload receipt
            </Link>
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {empty && (
        <div className="empty-state">
          <p className="text-3xl">🥑</p>
          <p className="mt-3 font-semibold text-ink">No purchase history yet</p>
          <p className="mt-2 text-sm text-muted">
            Upload your first grocery receipt and your stats will appear here.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon="💰" label="Total tracked spend" value={Number(spending?.totalSpent || 0).toFixed(2)} />
        <Stat icon="⏰" label="Due soon" value={spending?.dueSoon?.length || 0} />
        <Stat icon="💡" label="Suggestions" value={recs.length} />
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold text-ink">Spending by category</h2>
          <div className="mt-4">
            <CategoryChart data={spending?.byCategory || []} />
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-ink">Monthly trend</h2>
          <div className="mt-4">
            <MonthlyChart data={spending?.byMonth || []} />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Likely due soon</h2>
          <Link to="/shopping-list" className="text-sm font-semibold text-leaf-600 hover:underline">
            Shopping list →
          </Link>
        </div>
        {!spending?.dueSoon?.length ? (
          <p className="mt-4 text-sm text-muted">
            Upload a few receipts over time to unlock restock predictions.
          </p>
        ) : (
          <ul className="card mt-4 divide-y divide-sand overflow-hidden">
            {spending.dueSoon.map((p) => (
              <li key={p._id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-leaf-50/60">
                <span className="flex items-center gap-3 font-medium capitalize">
                  <span className="h-2 w-2 rounded-full bg-leaf-500" />
                  {p.normalizedName}
                </span>
                <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-semibold text-leaf-700">
                  {p.predictedNextPurchaseDate
                    ? new Date(p.predictedNextPurchaseDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">Recommendations</h2>
        {!recs.length ? (
          <p className="mt-4 text-sm text-muted">
            Suggestions appear after your purchase patterns are computed.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recs.map((r) => (
              <RecCard
                key={r._id}
                recommendation={r}
                onDismiss={handleDismiss}
                dismissing={dismissing === r._id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
