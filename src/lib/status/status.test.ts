import { expect, it } from 'vitest'
import { SHIFT_STATUSES, STATUS_LABEL } from './status.ts'

it('provides a label for every filterable shift status', () => {
  expect(SHIFT_STATUSES).toEqual(['open', 'claimed', 'cancelled', 'completed', 'no_show'])
  expect(SHIFT_STATUSES.map((status) => STATUS_LABEL[status])).toEqual(['Open', 'Claimed', 'Cancelled', 'Completed', 'No-show'])
})
