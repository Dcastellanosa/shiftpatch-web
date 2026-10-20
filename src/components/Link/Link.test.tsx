// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { Link } from './Link.tsx'

it('renders a real link and navigates on a plain click', async () => {
  window.history.replaceState(null, '', '/')
  const { container } = render(<Link to="/shifts">Available Shifts</Link>)
  expect(container.firstChild).toMatchSnapshot()
  await userEvent.click(screen.getByRole('link', { name: 'Available Shifts' }))
  expect(window.location.pathname).toBe('/shifts')
})
