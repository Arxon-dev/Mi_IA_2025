/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Configuración para evitar prerenderizado de rutas dinámicas
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  trailingSlash: false,
  output: 'standalone',

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
};

module.exports = nextConfig;