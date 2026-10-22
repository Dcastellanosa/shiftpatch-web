// @vitest-environment jsdom
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { Toaster } from './index.ts'

afterEach(() => vi.useRealTimers())

it('announces toasts politely, with their link, and lets the user dismiss them', async () => {
  const { container } = renderWithProviders(<Toaster />)
  const region = screen.getByRole('status')
  expect(region.getAttribute('aria-live')).toBe('polite')

  act(() => {
    useUiStore.getState().pushToast({
      kind: 'success',
      title: 'Shift claimed',
      body: 'Med-Surg RN — Day at Downtown Clinic is now yours.',
      link: { to: '/my-shifts', label: 'View My Shifts' },
    })
  })
  expect(screen.getByText('Shift claimed')).toBeTruthy()
  expect(screen.getByTestId('notification-banner').textContent).toContain('Shift claimed')
  expect(screen.getByRole('link', { name: 'View My Shifts' }).getAttribute('href')).toBe('/my-shifts')
  expect(container.firstChild).toMatchSnapshot()

  await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
  expect(screen.queryByText('Shift claimed')).toBeNull()
  expect(useUiStore.getState().toasts).toEqual([])
})

it('auto-dismisses no sooner than 8 seconds', () => {
  vi.useFakeTimers()
  renderWithProviders(<Toaster />)
  act(() => {
    useUiStore.getState().pushToast({ kind: 'success', title: 'Shift created' })
    useUiStore.getState().pushToast({ kind: 'error', title: 'Credential expired, cannot claim shift' })
  })
  expect(screen.getAllByTestId('notification-banner')).toHaveLength(2)
  act(() => vi.advanceTimersByTime(7_999))
  expect(screen.getByText('Shift created')).toBeTruthy()
  act(() => vi.advanceTimersByTime(1))
  expect(screen.queryByText('Shift created')).toBeNull()
})
