// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './index.ts'

afterEach(() => vi.restoreAllMocks())

function Broken(): never {
  throw new Error('secret internal detail')
}

it('renders children when nothing fails', () => {
  render(
    <ErrorBoundary>
      <p>All good</p>
    </ErrorBoundary>,
  )
  expect(screen.getByText('All good')).toBeTruthy()
})

it('replaces a crashed tree with fixed copy that hides the error', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const { container } = render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  )
  expect(screen.getByRole('alert').textContent).toContain('Something went wrong')
  expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy()
  expect(container.textContent).not.toContain('secret internal detail')
})
