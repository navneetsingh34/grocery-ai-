const TYPES = {
  restock: { label: 'Restock', cls: 'bg-leaf-100 text-leaf-800', icon: '↻' },
  pairing: { label: 'Pairing', cls: 'bg-amber-100 text-amber-800', icon: '✦' },
  trend: { label: 'Trend', cls: 'bg-sky-100 text-sky-800', icon: '↗' },
};

export default function RecCard({ recommendation, onDismiss, dismissing }) {
  const t = TYPES[recommendation.type] || { label: recommendation.type, cls: 'bg-sand text-muted', icon: '•' };

  return (
    <article className="card card-hover fade-up p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${t.cls}`}>
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </span>
        {onDismiss && (
          <button
            type="button"
            disabled={dismissing}
            onClick={() => onDismiss(recommendation._id)}
            aria-label="Dismiss"
            className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-sand hover:text-ink disabled:opacity-50"
          >
            ✕
          </button>
        )}
      </div>
      <p className="mt-3 leading-relaxed text-ink">{recommendation.message}</p>
      {recommendation.relatedProduct && (
        <p className="mt-3 text-sm capitalize text-muted">
          Related: <span className="font-medium text-leaf-700">{recommendation.relatedProduct}</span>
        </p>
      )}
    </article>
  );
}
