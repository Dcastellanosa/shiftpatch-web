// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ComingSoonPage } from './index.ts'

it('names the screen and says it is coming soon', () => {
  render(<ComingSoonPage title="Agencies" description="Create agencies and their branches." />)
  expect(screen.getByRole('heading', { level: 1, name: 'Agencies' })).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Agencies' })).toBeTruthy()
  expect(screen.getByText('Coming soon')).toBeTruthy()
})
