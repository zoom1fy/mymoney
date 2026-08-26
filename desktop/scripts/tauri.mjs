import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../frontend'
)
const tauriExe = path.join(
  frontendDir, 'node_modules', '@tauri-apps', 'cli', 'tauri.js'
)

const result = spawnSync('node', [tauriExe, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
})

process.exit(result.status ?? 1)
