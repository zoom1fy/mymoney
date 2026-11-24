import { invoke } from '@tauri-apps/api/core'

import { buildBackupFileName } from '@/lib/backup'

interface IDatabaseBackup {
  path: string
  size: number
}

export const backupService = {
  // Rust opens the native save dialog and snapshots the SQLite file
  async createBackup(): Promise<IDatabaseBackup | null> {
    return invoke<IDatabaseBackup | null>('backup_database', {
      fileName: buildBackupFileName()
    })
  }
}
