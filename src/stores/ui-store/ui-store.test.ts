import { beforeEach, expect, it } from 'vitest'
import { useUiStore } from './index.ts'

beforeEach(() => useUiStore.setState({ toasts: [] }))

it('queues and dismisses toasts in order', () => {
  const { pushToast, dismissToast } = useUiStore.getState()
  const first = pushToast({ kind: 'success', title: 'Shift claimed', body: 'Med-Surg RN at Downtown Clinic is now yours.', link: { to: '/my-shifts', label: 'View My Shifts' } })
  const second = pushToast({ kind: 'error', title: 'Could not refresh' })
  expect(useUiStore.getState().toasts.map((toast) => toast.title)).toEqual(['Shift claimed', 'Could not refresh'])
  expect(first).not.toBe(second)

  dismissToast(first)
  expect(useUiStore.getState().toasts.map((toast) => toast.id)).toEqual([second])
})

it('holds only the notification queue, never server state', () => {
  useUiStore.getState().pushToast({ kind: 'success', title: 'Shift created', body: 'Night RN at Downtown Clinic is open for eligible nurses.' })
  const state = useUiStore.getState()
  expect(Object.keys(state).sort()).toEqual(['dismissToast', 'pushToast', 'toasts'])
  for (const toast of state.toasts) {
    expect(Object.keys(toast).every((key) => ['id', 'kind', 'title', 'body', 'link'].includes(key))).toBe(true)
    for (const value of Object.values(toast)) {
      if (typeof value === 'object') expect(Object.values(value).every((v) => typeof v === 'string')).toBe(true)
      else expect(typeof value).toBe('string')
    }
  }
})
