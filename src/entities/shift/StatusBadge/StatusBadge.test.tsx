// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ShiftStatus } from '../model/index.ts'
import { StatusBadge } from './index.ts'

it('renders both public shift statuses', () => {
  const statuses: ShiftStatus[] = ['open', 'filled']
  const { container } = render(
    <>
      {statuses.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </>,
  )
  expect(container).toMatchSnapshot()
})
