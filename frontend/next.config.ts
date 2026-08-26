const isDesktop = process.env.NEXT_PLATFORM === 'desktop'

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true // ESLint runs as a separate CI step; don't block the build
  },
  // Static export feeds the Tauri webview; web builds keep server rendering
  ...(isDesktop && {
    output: 'export',
    images: { unoptimized: true }
  })
}

export default nextConfig
