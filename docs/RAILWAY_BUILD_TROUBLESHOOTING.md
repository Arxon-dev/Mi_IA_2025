# Solución de Problemas de Build en Railway

## Problema: Error de Memoria durante el Build

### Síntomas
- `Aborted (core dumped)` durante `npm run build`
- Exit code 134
- Proceso termina inesperadamente

### Solución Implementada

#### 1. Configuración de Memoria

**Archivo: `.nixpacks.toml`**
```toml
[variables]
NODE_OPTIONS = "--max-old-space-size=4096"
NEXT_TELEMETRY_DISABLED = "1"
NODE_ENV = "production"
```

**Archivo: `railway.json`**
```json
{
  "environments": {
    "production": {
      "variables": {
        "NODE_OPTIONS": "--max-old-space-size=4096",
        "NEXT_TELEMETRY_DISABLED": "1",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 2. Script de Build Optimizado

**Archivo: `scripts/railway-build.js`**
- Manejo de memoria mejorado
- Limpieza de caché automática
- Logging detallado para debugging
- Manejo de errores robusto

#### 3. Variables de Entorno Críticas

Asegúrate de configurar estas variables en Railway:

```bash
# Base de datos
DATABASE_URL="mysql://usuario:password@host:puerto/database"

# APIs de IA
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AI..."

# Telegram
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_WEBHOOK_SECRET="..."

# Autenticación
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://tu-app.railway.app"

# Pagos
STRIPE_SECRET_KEY="sk_..."
REDSYS_MERCHANT_CODE="..."
PAYPAL_CLIENT_ID="..."

# Entorno
NODE_ENV="production"
NODE_OPTIONS="--max-old-space-size=4096"
NEXT_TELEMETRY_DISABLED="1"
```

## Comandos de Debugging

### Verificar Build Local
```bash
# Probar el script de build optimizado
npm run build:railway

# Verificar memoria disponible
node -e "console.log(process.memoryUsage())"
```

### Monitorear Logs en Railway
```bash
# Ver logs de build
railway logs --service tu-servicio

# Ver logs en tiempo real
railway logs --service tu-servicio --follow
```

## Health Check

La aplicación incluye un endpoint de health check:
- **URL**: `/api/health`
- **Verifica**: Conexión a base de datos, estado general
- **Configurado en**: `railway.json`

## Estructura de Archivos de Configuración

```
.
├── .nixpacks.toml          # Configuración de Nixpacks
├── railway.json            # Configuración de Railway
├── Procfile               # Definición de servicios
├── scripts/
│   ├── railway-build.js   # Script de build optimizado
│   └── railway-scheduler.ts # Scheduler para Railway
└── src/app/api/health/
    └── route.ts           # Health check endpoint
```

## Próximos Pasos

1. **Configurar Variables de Entorno** en Railway Dashboard
2. **Crear Servicio Scheduler** separado (opcional)
3. **Verificar Health Check** después del deploy
4. **Monitorear Logs** durante las primeras horas

## Contacto

Si persisten los problemas:
1. Revisar logs detallados en Railway
2. Verificar todas las variables de entorno
3. Contactar soporte de Railway si es necesario