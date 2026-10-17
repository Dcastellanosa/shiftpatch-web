import { expect, test, type Browser, type Page } from '@playwright/test'

/**
 * The vertical slice through the real UI, BFF and database:
 * an agency posts a shift, an eligible nurse claims it, sees it in My Shifts,
 * and the agency view shows the assigned nurse.
 *
 * Uses the seeded accounts (shiftpatch-api `pnpm seed`). The password comes
 * from E2E_PASSWORD (the seed's SEED_USER_PASSWORD); it is never hardcoded.
 */

const password = process.env.E2E_PASSWORD
const nurseEmail = process.env.E2E_NURSE_EMAIL ?? 'nurse.ava@shiftpatch.test'
const nurseName = process.env.E2E_NURSE_NAME ?? 'Ava Thompson'
const agencyEmail = process.env.E2E_AGENCY_EMAIL ?? 'agency.northwind@shiftpatch.test'
const branchName = process.env.E2E_BRANCH ?? 'Downtown Clinic'

test.skip(!password, 'Set E2E_PASSWORD to the seeded accounts’ password to run the end-to-end flow')

async function signIn(browser: Browser, email: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage()
  await page.goto('/')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  return page
}

/** A future date unlikely to collide with earlier runs’ claims (no overlapping-shift conflict). */
function uniqueSlot() {
  const run = Math.floor(Date.now() / 1000)
  const day = new Date(Date.now() + (45 + (run % 600)) * 86_400_000).toISOString().slice(0, 10)
  const hour = 6 + (run % 12)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: day, start: `${pad(hour)}:00`, end: `${pad(hour + 2)}:00` }
}

test('nurse claims an eligible open shift and the agency sees the assignment', async ({ browser }) => {
  const title = `E2E Claim ${Date.now()}`
  const slot = uniqueSlot()

  // Agency posts an open shift at a branch where the nurse is eligible.
  const agency = await signIn(browser, agencyEmail)
  await expect(agency).toHaveURL(/\/agency\/shifts$/)
  await agency.getByLabel('Branch').selectOption({ label: branchName })
  await agency.getByLabel('Title').fill(title)
  await agency.getByLabel('Date').fill(slot.date)
  await agency.getByLabel('Start').fill(slot.start)
  await agency.getByLabel('End').fill(slot.end)
  await agency.getByRole('button', { name: 'Create Shift' }).click()
  await expect(agency.getByText('Shift created')).toBeVisible()

  // Nurse signs in and sees the eligible open shift.
  const nurse = await signIn(browser, nurseEmail)
  await expect(nurse).toHaveURL(/\/shifts$/)
  const card = nurse.getByRole('listitem').filter({ hasText: title })
  await expect(card).toBeVisible()
  await expect(card).toContainText(branchName)

  // Nurse claims it.
  await card.getByRole('button', { name: /^Claim / }).click()
  const dialog = nurse.getByRole('dialog', { name: 'Claim This Shift?' })
  await expect(dialog).toContainText(title)
  await dialog.getByRole('button', { name: 'Confirm Claim' }).click()
  await expect(nurse.getByText('Shift claimed')).toBeVisible()
  await expect(nurse.getByRole('listitem').filter({ hasText: title })).toHaveCount(0)

  // It appears in My Shifts.
  await nurse.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My Shifts' }).click()
  await expect(nurse).toHaveURL(/\/my-shifts$/)
  const upcoming = nurse.getByRole('region', { name: /Upcoming/ })
  await expect(upcoming.getByRole('listitem').filter({ hasText: title })).toContainText('Claimed')

  // The agency view reflects the assigned nurse and the history.
  await agency.reload()
  const row = agency.getByRole('row').filter({ hasText: title })
  await expect(row).toContainText('Claimed')
  await expect(row).toContainText(nurseName)
  await row.getByRole('button', { name: 'History' }).click()
  const history = agency.locator('.timeline')
  await expect(history).toContainText('Created')
  await expect(history).toContainText(`Claimed by ${nurseName}`)
})
