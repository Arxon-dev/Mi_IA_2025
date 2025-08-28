# 🔧 REFERENCIA TÉCNICA - SISTEMA DE SESIONES DE ESTUDIO

## 📋 RESUMEN EJECUTIVO

Sistema completo de sesiones de estudio para oposiciones de Permanencia en las FAS, implementado en Next.js con integración de Telegram Bot, base de datos PostgreSQL y sistema de suscripciones.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Componentes Principales

#### 1. **Frontend/Backend**
- **Framework**: Next.js 14 con App Router
- **Base de datos**: PostgreSQL con Prisma ORM
- **API**: RESTful endpoints + Webhook de Telegram
- **Autenticación**: Sistema de suscripciones integrado

#### 2. **Servicios Core**
- `StudySessionService`: Gestión de sesiones de estudio
- `StudyCommandHandler`: Procesamiento inteligente de comandos
- `SubscriptionService`: Gestión de planes y suscripciones
- `GamificationService`: Sistema de puntos y rankings
- `TelegramService`: Comunicación con API de Telegram

#### 3. **Base de Datos**
- **Usuarios**: `telegramuser`, `usersubscription`
- **Sesiones**: `userstudysession`, `userstudyresponse`
- **Contenido**: 25+ tablas de preguntas por materia
- **Gamificación**: `userpoints`, `userstreak`, `userachievement`

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### Sistema de Sesiones de Estudio

#### **Comandos por materia**
- **Formato**: `/[materia][cantidad]` (ej: `/constitucion10`)
- **Preguntas aleatorias**: `/aleatorias[X]`
- **Sistema de falladas**: `/falladas[X]`, `/[materia]falladas[X]`
- **Control de sesión**: `/stop`, `/progreso`
- **Timeout automático**: 60 segundos por pregunta
- **Límites por plan**: Básico (100 preguntas/día), Premium (ilimitado)

### Sistema de Simulacros

#### **Simulacros Básicos (Plan Básico y Premium)**
- **`/simulacro2018`**: Simulacro examen oficial 2018 (100 preguntas, 105 min)
- **`/simulacro2024`**: Simulacro examen oficial 2024 (100 preguntas, 3 horas)
- **Comandos de control**: `/simulacro_continuar`, `/simulacro_abandonar`, `/simulacro_historial`
- **Límites**: Plan Básico (1 simulacro/día), Premium (ilimitados)

#### **Simulacros Militares Premium (Solo Premium)**
- **`/simulacro_premium_et`**: Ejército de Tierra (100 preguntas especializadas)
- **`/simulacro_premium_aire`**: Ejército del Aire (100 preguntas especializadas)
- **`/simulacro_premium_armada`**: Armada (100 preguntas especializadas)
- **`/simulacros_premium`**: Información y estadísticas
- **Tiempo límite**: 105 minutos por simulacro
- **Exclusivo**: Solo usuarios con plan Premium

#### **Simulacros Personalizados (Solo Premium)**
- **`/premium_simulacro`**: Crear simulacros con configuraciones específicas
- **Personalización**: Materias, cantidad de preguntas, tiempo
- **Exclusivo**: Solo usuarios con plan Premium

### Sistema de Suscripciones

#### **Comandos Soportados**
```typescript
// Mapeo de comandos en StudySessionService
export const STUDY_COMMANDS = {
  '/constitucion': 'Constitucion',
  '/defensanacional': 'DefensaNacional',
  '/rjsp': 'Rio',
  '/rio': 'Rio',
  '/minsdef': 'Minsdef',
  '/organizacionfas': 'OrganizacionFas',
  '/emad': 'Emad',
  '/et': 'Et',
  '/armada': 'Armada',
  '/aire': 'Aire',
  '/carrera': 'Carrera',
  '/tropa': 'TropaMarineria',
  '/rroo': 'Rroo',
  '/derechosydeberes': 'DerechosYDeberes',
  '/regimendisciplinario': 'RegimenDisciplinario',
  '/iniciativasyquejas': 'IniciativasQuejas',
  '/igualdad': 'Igualdad',
  '/omi': 'Omi',
  '/pac': 'Pac',
  '/seguridadnacional': 'SeguridadNacional',
  '/pdc': 'Pdc',
  '/onu': 'Onu',
  '/otan': 'Otan',
  '/osce': 'Osce',
  '/ue': 'Ue',
  '/misionesinternacionales': 'MisionesInternacionales'
} as const;
```

