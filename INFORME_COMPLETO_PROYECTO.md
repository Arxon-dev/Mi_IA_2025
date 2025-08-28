# Informe Completo del Proyecto OpositIA - NeuroOpositor

## Resumen Ejecutivo

Este proyecto es una plataforma integral de preparación para oposiciones que combina una aplicación web Next.js con un plugin de Moodle, integrando tecnologías de inteligencia artificial, gamificación y sistemas de pago. El sistema está diseñado para generar preguntas de examen automatizadas, proporcionar análisis de aprendizaje y ofrecer una experiencia de estudio personalizada.

## 1. Arquitectura General del Sistema

### 1.1 Componentes Principales

#### **Aplicación Web Principal (Next.js)**
- **Framework**: Next.js 14 con TypeScript
- **Base de datos**: MySQL con Prisma ORM
- **Autenticación**: Sistema integrado
- **UI**: Tailwind CSS + Componentes personalizados
- **Deployment**: Configurado para producción

#### **Plugin de Moodle (NeuroOpositor)**
- **Tipo**: Plugin local de Moodle
- **Versión**: v1.0.9-alpha
- **Compatibilidad**: Moodle 4.1+
- **Funcionalidad**: Mapa neural de conocimiento y gestión de preguntas

### 1.2 Estructura de Directorios

```
Mi_IA_2025/
├── src/                          # Código fuente Next.js
│   ├── app/                      # App Router de Next.js
│   ├── components/               # Componentes React
│   ├── services/                 # Servicios de negocio
│   ├── types/                    # Definiciones TypeScript
│   └── lib/                      # Utilidades y configuraciones
├── local/neuroopositor/          # Plugin de Moodle
├── prisma/                       # Esquemas de base de datos
├── public/                       # Archivos estáticos
├── docs/                         # Documentación
├── scripts/                      # Scripts de automatización
└── .documentacion/               # Documentación técnica
```

## 2. Funcionalidades Principales

### 2.1 Generación de Preguntas con IA

#### **Modelos de IA Soportados**
- **Google Gemini**: 2.5 Pro, 2.5 Flash, 2.0 Flash, 2.0 Flash Thinking
- **OpenAI**: GPT-4, GPT-4.5 Preview, GPT-4 Turbo, GPT-4.1, GPT-4.1 Mini
- **Anthropic**: Claude 3 Opus, Claude 3.5 Sonnet, Claude 3.7 Sonnet, Claude Sonnet 4
- **xAI**: Grok 3, Grok 3 Mini
- **DeepSeek**: DeepSeek Chat

#### **Características de Generación**
- **Tipos de preguntas**: Múltiple opción, Verdadero/Falso, Respuesta corta
- **Niveles de dificultad**: Fácil, Medio, Difícil, Experto, Maestro
- **Taxonomía de Bloom**: Integración completa con niveles cognitivos
- **Procesamiento de texto**: Chunking inteligente, límites de tokens
- **Características avanzadas**:
  - Trampas conceptuales
  - Distractores de precisión
  - Procesamiento de textos legales
  - Referencias cruzadas
  - Casos prácticos

### 2.2 Sistema de Mapas Neurales (Plugin Moodle)

#### **Funcionalidades del Plugin NeuroOpositor**
- **Visualización 3D**: Mapas neurales interactivos del conocimiento
- **Conexiones temáticas**: Relaciones entre conceptos con pesos
- **Rutas de aprendizaje**: Personalizadas según el progreso del usuario
- **Análisis de progreso**: Seguimiento detallado del dominio por tema
- **Motor de IA integrado**: Recomendaciones personalizadas

#### **Estructura de Datos del Plugin**
```sql
-- Temas principales
neuroopositor_temas (
  id, bloque, numero, titulo, descripcion,
  nivel_dificultad, posicion_x, posicion_y, posicion_z,
  color, timecreated, timemodified
)

-- Conexiones entre temas
neuroopositor_connections (
  id, tema_origen_id, tema_destino_id, tipo_conexion,
  peso, descripcion, activa, timecreated, timemodified
)

-- Progreso de usuarios
neuroopositor_user_progress (
  id, userid, tema_id, courseid, porcentaje_dominio,
  preguntas_correctas, preguntas_totales,
  tiempo_estudio_segundos, nivel_confianza,
  ultima_actividad, timecreated, timemodified
)

-- Rutas neurales
neuroopositor_neural_paths (
  id, userid, courseid, path_data, tipo_ruta,
  activa, progreso, timecreated, timemodified
)
```

