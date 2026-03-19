const nextConfig = {
  serverExternalPackages: ['pdf-parse'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'openai.api.com' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' }
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'pdf-parse': 'commonjs pdf-parse'
    });
    return config;
  },
};

export default nextConfig;
