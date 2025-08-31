# Sistema de Alertas Inteligentes - OpoMelilla 2025

## Descripción General

El Sistema de Alertas Inteligentes es una funcionalidad avanzada que monitoriza automáticamente el rendimiento de los usuarios y envía notificaciones personalizadas para mejorar su experiencia de estudio y mantener su motivación.

## Características Principales

### 🎯 Tipos de Alertas

1. **Caída de Rendimiento** (`PERFORMANCE_DROP`)
   - Detecta cuando la precisión del usuario baja significativamente
   - Umbral configurable (por defecto: -15%)
   - Cooldown: 12 horas

2. **Advertencia de Inactividad** (`INACTIVITY_WARNING`)
   - Alerta cuando el usuario tiene poca actividad reciente
   - Umbral mínimo: 5 preguntas en período reciente
   - Cooldown: 24 horas

3. **Aumento en Tiempo de Respuesta** (`RESPONSE_TIME_INCREASE`)
   - Detecta cuando el usuario tarda más en responder
   - Umbral: 1.5x el tiempo promedio histórico
   - Tiempo máximo: 45 segundos
   - Cooldown: 8 horas

4. **Riesgo de Ruptura de Racha** (`STREAK_BREAK_RISK`)
   - Previene la pérdida de rachas de estudio
   - Mínimo: 3 días de racha
   - Alerta tras 20 horas sin actividad
   - Cooldown: 6 horas

5. **Impulso Motivacional** (`MOTIVATIONAL_BOOST`)
   - Celebra mejoras en el rendimiento
   - Umbral de mejora: +10% en precisión
   - Multiplicador de frecuencia: 1.2x
   - Cooldown: 48 horas

6. **Caída en Frecuencia de Estudio** (`STUDY_FREQUENCY_DROP`)
   - Detecta reducción en la actividad de estudio
   - Umbral: 50% de la frecuencia histórica
   - Frecuencia mínima histórica: 10 preguntas
   - Cooldown: 18 horas

### 📊 Métricas de Rendimiento

El sistema calcula las siguientes métricas para cada usuario:

- **Tendencia de Precisión**: Cambio en la precisión durante los últimos 7 días
- **Frecuencia de Estudio**: Promedio de preguntas respondidas por día
- **Tiempo de Respuesta**: Tiempo promedio para responder preguntas
- **Racha Actual**: Días consecutivos con actividad
- **Progresión de Dificultad**: Mejora en el manejo de preguntas difíciles
- **Engagement Score**: Puntuación general de compromiso del usuario

## Configuración

### Archivo de Configuración

La configuración se encuentra en `scheduler-config.json`:

```json
{
  "intelligentAlerts": {
    "enabled": true,
    "interval": 4,
    "allowedHours": {
      "start": 7,
      "end": 22
    },
    "maxAlertsPerUser": 3,
    "cooldownBetweenChecks": 30,
    "alertTypes": {
      "performanceDrop": {
        "enabled": true,
        "threshold": -0.15,
        "cooldownHours": 12
      }
      // ... más tipos de alertas
    }
  }
}
```

### Parámetros de Configuración

- `enabled`: Activa/desactiva el sistema completo
- `interval`: Intervalo en horas entre ejecuciones
- `allowedHours`: Horario permitido para envío de alertas
- `maxAlertsPerUser`: Máximo de alertas por usuario por ejecución
- `cooldownBetweenChecks`: Tiempo mínimo entre verificaciones (minutos)

## Uso del Sistema

### Scripts Disponibles

#### 1. Ejecutar Alertas Manualmente
```bash
# Ejecutar para todos los usuarios
npm run alerts run

# Ejecutar para un usuario específico
npm run alerts user 123456789
```

#### 2. Ver Estadísticas
```bash
# Estadísticas generales del sistema
npm run alerts stats

# Métricas de un usuario específico
npm run alerts metrics 123456789
```

#### 3. Gestión del Scheduler
```bash
# Iniciar scheduler continuo
npm run alerts start

# Ver estado del scheduler
npm run alerts status

# Ejecutar prueba del sistema
npm run alerts test
```

### Integración con el Bot de Telegram

El sistema se integra automáticamente con el bot de Telegram a través de:

1. **NotificationService**: Gestiona el envío de notificaciones
2. **IntelligentAlertsService**: Procesa las alertas y métricas
3. **IntelligentAlertsScheduler**: Ejecuta las verificaciones programadas

## Arquitectura del Sistema

### Componentes Principales

