import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/upload', label: 'Upload' },
  { to: '/receipts', label: 'Receipts' },
  { to: '/shopping-list', label: 'Shopping list' },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-leaf-400 to-leaf-700 text-white shadow-md shadow-leaf-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 7H6" />
        </svg>
      </span>
      <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-leaf-800">
        SmartCart
      </span>
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link to={user ? '/dashboard' : '/'}>
          <Logo />
        </Link>
        {user ? (
          <nav className="flex items-center gap-1 overflow-x-auto sm:gap-1.5">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-leaf-100 text-leaf-800'
                      : 'text-muted hover:bg-leaf-50 hover:text-ink'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-sand sm:block" />
            <button
              type="button"
              onClick={logout}
              className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition hover:bg-red-50 hover:text-red-600"
            >
              Log out
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-ink">
              Log in
            </Link>
            <Link to="/register" className="btn-primary !rounded-full !px-5">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
