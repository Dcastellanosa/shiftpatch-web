import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Config-only variable (no VITE_ prefix), so it is never exposed to the browser.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:3000'

  // Same-origin /api/* → shiftpatch-api with the /api prefix stripped.
  // The Authorization header the client adds and the browser's Origin header
  // are forwarded as-is (the API checks the Origin of browser requests).
  const apiProxy: Record<string, ProxyOptions> = {
    '^/api(?:/|$)': {
      target: apiTarget,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '') || '/',
    },
  }

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
  }
})