### 2.3 Integración con Telegram

#### **Bot de Telegram**
- **Webhook**: Configurado en `/api/telegram/webhook`
- **Comandos disponibles**:
  - `/aleatorias5` - Preguntas aleatorias
  - Comandos de suscripción
  - Gestión de pagos
- **Notificaciones**: Sistema automatizado de envío
- **Programador**: Envío automático de preguntas

#### **Servicios de Telegram**
- `telegramService.ts`: Interacción con API de Telegram
- `subscriptionCommands.ts`: Gestión de suscripciones
- `premium-features-notification.ts`: Notificaciones premium

### 2.4 Sistema de Pagos

#### **Proveedores de Pago**
- **PayPal**: Integración completa con webhooks
- **Bizum**: Sistema de pagos español
- **Telegram Payments**: Facturas nativas de Telegram

#### **Configuración de Pagos**
- **Moneda**: EUR (España)
- **IVA**: 21% (configuración española)
- **Planes de suscripción**: Sistema flexible
- **Webhooks**: Procesamiento automático de pagos

## 3. Base de Datos y Modelos

### 3.1 Esquema Principal (Prisma)

#### **Modelos de Preguntas**
```prisma
model aire {
  id                    Int      @id @default(autoincrement())
  questionnumber        Int?
  question              String   @db.Text
  options               String   @db.Text
  correctanswerindex    Int
  category              String?
  difficulty            String?
  isactive              Boolean  @default(true)
  sendcount             Int      @default(0)
  lastsuccessfulsendat  DateTime?
  feedback              String?  @db.Text
  type                  String?
  bloomlevel            String?
  updatedat             DateTime @default(now())
  title                 String?
  // Metadatos adicionales...
}
```

#### **Configuración de IA**
```prisma
model aiconfig {
  id                          String    @id @default(cuid())
  provider                    String
  model                       String
  temperature                 Float?
  maxtokens                   Int?
  systemprompt                String?   @db.Text
  textprocessing              Json?
  format                      Json?
  feedback                    Json?
  distribution                Json?
  questionsperchunk           Int?
  telegramscheduler           Json?
  createdat                   DateTime  @default(now())
  updatedat                   DateTime  @updatedAt
}
```

#### **Características de IA**
```prisma
model aifeatures {
  id                    String   @id @default(cuid())
  concepttrap           Boolean  @default(false)
  precisiondistractors  Boolean  @default(false)
  createdat             DateTime @default(now())
  updatedat             DateTime @updatedAt
}
```

### 3.2 Modelos de Datos por Categoría

El sistema incluye modelos especializados para diferentes áreas de oposiciones:
- `armada` - Preguntas de la Armada
- `carrera` - Preguntas de carrera administrativa
- `constitucion` - Preguntas constitucionales
- `defensanacional` - Preguntas de defensa nacional
- `derechosydeberes` - Preguntas de derechos y deberes

## 4. Servicios y APIs

### 4.1 Servicios Principales

#### **AIService** (`src/services/aiService.ts`)
- **Funcionalidad**: Gestión de modelos de IA y generación de preguntas
- **Características**:
  - Soporte multi-proveedor (OpenAI, Google, Anthropic, xAI, DeepSeek)
  - Gestión de API keys
  - Configuración de prompts
  - Procesamiento de texto por chunks
  - Validación de respuestas

#### **PaymentService** (`src/services/paymentService.ts`)
- **Funcionalidad**: Procesamiento de pagos
- **Integraciones**: PayPal, Bizum, Telegram Payments
- **Características**:
  - Creación de facturas
  - Procesamiento de webhooks
  - Gestión de suscripciones
  - Cálculo de IVA

