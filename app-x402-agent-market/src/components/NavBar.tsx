import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBalance } from '../hooks/useBalance';

export const NavBar = () => {
  const { pathname } = useLocation();
  const { balance } = useBalance();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/market', label: 'Market' },
    { to: '/my-agents', label: 'My Agents' },
    { to: '/payments', label: 'Payments' },
    { to: '/evolution', label: '⚡ Evolution' },
  ];

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white">
              x4
            </div>
            <span className="font-semibold text-foreground text-sm hidden sm:block">
              Agent Market
            </span>
          </Link>

          {/* Nav links — hidden on small screens */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {links.map((link) => (
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

          {/* Right side: balance chip (desktop) + register CTA + mobile menu toggle */}
          <div className="flex items-center gap-2">
            {/* FND balance chip — desktop only */}
            {balance && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium text-foreground">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                {balance.total} FND
              </div>
            )}

            {/* Register CTA */}
            <Link
              to="/register"
              className={[
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors no-underline',
                'bg-primary text-white hover:bg-primary/90',
              ].join(' ')}
            >
              <span className="hidden sm:inline">+ List Agent</span>
              <span className="sm:hidden">+</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted-background transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
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

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative ml-auto w-72 max-w-full h-full bg-card border-l border-border flex flex-col">
            {/* Balance footer area at top */}
            {balance && (
              <div className="px-4 pt-5 pb-3 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                  <span className="text-base font-semibold text-foreground">{balance.total} FND</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {balance.fnd} FND · {balance.internalFnd} iFND
                </div>
              </div>
            )}
            {/* Links */}
            <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline',
                    isActive(link.to)
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted-background',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium no-underline bg-primary text-white hover:bg-primary/90 transition-colors mt-2"
              >
                + List Agent
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
