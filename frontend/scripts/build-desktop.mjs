import { rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

process.env.NEXT_PLATFORM = 'desktop'

// Static export for the Tauri webview; Next drops API routes and server
// middleware in this mode — client-side AuthGuard replaces them.
const result = spawnSync('next', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
})

if (result.status === 0) {
  // The desktop build has no registration flow; drop the auth pages entirely
  for (const file of ['out/auth.html', 'out/auth.txt']) {
    rmSync(file, { force: true })
  }
}

process.exit(result.status ?? 1)
