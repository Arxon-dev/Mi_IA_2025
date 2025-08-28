# 📚 MANUAL DE USUARIO - SISTEMA DE SESIONES DE ESTUDIO

## 🎯 INTRODUCCIÓN

Bienvenido al sistema de sesiones de estudio de **OpoMelilla**, diseñado específicamente para oposiciones de **Permanencia en las Fuerzas Armadas Españolas (FAS)**.

Este manual te guiará paso a paso para aprovechar al máximo todas las funcionalidades disponibles.

---

## 🚀 PRIMEROS PASOS

### 1. Registro Inicial
```
/start
```
- **Qué hace**: Te registra en el sistema y te otorga 25 puntos iniciales
- **Solo necesitas hacerlo una vez**

### 2. Verificar tu Plan
```
/mi_plan
```
- **Qué hace**: Muestra tu suscripción actual y funcionalidades disponibles
- **Información incluida**: Tipo de plan, fecha de vencimiento, límites diarios

---

## 💰 PLANES DE SUSCRIPCIÓN

### 🥉 PLAN BÁSICO (€4.99/mes)
**Funcionalidades incluidas:**
- ✅ Sistema de preguntas falladas
- ✅ 100 preguntas diarias en privado
- ✅ Estadísticas básicas
- ✅ Sesiones de estudio por temas
- ✅ Simulacros exámenes oficiales (1 por día)
- ❌ Estadísticas avanzadas
- ❌ Simulacros personalizados
- ❌ Análisis con IA
- ❌ Integración con Moodle

**Comando para suscribirse:**
```
/basico
```

### 🥈 PLAN PREMIUM (€9.99/mes)
**Funcionalidades incluidas:**
- ✅ Sistema de preguntas falladas
- ✅ **Preguntas ILIMITADAS**
- ✅ Estadísticas avanzadas
- ✅ Simulacros personalizados
- ✅ Simulacros exámenes oficiales
- ✅ Integración con Moodle
- ✅ Sesiones de estudio por temas

**Comando para suscribirse:**
```
/premium
```

### Ver Todos los Planes
```
/planes
```

---

## 📖 COMANDOS DE SESIONES DE ESTUDIO POR TEMAS

### Formato General
```
/[materia][cantidad]
```

### 📋 Materias Disponibles

#### **Constitución y Derecho**
- `/constitucion[X]` - Constitución Española
- `/rjsp[X]` o `/rio[X]` - Régimen Jurídico del Sector Público
- `/derechosydeberes[X]` - Derechos y Deberes
- `/regimendisciplinario[X]` - Régimen Disciplinario
- `/iniciativasyquejas[X]` - Iniciativas y Quejas
- `/igualdad[X]` - Igualdad

#### **Defensa y Organización**
- `/defensanacional[X]` - Defensa Nacional
- `/minsdef[X]` - Ministerio de Defensa
- `/organizacionfas[X]` - Organización de las FAS
- `/emad[X]` - Estado Mayor de la Defensa
- `/seguridadnacional[X]` - Seguridad Nacional

#### **Ejércitos**
- `/et[X]` - Ejército de Tierra
- `/armada[X]` - Armada
- `/aire[X]` - Ejército del Aire y del Espacio

#### **Carrera Militar**
- `/carrera[X]` - Carrera Militar
- `/tropa[X]` - Tropa y Marinería
- `/rroo[X]` - Reales Ordenanzas

#### **Doctrina y Organismos**
- `/pdc[X]` - Publicación Doctrinal Conjunta
- `/pac[X]` - Publicación de Adiestramiento Conjunto
- `/omi[X]` - Organismos Militares Internacionales

#### **Organismos Internacionales**
- `/onu[X]` - Organización de las Naciones Unidas
- `/otan[X]` - Organización del Tratado del Atlántico Norte
- `/osce[X]` - Organización para la Seguridad y Cooperación en Europa
- `/ue[X]` - Unión Europea
- `/misionesinternacionales[X]` - Misiones Internacionales

### 📝 Ejemplos de Uso
```
/constitucion20    → 20 preguntas sobre Constitución
/pdc50            → 50 preguntas sobre Doctrina
/pac5             → 5 preguntas sobre PAC
/et15             → 15 preguntas sobre Ejército de Tierra
/armada10         → 10 preguntas sobre Armada
```

**Rango permitido**: 1-50 preguntas por sesión

---

## 🎯 SISTEMA DE PREGUNTAS FALLADAS

### ¿Qué son las Preguntas Falladas?
Son preguntas que has respondido incorrectamente en sesiones anteriores. El sistema las guarda automáticamente para que puedas repasar específicamente tus puntos débiles.

### Comandos de Preguntas Falladas

#### **Falladas Generales (todas las materias)**
```
/falladas[X]      → X preguntas falladas de todas las materias
```

