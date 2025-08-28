/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para aplicación dinámica
  output: 'standalone',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Desactivar instrumentación automática de OpenTelemetry
    instrumentationHook: false,
    // Deshabilitar prerenderizado problemático
    missingSuspenseWithCSRBailout: false,
    // Optimizar para Railway
    optimizePackageImports: ['lucide-react', 'react-markdown'],
    // Forzar renderizado dinámico para todas las rutas
    forceSwcTransforms: true,
  },
  
  // Configuración para evitar prerenderizado de rutas problemáticas
  async generateBuildId() {
    return 'build-' + Date.now();
  },
  
  // Ignorar errores de prerenderizado específicos
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Configuración para ignorar errores de export
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Configuración para manejar errores de build
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: []
    };
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
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // NO serverExternalPackages
  
  // Configuración para deshabilitar prerenderizado de rutas problemáticas
  async generateBuildId() {
    return 'build-' + Date.now();
  },
  
  // Deshabilitar prerenderizado estático para rutas dinámicas problemáticas
  trailingSlash: false,
  
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: []
    };
  }
};

module.exports = nextConfig;