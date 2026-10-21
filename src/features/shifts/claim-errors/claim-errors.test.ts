import { expect, it } from 'vitest'
import { ApiError } from '../../../shared/api/client/index.ts'
import { describeClaimError } from './index.ts'

it('explains known claim failures and network failures', () => {
  expect(describeClaimError(new ApiError(422, 'credential_expired', 'Expired')).title).toBe(
    'A required credential has expired',
  )
  expect(describeClaimError(new ApiError(0, 'network_error', 'Offline')).detail).toBe(
    'Check your connection and try again.',
  )
})
