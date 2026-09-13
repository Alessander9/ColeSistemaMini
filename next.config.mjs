/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

