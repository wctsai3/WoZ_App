/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/WoZ_App',
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
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

module.exports = nextConfig; 