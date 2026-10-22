import './AppShell.scss'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { NAV_BY_ROLE, ROLE_LABEL } from '../../../app/router/navigation/index.ts'
import { useSession } from '../../../features/auth/session-context/index.ts'
import type { UserRole } from '../../api/client/index.ts'
import { Toaster } from '../Toaster/index.ts'

/** Authenticated chrome: brand, role-aware navigation, account and sign-out, notifications. */
export function AppShell({ role, children }: { role: UserRole | null; children: ReactNode }) {
  const { user, logout } = useSession()
  const items = role ? NAV_BY_ROLE[role] : []

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <span className="brand" translate="no">
            <span className="brand__mark" aria-hidden="true">
              +
            </span>
            ShiftPatch
          </span>
          {items.length > 0 && (
            <nav aria-label="Main" className="nav">
              {items.map((item) => (
                // `aria-current="page"` (set by NavLink) is the styling hook; no extra class is appended.
                <NavLink key={item.to} to={item.to} end className={() => 'nav__link'}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="account">
            <span className="account__name">{user?.name}</span>
            {role && <span className="role-chip">{ROLE_LABEL[role]}</span>}
            {/* The session gate (App) returns to `/` once the session has ended. */}
            <button type="button" className="btn btn--ghost" onClick={() => void logout()}>
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="content" tabIndex={-1}>
        {children}
      </main>
      <Toaster />
    </div>
  )
}
