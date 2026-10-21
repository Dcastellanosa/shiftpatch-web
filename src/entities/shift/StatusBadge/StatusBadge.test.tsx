// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ShiftStatus } from '../model/index.ts'
import { StatusBadge } from './index.ts'

it('renders every shift status', () => {
  const statuses: ShiftStatus[] = ['open', 'claimed', 'completed', 'cancelled', 'no_show']
  const { container } = render(
    <>
      {statuses.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </>,
  )
  expect(container).toMatchSnapshot()
})
