// Timestamped names let several copies coexist in the same folder
export function buildBackupFileName(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')

  return (
    [
      'mymoney-backup',
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      `${pad(date.getHours())}-${pad(date.getMinutes())}`
    ].join('-') + '.db'
  )
}

// Human-readable size for the success toast
export function formatFileSize(bytes: number): string {
  const withUnit = (value: number, unit: string) =>
    `${value.toFixed(1).replace('.', ',')} ${unit}`

  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return withUnit(bytes / 1024, 'КБ')

  return withUnit(bytes / (1024 * 1024), 'МБ')
}
