import { expect, type Browser, type Locator, type Page } from '@playwright/test'

/** The trial specification's accounts (shiftpatch-api `scripts/seed-data.ts`) and their public password. */
export const PASSWORD = 'Trial2026!'
export const ACCOUNTS = {
  admin: 'alex.kim@example.com',
  sunrise: 'admin@sunrisehealth.example',
  metro: 'admin@metrocare.example',
  maria: 'maria.lopez@example.com',
  james: 'james.cook@example.com',
} as const

export const SUNRISE = 'Sunrise Health Staffing'
export const METRO = 'Metro Care Partners'
export const MAIN = 'Main'

/**
 * Signs in through the sign-in form in a fresh browser context. The bearer
 * token lives only in that page's memory: never reload or `goto` after this,
 * sign in again instead.
 */
export async function signIn(browser: Browser, email: string, password = PASSWORD): Promise<Page> {
  const page = await (await browser.newContext()).newPage()
  await page.goto('/')
  await page.getByTestId('login-email-input').fill(email)
  await page.getByTestId('login-password-input').fill(password)
  await page.getByTestId('login-submit-button').click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  return page
}

export async function openScreen(page: Page, link: string) {
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link }).click()
}

/** The notification banner carrying `text` (banners stack; the test id is shared by successes and errors). */
export function banner(page: Page, text: string | RegExp): Locator {
  return page.getByTestId('notification-banner').filter({ hasText: text })
}

/** A future slot (days ahead, afternoon) that never overlaps another spec's shift. */
export function futureSlot(daysAhead: number, hour = 13) {
  const day = new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: day, start: `${pad(hour)}:00`, end: `${pad(hour + 4)}:00` }
}

/** A name that cannot collide with the seed or with another run. */
export const uniqueName = (prefix: string) => `${prefix} ${Date.now().toString(36)}`

/** Posts a shift from the agency screen through the dialog (the required test ids). */
export async function postShift(agency: Page, role: string, slot: ReturnType<typeof futureSlot>) {
  await agency.getByTestId('agency-post-shift-button').click()
  const dialog = agency.getByRole('dialog', { name: 'Post a shift' })
  await dialog.getByLabel('Role').fill(role)
  await dialog.getByLabel('Date').fill(slot.date)
  await dialog.getByLabel('Start').fill(slot.start)
  await dialog.getByLabel('End').fill(slot.end)
  await agency.getByTestId('agency-post-shift-submit-button').click()
  await expect(banner(agency, 'Shift posted')).toBeVisible()
  await expect(dialog).toHaveCount(0)
}

interface MailpitMessage {
  ID: string
  To: { Address: string }[]
  Created: string
}

/**
 * The set-password link (path + fragment) from the newest local Mailpit
 * message to `email` of the given type. Polled because delivery is
 * asynchronous. Links are only ever read from the local mail catcher.
 */
export async function passwordLinkFor(email: string, type: 'invite' | 'recovery', notBefore: number): Promise<string> {
  const mailpit = process.env.E2E_MAILPIT_URL
  if (!mailpit) throw new Error('E2E_MAILPIT_URL is set by e2e/global-setup.ts')
  const pattern = new RegExp(
    `/set-password#token_hash=[A-Za-z0-9._~-]+&amp;type=${type}|/set-password#token_hash=[A-Za-z0-9._~-]+&type=${type}`,
  )
  for (let attempt = 0; attempt < 40; attempt++) {
    const list = (await (await fetch(`${mailpit}/api/v1/messages?limit=50`)).json()) as { messages: MailpitMessage[] }
    const candidates = list.messages.filter(
      (m) => m.To.some((to) => to.Address.toLowerCase() === email.toLowerCase()) && Date.parse(m.Created) >= notBefore,
    )
    for (const candidate of candidates) {
      const message = (await (await fetch(`${mailpit}/api/v1/message/${candidate.ID}`)).json()) as {
        HTML: string
        Text: string
      }
      const match = pattern.exec(message.HTML) ?? pattern.exec(message.Text)
      if (match) return match[0].replace('&amp;', '&')
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No ${type} email for ${email} arrived in the local Mailpit`)
}