#### **Tipos de Sesión**
1. **Normal**: `/[materia][cantidad]` - Preguntas aleatorias de la materia
2. **Falladas**: `/[materia]falladas[cantidad]` - Solo preguntas incorrectas
3. **Aleatorias**: `/aleatorias[cantidad]` - Preguntas de todas las materias

#### **Flujo de Sesión**
```typescript
// Proceso de una sesión típica
1. parseStudyCommand() → Validar comando
2. startStudySession() → Crear sesión en BD
3. sendNextQuestion() → Enviar pregunta como poll
4. handlePollAnswer() → Procesar respuesta
5. updateSessionProgress() → Actualizar progreso
6. generateSessionCompletionMessage() → Resumen final
```

### Sistema de Preguntas Falladas

#### **Lógica de Almacenamiento**
```sql
-- Las preguntas falladas se guardan automáticamente
INSERT INTO userstudyresponse (
  userid, questionid, sourcemodel, 
  iscorrect, respondedat
) VALUES (?, ?, ?, false, NOW());
```

#### **Recuperación Inteligente**
```typescript
// Obtener preguntas falladas por materia
async getFailedQuestions(userid: string, subject: string, limit: number) {
  // Consulta preguntas respondidas incorrectamente
  // Excluye preguntas ya respondidas correctamente posteriormente
  // Ordena por frecuencia de error
}
```

### Sistema de Timeouts

#### **Scheduler de Timeouts**
```typescript
// studyTimeoutScheduler.js
- Timeout de 1 minuto por pregunta
- Cancelación automática al responder
- Progresión automática en timeout
- Cleanup de timeouts huérfanos
```

---

## 🔐 SISTEMA DE SUSCRIPCIONES

### Planes Disponibles

#### **Plan Básico (€4.99/mes)**
```typescript
{
  name: 'basic',
  price: 4.99,
  dailyquestionslimit: 100,
  dailysimulationslimit: 1,
  canusefailedquestions: true,
  canuseadvancedstats: false,
  canusesimulations: true, // Solo simulacros básicos
  canusepremiumsimulations: false,
  canusecustomsimulations: false,
  canuseaianalysis: false,
  canusemoodleintegration: false
}
```

#### **Plan Premium (€9.99/mes)**
```typescript
{
  name: 'premium',
  price: 9.99,
  dailyquestionslimit: null, // Ilimitado
  dailysimulationslimit: null, // Ilimitado
  canusefailedquestions: true,
  canuseadvancedstats: true,
  canusesimulations: true,
  canusepremiumsimulations: true, // Simulacros militares
  canusecustomsimulations: true, // Simulacros personalizados
  canuseaianalysis: true,
  canusemoodleintegration: true
}
```

### Validación de Límites
```typescript
// Verificación antes de iniciar sesión
const subscription = await SubscriptionService.getCurrentSubscription(userid);
const dailyUsage = await this.getDailyQuestionUsage(userid);
const dailySimulations = await this.getDailySimulationUsage(userid);

// Verificar límite de preguntas
if (subscription.dailyquestionslimit && 
    dailyUsage >= subscription.dailyquestionslimit) {
  return { success: false, message: 'Límite diario de preguntas alcanzado' };
}

// Verificar límite de simulacros
if (subscription.dailysimulationslimit && 
    dailySimulations >= subscription.dailysimulationslimit) {
  return { success: false, message: 'Límite diario de simulacros alcanzado' };
}

// Verificar acceso a simulacros premium
if (isSimulacroPremium && !subscription.canusepremiumsimulations) {
  return { success: false, message: 'Simulacros militares solo disponibles en plan Premium' };
}
```

---

## 🤖 INTEGRACIÓN TELEGRAM

### Webhook Principal
**Endpoint**: `/api/telegram/webhook`

#### **Tipos de Update Soportados**
```typescript
interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  poll_answer?: PollAnswer;
  pre_checkout_query?: PreCheckoutQuery;
  successful_payment?: SuccessfulPayment;
}
```

#### **Procesamiento de Comandos**
```typescript
// Flujo principal en webhook/route.ts
1. Filtrar health checks
2. Procesar pagos (pre_checkout_query, successful_payment)
3. Manejar respuestas de polls (poll_answer)
4. Procesar comandos de texto (message)
5. Enviar respuesta apropiada
```

