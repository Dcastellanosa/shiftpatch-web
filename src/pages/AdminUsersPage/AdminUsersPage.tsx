import { useState } from 'react'
import { useAdminUsers } from '../../entities/user/queries/index.ts'
import { useSession } from '../../features/auth/session-context/index.ts'
import { InviteUserForm } from '../../features/admin-users/InviteUserForm/index.ts'
import { UsersTable } from '../../features/admin-users/UsersTable/index.ts'
import { useDeleteUser } from '../../features/admin-users/use-delete-user/index.ts'
import { useInviteUser } from '../../features/admin-users/use-invite-user/index.ts'
import type { AdminUser } from '../../shared/api/client/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'
import { Modal } from '../../shared/ui/Modal/index.ts'

/** Global admin: every account, invitations in a modal, and deletion with a warning. */
export function AdminUsersPage() {
  const session = useSession()
  const users = useAdminUsers()
  const invite = useInviteUser()
  const remove = useDeleteUser()
  const [inviting, setInviting] = useState(false)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)

  function closeInvite() {
    setInviting(false)
    invite.reset()
  }

  return (
    <section className="page" aria-labelledby="users-heading">
      <header className="page__header">
        <div>
          <h1 id="users-heading">Users</h1>
          <p className="muted">
            Invite administrators, agency users and nurses. Each one sets their own password from the email.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setInviting(true)}>
          Invite user
        </button>
      </header>

      {inviting && (
        <Modal
          title="Invite a user"
          description="They receive an email with a link to set their password."
          onClose={closeInvite}
        >
          <InviteUserForm
            pending={invite.isPending}
            error={invite.error ? toApiError(invite.error) : null}
            onSubmit={(input) => invite.mutate(input, { onSuccess: closeInvite })}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.fullName}?`}
          confirmLabel="Delete user"
          destructive
          pending={remove.isPending}
          onConfirm={() => remove.mutate(deleting, { onSettled: () => setDeleting(null) })}
          onCancel={() => setDeleting(null)}
        >
          This removes the account{deleting.email ? ` for ${deleting.email}` : ''}, its sign-in and its access. It
          cannot be undone. Users who have shifts or recorded actions cannot be deleted.
        </ConfirmDialog>
      )}

      <section className="section" aria-labelledby="users-list-heading">
        <h2 id="users-list-heading">All users</h2>
        {users.data === undefined ? (
          users.isError ? (
            <ErrorState error={toApiError(users.error)} onRetry={() => void users.refetch()} />
          ) : (
            <LoadingState label="Loading users…" />
          )
        ) : users.data.length === 0 ? (
          <EmptyState title="No users yet">Invite the first user with the button above.</EmptyState>
        ) : (
          <UsersTable
            users={users.data}
            currentUserId={session.user?.id ?? ''}
            pendingUserId={remove.isPending ? remove.variables.id : null}
            onDelete={setDeleting}
          />
        )}
      </section>
    </section>
  )
}