**Ejemplos:**
```
/falladas5        → 5 preguntas falladas de cualquier materia
/falladas15       → 15 preguntas falladas de cualquier materia
/falladas         → 5 preguntas falladas (cantidad por defecto)
```

#### **Falladas por Materia Específica**
```
/[materia]falladas[X]  → X preguntas falladas de una materia específica
```

**Ejemplos:**
```
/constitucionfalladas8  → 8 preguntas falladas de Constitución
/pdcfalladas10         → 10 preguntas falladas de Doctrina
/pacfalladas5          → 5 preguntas falladas de PAC
/etfalladas12          → 12 preguntas falladas de Ejército de Tierra
```

### 💡 Estrategia Recomendada
1. **Realiza una sesión normal**: `/pdc50`
2. **Si fallas 8 preguntas**: Usa `/pdcfalladas8`
3. **Repite hasta dominar**: Convierte tus errores en aciertos

---

## 🎲 PREGUNTAS ALEATORIAS

### Comando
```
/aleatorias[X]    → X preguntas aleatorias de todas las materias
```

### Ejemplos
```
/aleatorias10     → 10 preguntas aleatorias
/aleatorias25     → 25 preguntas aleatorias
/aleatorias50     → 50 preguntas aleatorias
```

**Ideal para**: Repaso general, calentamiento, evaluación de conocimientos globales

---

## 🎮 CONTROL DE SESIONES

### Durante una Sesión Activa

#### Cancelar Sesión
```
/stop
```
- **Qué hace**: Cancela inmediatamente la sesión actual
- **Cuándo usar**: Si necesitas parar por cualquier motivo
- **Resultado**: Recibes un resumen de tu progreso hasta ese momento

#### Ver Progreso
```
/progreso
```
- **Qué hace**: Muestra tu progreso actual en la sesión
- **Información incluida**: Preguntas respondidas, aciertos, fallos, tiempo restante

### ⏱️ Tiempo por Pregunta
- **Límite**: 1 minuto por pregunta
- **Qué pasa si se agota**: Pasa automáticamente a la siguiente pregunta
- **Notificación**: Recibes aviso de "¡Tiempo agotado!"

---

## 📋 SIMULACROS

### 🎯 Simulacros Básicos (Plan Básico y Premium)

#### Simulacros Oficiales
- **`/simulacro2018`** - Simulacro del examen oficial 2018
  - 100 preguntas del examen oficial
  - Tiempo límite: 105 minutos
  - Disponible para usuarios con plan Básico o Premium

- **`/simulacro2024`** - Simulacro del examen oficial 2024
  - 100 preguntas del examen oficial más reciente
  - Tiempo límite: 3 horas
  - Disponible para usuarios con plan Básico o Premium

#### Comandos de Control de Simulacros
- **`/simulacro_continuar`** - Continuar un simulacro en curso
- **`/simulacro_abandonar`** - Abandonar el simulacro actual
- **`/simulacro_historial`** - Ver historial de simulacros completados

### 🎖️ Simulacros Militares Premium (+ lo que tiene el Básico)

- **`/simulacro_premium_et`** - Simulacro Ejército de Tierra
  - 100 preguntas especializadas para Ejército de Tierra
  - Tiempo límite: 105 minutos
  - **Exclusivo para usuarios Premium**

- **`/simulacro_premium_aire`** - Simulacro Ejército del Aire
  - 100 preguntas especializadas para Ejército del Aire
  - Tiempo límite: 105 minutos
  - **Exclusivo para usuarios Premium**

- **`/simulacro_premium_armada`** - Simulacro Armada
  - 100 preguntas especializadas para la Armada
  - Tiempo límite: 105 minutos
  - **Exclusivo para usuarios Premium**

- **`/simulacros_premium`** - Información sobre simulacros militares
  - Muestra información general y estadísticas de simulacros militares

### 📊 Límites por Plan

| Característica | Plan Básico | Plan Premium |
|---|---|---|
| Simulacros básicos | ✅ (1/día) | ✅ (Ilimitados) |
| Simulacros et,armada, arire | ❌ | ✅ (Ilimitados) |
| Historial completo | ✅ | ✅ |

## 📊 ESTADÍSTICAS Y PROGRESO

### Ver tus Estadísticas
```
/stats
```
**Información incluida:**
- Puntos totales
- Preguntas respondidas
- Porcentaje de aciertos
- Racha actual
- Logros desbloqueados

### Rankings
```
/ranking          → Ranking general
/ranking_semanal  → Ranking de la semana
/ranking_mensual  → Ranking del mes
```

---

## 🔥 SISTEMA DE GAMIFICACIÓN

### Puntos
- **Respuesta correcta**: +10 puntos
- **Respuesta incorrecta**: +1 punto (por participación)
- **Bonus por racha**: Puntos extra por respuestas consecutivas correctas

### Rachas
- **Racha diaria**: Mantén actividad todos los días
- **Racha de aciertos**: Respuestas correctas consecutivas
- **Bonus especiales**: Multiplicadores por rachas largas

