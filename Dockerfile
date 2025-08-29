# Dockerfile optimizado para Railway
FROM node:18-alpine

# Configurar variables de entorno para optimización
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat openssl

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --prefer-offline --no-audit

# Copiar scripts necesarios para el build
COPY scripts ./scripts/

# Generar Prisma Client
RUN npx prisma generate

# Copiar resto del código fuente
COPY . .

# Ejecutar build optimizado
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]