import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../frontend'
)

const script = process.argv[2] === 'build' ? 'build:desktop' : 'dev:desktop'

const result = spawnSync('bun', ['run', script], {
  stdio: 'inherit',
  shell: true,
  cwd: frontendDir
})

process.exit(result.status ?? 1)
