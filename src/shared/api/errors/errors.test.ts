import { expect, it } from 'vitest'
import { ApiError } from '../client/index.ts'
import { toApiError } from './index.ts'

it('preserves API errors and hides unknown errors from the UI', () => {
  const known = new ApiError(409, 'shift_not_open', 'Conflict')
  expect(toApiError(known)).toBe(known)
  expect(toApiError(new Error('internal detail'))).toMatchObject({
    status: 0,
    message: 'Something went wrong',
  })
})