```
📁 src/services/
├── 📄 intelligentAlertsService.ts    # Lógica principal de alertas
├── 📄 notificationService.ts         # Servicio de notificaciones

📁 scripts/
├── 📄 intelligent-alerts-scheduler.ts # Scheduler automatizado
├── 📄 run-intelligent-alerts.ts      # Script de ejecución manual

📁 config/
├── 📄 scheduler-config.json          # Configuración del sistema
```

### Flujo de Procesamiento

1. **Recopilación de Datos**: Se obtienen las métricas de rendimiento del usuario
2. **Evaluación de Reglas**: Se verifican las condiciones de cada tipo de alerta
3. **Generación de Alertas**: Se crean las alertas que cumplen las condiciones
4. **Filtrado**: Se aplican cooldowns y límites de alertas por usuario
5. **Envío**: Se envían las notificaciones a través del bot de Telegram
6. **Registro**: Se registra la actividad para estadísticas y seguimiento

## Personalización de Mensajes

Cada tipo de alerta tiene mensajes personalizados que incluyen:

- **Contexto específico**: Información relevante sobre la métrica detectada
- **Consejos prácticos**: Sugerencias para mejorar el rendimiento
- **Motivación**: Mensajes alentadores y positivos
- **Llamadas a la acción**: Invitaciones específicas para retomar el estudio

### Ejemplos de Mensajes

**Caída de Rendimiento**:
```
📉 He notado que tu precisión ha bajado un 18% esta semana. 
¡No te preocupes! Esto es normal en el proceso de aprendizaje. 
💡 Consejo: Revisa las preguntas que has fallado recientemente. 
¿Quieres hacer un repaso de tus temas más débiles?
```

**Riesgo de Ruptura de Racha**:
```
🔥 ¡Cuidado! Llevas 22 horas sin estudiar y tienes una racha de 8 días. 
¡No dejes que se rompa ahora! 
⚡ Solo necesitas responder unas pocas preguntas para mantenerla. 
¿Empezamos con un mini-quiz?
```

## Monitoreo y Estadísticas

### Métricas del Sistema

- Alertas enviadas por día/semana/mes
- Usuarios activos monitorizados
- Distribución de tipos de alertas
- Efectividad de las alertas (engagement posterior)
- Tiempo de respuesta del sistema

### Logs y Debugging

El sistema genera logs detallados para:

- Ejecuciones del scheduler
- Alertas enviadas y rechazadas
- Errores y excepciones
- Métricas de rendimiento del sistema

## Mejores Prácticas

### Para Administradores

1. **Monitoreo Regular**: Revisar estadísticas semanalmente
2. **Ajuste de Umbrales**: Optimizar según el comportamiento de usuarios
3. **Análisis de Efectividad**: Medir el impacto en el engagement
4. **Backup de Configuración**: Mantener copias de seguridad de la configuración

### Para Desarrolladores

1. **Testing**: Usar el comando `test` antes de desplegar cambios
2. **Logs**: Revisar logs regularmente para detectar problemas
3. **Performance**: Monitorear el impacto en la base de datos
4. **Escalabilidad**: Considerar el crecimiento del número de usuarios

## Solución de Problemas

### Problemas Comunes

**Las alertas no se envían**:
- Verificar que `enabled: true` en la configuración
- Comprobar el horario permitido
- Revisar los cooldowns de las alertas

**Demasiadas alertas**:
- Ajustar `maxAlertsPerUser`
- Aumentar los cooldowns
- Revisar los umbrales de detección

**Alertas irrelevantes**:
- Ajustar los umbrales específicos
- Revisar la lógica de cálculo de métricas
- Considerar desactivar tipos específicos

### Comandos de Diagnóstico

```bash
# Ver estado completo del sistema
npm run alerts status

# Ejecutar prueba sin enviar alertas reales
npm run alerts test

# Ver métricas de un usuario problemático
npm run alerts metrics <userId>
```

## Roadmap y Mejoras Futuras

### Próximas Funcionalidades

- **Machine Learning**: Predicción más precisa de patrones de estudio
- **Alertas Grupales**: Notificaciones para grupos de estudio
- **Integración con Calendario**: Alertas basadas en fechas de examen
- **Análisis Predictivo**: Predicción de abandono de usuarios
- **Personalización Avanzada**: Alertas basadas en preferencias del usuario

### Optimizaciones Técnicas

- **Cache de Métricas**: Reducir carga en la base de datos
- **Procesamiento Asíncrono**: Mejorar rendimiento para muchos usuarios
- **API REST**: Exposición de métricas para dashboards externos
- **Webhooks**: Integración con sistemas externos

---

*Documentación actualizada: Enero 2025*
*Versión del Sistema: 1.0.0*