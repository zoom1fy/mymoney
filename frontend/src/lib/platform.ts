// The desktop build runs inside a Tauri webview, which injects this global
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
