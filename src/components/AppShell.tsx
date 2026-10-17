import type { ReactNode } from 'react'
import { useSession } from '../auth/session-context.ts'
import type { UserRole } from '../lib/api-client.ts'
import { navigate, useLocation } from '../lib/router.ts'
import { Link } from './Link.tsx'
import { NAV_BY_ROLE, ROLE_LABEL } from './navigation.ts'

export function AppShell({ role, children }: { role: UserRole | null; children: ReactNode }) {
  const { user, logout } = useSession()
  const { pathname } = useLocation()
  const items = role ? NAV_BY_ROLE[role] : []

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand" translate="no">
            <span className="brand-mark" aria-hidden="true">
              +
            </span>
            ShiftPatch
          </span>
          {items.length > 0 && (
            <nav aria-label="Main" className="nav">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-link"
                  aria-current={pathname === item.to ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="account">
            <span className="account-name">{user?.fullName ?? user?.email}</span>
            {role && <span className="role-chip">{ROLE_LABEL[role]}</span>}
            <button type="button" className="btn btn-ghost" onClick={() => void logout().then(() => navigate('/', { replace: true }))}>
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
