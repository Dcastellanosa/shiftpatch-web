import { expect, test } from '@playwright/test'
import { resetSeed } from './reset.ts'
import { ACCOUNTS, MAIN, SUNRISE, banner, openScreen, passwordLinkFor, signIn } from './support.ts'

const EMAIL = 'e2e.nurse@shiftpatch.test'

test.beforeAll(() => resetSeed())

/**
 * Invitation and password recovery through the local mail catcher: the admin
 * invites a nurse, the nurse sets a password from the emailed link and lands
 * signed in (the bearer session the API returned), then recovers a forgotten
 * password the same way.
 */
test('an invited nurse sets a password from the email and can later recover it', async ({ browser }) => {
  const admin = await signIn(browser, ACCOUNTS.admin)
  await openScreen(admin, 'Users')
  await expect(admin).toHaveURL(/\/admin\/users$/)

  const invitedAt = Date.now() - 1000
  await admin.getByRole('button', { name: 'Invite user' }).click()
  const inviteDialog = admin.getByRole('dialog', { name: 'Invite a user' })
  await inviteDialog.getByLabel('Full name').fill('E2E Nurse')
  await inviteDialog.getByLabel('Email').fill(EMAIL)
  await inviteDialog.getByLabel('Role').selectOption('nurse')
  await inviteDialog.getByLabel('Branch').selectOption({ label: `${SUNRISE} · ${MAIN}` })
  await inviteDialog.getByRole('button', { name: 'Send invitation' }).click()
  await expect(banner(admin, 'Invitation sent')).toBeVisible()
  await expect(inviteDialog).toHaveCount(0)
  const row = admin.getByRole('row').filter({ hasText: EMAIL })
  await expect(row).toContainText('Invited')
  await expect(row).toContainText(MAIN)

  // The nurse opens the link in a fresh browser context.
  const invitee = await (await browser.newContext()).newPage()
  await invitee.goto(await passwordLinkFor(EMAIL, 'invite', invitedAt))
  await expect(invitee.getByRole('heading', { level: 1, name: 'Welcome to ShiftPatch' })).toBeVisible()
  expect(new URL(invitee.url()).hash).toBe('')
  await invitee.getByLabel('Password', { exact: true }).fill('first password e2e')
  await invitee.getByLabel('Confirm password').fill('first password e2e')
  await invitee.getByRole('button', { name: 'Set password and sign in' }).click()
  await expect(invitee.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await expect(invitee).toHaveURL(/\/shifts$/)
  await expect(invitee.getByTestId('shift-list-item').first()).toBeVisible()

  // A fresh admin session (the token is in memory only; no reload) shows the account as active.
  const adminAgain = await signIn(browser, ACCOUNTS.admin)
  await openScreen(adminAgain, 'Users')
  await expect(adminAgain.getByRole('row').filter({ hasText: EMAIL })).toContainText('Active')

  // Sign out, then recover the password from the sign-in page.
  await invitee.getByRole('button', { name: 'Sign Out' }).click()
  await expect(invitee.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  const recoveredAt = Date.now() - 1000
  await invitee.getByRole('button', { name: 'Forgot your password?' }).click()
  await invitee.getByLabel('Email').fill(EMAIL)
  await invitee.getByRole('button', { name: 'Email me a link' }).click()
  await expect(invitee.getByText('Check your email')).toBeVisible()

  await invitee.goto(await passwordLinkFor(EMAIL, 'recovery', recoveredAt))
  await expect(invitee.getByRole('heading', { level: 1, name: 'Choose a new password' })).toBeVisible()
  await invitee.getByLabel('New password').fill('second password e2e')
  await invitee.getByLabel('Confirm password').fill('second password e2e')
  await invitee.getByRole('button', { name: 'Save new password' }).click()
  await expect(invitee.getByRole('navigation', { name: 'Main' })).toBeVisible()

  // The new password works for a normal sign-in; the old one does not.
  await invitee.getByRole('button', { name: 'Sign Out' }).click()
  await expect(invitee.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  await invitee.getByTestId('login-email-input').fill(EMAIL)
  await invitee.getByTestId('login-password-input').fill('first password e2e')
  await invitee.getByTestId('login-submit-button').click()
  await expect(invitee.getByRole('alert')).toContainText('Invalid email or password')
  await invitee.getByTestId('login-password-input').fill('second password e2e')
  await invitee.getByTestId('login-submit-button').click()
  await expect(invitee.getByRole('navigation', { name: 'Main' })).toBeVisible()
})

test('an admin deletes a user who has no history after confirming, and cannot delete themselves', async ({
  browser,
}) => {
  const admin = await signIn(browser, ACCOUNTS.admin)
  await openScreen(admin, 'Users')
  const row = admin.getByRole('row').filter({ hasText: EMAIL })
  await expect(row).toBeVisible()
  await expect(
    admin
      .getByRole('row')
      .filter({ hasText: ACCOUNTS.admin })
      .getByRole('button', { name: /^Delete/ }),
  ).toHaveCount(0)

  await row.getByRole('button', { name: 'Delete E2E Nurse' }).click()
  const dialog = admin.getByRole('dialog', { name: 'Delete E2E Nurse?' })
  await expect(dialog).toContainText(EMAIL)
  await dialog.getByRole('button', { name: 'Delete user' }).click()
  await expect(banner(admin, 'User deleted')).toBeVisible()
  await expect(row).toHaveCount(0)

  // The deleted account can no longer sign in.
  const gone = await (await browser.newContext()).newPage()
  await gone.goto('/')
  await gone.getByTestId('login-email-input').fill(EMAIL)
  await gone.getByTestId('login-password-input').fill('second password e2e')
  await gone.getByTestId('login-submit-button').click()
  await expect(gone.getByRole('alert')).toBeVisible()
})
