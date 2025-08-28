# 🚀 Scripts de Activación Manual de Usuarios Premium

Este directorio contiene scripts para activar manualmente usuarios al plan Premium o Básico sin necesidad de pago.

## 📁 Archivos Incluidos

- `activar-usuario-premium-manual.js` - Script básico para activar un usuario individual
- `activar-usuarios-premium-avanzado.js` - Script avanzado con múltiples funcionalidades
- `ejemplo-usuarios.txt` - Archivo de ejemplo para activaciones por lotes
- `README-activacion-manual.md` - Este archivo de documentación

## 🔧 Requisitos Previos

1. **Node.js** instalado en el sistema
2. **Prisma Client** configurado y conectado a la base de datos
3. **Acceso a la base de datos** con permisos de escritura
4. **Variables de entorno** configuradas correctamente

## ⚠️ Correcciones Importantes

**Versión actualizada:** Los scripts han sido corregidos para resolver:
- ✅ **Error de restricción única:** Uso de `upsert` en lugar de `create/update` separados
- ✅ **Campo inexistente:** Eliminación de `planid` en `paymenttransaction` (no existe en el esquema)
- ✅ **Compatibilidad con esquema:** Ajustado a la estructura real de la base de datos

## 📖 Script Básico: `activar-usuario-premium-manual.js`

### Uso
```bash
node activar-usuario-premium-manual.js <TELEGRAM_ID>
```

### Ejemplo
```bash
node activar-usuario-premium-manual.js 123456789
```

### Funcionalidad
- Activa un usuario individual al plan Premium
- Duración fija de 1 mes
- Crea registro de transacción para auditoría
- Validaciones de seguridad incluidas

## 🚀 Script Avanzado: `activar-usuarios-premium-avanzado.js`

### Comandos Disponibles

#### 1️⃣ Activar Usuario Individual
```bash
node activar-usuarios-premium-avanzado.js activar <telegram_id> [plan] [meses]
```

**Ejemplos:**
```bash
# Activar usuario con plan premium por 1 mes (por defecto)
node activar-usuarios-premium-avanzado.js activar 123456789

# Activar usuario con plan premium por 3 meses
node activar-usuarios-premium-avanzado.js activar 123456789 premium 3

# Activar usuario con plan básico por 1 mes
node activar-usuarios-premium-avanzado.js activar 123456789 basic 1
```

#### 2️⃣ Activar Usuarios por Lotes
```bash
node activar-usuarios-premium-avanzado.js lote <archivo.txt> [plan] [meses]
```

**Ejemplos:**
```bash
# Activar usuarios desde archivo con plan premium por 1 mes
node activar-usuarios-premium-avanzado.js lote ejemplo-usuarios.txt

# Activar usuarios con plan premium por 2 meses
node activar-usuarios-premium-avanzado.js lote usuarios.txt premium 2

# Activar usuarios con plan básico por 1 mes
node activar-usuarios-premium-avanzado.js lote usuarios.txt basic 1
```

#### 3️⃣ Listar Usuarios Activos
```bash
node activar-usuarios-premium-avanzado.js listar [plan]
```

**Ejemplos:**
```bash
# Listar todos los usuarios con suscripciones activas
node activar-usuarios-premium-avanzado.js listar

# Listar solo usuarios con plan premium
node activar-usuarios-premium-avanzado.js listar premium

# Listar solo usuarios con plan básico
node activar-usuarios-premium-avanzado.js listar basic
```

#### 4️⃣ Extender Suscripción Existente
```bash
node activar-usuarios-premium-avanzado.js extender <telegram_id> <meses>
```

**Ejemplos:**
```bash
# Extender suscripción por 2 meses adicionales
node activar-usuarios-premium-avanzado.js extender 123456789 2

# Extender suscripción por 6 meses adicionales
node activar-usuarios-premium-avanzado.js extender 123456789 6
```

#### 5️⃣ Ver Información Detallada de Usuario
```bash
node activar-usuarios-premium-avanzado.js info <telegram_id>
```

