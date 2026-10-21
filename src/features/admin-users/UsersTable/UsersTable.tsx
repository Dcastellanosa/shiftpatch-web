import './UsersTable.scss'
import { ELIGIBILITY_STATUS_LABEL, USER_ROLE_LABEL, USER_STATUS_LABEL } from '../../../entities/user/model/index.ts'
import type { AdminUser } from '../../../shared/api/client/index.ts'
import { formatTimestamp } from '../../../shared/lib/format/index.ts'

/** Every account with its role, status and access. Read-only; invitations happen in the form above. */
export function UsersTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="table-wrap">
      <table className="table users-table" data-testid="users-table">
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Access</th>
            <th scope="col">Last sign-in</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td data-label="User">
                <span className="table__cell--strong users-table__name">{user.fullName}</span>
                <span className="muted small users-table__email">{user.email ?? 'No email'}</span>
              </td>
              <td data-label="Role">{USER_ROLE_LABEL[user.role]}</td>
              <td data-label="Status">
                <span className={`badge badge--${user.status === 'active' ? 'active' : 'invited'}`}>{USER_STATUS_LABEL[user.status]}</span>
              </td>
              <td data-label="Access">
                <Access user={user} />
              </td>
              <td data-label="Last sign-in">
                {user.lastSignInAt ? (
                  <time dateTime={user.lastSignInAt}>{formatTimestamp(user.lastSignInAt)}</time>
                ) : user.invitedAt ? (
                  <span className="muted">Invited {formatTimestamp(user.invitedAt)}</span>
                ) : (
                  <span className="muted">Never</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Access({ user }: { user: AdminUser }) {
  if (user.role === 'admin') return <span className="muted">All agencies</span>
  if (user.role === 'agency') {
    return user.agencies.length === 0 ? (
      <span className="muted">No agency</span>
    ) : (
      <ul className="users-table__access">
        {user.agencies.map((agency) => (
          <li key={agency.id}>{agency.name}</li>
        ))}
      </ul>
    )
  }
  return user.eligibleBranches.length === 0 ? (
    <span className="muted">No branches</span>
  ) : (
    <ul className="users-table__access">
      {user.eligibleBranches.map((branch) => (
        <li key={branch.id}>
          {branch.agency.name} · {branch.name}{' '}
          <span className={`badge badge--eligibility-${branch.status}`}>{ELIGIBILITY_STATUS_LABEL[branch.status]}</span>
        </li>
      ))}
    </ul>
  )
}
