# 🧠 ML Analytics - Sistema de Análisis Predictivo Real

## 📋 Descripción

Sistema de análisis predictivo que utiliza datos reales de rendimiento del usuario para generar:
- 🎯 **Análisis Predictivo**: Probabilidad de éxito y áreas de riesgo
- 📈 **Métricas de Aprendizaje**: Curvas de retención y eficiencia
- ⚡ **Optimización de Estudio**: Horarios óptimos y recomendaciones
- 👥 **Análisis Social**: Comparación con peers y grupos de estudio

## 🗃️ Fuentes de Datos

El sistema analiza datos de múltiples tablas:

### Tablas Principales:
- **`TelegramResponse`**: Respuestas del bot de Telegram
- **`StudyResponse`**: Sesiones de estudio estructuradas
- **`MoodleQuestionResponse`**: Respuestas en Moodle (si está integrado)
- **`TelegramUser`**: Información de usuarios

### Datos Analizados:
- ✅ Precisión por materia
- ⏱️ Tiempo de respuesta promedio
- 🚫 Tasa de timeouts
- 📊 Consistencia de estudio
- 📅 Patrones temporales

## 🚀 Instalación y Configuración

### 1. Configurar Base de Datos

Edita `db-config.php` con tus credenciales:

```php
$db_config = [
    'host' => 'localhost',        // Tu servidor PostgreSQL
    'port' => '5432',            // Puerto de PostgreSQL
    'dbname' => 'mi_ia_db',      // Nombre de tu base de datos
    'user' => 'postgres',        // Usuario de la base de datos
    'password' => 'admin123'     // Contraseña de la base de datos
];
```

### 2. Verificar Conexión

Ejecuta el test de conexión:
```
https://campus.opomelilla.com/local/telegram_integration/test-db-connection.php
```

### 3. Activar Análisis Real

En `analytics.php`, asegúrate de que esté configurado para usar datos reales:
```javascript
apiBaseUrl: '/local/telegram_integration/ml-analytics-real.php'
```

## 📊 Algoritmos Implementados

### 🎯 Análisis Predictivo

**Cálculo de Riesgo por Materia:**
```
Risk Score = (Accuracy × 40%) + (Response Time × 30%) + (Timeouts × 20%) + (Sample Size × 10%)
```

**Niveles de Riesgo:**
- 🔴 **Alto**: Score ≥ 70
- 🟡 **Medio**: Score ≥ 40
- 🟢 **Bajo**: Score < 40

### 📈 Métricas de Aprendizaje

**Curva de Retención:**
- Basada en la curva de olvido de Ebbinghaus
- Ajustada por rendimiento reciente del usuario
- Proyección a 1, 3, 7, 14 y 30 días

**Eficiencia de Aprendizaje:**
```
Efficiency = (Accuracy × 50%) + (Speed Factor × 30%) + (Consistency × 20%)
```

### ⚡ Optimización de Estudio

**Horarios Óptimos:**
- Análisis por hora del día
- Basado en precisión y velocidad de respuesta
- Recomendaciones personalizadas

**Duración Óptima:**
- Análisis de sesiones históricas
- Objetivo: 10% de mejora sobre promedio actual

### 👥 Análisis Social

**Percentil de Rendimiento:**
- Comparación con todos los usuarios activos
- Basado en precisión de últimos 30 días

**Compatibilidad para Grupos:**
- Materias compartidas
- Solapamiento de horarios de estudio
- Nivel de rendimiento similar

## 🔧 Archivos del Sistema

### Archivos Principales:
- **`ml-analytics-real.php`**: Endpoint principal del API
- **`ml-analytics-functions.php`**: Funciones de análisis
- **`db-config.php`**: Configuración de base de datos
- **`analytics.php`**: Página principal de Moodle
- **`js/analytics.js`**: Frontend JavaScript
- **`styles/analytics.css`**: Estilos CSS

### Archivos de Prueba:
- **`test-db-connection.php`**: Test de conexión a BD
- **`ml-analytics-mock.php`**: Datos simulados (backup)

## 📈 Uso y Acceso

### URL Principal:
```
https://campus.opomelilla.com/local/telegram_integration/analytics.php
```

### Requisitos:
1. ✅ Usuario logueado en Moodle
2. ✅ Cuenta de Telegram vinculada (recomendado)
3. ✅ Historial de respuestas en la base de datos

### Pestañas Disponibles:
- 🎯 **Análisis Predictivo**: Áreas de riesgo y probabilidad de éxito
- 📈 **Métricas de Aprendizaje**: Retención y eficiencia
- ⚡ **Optimización**: Horarios y duración óptima
- 👥 **Análisis Social**: Comparación y grupos de estudio

## 🐛 Resolución de Problemas

### Problema: "Database connection failed"
**Solución:**
1. Verificar credenciales en `db-config.php`
2. Comprobar que PostgreSQL esté ejecutándose
3. Verificar permisos de usuario en la base de datos

### Problema: "No data available" o áreas de riesgo vacías
**Solución:**
1. Verificar que hay datos en `TelegramResponse` o `StudyResponse`
2. Comprobar que el usuario tiene actividad reciente (30 días)
3. Ejecutar `test-db-connection.php` para diagnóstico

### Problema: Datos inconsistentes
**Solución:**
1. Verificar mapeo de materias en `db-config.php`
2. Comprobar formato de datos en tablas
3. Revisar logs de errores de PHP

## 📊 Interpretación de Resultados

### Probabilidad de Éxito:
- **90-95%**: Excelente preparación
- **80-89%**: Buena preparación, revisar áreas débiles
- **70-79%**: Preparación media, enfocar estudio
- **< 70%**: Necesita más preparación

### Confianza del Análisis:
- **Alta**: > 50 preguntas en 30 días
- **Media**: 20-50 preguntas en 30 días
- **Baja**: < 20 preguntas en 30 días

### Recomendaciones:
- Las recomendaciones se generan automáticamente basadas en patrones detectados
- Se priorizan las materias con mayor riesgo
- Se incluyen estrategias específicas por tipo de problema

## 🔄 Mantenimiento

### Actualización de Datos:
- Los datos se analizan en tiempo real
- Cache automático de 30 segundos
- Refresco automático cada 30 segundos

### Optimización:
- Índices en tablas para consultas rápidas
- Límite de 30 días para análisis (configurable)
- Paginación automática para grandes datasets

### Monitoreo:
- Logs de errores en logs de PHP
- Métricas de rendimiento en cada consulta
- Alertas automáticas para fallos de conexión

---

**Desarrollado por:** OpoMelilla Team  
**Versión:** 1.0.0  
**Última actualización:** Enero 2025