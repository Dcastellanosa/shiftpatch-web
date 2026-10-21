// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClaimDialog } from './index.ts'
import { json, makeShift, stubApi } from '../../../tests/fake-api.ts'

const SHIFT = makeShift()
const CLAIM = `POST /api/shifts/${SHIFT.id}/claim`

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderDialog() {
  const onClaimed = vi.fn()
  const onClose = vi.fn()
  const { container } = render(<ClaimDialog shift={SHIFT} onClaimed={onClaimed} onClose={onClose} />)
  return { onClaimed, onClose, container }
}

describe('ClaimDialog', () => {
  it('summarises the shift and asks for confirmation', () => {
    stubApi({})
    const { container } = renderDialog()
    expect(screen.getByRole('dialog', { name: 'Claim This Shift?' })).toBeTruthy()
    expect(screen.getByText('Med-Surg RN — Day')).toBeTruthy()
    expect(screen.getByText(/Downtown Clinic · Northwind Care Staffing/)).toBeTruthy()
    const snapshot = container.firstElementChild!.cloneNode(true) as HTMLElement
    const title = snapshot.querySelector('h2')!
    const dialog = snapshot.querySelector('[role="dialog"]')!
    title.id = 'dialog-title'
    dialog.setAttribute('aria-labelledby', 'dialog-title')
    expect(snapshot).toMatchSnapshot()
  })

  it('claims through POST /api/shifts/:id/claim and reports success', async () => {
    const claimed = makeShift({ status: 'claimed', assignedNurse: { id: 'u-nurse', fullName: 'Ava Thompson' } })
    const fetchMock = stubApi({ [CLAIM]: () => json(200, { shift: claimed }) })
    const { onClaimed } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm Claim' }))

    expect(onClaimed).toHaveBeenCalledWith(claimed)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`/api/shifts/${SHIFT.id}/claim`)
    expect(init?.method).toBe('POST')
    expect(init?.credentials).toBe('include')
    expect(init?.body).toBeUndefined()
  })

  it.each([
    [422, 'credential_expired', 'A required credential has expired'],
    [422, 'credential_missing', 'A required credential is missing'],
    [422, 'eligibility_inactive', 'You are not active at this branch'],
    [409, 'shift_not_open', 'This shift was already claimed'],
    [409, 'schedule_conflict', 'This overlaps a shift you already have'],
  ])('explains a %i %s failure', async (status, code, title) => {
    stubApi({ [CLAIM]: () => json(status, { error: { code, message: 'server message' } }) })
    const { onClaimed, onClose } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm Claim' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(title)
    expect(onClaimed).not.toHaveBeenCalled()
    // Rule failures cannot be retried; the nurse can only close the dialog.
    expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ code }))
  })

  it('offers a retry after a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Claim' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Check your connection')
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
  })

  it('closes on Escape', async () => {
    stubApi({})
    const { onClose } = renderDialog()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledWith(null)
  })
})
