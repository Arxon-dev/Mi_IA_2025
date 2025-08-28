# Solución para Problemas de Conexión MySQL en Next.js

## Problema Identificado
La aplicación experimentaba errores de conexión intermitentes con MySQL alojado en hosting:
```
Can't reach database server at `145.223.38.91:3306`
```

## Diagnóstico Realizado
✅ **Conexión directa con mysql2**: Funcionaba correctamente
✅ **Conexión con Prisma standalone**: Funcionaba correctamente
❌ **Conexión con Prisma en Next.js**: Fallaba intermitentemente

## Soluciones Implementadas

### 1. Configuración Optimizada de Prisma (`src/lib/prisma.ts`)
- Configuración explícita de `datasources` en el cliente
- Logging mejorado para desarrollo
- Funciones de reconexión automática

### 2. Sistema de Reintentos (`src/lib/prisma-retry.ts`)
- Wrapper `withRetry` para operaciones críticas
- Backoff exponencial en reintentos
- Detección específica de errores de conexión (P1001)

### 3. Manejo Mejorado de Errores (`src/services/prismaService.ts`)
- Detección y manejo específico de errores de conexión
- Integración con sistema de reintentos
- Logging detallado para debugging

### 4. Inicialización Automática (`src/lib/init.ts`)
- Verificación de conexión al arrancar la aplicación
- Inicialización automática en el servidor
- Prevención de múltiples inicializaciones

### 5. Funciones Críticas Mejoradas
- `getDocuments()`: Con reintentos automáticos
- `getDocumentById()`: Con reintentos automáticos
- `getQuestions()`: Con reintentos automáticos

## Archivos Modificados

### Nuevos Archivos
- `src/lib/prisma-retry.ts` - Sistema de reintentos
- `src/lib/init.ts` - Inicialización automática
- `SOLUCION-CONEXION-MYSQL.md` - Este documento

### Archivos Modificados
- `src/lib/prisma.ts` - Configuración optimizada
- `src/services/prismaService.ts` - Manejo de errores y reintentos
- `src/app/layout.tsx` - Importación de inicialización

## Configuración de Base de Datos

### Variables de Entorno
```env
DATABASE_URL="mysql://u449034524_opomelilla_25:Sirius%2F%2F03072503%2F%2F@145.223.38.91:3306/u449034524_moodel_telegra"
```

### Configuración Prisma
```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}
```

## Características del Sistema de Reintentos

### Parámetros Configurables
- **Máximo de reintentos**: 3 intentos por defecto
- **Backoff exponencial**: 1s, 2s, 3s entre reintentos
- **Detección inteligente**: Solo reintenta errores de conexión

### Logging Detallado
- Información de cada intento
- Detalles de errores específicos
- Confirmación de reconexión exitosa

## Pruebas de Verificación

### Script de Prueba
```bash
node test-mysql-connection.js
```

### Verificación en Producción
1. Monitorear logs de Next.js
2. Verificar métricas de conexión
3. Comprobar tiempo de respuesta de APIs

## Mantenimiento

### Monitoring
- Verificar logs de reconexión
- Monitorear frecuencia de reintentos
- Revisar métricas de base de datos

### Posibles Mejoras Futuras
- Pool de conexiones personalizado
- Métricas de performance
- Alertas automáticas por fallos de conexión
- Configuración de timeouts personalizables

## Comandos Útiles

```bash
# Probar conexión
node test-mysql-connection.js

# Regenerar cliente Prisma
npx prisma generate

# Iniciar aplicación
npm run dev
```

## Notas Importantes

1. **Hosting MySQL**: El servidor está en `145.223.38.91:3306`
2. **Credenciales**: Almacenadas en variables de entorno
3. **Timeouts**: Configurados para conexiones de hosting
4. **Logging**: Activado para debugging en desarrollo

---

**Fecha de implementación**: $(date)
**Estado**: ✅ Implementado y probado
**Próxima revisión**: Monitorear por 1 semana 