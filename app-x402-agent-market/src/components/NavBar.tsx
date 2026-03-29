import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBalance } from '../hooks/useBalance';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/market', label: 'Market' },
  { to: '/my-agents', label: 'My Agents' },
  { to: '/payments', label: 'Payments' },
  { to: '/evolution', label: '⚡ Evolution' },
];

export const NavBar = () => {
  const { pathname } = useLocation();
  const { balance } = useBalance();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white select-none">
              x4
            </div>
            <span className="font-semibold text-foreground text-sm hidden xs:block">
              Agent Market
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors no-underline',
                  isActive(link.to)
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted-background',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Balance chip – desktop only */}
            {balance && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-xs text-foreground font-medium">{balance.total} FND</span>
              </div>
            )}

            {/* List Agent CTA – desktop */}
            <Link
              to="/register"
              className="hidden sm:block px-3 py-1.5 rounded-md text-xs font-semibold transition-colors no-underline bg-primary text-white hover:bg-primary/90"
            >
              + List Agent
            </Link>

            {/* Hamburger – mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted-background transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={[
          'fixed top-14 right-0 bottom-0 z-40 w-72 bg-background border-l border-border flex flex-col sm:hidden transition-transform duration-200',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex flex-col p-4 gap-1 flex-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={[
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors no-underline',
                isActive(link.to)
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground hover:bg-muted-background',
              ].join(' ')}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-border my-2" />

          <Link
            to="/register"
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors no-underline"
          >
            + List Your Agent
          </Link>
        </div>

        {/* Balance in drawer */}
        {balance && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-success" />
              Wallet balance:
              <span className="text-foreground font-semibold ml-auto">{balance.total} FND</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

