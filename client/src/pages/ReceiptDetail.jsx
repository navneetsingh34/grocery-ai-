import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getReceipt, reprocessReceipt } from '../api/receipts';
import StatusBadge from '../components/StatusBadge';

export default function ReceiptDetail() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getReceipt(id);
      setReceipt(data.receipt);
      setItems(data.items || []);
      setError('');
    } catch {
      setError('Receipt not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!receipt || receipt.status !== 'processing') return undefined;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [receipt, load]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const data = await reprocessReceipt(id);
      setReceipt(data.receipt);
      setItems([]);
    } catch {
      setError('Could not restart processing.');
    } finally {
      setRetrying(false);
    }
  }

  if (loading) return <p className="text-muted">Loading receipt…</p>;
  if (error || !receipt) return <p className="text-red-600">{error || 'Not found'}</p>;

  const imageSrc = receipt.imageUrl;

  return (
    <div>
      <Link to="/receipts" className="text-sm font-semibold text-leaf-600 hover:underline">
        ← All receipts
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">
            {receipt.store || 'Receipt'}
          </h1>
          <p className="mt-1 text-muted">
            {receipt.purchaseDate
              ? new Date(receipt.purchaseDate).toLocaleDateString()
              : 'Date pending'}
          </p>
        </div>
        <StatusBadge status={receipt.status} />
      </div>

      {receipt.status === 'processing' && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Processing OCR and AI parsing… this page refreshes automatically.
        </div>
      )}

      {receipt.status === 'failed' && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{receipt.errorMessage || 'Parsing failed. Try a clearer, well-lit photo.'}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="btn-primary !py-1.5"
            >
              {retrying ? 'Retrying…' : 'Retry processing'}
            </button>
            <Link to="/upload" className="rounded-lg px-3 py-1.5 text-sm font-semibold underline">
              Upload again
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Image</h2>
          <img
            src={imageSrc}
            alt="Uploaded receipt"
            className="mt-3 max-h-[480px] w-full card object-contain p-2"
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Line items ({items.length})
          </h2>
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {receipt.status === 'processing' ? 'Waiting for parse…' : 'No items extracted.'}
            </p>
          ) : (
            <ul className="mt-3 card divide-y divide-sand overflow-hidden">
              {items.map((item) => (
                <li key={item._id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium text-ink">{item.productName}</p>
                    <p className="text-xs text-muted capitalize">
                      {item.normalizedName} · {item.category} · qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">
                    {Number(item.totalPrice).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
