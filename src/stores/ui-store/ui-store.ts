import { create } from 'zustand'

export type ToastKind = 'success' | 'error'

export interface ToastLink {
  to: string
  label: string
}

export interface Toast {
  id: string
  kind: ToastKind
  title: string
  body?: string
  link?: ToastLink
}

export type ToastInput = Omit<Toast, 'id'>

/**
 * Global client-only UI state. The only thing that lives here is the
 * notification queue. Session, shifts, branches and every other piece of
 * server state belong to TanStack Query, never to this store.
 */
export interface UiState {
  toasts: Toast[]
  pushToast: (toast: ToastInput) => string
  dismissToast: (id: string) => void
}

let nextToastId = 0

export const useUiStore = create<UiState>()((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = `toast-${++nextToastId}`
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    return id
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
