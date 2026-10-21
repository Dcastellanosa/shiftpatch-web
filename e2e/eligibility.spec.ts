import { expect, test } from '@playwright/test'
import { ACCOUNTS, AVA, DOWNTOWN, openScreen, signIn } from './support.ts'

/** Agency users control which nurses see each branch's open shifts. */
test('suspending a nurse at a branch hides its open shifts until she is activated again', async ({ browser }) => {
  const nurse = await signIn(browser, ACCOUNTS.ava)
  await expect(nurse.getByRole('listitem').filter({ hasText: DOWNTOWN }).first()).toBeVisible()

  const agency = await signIn(browser, ACCOUNTS.northwind)
  await openScreen(agency, 'Nurses')
  await expect(agency).toHaveURL(/\/agency\/nurses$/)
  await agency.getByRole('button', { name: `Suspend ${AVA} at ${DOWNTOWN}` }).click()
  await expect(agency.getByText('Nurse suspended')).toBeVisible()
  await expect(agency.getByRole('button', { name: `Activate ${AVA} at ${DOWNTOWN}` })).toBeVisible()

  await nurse.reload()
  await expect(nurse.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await expect(nurse.getByRole('listitem').filter({ hasText: DOWNTOWN })).toHaveCount(0)

  await agency.getByRole('button', { name: `Activate ${AVA} at ${DOWNTOWN}` }).click()
  await expect(agency.getByText('Nurse activated')).toBeVisible()

  await nurse.reload()
  await expect(nurse.getByRole('listitem').filter({ hasText: DOWNTOWN }).first()).toBeVisible()
})
