import { expect, it } from 'vitest'
import { ApiError } from '../api-client/api-client.ts'
import { describeClaimError, toApiError } from './errors.ts'

it('preserves API errors and hides unknown errors from the UI', () => {
  const known = new ApiError(409, 'shift_not_open', 'Conflict')
  expect(toApiError(known)).toBe(known)
  expect(toApiError(new Error('internal detail'))).toMatchObject({ status: 0, code: 'unexpected_error', message: 'Something went wrong' })
})

it('explains known claim failures and network failures', () => {
  expect(describeClaimError(new ApiError(422, 'credential_expired', 'Expired')).title).toBe('A required credential has expired')
  expect(describeClaimError(new ApiError(0, 'network_error', 'Offline')).detail).toBe('Check your connection and try again.')
})