### Envío de Polls
```typescript
// Formato de poll para Telegram
const pollData = {
  chat_id: userid,
  question: cleanedQuestion,
  options: cleanedOptions,
  is_anonymous: false,
  type: 'quiz',
  correct_option_id: correctAnswerIndex,
  explanation: 'Explicación de la respuesta'
};
```

---

## 📊 SISTEMA DE GAMIFICACIÓN

### Puntuación
```typescript
// Sistema de puntos
const POINTS = {
  CORRECT_ANSWER: 10,
  INCORRECT_ANSWER: 1,
  STREAK_BONUS: 5, // Por cada 5 respuestas correctas consecutivas
  DAILY_BONUS: 25  // Por mantener racha diaria
};
```

### Rankings
```typescript
// Tipos de ranking disponibles
- General (todos los tiempos)
- Semanal (últimos 7 días)
- Mensual (últimos 30 días)
- Por materia específica
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tablas Principales

#### **Usuarios y Suscripciones**
```sql
telegramuser {
  id: String @id
  telegramuserid: String @unique
  username: String?
  firstname: String?
  lastname: String?
  totalpoints: Int @default(0)
  lastactivity: DateTime?
}

usersubscription {
  id: String @id
  userid: String
  planid: String
  status: String
  startedat: DateTime
  expiresat: DateTime
  autorenew: Boolean @default(true)
}
```

#### **Sesiones de Estudio**
```sql
userstudysession {
  id: String @id
  userid: String
  subject: String
  totalquestions: Int
  currentindex: Int @default(0)
  status: String
  startedat: DateTime
  updatedat: DateTime
}

userstudyresponse {
  id: String @id
  userid: String
  questionid: String
  sourcemodel: String
  iscorrect: Boolean
  respondedat: DateTime
}
```

### Tablas de Contenido (25+ materias)
```sql
-- Ejemplo: Tabla de Constitución
Constitucion {
  id: String @id
  question: String
  options: String // JSON array
  correctanswer: String
  explanation: String?
  difficulty: String?
  topic: String?
}
```

---

## ⚙️ CONFIGURACIÓN Y DEPLOYMENT

### Variables de Entorno Requeridas
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Base de datos
DATABASE_URL=postgresql://user:pass@host:port/db

# Pagos
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
REDSYS_MERCHANT_CODE=your_redsys_code
REDSYS_TERMINAL=your_terminal
REDSYS_SECRET_KEY=your_secret_key

# Aplicación
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_app_url
```

### Scripts de Deployment
```bash
# Instalación
npm install

# Configurar base de datos
npx prisma generate
npx prisma db push

# Poblar datos iniciales
npx tsx scripts/poblar-prompts.js
npx tsx scripts/poblar-rewards.js

# Configurar webhook de Telegram
npx tsx scripts/setup-ngrok.ts

# Iniciar aplicación
npm run dev
```

---

## 🔍 MONITOREO Y DEBUGGING

### Scripts de Monitoreo
```bash
# Estado general del sistema
npx tsx scripts/monitor-system.ts

# Monitoreo de webhook
npx tsx scripts/monitor-webhook.ts

# Verificar base de datos
npx tsx scripts/check-tables.js

# Estadísticas de uso
npx tsx scripts/analyze-usage.ts
```

### Logs Importantes
```typescript
// Logs de sesiones de estudio
console.log('🎯 STUDY COMMAND - Materia:', subject, 'Cantidad:', quantity);
console.log('📊 POLL SENT - Usuario:', userid, 'Pregunta:', questionId);
console.log('✅ POLL ANSWER - Usuario:', userid, 'Correcto:', isCorrect);
console.log('🏁 SESSION COMPLETED - Resumen:', summary);
```

### Métricas Clave

#### Métricas de Usuario
- **Preguntas respondidas por día**
- **Simulacros completados por día**
- **Porcentaje de aciertos (preguntas y simulacros)**
- **Tiempo promedio por pregunta**
- **Tiempo promedio por simulacro**
- **Racha actual y máxima**
- **Puntos acumulados**
- **Nivel alcanzado**
- **Simulacros militares completados**
- **Historial de simulacros personalizados**

