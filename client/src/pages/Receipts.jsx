import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReceipts } from '../api/receipts';
import ReceiptCard from '../components/ReceiptCard';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listReceipts()
      .then((data) => setReceipts(data.receipts || []))
      .catch(() => setError('Could not load receipts.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">
            Receipts
          </h1>
          <p className="mt-2 text-muted">Your scanned purchase history.</p>
        </div>
        <Link
          to="/upload"
          className="btn-primary"
        >
          Upload new
        </Link>
      </div>

      {loading && <p className="mt-10 text-muted">Loading receipts…</p>}
      {error && <p className="mt-10 text-red-600">{error}</p>}

      {!loading && !error && receipts.length === 0 && (
        <div className="mt-12 empty-state">
          <p className="text-3xl">🧾</p><p className="mt-3 font-semibold text-ink">No receipts yet</p>
          <p className="mt-2 text-sm text-muted">Upload your first grocery receipt to get started.</p>
          <Link to="/upload" className="mt-6 inline-block text-leaf-600 font-semibold hover:underline">
            Upload a receipt
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {receipts.map((r) => (
          <ReceiptCard key={r._id} receipt={r} />
        ))}
      </div>
    </div>
  );
}
