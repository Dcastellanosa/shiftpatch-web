import { expect, it } from 'vitest'
import { SHIFT_STATUSES, STATUS_LABEL } from './index.ts'

it('knows exactly the two public statuses', () => {
  expect(SHIFT_STATUSES).toEqual(['open', 'filled'])
  expect(SHIFT_STATUSES.map((status) => STATUS_LABEL[status])).toEqual(['Open', 'Filled'])
})