#### Métricas del Sistema
- **Usuarios activos diarios (DAU)**
- **Usuarios activos mensuales (MAU)**
- **Simulacros iniciados vs completados**
- **Tasa de conversión a premium**
- **Uso de simulacros por plan**
- **Tiempo de respuesta del webhook**
- **Errores por minuto**
- **Uptime del sistema**

#### Métricas de Simulacros
- **Simulacros básicos completados/día**
- **Simulacros militares completados/día**
- **Simulacros personalizados creados/día**
- **Tasa de abandono de simulacros**
- **Tiempo promedio de finalización**
- **Puntuación promedio por tipo de simulacro**
- **Sesiones iniciadas por día**
- **Preguntas respondidas por usuario**
- **Tasa de finalización de sesiones**
- **Uso de preguntas falladas**
- **Conversión de suscripciones**

---

## 🚨 SOLUCIÓN DE PROBLEMAS TÉCNICOS

### Problemas Comunes

#### **Webhook no recibe updates**
```bash
# Verificar configuración
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo

# Reconfigurar webhook
npx tsx scripts/setup-ngrok.ts
```

#### **Sesiones no se completan**
```sql
-- Verificar sesiones activas
SELECT * FROM userstudysession WHERE status = 'active';

-- Limpiar sesiones huérfanas
UPDATE userstudysession SET status = 'cancelled' 
WHERE status = 'active' AND updatedat < NOW() - INTERVAL '2 hours';
```

#### **Timeouts no funcionan**
```typescript
// Verificar scheduler
const scheduler = await getScheduler();
console.log('Active timeouts:', scheduler.getActiveTimeouts());

// Reiniciar scheduler
scheduler.cleanup();
```

### Herramientas de Debug
```bash
# Test de comando específico
npx tsx scripts/test-study-command.ts --command="/constitucion10" --user="123456789"

# Simular respuesta de poll
npx tsx scripts/test-poll-webhook.ts

# Verificar integridad de datos
npx tsx scripts/check-data-integrity.ts
```

---

## 📈 MÉTRICAS Y ANALYTICS

### KPIs del Sistema
```typescript
// Métricas principales a monitorear
interface SystemMetrics {
  dailyActiveUsers: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  questionsAnswered: number;
  averageSessionDuration: number;
  subscriptionConversionRate: number;
  failedQuestionsUsage: number;
}
```

### Queries de Analytics
```sql
-- Usuarios activos por día
SELECT DATE(lastactivity) as date, COUNT(*) as active_users
FROM telegramuser 
WHERE lastactivity >= NOW() - INTERVAL '30 days'
GROUP BY DATE(lastactivity);

-- Sesiones por materia
SELECT subject, COUNT(*) as sessions, 
       AVG(currentindex) as avg_questions
FROM userstudysession 
WHERE startedat >= NOW() - INTERVAL '7 days'
GROUP BY subject;

-- Tasa de aciertos por usuario
SELECT userid, 
       COUNT(*) as total_answers,
       SUM(CASE WHEN iscorrect THEN 1 ELSE 0 END) as correct_answers,
       ROUND(SUM(CASE WHEN iscorrect THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM userstudyresponse
GROUP BY userid
HAVING COUNT(*) >= 10;
```

---

## 🔮 ROADMAP Y MEJORAS FUTURAS

### Funcionalidades Planificadas
1. **Análisis con IA**: Recomendaciones personalizadas de estudio
2. **Simulacros adaptativos**: Dificultad que se ajusta al rendimiento
3. **Integración Moodle**: Sincronización bidireccional
4. **App móvil nativa**: Experiencia optimizada para móviles
5. **Sistema de grupos de estudio**: Competencias entre equipos

### Optimizaciones Técnicas
1. **Cache de preguntas**: Redis para mejorar rendimiento
2. **CDN para imágenes**: Optimización de carga de contenido
3. **Microservicios**: Separación de responsabilidades
4. **Monitoring avanzado**: Alertas proactivas
5. **Backup automático**: Estrategia de recuperación de desastres

---

## 📞 CONTACTO TÉCNICO

**Desarrollador Principal**: @Carlos_esp  
**Repositorio**: Privado  
**Documentación**: Este archivo + comentarios en código  
**Soporte**: Telegram @Carlos_esp

---

*Documentación técnica actualizada: Enero 2025*  
*Sistema OpoMelilla v2.0*