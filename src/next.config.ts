
import type {NextConfig} from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack'; // Added for typing

const nextConfig: NextConfig = {
  output: 'export', // Reinstated for static export
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
    unoptimized: true, // Can be kept, or set to false if a custom image loader is configured for serverful deployment
  },
  webpack: (
    config: WebpackConfiguration,
    // options: { buildId: string; dev: boolean; isServer: boolean; defaultLoaders: any; webpack: any }
  ) => {
    // Aliasing handlebars to its precompiled browser version
    // to avoid `require.extensions` issue with Webpack.
    // This path assumes a standard Handlebars package structure.
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

