# 📊 Sistema de Analytics Avanzado para Telegram

## 🎯 Descripción

Este sistema proporciona analytics avanzados y personalizados para usuarios del bot de Telegram, integrado con Moodle. Permite a los usuarios ver su progreso, recibir recomendaciones personalizadas y comparar su rendimiento con otros usuarios.

## 🚀 Características Principales

### Para Usuarios
- **📈 Analytics Personal**: Progreso, precisión, puntos y nivel
- **📚 Rendimiento por Temas**: Análisis detallado por sección
- **💡 Recomendaciones**: Sugerencias personalizadas basadas en rendimiento
- **🏆 Logros**: Sistema de badges y reconocimientos automáticos
- **📅 Progreso Temporal**: Evolución del aprendizaje a lo largo del tiempo

### Para Administradores
- **🏆 Rankings Globales**: Comparativas entre todos los usuarios
- **📊 Estadísticas del Sistema**: Métricas globales y tendencias
- **⚠️ Temas Difíciles**: Identificación de áreas problemáticas
- **📈 Análisis de Popularidad**: Temas más y menos populares

## 📁 Estructura de Archivos

```
local/telegram_integration/
├── my-advanced-analytics.php          # Analytics personal para usuarios
├── global-rankings.php                # Rankings globales
├── setup-advanced-analytics.php       # Configuración inicial
├── test-advanced-analytics.php        # Pruebas del sistema
├── install-analytics.php              # Instalación automática
├── blocks/
│   └── analytics_nav.php             # Bloque de navegación
├── db/
│   └── menu.php                      # Menú de administración
└── README-ANALYTICS.md               # Esta documentación
```

## 🗄️ Tablas de Base de Datos

### Tablas Principales
- `mdl_local_telegram_user_topic_performance`: Rendimiento por temas
- `mdl_local_telegram_user_responses`: Respuestas individuales detalladas
- `mdl_local_telegram_study_sessions`: Sesiones de estudio
- `mdl_local_telegram_achievements`: Sistema de logros
- `mdl_local_telegram_recommendations`: Recomendaciones personalizadas
- `mdl_local_telegram_progress_timeline`: Progreso temporal

## 🛠️ Instalación

### 1. Configuración Inicial
```bash
# Acceder a la página de configuración
https://campus.opomelilla.com/local/telegram_integration/setup-advanced-analytics.php
```

### 2. Instalación Automática
```bash
# Ejecutar el script de instalación
https://campus.opomelilla.com/local/telegram_integration/install-analytics.php
```

### 3. Datos de Prueba (Opcional)
```bash
# Insertar datos de prueba para verificar funcionamiento
https://campus.opomelilla.com/local/telegram_integration/test-advanced-analytics.php
```

## 📊 Uso del Sistema

### Para Usuarios

#### Acceso a Analytics Personal
1. Ir a: `https://campus.opomelilla.com/local/telegram_integration/my-advanced-analytics.php`
2. Ver estadísticas personales:
   - Puntos totales y nivel
   - Precisión global
   - Rendimiento por temas
   - Recomendaciones personalizadas
   - Logros recientes

#### Comandos de Telegram
- `/analytics_avanzado`: Ver analytics personal
- `/recomendaciones`: Ver recomendaciones detalladas
- `/temas`: Análisis por temas específicos

### Para Administradores

#### Rankings Globales
1. Ir a: `https://campus.opomelilla.com/local/telegram_integration/global-rankings.php`
2. Ver comparativas:
   - Top usuarios por puntos
   - Top usuarios por precisión
   - Top usuarios por racha
   - Temas más populares
   - Temas más difíciles

## 🎨 Características Visuales

### Gráficos Interactivos
- **Chart.js**: Gráficos de barras, líneas y donas
- **Responsive Design**: Adaptable a diferentes dispositivos
- **Colores Intuitivos**: Verde para bueno, amarillo para medio, rojo para malo

### Pestañas Organizadas
- **Resumen**: Vista general del progreso
- **Temas**: Análisis detallado por sección
- **Ranking**: Comparativas con otros usuarios
- **Logros**: Badges y reconocimientos

## 🔧 Configuración Avanzada

### Personalización de Logros
Los logros se otorgan automáticamente cuando:
- **Topic Master**: Precisión ≥90% en un tema con ≥10 preguntas
- **Streak Master**: Racha de ≥10 aciertos consecutivos
- **Accuracy King**: Precisión global ≥90%

### Personalización de Recomendaciones
Las recomendaciones se generan cuando:
- **Practice Topic**: Precisión <70% en un tema
- **Review Failed**: Preguntas fallidas pendientes
- **Challenge Yourself**: Sugerencias para mejorar nivel

## 📈 Métricas Disponibles

### Métricas de Usuario
- Puntos totales y nivel
- Precisión global y por temas
- Mejor racha de aciertos
- Tiempo promedio de respuesta
- Preguntas respondidas por día

### Métricas Globales
- Total de usuarios activos
- Puntos promedio del sistema
- Precisión promedio del sistema
- Temas más y menos populares
- Rankings de usuarios

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. "Usuario no encontrado"
**Causa**: Usuario no tiene cuenta de Telegram vinculada
**Solución**: Usar comando `/vincular` en el bot de Telegram

#### 2. "No hay datos disponibles"
**Causa**: Usuario no ha respondido preguntas recientemente
**Solución**: Practicar más preguntas en el bot

#### 3. "Error de base de datos"
**Causa**: Tablas no creadas correctamente
**Solución**: Ejecutar `setup-advanced-analytics.php`

### Verificación del Sistema
```bash
# Verificar tablas
https://campus.opomelilla.com/local/telegram_integration/install-analytics.php

# Insertar datos de prueba
https://campus.opomelilla.com/local/telegram_integration/test-advanced-analytics.php
```

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Exportar analytics a PDF
- [ ] Gráficos más avanzados (heatmaps, radar charts)
- [ ] Notificaciones automáticas de progreso
- [ ] Integración con badges de Moodle
- [ ] API para aplicaciones externas

### Optimizaciones Técnicas
- [ ] Caché de consultas frecuentes
- [ ] Compresión de datos históricos
- [ ] Backups automáticos de analytics
- [ ] Migración a base de datos dedicada

## 📞 Soporte

### Contacto
- **Desarrollador**: Carlos Espinosa
- **Email**: carlos@opomelilla.com
- **Telegram**: @carlos_esp

### Recursos Útiles
- [Documentación de Chart.js](https://www.chartjs.org/docs/)
- [Guía de Moodle Plugins](https://docs.moodle.org/dev/Plugin_types)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

**Versión**: 1.0.0  
**Última actualización**: <?= date('Y-m-d') ?>  
**Compatibilidad**: Moodle 4.0+, PHP 8.0+ 