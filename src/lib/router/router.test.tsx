// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { navigate, setSearchParams, useLocation } from './router.ts'

function LocationProbe() {
  const { pathname, search } = useLocation()
  return <p>{pathname}{search.toString() && `?${search}`}</p>
}

it('updates subscribed routes and drops empty search values', () => {
  window.history.replaceState(null, '', '/')
  render(<LocationProbe />)
  act(() => navigate('/admin/shifts'))
  expect(screen.getByText('/admin/shifts')).toBeTruthy()
  act(() => setSearchParams({ status: 'open', agency: '' }))
  expect(screen.getByText('/admin/shifts?status=open')).toBeTruthy()
})
