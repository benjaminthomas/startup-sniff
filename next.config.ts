import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['argon2', 'winston', 'winston-daily-rotate-file'],
  // Security & Performance
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,

  // TypeScript Optimization (Stable in 15.5) - Disabled temporarily to avoid breaking changes
  // typedRoutes: true,

  // Build Optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip'
    ],
  },

  // Turbopack for faster builds (beta)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Image Optimization (Enhanced for 15.5)
  images: {
    minimumCacheTTL: 31536000,
    formats: ['image/webp', 'image/avif'],
    qualities: [75, 100],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    localPatterns: [
      {
        pathname: '/**',
        search: '',
      },
    ],
  },

  // Transpile packages for better compatibility
  transpilePackages: ['jspdf'],

  // Custom webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // For client-side bundles, replace winston modules with empty modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };

      // Ignore winston imports on client side
      config.resolve.alias = {
        ...config.resolve.alias,
        winston: false,
        'winston-daily-rotate-file': false,
      };
    }
    return config;
  },

  // Output optimization (removed standalone for development compatibility)

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

// Export config directly (Sentry integration disabled until NEXT_PUBLIC_SENTRY_DSN is configured)
export default nextConfig;

// To enable Sentry, uncomment the following:
// import { withSentryConfig } from "@sentry/nextjs";
//
// const sentryOptions = {
//   silent: true,
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
//   disableLogger: true,
//   widenClientFileUpload: true,
//   hideSourceMaps: true,
//   telemetry: false,
// };
//
// export default process.env.NEXT_PUBLIC_SENTRY_DSN
//   ? withSentryConfig(nextConfig, sentryOptions)
//   : nextConfig;
