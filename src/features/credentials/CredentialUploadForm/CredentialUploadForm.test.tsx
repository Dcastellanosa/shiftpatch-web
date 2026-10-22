// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { MAX_CREDENTIAL_BYTES } from '../../../entities/credential/model/index.ts'
import { CredentialUploadForm } from './index.ts'

const pdf = (size: number, name = 'licence.pdf') => new File([new Uint8Array(size)], name, { type: 'application/pdf' })

it('refuses a file over 4 MB before any request, with an inline message', async () => {
  const onSubmit = vi.fn()
  render(<CredentialUploadForm pending={false} error={null} onSubmit={onSubmit} />)
  await userEvent.upload(screen.getByTestId('credential-upload-input'), pdf(MAX_CREDENTIAL_BYTES + 1))
  fireEvent.change(screen.getByTestId('credential-expiry-date-input'), { target: { value: '2028-01-01' } })

  expect(screen.getByRole('alert').textContent).toContain('larger than 4 MB')
  expect((screen.getByRole('button', { name: 'Upload credential' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.submit(screen.getByRole('button', { name: 'Upload credential' }).closest('form')!)
  expect(onSubmit).not.toHaveBeenCalled()
})

it('submits a file within the limit with its expiry date and type', async () => {
  const onSubmit = vi.fn()
  render(<CredentialUploadForm pending={false} error={null} onSubmit={onSubmit} />)
  await userEvent.upload(screen.getByTestId('credential-upload-input'), pdf(MAX_CREDENTIAL_BYTES))
  fireEvent.change(screen.getByTestId('credential-expiry-date-input'), { target: { value: '2028-01-01' } })
  expect(screen.queryByRole('alert')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Upload credential' }))
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ expiresAt: '2028-01-01', credentialTypeCode: 'nursing_license' }),
  )
})
