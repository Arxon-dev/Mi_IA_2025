# 🧠 ML Analytics - Sistema Híbrido

## 📋 Descripción

El sistema híbrido de ML Analytics permite usar datos de PostgreSQL local desde un hosting remoto a través de una API bridge. Esta arquitectura resuelve el problema de no tener PostgreSQL en el hosting mientras mantiene la seguridad de los datos en el servidor local.

## 🏗️ Arquitectura

```
[Hosting Moodle] ←→ [API Bridge] ←→ [PC Local + PostgreSQL]
     PHP                HTTP              Next.js + Prisma
```

### Componentes:

1. **Hosting (Moodle)**: 
   - `analytics.php` - Interfaz web
   - `ml-analytics-bridge.php` - Cliente API
   - `ml-analytics-hybrid.php` - Proveedor de datos

2. **PC Local**:
   - Next.js server (puerto 3000-3003)
   - PostgreSQL database (`mi_ia_db`)
   - API endpoint: `/api/moodle/ml-analytics-bridge`

## 🔧 Instalación

### 1. En tu PC Local

Asegúrate de que el servidor Next.js esté ejecutándose:

```bash
cd /Mi_IA_2025
npm run dev
```

El servidor debe estar accesible en uno de estos puertos:
- http://localhost:3000
- http://localhost:3001
- http://localhost:3002
- http://localhost:3003

### 2. En el Hosting

Los siguientes archivos ya están creados:

- ✅ `ml-analytics-bridge.php` - Cliente para conectar con API
- ✅ `ml-analytics-hybrid.php` - Funciones de datos híbridas
- ✅ `analytics.php` - Página principal (modificada)
- ✅ `install-check-hybrid.php` - Verificación del sistema

## 🧪 Verificación

### Opción 1: Script de Verificación Híbrido
Accede a: `https://campus.opomelilla.com/local/telegram_integration/install-check-hybrid.php`

### Opción 2: Script Original (Para Comparar)
Accede a: `https://campus.opomelilla.com/local/telegram_integration/install-check.php`

## ✅ Requisitos del Sistema

### En el Hosting:
- ✅ PHP 7.4+ (Tienes 8.3.19)
- ✅ Extensión JSON
- ✅ Extensión cURL
- ❌ **NO** requiere PostgreSQL
- ❌ **NO** requiere pdo_pgsql

### En tu PC Local:
- ✅ Node.js + Next.js ejecutándose
- ✅ PostgreSQL con base de datos `mi_ia_db`
- ✅ Puerto accesible (3000-3003)

## 🔄 Funcionamiento

### 1. Flujo de Datos

```
Usuario → Hosting Moodle → ml-analytics-bridge.php → HTTP Request → 
PC Local (Next.js) → PostgreSQL → Response → Hosting → Usuario
```

### 2. Funciones Disponibles

- **Análisis Predictivo**: Probabilidad de éxito, áreas de riesgo
- **Métricas de Aprendizaje**: Curvas de retención, velocidad de aprendizaje
- **Optimización**: Horarios óptimos, recomendaciones de sesión
- **Análisis Social**: Comparativas, grupos de estudio

### 3. Detección Automática de Puerto

El sistema automáticamente prueba los puertos 3000, 3001, 3002, y 3003 para encontrar el servidor activo.

## 🚨 Solución de Problemas

### Problema: "Failed to connect to bridge API"

**Causas posibles:**
1. Servidor Next.js no está ejecutándose
2. Puerto bloqueado por firewall
3. Dirección IP incorrecta

**Soluciones:**
```bash
# 1. Verificar que el servidor esté ejecutándose
cd /Mi_IA_2025
npm run dev

# 2. Verificar que el puerto esté abierto
netstat -an | findstr :3000

# 3. Probar manualmente la conexión
curl http://localhost:3000/api/moodle/ml-analytics-bridge
```

### Problema: "Database connection failed"

**Causas posibles:**
1. PostgreSQL no está ejecutándose
2. Credenciales incorrectas
3. Base de datos no existe

**Soluciones:**
```bash
# Verificar PostgreSQL
pg_ctl status

# Conectar manualmente
psql -h localhost -U postgres -d mi_ia_db
```

### Problema: "Invalid JSON response"

**Causas posibles:**
1. Error en el código Next.js
2. Respuesta HTML en lugar de JSON
3. Timeout en la conexión

**Soluciones:**
1. Revisar logs del servidor Next.js
2. Verificar que el endpoint devuelva JSON válido
3. Aumentar timeout en `ml-analytics-bridge.php`

## 🔒 Seguridad

### Ventajas del Sistema Híbrido:
- ✅ Datos permanecen en tu PC local
- ✅ No requiere credenciales de base de datos en hosting
- ✅ Comunicación HTTP estándar
- ✅ Fácil de debuggear y mantener

### Consideraciones:
- 🔄 Requiere que tu PC esté encendido y conectado
- 🔄 Dependiente de la conexión a internet
- 🔄 Latencia adicional por la comunicación HTTP

## 📊 Monitoreo

### Logs a Revisar:

1. **En Hosting**: Error logs de PHP
2. **En PC Local**: Console logs de Next.js
3. **Base de Datos**: PostgreSQL logs

### Comandos Útiles:

```bash
# Ver logs de Next.js
npm run dev

# Ver conexiones PostgreSQL
SELECT * FROM pg_stat_activity WHERE datname = 'mi_ia_db';

# Test manual del endpoint
curl -X POST http://localhost:3000/api/moodle/ml-analytics-bridge \
  -H "Content-Type: application/json" \
  -d '{"action":"test_connection","params":{}}'
```

## 🎯 Próximos Pasos

1. **Verificar instalación**: Usar `install-check-hybrid.php`
2. **Probar conectividad**: Asegurar que el servidor Next.js esté ejecutándose
3. **Verificar datos**: Confirmar que hay datos en las tablas de PostgreSQL
4. **Usar el sistema**: Acceder a la página de analytics y probar las funciones

## 📞 Soporte

Si encuentras problemas:

1. Ejecuta `install-check-hybrid.php` para diagnóstico
2. Revisa los logs del servidor Next.js
3. Verifica que PostgreSQL esté funcionando
4. Confirma que no hay firewall bloqueando el puerto

---

**Nota**: Este sistema híbrido es una solución elegante que permite usar PostgreSQL local desde un hosting remoto sin comprometer la seguridad ni requerir instalaciones adicionales en el hosting. 