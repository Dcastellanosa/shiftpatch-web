import { expect, test } from '@playwright/test'
import { ACCOUNTS, DOWNTOWN, createShift, futureSlot, openScreen, signIn } from './support.ts'

/**
 * Admin agency management: create an agency and a branch, deactivate and
 * reactivate both, and verify that an inactive branch cannot take shifts.
 */
test('admin creates an agency with a branch and controls their status', async ({ browser }) => {
  const admin = await signIn(browser, ACCOUNTS.admin)
  await openScreen(admin, 'Agencies')
  await expect(admin).toHaveURL(/\/admin\/agencies$/)

  await admin.getByLabel('Name').fill('E2E Summit Nursing')
  await admin.getByRole('button', { name: 'Create agency' }).click()
  await expect(admin.getByText('Agency created')).toBeVisible()
  await admin.getByRole('link', { name: 'E2E Summit Nursing' }).click()
  await expect(admin.getByRole('heading', { level: 1, name: 'E2E Summit Nursing' })).toBeVisible()

  await admin.getByLabel('Branch name').fill('E2E Uptown Clinic')
  await admin.getByLabel('Address').fill('1 Up Street')
  await admin.getByLabel('Time zone').selectOption('America/Chicago')
  await admin.getByRole('button', { name: 'Create branch' }).click()
  await expect(admin.getByText('Branch created')).toBeVisible()
  const branchRow = admin.getByRole('row').filter({ hasText: 'E2E Uptown Clinic' })
  await expect(branchRow).toContainText('Active')

  await branchRow.getByRole('button', { name: 'Deactivate' }).click()
  await admin.getByRole('dialog', { name: 'Deactivate E2E Uptown Clinic?' }).getByRole('button', { name: 'Deactivate' }).click()
  await expect(admin.getByText('Branch deactivated')).toBeVisible()
  await expect(branchRow).toContainText('Inactive')
  await branchRow.getByRole('button', { name: 'Activate' }).click()
  await admin.getByRole('dialog', { name: 'Activate E2E Uptown Clinic?' }).getByRole('button', { name: 'Activate' }).click()
  await expect(branchRow).toContainText('Active')

  await admin.getByRole('button', { name: 'Deactivate' }).first().click()
  await admin.getByRole('dialog', { name: 'Deactivate E2E Summit Nursing?' }).getByRole('button', { name: 'Deactivate' }).click()
  await expect(admin.getByText('This agency is inactive')).toBeVisible()
  await expect(admin.getByLabel('Branch name')).toHaveCount(0)
  await admin.getByRole('button', { name: 'Activate' }).first().click()
  await admin.getByRole('dialog', { name: 'Activate E2E Summit Nursing?' }).getByRole('button', { name: 'Activate' }).click()
  await expect(admin.getByText('This agency is inactive')).toHaveCount(0)

  await openScreen(admin, 'Agencies')
  const agencyRow = admin.getByRole('row').filter({ hasText: 'E2E Summit Nursing' })
  await expect(agencyRow).toContainText('Active')
  await expect(agencyRow).toContainText('1')
})

test('an inactive branch rejects new shifts until it is activated again', async ({ browser }) => {
  const admin = await signIn(browser, ACCOUNTS.admin)
  await admin.goto('/admin/agencies')
  await admin.getByRole('link', { name: 'Northwind Care Staffing' }).click()
  const downtown = admin.getByRole('row').filter({ hasText: DOWNTOWN })
  await downtown.getByRole('button', { name: 'Deactivate' }).click()
  await admin.getByRole('dialog', { name: `Deactivate ${DOWNTOWN}?` }).getByRole('button', { name: 'Deactivate' }).click()
  await expect(downtown).toContainText('Inactive')

  const agency = await signIn(browser, ACCOUNTS.northwind)
  await createShift(agency, DOWNTOWN, 'E2E Rejected — Inactive', futureSlot(31))
  await expect(agency.getByRole('alert')).toContainText(/inactive/i)
  await expect(agency.getByRole('row').filter({ hasText: 'E2E Rejected — Inactive' })).toHaveCount(0)

  await downtown.getByRole('button', { name: 'Activate' }).click()
  await admin.getByRole('dialog', { name: `Activate ${DOWNTOWN}?` }).getByRole('button', { name: 'Activate' }).click()
  await expect(downtown).toContainText('Active')

  await agency.reload()
  await createShift(agency, DOWNTOWN, 'E2E Accepted — Active', futureSlot(32))
  await expect(agency.getByText('Shift created')).toBeVisible()
})
