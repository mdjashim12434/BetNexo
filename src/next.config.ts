
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Set to 'export' as requested for static site generation
  /* config options here */
  // typescript: {
  //   ignoreBuildErrors: true, // Removed to surface build errors
  // },
  // eslint: {
  //   ignoreDuringBuilds: true, // Removed to surface lint errors during build
  // },
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
