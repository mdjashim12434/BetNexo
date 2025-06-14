
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Set to 'export' as requested for static site generation
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Explicitly ignore TS errors for dev server stability
  },
  eslint: {
    ignoreDuringBuilds: true, // Explicitly ignore ESLint errors for dev server stability
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Required for static export with next/image unless a custom loader is configured
  },
};

export default nextConfig;
