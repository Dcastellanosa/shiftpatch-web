// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { EmptyState } from './EmptyState.tsx'

it('renders a title and guidance', () => {
  const { container } = render(<EmptyState title="No open shifts">Check back later.</EmptyState>)
  expect(container.firstChild).toMatchSnapshot()
})
