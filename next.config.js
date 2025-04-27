/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Only run ESLint on build in production. Linting is also run by the editor.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 