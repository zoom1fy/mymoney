const isDesktop = process.env.NEXT_PLATFORM === 'desktop'
// Only export for production builds: `output: 'export'` is invalid in `next dev`
// and makes Next reject the middleware with "cannot be used with output: export"
const isProductionBuild = process.env.NODE_ENV === 'production'

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true // ESLint runs as a separate CI step; don't block the build
  },
  // Static export feeds the Tauri webview; web builds keep server rendering
  ...(isDesktop &&
    isProductionBuild && {
      output: 'export',
      images: { unoptimized: true }
    })
}

export default nextConfig
