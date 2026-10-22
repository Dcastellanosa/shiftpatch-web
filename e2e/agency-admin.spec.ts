import { expect, test } from '@playwright/test'
import { resetSeed } from './reset.ts'
import { ACCOUNTS, SUNRISE, banner, openScreen, signIn, uniqueName } from './support.ts'

test.beforeAll(() => resetSeed())

/**
 * Admin agency management on entities this test creates: an agency and a
 * branch, their status, deletion, and the refusal to delete an agency with
 * shift history (Sunrise).
 */
test('admin creates an agency with a branch and controls their status', async ({ browser }) => {
  const agencyName = uniqueName('E2E Summit Nursing')
  const branchName = uniqueName('E2E Uptown Clinic')
  const admin = await signIn(browser, ACCOUNTS.admin)
  await openScreen(admin, 'Agencies')
  await expect(admin).toHaveURL(/\/admin\/agencies$/)

  await admin.getByRole('button', { name: 'New agency' }).click()
  const createDialog = admin.getByRole('dialog', { name: 'New agency' })
  await createDialog.getByLabel('Name').fill(agencyName)
  await createDialog.getByRole('button', { name: 'Create agency' }).click()
  await expect(banner(admin, 'Agency created')).toBeVisible()
  await expect(createDialog).toHaveCount(0)
  await admin.getByRole('link', { name: agencyName }).click()
  await expect(admin.getByRole('heading', { level: 1, name: agencyName })).toBeVisible()

  await admin.getByLabel('Branch name').fill(branchName)
  await admin.getByLabel('Address').fill('1 Up Street')
  await admin.getByLabel('Time zone').selectOption('America/Chicago')
  await admin.getByRole('button', { name: 'Create branch' }).click()
  await expect(banner(admin, 'Branch created')).toBeVisible()
  const branchRow = admin.getByRole('row').filter({ hasText: branchName })
  await expect(branchRow).toContainText('Active')

  await branchRow.getByRole('button', { name: 'Deactivate' }).click()
  await admin
    .getByRole('dialog', { name: `Deactivate ${branchName}?` })
    .getByRole('button', { name: 'Deactivate' })
    .click()
  await expect(banner(admin, 'Branch deactivated')).toBeVisible()
  await expect(branchRow).toContainText('Inactive')
  await branchRow.getByRole('button', { name: 'Activate' }).click()
  await admin
    .getByRole('dialog', { name: `Activate ${branchName}?` })
    .getByRole('button', { name: 'Activate' })
    .click()
  await expect(branchRow).toContainText('Active')

  await admin.getByRole('button', { name: 'Deactivate' }).first().click()
  await admin
    .getByRole('dialog', { name: `Deactivate ${agencyName}?` })
    .getByRole('button', { name: 'Deactivate' })
    .click()
  await expect(admin.getByText('This agency is inactive')).toBeVisible()
  await expect(admin.getByLabel('Branch name')).toHaveCount(0)
  await admin.getByRole('button', { name: 'Activate' }).first().click()
  await admin
    .getByRole('dialog', { name: `Activate ${agencyName}?` })
    .getByRole('button', { name: 'Activate' })
    .click()
  await expect(admin.getByText('This agency is inactive')).toHaveCount(0)

  await openScreen(admin, 'Agencies')
  const agencyRow = admin.getByRole('row').filter({ hasText: agencyName })
  await expect(agencyRow).toContainText('Active')
  await expect(agencyRow).toContainText('1')

  // Deletion asks for confirmation; the agency never had shifts, so it goes away.
  await agencyRow.getByRole('button', { name: `Delete ${agencyName}` }).click()
  const deleteDialog = admin.getByRole('dialog', { name: `Delete ${agencyName}?` })
  await expect(deleteDialog).toContainText('cannot be undone')
  await deleteDialog.getByRole('button', { name: 'Delete agency' }).click()
  await expect(banner(admin, 'Agency deleted')).toBeVisible()
  await expect(agencyRow).toHaveCount(0)

  // An agency with shifts is refused, with the reason.
  await admin.getByRole('button', { name: `Delete ${SUNRISE}` }).click()
  await admin
    .getByRole('dialog', { name: `Delete ${SUNRISE}?` })
    .getByRole('button', { name: 'Delete agency' })
    .click()
  await expect(banner(admin, 'Agency not deleted')).toBeVisible()
  await expect(admin.getByRole('link', { name: SUNRISE })).toBeVisible()
})
