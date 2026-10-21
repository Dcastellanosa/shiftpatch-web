import { expect, type Browser, type Page } from '@playwright/test'

/** Seeded accounts (shiftpatch-api `scripts/seed-data.ts`). The password is generated per run by global-setup. */
export const ACCOUNTS = {
  admin: 'admin@shiftpatch.test',
  northwind: 'agency.northwind@shiftpatch.test',
  ava: 'nurse.ava@shiftpatch.test',
} as const

export const AVA = 'Ava Thompson'
export const DOWNTOWN = 'Downtown Clinic'

export function seededPassword(): string {
  const password = process.env.E2E_SEED_PASSWORD
  if (!password) throw new Error('E2E_SEED_PASSWORD is set by e2e/global-setup.ts; run the suite through `pnpm test:e2e`')
  return password
}

export async function signIn(browser: Browser, email: string, password = seededPassword()): Promise<Page> {
  const page = await (await browser.newContext()).newPage()
  await page.goto('/')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  return page
}

export async function openScreen(page: Page, link: string) {
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link }).click()
}

/** A future slot (days ahead, afternoon) that never overlaps another spec's shift. */
export function futureSlot(daysAhead: number, hour = 13) {
  const day = new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: day, start: `${pad(hour)}:00`, end: `${pad(hour + 4)}:00` }
}

export async function createShift(agency: Page, branch: string, title: string, slot: ReturnType<typeof futureSlot>) {
  await agency.getByLabel('Branch').selectOption({ label: branch })
  await agency.getByLabel('Title').fill(title)
  await agency.getByLabel('Date').fill(slot.date)
  await agency.getByLabel('Start').fill(slot.start)
  await agency.getByLabel('End').fill(slot.end)
  await agency.getByRole('button', { name: 'Create Shift' }).click()
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
  const pattern = new RegExp(`/set-password#token_hash=[A-Za-z0-9._~-]+&amp;type=${type}|/set-password#token_hash=[A-Za-z0-9._~-]+&type=${type}`)
  for (let attempt = 0; attempt < 40; attempt++) {
    const list = (await (await fetch(`${mailpit}/api/v1/messages?limit=50`)).json()) as { messages: MailpitMessage[] }
    const candidates = list.messages.filter(
      (m) => m.To.some((to) => to.Address.toLowerCase() === email.toLowerCase()) && Date.parse(m.Created) >= notBefore,
    )
    for (const candidate of candidates) {
      const message = (await (await fetch(`${mailpit}/api/v1/message/${candidate.ID}`)).json()) as { HTML: string; Text: string }
      const match = pattern.exec(message.HTML) ?? pattern.exec(message.Text)
      if (match) return match[0].replace('&amp;', '&')
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No ${type} email for ${email} arrived in the local Mailpit`)
}
