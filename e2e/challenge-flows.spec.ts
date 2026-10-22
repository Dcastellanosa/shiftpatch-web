import { expect, test } from '@playwright/test'
import { resetSeed } from './reset.ts'
import { ACCOUNTS, METRO, SUNRISE, banner, futureSlot, openScreen, postShift, signIn } from './support.ts'

/**
 * The challenge baseline, driven only by the specification's test ids, on the
 * exact sample data: nurse marketplace and claim (Maria), the expired-licence
 * refusal (James), agency post and no-show cancellation (Sunrise), a nurse's
 * advance cancellation, the credential upload, and the admin's shift table,
 * audit log and timesheets.
 */
test.describe.configure({ mode: 'serial' })
test.beforeAll(() => resetSeed())

const CNA_SLOT = futureSlot(30)

test('Sunrise posts a shift from the dialog and sees it in its own list', async ({ browser }) => {
  const agency = await signIn(browser, ACCOUNTS.sunrise)
  await expect(agency).toHaveURL(/\/agency\/shifts$/)
  // The seeded shifts of agency-a, with shift-2 filled by Maria.
  await expect(agency.getByRole('row').filter({ hasText: 'LPN' })).toContainText('nurse-1')
  await expect(agency.getByRole('row').filter({ hasText: 'LPN' })).toContainText('Filled')

  await postShift(agency, 'CNA', CNA_SLOT)
  const row = agency.getByRole('row').filter({ hasText: 'CNA' })
  await expect(row).toContainText('Open')
  await expect(row).toContainText('Unassigned')
})

test('Maria browses both agencies, claims shift-1 in one click, then releases the new shift in advance', async ({
  browser,
}) => {
  const nurse = await signIn(browser, ACCOUNTS.maria)
  await expect(nurse).toHaveURL(/\/shifts$/)
  const cards = nurse.getByTestId('shift-list-item')
  // Open shifts only, from both agencies: shift-1 (Sunrise), shift-3 (Metro) and the CNA shift.
  await expect(cards).toHaveCount(3)
  await expect(cards.filter({ hasText: METRO })).toHaveCount(1)

  const shift1 = cards.filter({ hasText: SUNRISE }).filter({ hasText: 'Fri, Oct 2, 2026' })
  await expect(shift1).toContainText('19:00 – 07:00 (next day)')
  await shift1.getByTestId('shift-claim-button').click()
  await expect(banner(nurse, 'Shift claimed')).toBeVisible()
  await expect(cards).toHaveCount(2)

  const cna = cards.filter({ hasText: 'CNA' })
  await cna.getByTestId('shift-claim-button').click()
  await expect(banner(nurse, 'Shift claimed')).toHaveCount(2)
  await expect(cards).toHaveCount(1)

  await openScreen(nurse, 'My Shifts')
  const upcoming = nurse.getByRole('region', { name: /Upcoming/ })
  const held = upcoming.getByRole('listitem').filter({ hasText: 'CNA' })
  await expect(held).toContainText('Filled')
  await held.getByTestId('shift-cancel-button').click()
  await expect(banner(nurse, 'Shift reopened')).toBeVisible()
  await expect(upcoming.getByRole('listitem').filter({ hasText: 'CNA' })).toHaveCount(0)
  // shift-1 is dated, so it sits under Past.
  await expect(
    nurse.getByRole('region', { name: /Past/ }).getByRole('listitem').filter({ hasText: 'RN' }),
  ).toContainText('Filled')
})

test('James is refused with the contract message because his licence expired', async ({ browser }) => {
  const nurse = await signIn(browser, ACCOUNTS.james)
  const metro = nurse.getByTestId('shift-list-item').filter({ hasText: METRO })
  await expect(metro).toHaveCount(1)
  await metro.getByTestId('shift-claim-button').click()
  await expect(banner(nurse, 'Credential expired, cannot claim shift')).toBeVisible()
  await expect(metro).toHaveCount(1)
})

test('Sunrise reports a no-show on shift-2 and the shift reopens with its history', async ({ browser }) => {
  const agency = await signIn(browser, ACCOUNTS.sunrise)
  const row = agency.getByRole('row').filter({ hasText: 'LPN' })
  await expect(row).toContainText('Filled')
  await row.getByLabel('Cancellation reason').selectOption('no-show')
  await row.getByTestId('shift-cancel-button').click()
  await expect(banner(agency, 'Shift reopened')).toBeVisible()
  await expect(row).toContainText('Open')
  await expect(row).toContainText('Unassigned')
  await expect(row.getByTestId('shift-cancel-button')).toHaveCount(0)

  await row.getByRole('button', { name: 'History' }).click()
  await expect(agency.getByTestId('shift-history')).toContainText('Marked no-show')
})

test('Maria uploads a credential with its expiry date through the API', async ({ browser }) => {
  const nurse = await signIn(browser, ACCOUNTS.maria)
  await openScreen(nurse, 'Credentials')
  await expect(nurse).toHaveURL(/\/credentials$/)
  await nurse.getByTestId('credential-upload-input').setInputFiles({
    name: 'licence.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'),
  })
  await nurse.getByTestId('credential-expiry-date-input').fill('2028-01-01')
  await nurse.getByRole('button', { name: 'Upload credential' }).click()
  await expect(banner(nurse, 'Credential uploaded')).toBeVisible()
  const row = nurse.getByTestId('credentials-table').getByRole('row').filter({ hasText: 'Nursing licence' })
  await expect(row).toContainText('licence.pdf')
  await expect(row).toContainText('Valid')
})

test('Alex sees the reporting table with badges, the audit log and the timesheets', async ({ browser }) => {
  const admin = await signIn(browser, ACCOUNTS.admin)
  await expect(admin).toHaveURL(/\/admin\/shifts$/)
  await expect(admin.getByTestId('admin-dashboard-shift-table')).toBeVisible()
  const badges = admin.getByTestId('admin-shift-status-badge')
  await expect(badges).toHaveCount(4)
  await expect(badges.filter({ hasText: 'Filled' })).toHaveCount(1)
  await expect(badges.filter({ hasText: 'Open' })).toHaveCount(3)

  await openScreen(admin, 'Audit Log')
  const log = admin.getByTestId('audit-log-table')
  await expect(log).toBeVisible()
  await expect(log).toContainText('Maria Lopez')
  await expect(log.getByRole('row').filter({ hasText: 'No-show' })).toContainText('shift-2')

  await openScreen(admin, 'Timesheets')
  const timesheet = admin.getByTestId('timesheet-table')
  await expect(timesheet).toBeVisible()
  const held = timesheet.getByRole('row').filter({ hasText: 'Maria Lopez' })
  await expect(held).toContainText(SUNRISE)
  await expect(held).toContainText('19:00 – 07:00 (next day)')
  await expect(held).toContainText('12')
})
