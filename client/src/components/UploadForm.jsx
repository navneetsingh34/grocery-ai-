import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadReceipt } from '../api/receipts';

export default function UploadForm() {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function onFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP).');
      return;
    }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Select a receipt photo first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { receipt } = await uploadReceipt(file);
      navigate(`/receipts/${receipt._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging
            ? 'border-leaf-500 bg-leaf-50'
            : 'border-leaf-200 bg-white/60 hover:border-leaf-400 hover:bg-leaf-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {preview ? (
          <img
            src={preview}
            alt="Receipt preview"
            className="mx-auto max-h-64 rounded-lg object-contain"
          />
        ) : (
          <>
            <p className="font-[family-name:var(--font-display)] text-lg text-ink">
              Drop a receipt photo
            </p>
            <p className="mt-2 text-sm text-muted">or click to browse — JPG, PNG, WebP up to 10MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !file}
        className="btn-primary w-full !py-3"
      >
        {loading ? 'Uploading…' : 'Scan receipt'}
      </button>
    </form>
  );
}
