export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-62px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="card fade-up p-7 sm:p-9">
        <h1 className="page-title">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        {children}
      </div>
      <p className="mt-6 text-center text-sm text-muted">{footer}</p>
    </div>
  );
}

export function Field({ label, type, value, onChange, required, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </label>
  );
}
