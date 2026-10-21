// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { makeShift } from '../../../../tests/fake-api.ts'
import { ShiftTable } from './index.ts'

it('renders an agency shift with the assigned nurse', () => {
  const shift = makeShift({ status: 'claimed', assignedNurse: { id: 'nurse-1', fullName: 'Ava Thompson' } })
  const { container } = render(<ShiftTable shifts={[shift]} showAgency />)
  expect(container.firstChild).toMatchSnapshot()
})
