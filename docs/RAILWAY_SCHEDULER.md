# Railway Notification Scheduler

## Configuración en Railway

### 1. Servicios Múltiples

Este proyecto está configurado para ejecutar dos servicios en Railway:

- **web**: La aplicación Next.js principal
- **scheduler**: El sistema de notificaciones programadas

### 2. Archivos de Configuración

#### Procfile
```
web: npm start
scheduler: npm run scheduler:railway
```

#### railway.json
Configura el comportamiento de despliegue en Railway.

### 3. Scripts Disponibles

```bash
# Ejecutar scheduler localmente
npm run scheduler:start

# Ejecutar scheduler en modo desarrollo
npm run scheduler:dev

# Ejecutar scheduler optimizado para Railway
npm run scheduler:railway

# Ejecutar scheduler Railway en modo desarrollo
npm run scheduler:railway:dev
```

### 4. Configuración en Railway Dashboard

#### Paso 1: Crear Servicio Scheduler
1. Ve a tu proyecto en Railway
2. Haz clic en "+ New Service"
3. Selecciona "Empty Service"
4. Nombra el servicio "scheduler"

#### Paso 2: Configurar Variables de Entorno
Asegúrate de que ambos servicios (web y scheduler) tengan las mismas variables de entorno:

```env
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
TELEGRAM_BOT_TOKEN=your_bot_token
OPENAI_API_KEY=your_openai_key
# ... otras variables necesarias
```

#### Paso 3: Configurar Comando de Inicio
En el servicio scheduler:
1. Ve a Settings → Deploy
2. En "Start Command" ingresa: `npm run scheduler:railway`

### 5. Monitoreo

#### Ver Logs del Scheduler
```bash
railway logs --service scheduler
```

#### Ver Logs en Tiempo Real
```bash
railway logs --service scheduler --follow
```

### 6. Configuración del Scheduler

El scheduler lee la configuración desde `scripts/scheduler-config.json`:

```json
{
  "polls": {
    "enabled": true,
    "schedule": "0 9 * * *",
    "description": "Polls diarios a las 9:00 AM"
  },
  "notifications": {
    "enabled": true,
    "schedule": "*/30 * * * *",
    "description": "Notificaciones cada 30 minutos"
  }
}
```

### 7. Troubleshooting

#### El scheduler no inicia
1. Verifica que `tsx` esté instalado: `npm list tsx`
2. Revisa los logs: `railway logs --service scheduler`
3. Verifica las variables de entorno

#### Errores de memoria
El script está configurado con `--max-old-space-size=512` para Railway.

#### Zona horaria
El scheduler está configurado para usar `Europe/Madrid`.

### 8. Comandos Útiles

```bash
# Desplegar solo el scheduler
railway up --service scheduler

# Reiniciar el scheduler
railway service restart scheduler

# Ver estado de servicios
railway status

# Conectar a la base de datos
railway connect
```

### 9. Estructura de Archivos

```
scripts/
├── notification-scheduler.ts     # Scheduler principal
├── railway-scheduler.ts          # Wrapper para Railway
├── scheduler-config.json         # Configuración
└── ...

Procfile                          # Configuración de servicios
railway.json                      # Configuración de Railway
```

### 10. Notas Importantes

- El scheduler se reinicia automáticamente si falla
- Los logs incluyen timestamps y códigos de color
- El servicio maneja señales SIGTERM y SIGINT correctamente
- La configuración es específica para el entorno de Railway