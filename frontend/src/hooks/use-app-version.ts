'use client'

import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'

import { isTauri } from '@/lib/platform'

// getVersion() only works inside the Tauri webview; the browser build falls
// back to a version injected at build time when one is provided.
const BUILD_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? null

/**
 * Resolves the running application version from the Tauri runtime.
 */
export function useAppVersion(): string | null {
  const [appVersion, setAppVersion] = useState<string | null>(BUILD_APP_VERSION)

  useEffect(() => {
    if (!isTauri()) return

    let isActive = true

    getVersion()
      .then(version => {
        if (isActive) setAppVersion(version)
      })
      .catch(() => {
        // The label is cosmetic; a failed lookup must not break the dashboard.
      })

    return () => {
      isActive = false
    }
  }, [])

  return appVersion
}
