import { resolve } from 'node:path'

/** Fixed local addresses of the end-to-end run. Nothing here is configurable to a remote host. */
export const WEB_ORIGIN = 'http://localhost:5174'
export const API_PORT = 3100
/** shiftpatch-api checkout: the sibling folder, or E2E_API_DIR from `.env.e2e.local`. */
export const API_DIR = resolve(process.env.E2E_API_DIR ?? '../shiftpatch-api')
