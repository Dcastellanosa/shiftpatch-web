// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LoadingState } from './index.ts'

it('renders an accessible loading label', () => {
  const { container } = render(<LoadingState label="Loading shifts…" />)
  expect(container.firstChild).toMatchSnapshot()
})
