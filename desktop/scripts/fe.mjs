import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../frontend'
)

const frontendScript = process.argv[2] === 'build' ? 'build:desktop' : 'dev:desktop'

const spawnResult = spawnSync('bun', ['run', frontendScript], {
  stdio: 'inherit',
  shell: true,
  cwd: frontendDir
})

process.exit(spawnResult.status ?? 1)
