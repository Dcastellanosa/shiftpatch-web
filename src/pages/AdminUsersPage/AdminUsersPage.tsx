import { useAdminUsers } from '../../entities/user/queries/index.ts'
import { InviteUserForm } from '../../features/admin-users/InviteUserForm/index.ts'
import { UsersTable } from '../../features/admin-users/UsersTable/index.ts'
import { useInviteUser } from '../../features/admin-users/use-invite-user/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

/** Global admin: every account and the invitation form. */
export function AdminUsersPage() {
  const users = useAdminUsers()
  const invite = useInviteUser()

  return (
    <section className="page" aria-labelledby="users-heading">
      <header className="page__header">
        <div>
          <h1 id="users-heading">Users</h1>
          <p className="muted">Invite administrators, agency users and nurses. Each one sets their own password from the email.</p>
        </div>
      </header>

      <InviteUserForm
        key={invite.isSuccess ? invite.data.id : 'new'}
        pending={invite.isPending}
        error={invite.error ? toApiError(invite.error) : null}
        onSubmit={(input) => invite.mutate(input)}
      />

      <section className="section" aria-labelledby="users-list-heading">
        <h2 id="users-list-heading">All users</h2>
        {users.data === undefined ? (
          users.isError ? (
            <ErrorState error={toApiError(users.error)} onRetry={() => void users.refetch()} />
          ) : (
            <LoadingState label="Loading users…" />
          )
        ) : users.data.length === 0 ? (
          <EmptyState title="No users yet">Invite the first user above.</EmptyState>
        ) : (
          <UsersTable users={users.data} />
        )}
      </section>
    </section>
  )
}
