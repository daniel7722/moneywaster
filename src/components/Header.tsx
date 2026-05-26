import { Link } from '@tanstack/react-router'
import { TrendingDown } from 'lucide-react'

export default function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.96)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <nav
        className="page-wrap"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          padding: '0.875rem 0',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--crimson)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingDown size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
              letterSpacing: '-0.01em',
            }}
          >
            Money<span style={{ color: 'var(--crimson)' }}>Waster</span>
          </span>
        </Link>

        {/* Nav links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
            flex: 1,
          }}
        >
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
            activeOptions={{ exact: true }}
          >
            Dashboard
          </Link>
          <Link
            to="/log"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Log Expense
          </Link>
          <Link
            to="/ledger"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Ledger
          </Link>
          <Link
            to="/categories"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Categories
          </Link>
        </div>

        {/* Right side CTA */}
        <Link
          to="/log"
          className="btn-primary"
          style={{ fontSize: 13, padding: '6px 16px' }}
        >
          + Add Expense
        </Link>
      </nav>
    </header>
  )
}
