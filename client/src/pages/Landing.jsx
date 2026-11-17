import { Link } from 'react-router-dom';

const features = [
  { icon: '📸', title: 'Snap a receipt', text: 'OCR and AI turn messy photos into clean line items.' },
  { icon: '📈', title: 'Spot your patterns', text: 'A deterministic engine learns how often you buy each item.' },
  { icon: '🛒', title: 'Shop smarter', text: 'Get restock predictions and pairing ideas before you run out.' },
];

export default function Landing() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(105deg, rgba(14,58,30,0.92) 0%, rgba(14,58,30,0.6) 55%, rgba(14,58,30,0.25) 100%), url(https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="mx-auto flex min-h-[calc(100vh-62px)] max-w-6xl flex-col justify-center px-4 py-20">
          <span className="fade-up w-fit rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-leaf-100 backdrop-blur">
            AI grocery assistant
          </span>
          <h1 className="fade-up mt-6 max-w-3xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl">
            Never run out of <span className="text-leaf-300">the basics</span> again.
          </h1>
          <p className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Turn receipt photos into restock predictions and smarter shopping lists, powered by OCR, AI parsing and a custom pattern engine.
          </p>
          <div className="fade-up mt-9 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary !px-7 !py-3.5 !text-base">
              Get started free
            </Link>
            <Link
              to="/login"
              className="btn border border-white/40 bg-white/10 !px-7 !py-3.5 !text-base text-white backdrop-blur hover:bg-white/20"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-50 text-2xl">{f.icon}</span>
              <h3 className="mt-5 text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