#### **SubscriptionService**
- **Funcionalidad**: Gestión de suscripciones de usuarios
- **Características**:
  - Planes flexibles
  - Renovación automática
  - Integración con pagos
  - Notificaciones

#### **TelegramService**
- **Funcionalidad**: Interacción con Telegram Bot API
- **Características**:
  - Envío de mensajes
  - Gestión de comandos
  - Webhooks
  - Notificaciones programadas

### 4.2 Endpoints de API

#### **Estructura de APIs** (`src/app/api/`)
```
api/
├── admin/                    # Administración
├── ai-config/               # Configuración de IA
├── payments/                # Pagos
│   ├── paypal/             # PayPal específico
│   └── bizum/              # Bizum específico
├── telegram/               # Telegram Bot
│   └── webhook/            # Webhook de Telegram
└── tournaments/            # Torneos y competiciones
```

## 5. Interfaz de Usuario

### 5.1 Componentes Principales

#### **Header** (`src/components/Header.tsx`)
- **Funcionalidades**:
  - Navegación principal
  - Cambio de tema (claro/oscuro)
  - Notificaciones
  - Logo y branding
  - Navegación responsive

#### **Sidebar** (`src/components/Sidebar.tsx`)
- **Funcionalidades**:
  - Menú de navegación lateral
  - Categorización de funciones
  - Badges para nuevas características
  - Submenús expandibles
  - Iconografía consistente

### 5.2 Páginas y Vistas

#### **Dashboard Principal**
- Panel de control con métricas
- Acceso rápido a funcionalidades
- Progreso del usuario
- Recomendaciones personalizadas

#### **Generador de Esquemas**
- Interfaz para creación de esquemas con IA
- Configuración avanzada de parámetros
- Vista previa en tiempo real

#### **Configuración de IA**
- Gestión de modelos y proveedores
- Configuración de prompts
- Pruebas de API keys
- Ajustes de parámetros

## 6. Características Técnicas Avanzadas

### 6.1 Gestión de Prompts

El sistema incluye un conjunto completo de prompts especializados:

- **expertPrompt**: Instrucciones para expertos en la materia
- **formatPrompt**: Formato y estructura de preguntas
- **difficultyPrompt**: Calibración de dificultad
- **distractorsPrompt**: Generación de distractores efectivos
- **documentationPrompt**: Procesamiento de documentación
- **qualityPrompt**: Control de calidad
- **telegramPrompt**: Optimización para Telegram

### 6.2 Procesamiento de Texto

#### **Características**
- **Chunking inteligente**: División automática de textos largos
- **Límites de tokens**: Gestión automática según el modelo
- **Procesamiento por secciones**: Mantenimiento del orden
- **Optimización de prompts**: Truncado inteligente

### 6.3 Sistema de Gamificación

#### **Logros** (modelo `achievement`)
```prisma
model achievement {
  id          String   @id @default(cuid())
  name        String
  description String
  icon        String
  category    String
  condition   String
  points      Int
  rarity      String
  isactive    Boolean  @default(true)
  createdat   DateTime @default(now())
}
```

#### **Características**
- Sistema de puntos
- Categorías de logros
- Niveles de rareza
- Condiciones personalizables

## 7. Configuración y Deployment

### 7.1 Variables de Entorno

```env
# Base de datos
DATABASE_URL="mysql://..."

# APIs de IA
NEXT_PUBLIC_GPT_API_KEY="..."
GOOGLE_API_KEY="..."
ANTHROPIC_API_KEY="..."
XAI_API_KEY="..."
DEEPSEEK_API_KEY="..."

# Telegram
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."

# Pagos
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
BIZUM_API_KEY="..."
```

### 7.2 Configuración de Producción

#### **Next.js Config** (`next.config.js`)
- Optimizaciones de build
- Configuración de imágenes
- Variables de entorno
- Redirects y rewrites

#### **Tailwind Config** (`tailwind.config.ts`)
- Tema personalizado
- Colores corporativos
- Componentes extendidos
- Responsive design

## 8. Scripts y Automatización

El proyecto incluye numerosos scripts de automatización:

