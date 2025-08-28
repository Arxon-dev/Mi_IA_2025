/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Desactivar instrumentación automática de OpenTelemetry
    instrumentationHook: false,
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules|backups/
    };
    
    // Excluir OpenTelemetry de la construcción del servidor
    if (isServer) {
      config.externals.push({
        '@opentelemetry/auto-instrumentations-node': 'commonjs @opentelemetry/auto-instrumentations-node',
        '@opentelemetry/sdk-node': 'commonjs @opentelemetry/sdk-node',
      });
    }
    
    return config;
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js']
  // NO serverExternalPackages
};

module.exports = nextConfig; 