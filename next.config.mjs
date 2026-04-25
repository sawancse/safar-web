/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  images: {
    domains: [
      'localhost',
      'd1pei2hufbgxoj.cloudfront.net',
      'media.ysafar.com',
      process.env.NEXT_PUBLIC_CDN_DOMAIN ?? '',
    ].filter(Boolean),
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      // Old celebrations marketplace landing → new events landing under /services
      { source: '/cooks/services',         destination: '/services/events', permanent: true },
      // Bespoke + dynamic-template pages moved 1:1 from /cooks/services/* to /services/*
      { source: '/cooks/services/:path*',  destination: '/services/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
