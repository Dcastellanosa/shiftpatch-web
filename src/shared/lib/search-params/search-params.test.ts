import { expect, it } from 'vitest'
import { compactParams } from './index.ts'

it('keeps only non-empty filter values', () => {
  expect(compactParams({ status: 'open', agency: '', branch: undefined, from: '2030-01-01' })).toEqual({ status: 'open', from: '2030-01-01' })
  expect(new URLSearchParams(compactParams({ status: '', agency: '' })).toString()).toBe('')
})