### 8.1 Scripts de Base de Datos
- `activar_ranking.js` - Activación de rankings
- `actualizar_*.js` - Scripts de actualización
- `backup_*.js` - Scripts de respaldo
- `limpiar_*.js` - Scripts de limpieza

### 8.2 Scripts de Análisis
- `analizar_datos.js` - Análisis de datos
- `debug_*.js` - Scripts de depuración
- `test_*.js` - Scripts de pruebas

### 8.3 Scripts de Configuración
- `configurar_*.js` - Scripts de configuración
- `importar_*.js` - Scripts de importación
- `migrar_*.js` - Scripts de migración

## 9. Documentación y Correcciones

### 9.1 Documentación Técnica

El proyecto incluye documentación exhaustiva en `.documentacion/`:
- Guías de configuración
- Documentación de APIs
- Manuales de usuario
- Guías de troubleshooting

### 9.2 Historial de Correcciones

Se mantiene un registro detallado de correcciones:
- `CORRECCION-*.md` - Documentos de correcciones
- `SOLUCION-*.md` - Soluciones implementadas
- `ERRORES-CORREGIDOS-*.md` - Registro de errores corregidos

## 10. Seguridad y Mejores Prácticas

### 10.1 Seguridad
- **Autenticación**: Sistema robusto de autenticación
- **Autorización**: Control de acceso basado en roles
- **Validación**: Validación exhaustiva de inputs
- **Sanitización**: Limpieza de datos de entrada
- **HTTPS**: Comunicación segura
- **API Keys**: Gestión segura de claves

### 10.2 Mejores Prácticas
- **TypeScript**: Tipado estático completo
- **ESLint**: Linting de código
- **Prettier**: Formateo consistente
- **Git**: Control de versiones estructurado
- **Testing**: Scripts de pruebas automatizadas
- **Monitoring**: Logs y monitoreo

## 11. Rendimiento y Optimización

### 11.1 Optimizaciones de Frontend
- **Next.js 14**: App Router para mejor rendimiento
- **Lazy Loading**: Carga diferida de componentes
- **Image Optimization**: Optimización automática de imágenes
- **Bundle Splitting**: División inteligente de código
- **Caching**: Estrategias de caché avanzadas

### 11.2 Optimizaciones de Backend
- **Prisma ORM**: Consultas optimizadas
- **Connection Pooling**: Pool de conexiones de BD
- **Caching**: Caché de consultas frecuentes
- **Chunking**: Procesamiento por lotes
- **Rate Limiting**: Limitación de velocidad de API

## 12. Escalabilidad y Futuro

### 12.1 Arquitectura Escalable
- **Microservicios**: Separación de responsabilidades
- **API First**: Diseño API-first
- **Database Sharding**: Preparado para particionado
- **CDN Ready**: Preparado para CDN
- **Container Ready**: Preparado para contenedores

### 12.2 Roadmap Futuro
- **Más modelos de IA**: Integración de nuevos proveedores
- **Análisis avanzado**: Machine Learning para recomendaciones
- **Mobile App**: Aplicación móvil nativa
- **Integración LMS**: Más plataformas educativas
- **Internacionalización**: Soporte multi-idioma

## 13. Conclusiones

Este proyecto representa una solución integral y avanzada para la preparación de oposiciones, combinando:

1. **Tecnología de vanguardia**: Next.js, TypeScript, Prisma, múltiples APIs de IA
2. **Funcionalidades completas**: Generación de preguntas, mapas neurales, gamificación
3. **Integraciones robustas**: Telegram, sistemas de pago, Moodle
4. **Arquitectura escalable**: Diseño modular y extensible
5. **Experiencia de usuario**: Interfaz moderna y responsive
6. **Automatización**: Scripts y procesos automatizados
7. **Documentación**: Documentación exhaustiva y mantenida

El sistema está preparado para escalar y adaptarse a las necesidades futuras, manteniendo altos estándares de calidad, seguridad y rendimiento.

---

**Fecha del informe**: Enero 2025  
**Versión del proyecto**: v1.0.9-alpha  
**Tecnologías principales**: Next.js 14, TypeScript, Prisma, MySQL, Moodle Plugin  
**Estado**: En desarrollo activo