**Ejemplo:**
```bash
node activar-usuarios-premium-avanzado.js info 123456789
```

## 📝 Formato del Archivo para Lotes

Para usar la funcionalidad de activación por lotes, crea un archivo de texto con el siguiente formato:

```txt
# Archivo de usuarios para activación por lotes
# Un Telegram ID por línea
# Las líneas que empiecen con # serán ignoradas

123456789
987654321
555666777
111222333

# Puedes agregar comentarios
444555666
```

### Reglas del Archivo:
- **Un Telegram ID por línea**
- **Solo números** (sin espacios ni caracteres especiales)
- **Líneas que empiecen con #** serán ignoradas (comentarios)
- **Líneas vacías** serán ignoradas

## 🎯 Planes Disponibles

- **`basic`** - Plan Básico
- **`premium`** - Plan Premium (por defecto)

## ⚠️ Consideraciones Importantes

### Seguridad
- Los scripts validan que el usuario exista antes de activarlo
- Se crean registros de auditoría para todas las activaciones
- Las activaciones manuales se marcan como `paymentmethod: 'manual_activation'`

### Base de Datos
- Los scripts actualizan las tablas `usersubscription` y `paymenttransaction`
- Si el usuario ya tiene una suscripción activa, se actualiza en lugar de crear una nueva
- Las fechas se calculan automáticamente (inicio: ahora, fin: inicio + meses)

### Auditoría
- Todas las activaciones quedan registradas en `paymenttransaction`
- El campo `description` incluye detalles de la activación manual
- El `amount` se establece en 0 para activaciones manuales

## 🔍 Solución de Problemas

### Error: "Usuario no encontrado"
- Verifica que el Telegram ID sea correcto
- Asegúrate de que el usuario haya interactuado con el bot al menos una vez

### Error: "Plan no encontrado"
- Verifica que el plan especificado (`basic` o `premium`) exista en la base de datos
- Asegúrate de que el plan esté marcado como activo (`isactive: true`)

### Error de Conexión a Base de Datos
- Verifica que Prisma esté configurado correctamente
- Asegúrate de que la base de datos esté accesible
- Revisa las variables de entorno de conexión

### Error en Archivo de Lotes
- Verifica que el archivo exista y sea accesible
- Asegúrate de que contenga IDs válidos (solo números)
- Revisa que no haya caracteres especiales o espacios

## 📊 Ejemplos de Uso Común

### Activar Usuario VIP por 6 Meses
```bash
node activar-usuarios-premium-avanzado.js activar 123456789 premium 6
```

### Activar Grupo de Beta Testers
```bash
# Crear archivo beta-testers.txt con los IDs
node activar-usuarios-premium-avanzado.js lote beta-testers.txt premium 3
```

### Extender Suscripción de Usuario Leal
```bash
node activar-usuarios-premium-avanzado.js extender 123456789 12
```

### Revisar Estado de Usuarios Premium
```bash
node activar-usuarios-premium-avanzado.js listar premium
```

### Verificar Información Completa de Usuario
```bash
node activar-usuarios-premium-avanzado.js info 123456789
```

## 🚨 Notas de Seguridad

1. **Ejecuta estos scripts solo en entorno de producción con precaución**
2. **Haz backup de la base de datos antes de activaciones masivas**
3. **Verifica los IDs de usuario antes de ejecutar lotes grandes**
4. **Mantén un registro de las activaciones manuales realizadas**
5. **No compartas estos scripts con usuarios no autorizados**

## 📞 Soporte

Si encuentras problemas o necesitas funcionalidades adicionales:
1. Revisa los logs de error detallados que proporcionan los scripts
2. Verifica la configuración de Prisma y la conexión a base de datos
3. Asegúrate de tener los permisos necesarios para modificar la base de datos

---

**¡Importante!** Estos scripts están diseñados para uso administrativo. Úsalos responsablemente y mantén siempre backups de tu base de datos.