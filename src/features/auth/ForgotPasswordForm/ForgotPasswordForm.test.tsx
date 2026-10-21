// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { ForgotPasswordForm } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('sends the address and shows the same confirmation for any outcome the API accepts', async () => {
  const fetchMock = stubApi({ 'POST /api/auth/recover': () => ({ status: 204 }) })
  const onBack = vi.fn()
  renderWithProviders(<ForgotPasswordForm onBack={onBack} />)
  await userEvent.type(screen.getByLabelText('Email'), ' nobody@example.test ')
  await userEvent.click(screen.getByRole('button', { name: 'Email me a link' }))
  expect(await screen.findByText('Check your email')).toBeTruthy()
  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ email: 'nobody@example.test' })
  await userEvent.click(screen.getByRole('button', { name: 'Back to sign in' }))
  expect(onBack).toHaveBeenCalled()
})

it('reports a failure without pretending the email was sent', async () => {
  stubApi({
    'POST /api/auth/recover': () => json(400, { error: { code: 'validation_error', message: 'Invalid email' } }),
  })
  renderWithProviders(<ForgotPasswordForm onBack={vi.fn()} />)
  await userEvent.type(screen.getByLabelText('Email'), 'bad@example')
  await userEvent.click(screen.getByRole('button', { name: 'Email me a link' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Invalid email')
  expect(screen.queryByText('Check your email')).toBeNull()
})
