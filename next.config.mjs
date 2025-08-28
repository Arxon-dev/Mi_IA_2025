/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuración de webpack para resolver problemas de compilación
  webpack: (config, { dev, isServer }) => {
    // Resolución de problemas de compilación
    return config;
  },
  // Configuración experimental correcta
  experimental: {
    // Otras opciones experimentales pueden ir aquí
  }
}

export default nextConfig 