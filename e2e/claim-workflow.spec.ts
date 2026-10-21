import { expect, test } from '@playwright/test'
import { ACCOUNTS, AVA, DOWNTOWN, createShift, futureSlot, openScreen, signIn } from './support.ts'

/**
 * The vertical slice through the real UI, BFF and database: an agency posts a
 * shift, an eligible nurse claims it, sees it in My Shifts, and the agency
 * view shows the assigned nurse. Runs on the freshly reset local database.
 */
test('nurse claims an eligible open shift and the agency sees the assignment', async ({ browser }) => {
  const title = 'E2E Claim — Day'

  const agency = await signIn(browser, ACCOUNTS.northwind)
  await expect(agency).toHaveURL(/\/agency\/shifts$/)
  await createShift(agency, DOWNTOWN, title, futureSlot(30))
  await expect(agency.getByText('Shift created')).toBeVisible()

  const nurse = await signIn(browser, ACCOUNTS.ava)
  await expect(nurse).toHaveURL(/\/shifts$/)
  const card = nurse.getByRole('listitem').filter({ hasText: title })
  await expect(card).toBeVisible()
  await expect(card).toContainText(DOWNTOWN)

  await card.getByRole('button', { name: /^Claim / }).click()
  const dialog = nurse.getByRole('dialog', { name: 'Claim This Shift?' })
  await expect(dialog).toContainText(title)
  await dialog.getByRole('button', { name: 'Confirm Claim' }).click()
  await expect(nurse.getByText('Shift claimed')).toBeVisible()
  await expect(nurse.getByRole('listitem').filter({ hasText: title })).toHaveCount(0)

  await openScreen(nurse, 'My Shifts')
  await expect(nurse).toHaveURL(/\/my-shifts$/)
  const upcoming = nurse.getByRole('region', { name: /Upcoming/ })
  await expect(upcoming.getByRole('listitem').filter({ hasText: title })).toContainText('Claimed')

  await agency.reload()
  const row = agency.getByRole('row').filter({ hasText: title })
  await expect(row).toContainText('Claimed')
  await expect(row).toContainText(AVA)
  await row.getByRole('button', { name: 'History' }).click()
  const history = agency.getByTestId('shift-history')
  await expect(history).toContainText('Created')
  await expect(history).toContainText(`Claimed by ${AVA}`)
})
