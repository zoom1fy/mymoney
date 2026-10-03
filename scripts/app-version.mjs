import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// tauri.conf.json is the single source of truth: the bundled installer and the
// runtime getVersion() both read it, and a release tag must match it exactly.
const SOURCE_OF_TRUTH = { file: 'desktop/src-tauri/tauri.conf.json', type: 'json' }

// Every manifest that duplicates the version. They must stay equal so the tag,
// installer metadata, Cargo package and the UI never disagree.
const VERSION_TARGETS = [
  SOURCE_OF_TRUTH,
  { file: 'desktop/src-tauri/Cargo.toml', type: 'cargo' },
  { file: 'frontend/package.json', type: 'json' },
  { file: 'backend/package.json', type: 'json' },
  { file: 'desktop/package.json', type: 'json' },
  { file: 'package.json', type: 'json' }
]

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

function readFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath))
}

function readVersion(target) {
  if (target.type === 'cargo') {
    const match = readFile(target.file).match(/^version\s*=\s*"([^"]+)"/m)
    return match?.[1] ?? null
  }
  return readJson(target.file).version ?? null
}

// Preserve the existing key order when "version" is already present so syncing
// never reshuffles a manifest. When the field is missing (desktop/package.json,
// root package.json) it is inserted right after "name".
function writeJsonVersion(relativePath, version) {
  let manifest = readJson(relativePath)

  if ('version' in manifest) {
    manifest.version = version
  } else {
    const entries = Object.entries(manifest)
    const nameIndex = entries.findIndex(([key]) => key === 'name')
    entries.splice(nameIndex === -1 ? 0 : nameIndex + 1, 0, ['version', version])
    manifest = Object.fromEntries(entries)
  }

  writeFileSync(
    path.join(repoRoot, relativePath),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
}

function writeCargoVersion(relativePath, version) {
  const content = readFile(relativePath)
  // Anchored at column 0 so dependency versions like `serde = { version = ... }`
  // are never touched.
  const updated = content.replace(
    /^version\s*=\s*"[^"]*"/m,
    `version = "${version}"`
  )
  writeFileSync(path.join(repoRoot, relativePath), updated)
}

function writeVersion(target, version) {
  if (target.type === 'cargo') {
    writeCargoVersion(target.file, version)
    return
  }
  writeJsonVersion(target.file, version)
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const setIndex = args.findIndex(arg => arg === '--set' || arg === 'set')

  if (setIndex !== -1) return { mode: 'set', version: args[setIndex + 1] }
  if (args.includes('--check') || args.includes('check')) return { mode: 'check' }
  return { mode: 'sync' }
}

function requireValidVersion(version) {
  if (!SEMVER_PATTERN.test(version ?? '')) {
    console.error(
      `Invalid version "${version ?? ''}". Expected semver such as 0.1.0`
    )
    process.exit(1)
  }
}

const command = parseArgs(process.argv)

if (command.mode === 'set') {
  requireValidVersion(command.version)

  for (const target of VERSION_TARGETS) writeVersion(target, command.version)

  console.log(`Set version ${command.version} in:`)
  for (const target of VERSION_TARGETS) console.log(`  - ${target.file}`)
  process.exit(0)
}

const currentVersion = readVersion(SOURCE_OF_TRUTH)
if (!currentVersion) {
  console.error(`No version found in ${SOURCE_OF_TRUTH.file}`)
  process.exit(1)
}

const versions = VERSION_TARGETS.map(target => ({
  ...target,
  version: readVersion(target)
}))

if (command.mode === 'check') {
  const mismatched = versions.filter(entry => entry.version !== currentVersion)

  if (mismatched.length > 0) {
    console.error(
      `Version mismatch: ${SOURCE_OF_TRUTH.file} is ${currentVersion}, but:`
    )
    for (const entry of mismatched) {
      console.error(`  - ${entry.file}: ${entry.version ?? 'missing'}`)
    }
    console.error('Run `npm run version` to sync them.')
    process.exit(1)
  }

  console.log(`Versions are in sync: ${currentVersion}`)
  process.exit(0)
}

const changed = []
for (const entry of versions) {
  if (entry.version === currentVersion) continue
  writeVersion(entry, currentVersion)
  changed.push(entry)
}

if (changed.length === 0) {
  console.log(`All files already at version ${currentVersion}`)
} else {
  console.log(`Synced version ${currentVersion} in:`)
  for (const entry of changed) console.log(`  - ${entry.file}`)
}
