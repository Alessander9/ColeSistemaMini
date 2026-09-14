/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'jspdf', 'html2canvas', 'clsx', 'tailwind-merge'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply to ALL routes
        source: '/(.*)',
        headers: [
          // Allow camera / microphone in iframes and cross-origin contexts
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=()',
          },
          // Legacy browser fallback
          {
            key: 'Feature-Policy',
            value: "camera 'self'; microphone 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

