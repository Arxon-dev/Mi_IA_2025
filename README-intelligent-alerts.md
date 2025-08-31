# 🤖 Sistema de Alertas Inteligentes - Guía Rápida

## ¿Qué es?

Un sistema automatizado que monitoriza el rendimiento de los usuarios y envía notificaciones personalizadas para mantener su motivación y mejorar su experiencia de estudio.

## 🚀 Inicio Rápido

### 1. Verificar el Estado del Sistema
```bash
npm run alerts:status
```

### 2. Ejecutar Alertas Manualmente
```bash
# Para todos los usuarios
npm run alerts:run

# Para un usuario específico
npm run alerts user 123456789
```

### 3. Ver Estadísticas
```bash
# Estadísticas generales
npm run alerts:stats

# Métricas de un usuario
npm run alerts metrics 123456789
```

### 4. Iniciar Scheduler Automático
```bash
npm run alerts:start
```

## 📊 Tipos de Alertas

| Tipo | Descripción | Cooldown |
|------|-------------|----------|
| 📉 **Caída de Rendimiento** | Precisión baja -15% | 12h |
| ⚠️ **Advertencia de Inactividad** | Menos de 5 preguntas recientes | 24h |
| ⏱️ **Tiempo de Respuesta Alto** | 1.5x más lento que promedio | 8h |
| 🔥 **Riesgo de Ruptura de Racha** | 20h sin actividad con racha ≥3 días | 6h |
| 💪 **Impulso Motivacional** | Mejora +10% en precisión | 48h |
| 📚 **Baja Frecuencia de Estudio** | 50% menos actividad que promedio | 18h |

## ⚙️ Configuración

Edita `scheduler-config.json`:

```json
{
  "intelligentAlerts": {
    "enabled": true,
    "interval": 4,
    "allowedHours": { "start": 7, "end": 22 },
    "maxAlertsPerUser": 3
  }
}
```

## 🔧 Comandos Útiles

```bash
# Ver ayuda completa
npm run alerts

# Ejecutar prueba sin enviar alertas reales
npm run alerts:test

# Ejecutar scheduler independiente
npm run alerts:scheduler
```

## 📈 Métricas Monitorizadas

- **Tendencia de Precisión**: Cambio en últimos 7 días
- **Frecuencia de Estudio**: Preguntas por día
- **Tiempo de Respuesta**: Promedio de velocidad
- **Racha Actual**: Días consecutivos activos
- **Progresión de Dificultad**: Mejora en preguntas difíciles
- **Engagement Score**: Puntuación de compromiso

## 🛠️ Solución de Problemas

### Las alertas no se envían
1. Verificar `enabled: true` en configuración
2. Comprobar horario permitido (7:00-22:00)
3. Revisar cooldowns activos

### Demasiadas alertas
1. Reducir `maxAlertsPerUser`
2. Aumentar cooldowns específicos
3. Ajustar umbrales de detección

### Ver logs detallados
```bash
# Ejecutar con información de debug
DEBUG=alerts npm run alerts:run
```

## 📁 Archivos Importantes

- `src/services/intelligentAlertsService.ts` - Lógica principal
- `src/services/notificationService.ts` - Envío de notificaciones
- `scripts/intelligent-alerts-scheduler.ts` - Scheduler automático
- `scripts/run-intelligent-alerts.ts` - Ejecución manual
- `scheduler-config.json` - Configuración
- `docs/intelligent-alerts-system.md` - Documentación completa

## 🎯 Ejemplos de Uso

### Monitoreo Diario
```bash
# Ejecutar cada mañana para ver estadísticas
npm run alerts:stats

# Ejecutar alertas si es necesario
npm run alerts:run
```

### Debugging de Usuario
```bash
# Ver métricas específicas
npm run alerts metrics 123456789

# Ejecutar alertas solo para ese usuario
npm run alerts user 123456789
```

### Configuración de Producción
```bash
# Iniciar scheduler en background
npm run alerts:start &

# Verificar que está funcionando
npm run alerts:status
```

---

💡 **Tip**: Para más detalles, consulta la [documentación completa](docs/intelligent-alerts-system.md)

🔗 **Enlaces útiles**:
- [Configuración del Scheduler](scheduler-config.json)
- [Código del Servicio](src/services/intelligentAlertsService.ts)
- [Scripts de Ejecución](scripts/)