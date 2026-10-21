import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { useUiStore } from '../src/stores/ui-store/index.ts'

afterEach(() => {
  cleanup()
  useUiStore.setState({ toasts: [] })
})
