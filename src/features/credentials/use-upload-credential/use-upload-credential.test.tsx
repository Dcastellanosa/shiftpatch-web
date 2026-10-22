// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeCredential, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { credentialKeys } from '../../../entities/credential/queries/index.ts'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useUploadCredential } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const file = new File(['%PDF-1.4'], 'licence.pdf', { type: 'application/pdf' })

it('uploads as multipart, refreshes credentials and shifts, and announces it', async () => {
  const credential = makeCredential()
  const fetchMock = stubApi({ 'POST /api/me/credentials': () => json(201, { credential }) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useUploadCredential, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync({ file, expiresAt: '2028-01-01', credentialTypeCode: 'nursing_license' }))

  const [, init] = fetchMock.mock.calls[0]!
  const body = init?.body as FormData
  expect(body).toBeInstanceOf(FormData)
  expect(body.get('expiresAt')).toBe('2028-01-01')
  expect(body.get('credentialTypeCode')).toBe('nursing_license')
  expect((body.get('file') as File).name).toBe('licence.pdf')
  expect(new Headers(init?.headers).has('Content-Type')).toBe(false)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: credentialKeys.all })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'success', title: 'Credential uploaded' }),
  ])
})

it('announces a refusal with the API’s message', async () => {
  stubApi({ 'POST /api/me/credentials': () => json(400, { error: 'Unsupported file type' }) })
  const { result } = renderHook(useUploadCredential, { wrapper: withProviders() })
  await act(() =>
    result.current
      .mutateAsync({ file, expiresAt: '2028-01-01', credentialTypeCode: 'nursing_license' })
      .catch(() => undefined),
  )
  await waitFor(() => expect(result.current.error).toMatchObject({ status: 400 }))
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'error', title: 'Credential not uploaded', body: 'Unsupported file type' }),
  ])
})
