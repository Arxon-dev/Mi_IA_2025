# Telegram Integration Plugin for Moodle 4.5

**Integración con Telegram para Moodle - El primer plugin del mundo que unifica gamificación entre Moodle y Telegram para oposiciones.**

## 🎯 Descripción

Este plugin permite a los usuarios vincular sus cuentas de Moodle con Telegram para:

- ✅ **Gamificación unificada** entre ambas plataformas
- ✅ **Sincronización automática** de progreso y puntos
- ✅ **Tiempo real** - Los quizzes de Moodle se reflejan instantáneamente en Telegram
- ✅ **Dashboard unificado** con estadísticas combinadas
- ✅ **Sistema de códigos de verificación** de 6 dígitos
- ✅ **Multiidioma** (Español e Inglés)

## 🔧 Requisitos

- Moodle 4.5 o superior
- PHP 7.4 o superior
- Bot de Telegram configurado
- API de Telegram funcionando

## 📦 Instalación

### 1. Descargar e instalar el plugin

```bash
# Opción 1: Clonar desde repositorio
cd /path/to/moodle/local/
git clone https://github.com/tu-repo/telegram_integration.git

# Opción 2: Descargar ZIP y extraer
# Extraer en /moodle/local/telegram_integration/
```

### 2. Actualizar base de datos

```bash
# Via web: Administración del sitio > Notificaciones
# O via CLI:
php admin/cli/upgrade.php
```

### 3. Configurar el plugin

1. Ve a **Administración del sitio > Plugins > Plugins locales > Telegram Integration**
2. Configura las URLs de API:
   - **Telegram API URL**: `http://localhost:3000/api/moodle/verify-code`
   - **Webhook URL**: `http://localhost:3000/api/moodle/quiz-webhook`

## 🚀 Uso para Usuarios

### Vincular cuenta con Telegram

1. **En Moodle**: Ve a tu perfil > "Integración con Telegram"
2. **Genera código**: Haz clic en "Generar Código de Verificación"
3. **Copia el código**: Código de 6 dígitos (ej: 123456)
4. **En Telegram**: Ejecuta `/codigo_moodle` en tu bot
5. **Introduce código**: Sigue las instrucciones del bot
6. **¡Vinculado!**: Tus cuentas están ahora conectadas

### Una vez vinculado

- ✅ **Automático**: Los quizzes completados en Moodle se sincronizan con Telegram
- ✅ **Puntos unificados**: Misma gamificación en ambas plataformas  
- ✅ **Estadísticas combinadas**: Dashboard Premium en Telegram muestra progreso total
- ✅ **Tiempo real**: Sin demoras, sincronización instantánea

## 🔧 Configuración Avanzada

### Variables de entorno del bot

Asegúrate de que tu bot de Telegram tenga configurado:

```env
MOODLE_API_URL=https://campus.opomelilla.com
MOODLE_WEBSERVICE_TOKEN=tu_token_aqui
```

### Mapeo de materias

El plugin mapea automáticamente cursos/quizzes a materias:

- **Constitución**: "constitucion", "constitutional", "constitution"
- **Defensa Nacional**: "defensa", "nacional", "defense", "security"
- **RIO**: "rio", "regulation", "reglamento"
- **Y 24 materias más...**

Puedes personalizar este mapeo editando `observer.php`.

### Configuración de dificultad

El plugin determina automáticamente la dificultad basada en:

- **Fácil**: < 10 preguntas, sin límite de tiempo
- **Medio**: 10-20 preguntas o con límite de tiempo
- **Difícil**: > 20 preguntas con límite de tiempo

## 🛠️ Estructura del Plugin

```
local/telegram_integration/
├── version.php              # Metadata del plugin
├── lib.php                  # Funciones principales
├── verify.php               # Página de verificación
├── styles.css               # Estilos CSS
├── README.md                # Este archivo
├── db/
│   ├── install.xml          # Esquema de base de datos
│   └── events.php           # Configuración de eventos
├── classes/
│   └── observer.php         # Manejo de eventos
└── lang/
    ├── en/
    │   └── local_telegram_integration.php
    └── es/
        └── local_telegram_integration.php
```

## 🗄️ Tablas de Base de Datos

### `local_telegram_verification`
- Códigos de verificación y vinculaciones de usuarios

### `local_telegram_activities`  
- Actividades sincronizadas entre Moodle y Telegram

## 🔐 Seguridad

- ✅ **Códigos únicos**: Cada código de verificación es único
- ✅ **Expiración**: Los códigos expiran en 15 minutos
- ✅ **Encriptación**: Comunicación segura via HTTPS
- ✅ **Tokens seguros**: Validación de sesiones de Moodle
- ✅ **Logs de auditoría**: Registro completo de actividades

## 🐛 Solución de Problemas

### Error: "No se puede generar código"
- Verificar permisos de base de datos
- Comprobar que las tablas estén creadas correctamente

### Error: "No se conecta a API de Telegram"
- Verificar URL de API en configuración
- Comprobar que el bot de Telegram esté funcionando
- Revisar logs de error en Moodle

### Los quizzes no se sincronizan
- Verificar que el usuario esté vinculado
- Comprobar configuración de webhook
- Revisar logs de eventos

## 📊 Logs y Debugging

Los logs se almacenan en:
- **Moodle logs**: Administración del sitio > Informes > Logs
- **Error logs**: `error_log()` para debugging
- **API responses**: Revisar respuestas de curl

## 🔄 Actualizaciones

Para actualizar el plugin:

1. Reemplazar archivos del plugin
2. Ejecutar: `php admin/cli/upgrade.php`
3. Verificar configuración en administración

## 📞 Soporte

- **Documentación**: Ver documentación completa del proyecto
- **Issues**: Reportar problemas en el repositorio
- **Email**: contacto@opomelilla.com

## 📝 Licencia

GPL v3 - Ver LICENSE para más detalles.

## 🏆 Créditos

Desarrollado por **OpoMelilla** - La primera plataforma educativa unificada para oposiciones.

---

**¡Felicidades! Tienes el primer plugin del mundo que unifica Moodle y Telegram para educación. 🚀** 