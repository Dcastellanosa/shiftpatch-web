// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client/index.ts'
import { ErrorState } from './index.ts'

it('renders an API error and recovery action', () => {
  const { container } = render(
    <ErrorState error={new ApiError(500, 'server_error', 'Please try again.')} onRetry={vi.fn()} />,
  )
  expect(container.firstChild).toMatchSnapshot()
})