### Logros
Desbloquea logros especiales por:
- Número de preguntas respondidas
- Porcentaje de aciertos
- Rachas mantenidas
- Participación en diferentes materias

---

## 🎯 FLUJO TÍPICO DE UNA SESIÓN

### 1. Iniciar Sesión
```
/constitucion20
```
**Recibes:**
```
📚 ¡Sesión de repaso iniciada!

🎯 Materia: CONSTITUCION
📊 Preguntas: 20

⏱️ Tienes 1 minuto por pregunta
⚡ Usa /stop para cancelar
📈 Usa /progreso para ver tu estado
```

### 2. Responder Preguntas
- Recibes preguntas en formato de encuesta (poll)
- Selecciona tu respuesta
- Recibes feedback inmediato
- Automáticamente pasa a la siguiente

### 3. Finalizar Sesión
**Al completar todas las preguntas, recibes un resumen:**
```
🏁 ¡SESIÓN COMPLETADA!

📊 RESULTADOS:
✅ Aciertos: 15/20 (75%)
❌ Fallos: 5/20 (25%)
🎯 Puntos ganados: 155
⏱️ Tiempo promedio: 45s por pregunta

🔥 ¡Excelente trabajo!
```

---

## 🛠️ COMANDOS DE GESTIÓN

### Información de Cuenta
```
/mi_plan          → Ver tu suscripción actual
/stats            → Ver tus estadísticas
/planes           → Ver planes disponibles
```

### Soporte
```
/cancelar         → Información para cancelar suscripción
```
**Contacto directo**: @Carlos_esp

---

## ❓ PREGUNTAS FRECUENTES

### ¿Puedo hacer varias sesiones seguidas?
**Sí**, pero respeta los límites de tu plan:
- **Plan Básico**: 100 preguntas/día
- **Plan Premium**: Ilimitadas

### ¿Qué pasa si no termino una sesión?
- Usa `/stop` para cancelar y recibir resumen
- Las preguntas falladas se guardan automáticamente
- Puedes retomarlas con comandos de falladas

### ¿Cómo funcionan las preguntas falladas?
- Se guardan automáticamente cuando fallas
- Puedes repasarlas específicamente
- El sistema las elimina cuando las respondes correctamente

### ¿Puedo cambiar de plan?
- Usa `/premium` o `/basico` para cambiar
- Los cambios son inmediatos
- Se prorratea el costo

### ¿Las sesiones funcionan en grupos?
**No**, las sesiones de estudio son **exclusivamente privadas**. Debes escribir al bot directamente.

---

## 🎯 CONSEJOS PARA MAXIMIZAR TU ESTUDIO

### 1. **Estrategia de Repaso Inteligente**
```
1. /constitucion30     → Sesión inicial
2. /constitucionfalladas10  → Repasar errores
3. /constitucionfalladas5   → Consolidar
```

### 2. **Rutina Diaria Recomendada**
- **Mañana**: `/aleatorias10` (calentamiento)
- **Mediodía**: Sesión específica de tu materia más débil
- **Tarde**: `/falladas15` (repaso de errores)

### 3. **Seguimiento de Progreso**
- Usa `/stats` diariamente
- Mantén rachas con `/ranking`
- Enfócate en materias con menor porcentaje de aciertos

### 4. **Aprovecha las Preguntas Falladas**
- No ignores tus errores
- Repasa específicamente lo que fallas
- Convierte debilidades en fortalezas

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### "No recibo preguntas"
1. Verifica que escribes al bot **en privado**, no en el grupo
2. Asegúrate de tener suscripción activa: `/mi_plan`
3. Verifica que no hayas alcanzado tu límite diario

### "El comando no funciona"
1. Verifica la sintaxis: `/constitucion20` (sin espacios)
2. Asegúrate de que la cantidad esté entre 1-50
3. Usa `/start` si es tu primera vez

### "Se canceló mi sesión"
- Las sesiones se cancelan automáticamente por inactividad
- Usa `/progreso` para verificar el estado
- Reinicia con el mismo comando si es necesario

---

## 📞 SOPORTE TÉCNICO

**Contacto directo**: @Carlos_esp

**Para reportar problemas incluye:**
- Tu ID de usuario
- Comando que intentaste usar
- Descripción del problema
- Captura de pantalla si es posible

---

## 🎉 ¡EMPIEZA AHORA!

1. **Regístrate**: `/start`
2. **Elige tu plan**: `/planes`
3. **Comienza a estudiar**: `/constitucion10`
4. **Revisa tus errores**: `/falladas5`
5. **Sigue tu progreso**: `/stats`

**¡Buena suerte en tu preparación para obtener tu plaza de PERMANENTE!** 🍀

---

*Manual actualizado: Agosto 2025*  
*Sistema OpoMelilla v2.0*