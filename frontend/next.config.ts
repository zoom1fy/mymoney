const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true // ESLint runs as a separate CI step; don't block the build
  }
}

export default nextConfig
