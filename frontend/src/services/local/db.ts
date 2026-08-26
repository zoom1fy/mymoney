import Database from '@tauri-apps/plugin-sql'
import { appLocalDataDir, join } from '@tauri-apps/api/path'

// Fixed single user created by the seed migration; all local data hangs off this id
export const LOCAL_USER_ID = '00000000-0000-0000-0000-000000000001'

const DB_FILENAME = 'mymoney.db'

let database: Database | null = null

// Stored per-machine (%LOCALAPPDATA% on Windows, ~/.local/share on Linux);
// migrations run on the Rust side before this handle is handed out.
// An absolute path overrides the plugin's default app-config-dir placement.
export async function getDb(): Promise<Database> {
  if (!database) {
    const dir = await appLocalDataDir()
    database = await Database.load(`sqlite:${await join(dir, DB_FILENAME)}`)
  }

  return database
}
