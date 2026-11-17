import UploadForm from '../components/UploadForm';

export default function Upload() {
  return (
    <div>
      <h1 className="page-title">
        Upload receipt
      </h1>
      <p className="mt-2 max-w-lg text-muted">
        Snap or upload a grocery receipt. We OCR the image, parse line items with AI, then update your restock patterns.
      </p>
      <div className="mt-8">
        <UploadForm />
      </div>
    </div>
  );
}
