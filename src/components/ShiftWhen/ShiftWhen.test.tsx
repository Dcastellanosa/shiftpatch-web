// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { makeShift } from '../../../tests/fake-api.ts'
import { ShiftWhen } from './ShiftWhen.tsx'

it('renders the branch-local date, time and duration', () => {
  const { container } = render(<ShiftWhen shift={makeShift()} />)
  expect(container.firstChild).toMatchSnapshot()
})
