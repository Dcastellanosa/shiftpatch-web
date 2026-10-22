import { useQuery } from '@tanstack/react-query'
import { listAuditEvents } from '../../../shared/api/client/index.ts'

export const auditKeys = {
  all: ['admin', 'audit-events'] as const,
}

/** The unified audit log (admin only; the API refuses other roles). */
export function useAuditEvents() {
  return useQuery({ queryKey: auditKeys.all, queryFn: listAuditEvents })
}
