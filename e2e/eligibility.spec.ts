import { expect, test } from '@playwright/test'
import { resetSeed } from './reset.ts'
import { ACCOUNTS, MAIN, banner, futureSlot, openScreen, postShift, signIn, uniqueName } from './support.ts'

test.beforeAll(() => resetSeed())

/** Agency users control who may claim at each branch; the marketplace still lists every shift. */
test('suspending a nurse at a branch blocks her claims there until she is activated again', async ({ browser }) => {
  const role = uniqueName('RN eligibility')
  const agency = await signIn(browser, ACCOUNTS.sunrise)
  await postShift(agency, role, futureSlot(40))

  await openScreen(agency, 'Nurses')
  await expect(agency).toHaveURL(/\/agency\/nurses$/)
  await agency.getByRole('button', { name: `Suspend Maria Lopez at ${MAIN}` }).click()
  await expect(banner(agency, 'Nurse suspended')).toBeVisible()

  const nurse = await signIn(browser, ACCOUNTS.maria)
  const card = nurse.getByTestId('shift-list-item').filter({ hasText: role })
  await expect(card).toBeVisible()
  await card.getByTestId('shift-claim-button').click()
  await expect(banner(nurse, 'Shift not claimed')).toContainText('not active at this branch')
  await expect(card).toBeVisible()

  await agency.getByRole('button', { name: `Activate Maria Lopez at ${MAIN}` }).click()
  await expect(banner(agency, 'Nurse activated')).toBeVisible()

  await card.getByTestId('shift-claim-button').click()
  await expect(banner(nurse, 'Shift claimed')).toBeVisible()
  await expect(card).toHaveCount(0)
})
