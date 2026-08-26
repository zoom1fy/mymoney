import { spawnSync } from 'node:child_process'

process.env.NEXT_PLATFORM = 'desktop'

// Dev server for the Tauri window: NEXT_PLATFORM=desktop makes the root page
// render the dashboard directly and disables auth redirects in middleware
const result = spawnSync('next', ['dev'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
})

process.exit(result.status ?? 1)
