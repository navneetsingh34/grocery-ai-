import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function ReceiptCard({ receipt }) {
  const date = receipt.purchaseDate || receipt.createdAt;
  return (
    <Link to={`/receipts/${receipt._id}`} className="card card-hover fade-up block p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-leaf-50 text-xl">🧾</span>
          <div>
            <p className="font-semibold text-ink">{receipt.store || 'Unknown store'}</p>
            <p className="mt-0.5 text-sm text-muted">
              {date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
        <StatusBadge status={receipt.status} />
      </div>
      {receipt.errorMessage && receipt.status === 'failed' && (
        <p className="mt-3 line-clamp-2 text-sm text-red-600">{receipt.errorMessage}</p>
      )}
    </Link>
  );
}
