
import type {NextConfig} from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true, 
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
    unoptimized: true, 
  },
  webpack: (
    config: WebpackConfiguration,
  ) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'handlebars': 'handlebars/dist/handlebars.js',
      },
    };
    return config;
  },
};

export default nextConfig;
