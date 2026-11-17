const styles = {
  processing: 'bg-amber-100 text-amber-800',
  parsed: 'bg-leaf-100 text-leaf-800',
  failed: 'bg-red-100 text-red-700',
};
const dots = {
  processing: 'bg-amber-500 animate-pulse',
  parsed: 'bg-leaf-500',
  failed: 'bg-red-500',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status] || 'bg-sand text-muted'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || 'bg-muted'}`} />
      {status}
    </span>
  );
}
