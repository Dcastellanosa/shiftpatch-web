import { useQuery } from '@tanstack/react-query'
import { listTimesheets } from '../../../shared/api/client/index.ts'

export const timesheetKeys = {
  all: ['timesheets'] as const,
}

/** Timesheet rows derived from filled shifts, scoped by the API to the caller's role. */
export function useTimesheets() {
  return useQuery({ queryKey: timesheetKeys.all, queryFn: listTimesheets })
}
