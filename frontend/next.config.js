/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images from external domains (for institute logos)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Silence hydration warnings from browser extensions
  reactStrictMode: true,
}

module.exports = nextConfig
