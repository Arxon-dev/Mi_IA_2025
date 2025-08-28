# NeuroOpositor - Plugin Moodle
## Plugin de Moodle para Aprendizaje Neural en Oposiciones Militares

---

## 📋 ÍNDICE
1. [Análisis de Contenido](#análisis-de-contenido)
2. [Arquitectura Neural](#arquitectura-neural)
3. [Matriz de Conexiones](#matriz-de-conexiones)
4. [Plan de Implementación](#plan-de-implementación)
5. [Especificaciones Técnicas](#especificaciones-técnicas)
6. [Roadmap de Desarrollo](#roadmap-de-desarrollo)

---

## 🎯 ANÁLISIS DE CONTENIDO

### Estructura Temática Identificada

**BLOQUE I: FUNDAMENTOS CONSTITUCIONALES Y ORGANIZATIVOS**
- Tema 1: Constitución
- Tema 2: Ley Orgánica 5/2005, de la Defensa Nacional
- Tema 3: Régimen Jurídico del Sector Público
- Tema 4: Real Decreto 205/2024, Ministerio de Defensa
- Tema 5: Organización básica de las Fuerzas Armadas
- Tema 6.1-6.5: Organización específica por ejércitos

**BLOQUE II: RÉGIMEN JURÍDICO Y DISCIPLINARIO**
- Tema 1: Ley 8/2006, Tropa y Marinería
- Tema 2: Real Decreto 96/2009, Reales Ordenanzas
- Tema 3: Ley Orgánica 9/2011, derechos y deberes FAS
- Tema 4: Ley Orgánica 8/2014, Régimen Disciplinario
- Tema 5: Real Decreto 176/2014, iniciativas y quejas
- Tema 6: Ley Orgánica 3/2007, igualdad efectiva
- Tema 7: Observatorio militar para la igualdad
- Tema 8: Ley 39/2015, Procedimiento Administrativo

**BLOQUE III: SEGURIDAD Y RELACIONES INTERNACIONALES**
- Tema 1: Ley 36/2015, Seguridad Nacional
- Tema 2: PDC-01(B) Doctrina para el empleo de las FAS
- Tema 3: Organización de las Naciones Unidas (ONU)
- Tema 4: Organización del Tratado del Atlántico Norte (OTAN)
- Tema 5: Organización para la Seguridad y Cooperación en Europa (OSCE)
- Tema 6: Unión Europea (UE)
- Tema 7: España y su participación en Misiones Internacionales

---

## 🧠 ARQUITECTURA NEURAL

### Nodos Principales (21 Temas)

```
BLOQUE I: FUNDAMENTOS
├── Nodo 1.1: Constitución [NÚCLEO CENTRAL]
├── Nodo 1.2: Defensa Nacional
├── Nodo 1.3: Régimen Jurídico
├── Nodo 1.4: Ministerio Defensa
├── Nodo 1.5: Organización FFAA
└── Nodos 1.6: Organización Específica (5 subnodos)

BLOQUE II: RÉGIMEN JURÍDICO
├── Nodo 2.1: Tropa y Marinería
├── Nodo 2.2: Reales Ordenanzas
├── Nodo 2.3: Derechos y Deberes
├── Nodo 2.4: Régimen Disciplinario
├── Nodo 2.5: Iniciativas y Quejas
├── Nodo 2.6: Igualdad Efectiva
├── Nodo 2.7: Observatorio Igualdad
└── Nodo 2.8: Procedimiento Administrativo

BLOQUE III: SEGURIDAD INTERNACIONAL
├── Nodo 3.1: Seguridad Nacional
├── Nodo 3.2: Doctrina Empleo FFAA
├── Nodo 3.3: ONU
├── Nodo 3.4: OTAN
├── Nodo 3.5: OSCE
├── Nodo 3.6: Unión Europea
└── Nodo 3.7: Misiones Internacionales
```

### Subnodos Conceptuales por Tema

**Ejemplo: Nodo 1.1 - Constitución**
- Derechos fundamentales
- Organización territorial del Estado
- División de poderes
- La Corona
- Fuerzas Armadas en la Constitución
- Reforma constitucional

**Ejemplo: Nodo 2.4 - Régimen Disciplinario**
- Faltas disciplinarias
- Sanciones
- Procedimiento sancionador
- Recursos
- Prescripción
- Responsabilidad patrimonial

---

## 🔗 MATRIZ DE CONEXIONES

### Conexiones Directas (Mismo Marco Legal)
- Constitución ↔ Defensa Nacional
- Régimen Jurídico ↔ Procedimiento Administrativo
- Derechos y Deberes ↔ Régimen Disciplinario
- Organización FFAA ↔ Organización Específica

### Conexiones Conceptuales (Misma Área)
- Tropa y Marinería ↔ Reales Ordenanzas
- Igualdad Efectiva ↔ Observatorio Igualdad
- ONU ↔ OTAN ↔ UE ↔ OSCE (Organizaciones Internacionales)
- Seguridad Nacional ↔ Misiones Internacionales

### Conexiones Prácticas (Aplicación Real)
- Doctrina Empleo ↔ Misiones Internacionales
- Iniciativas y Quejas ↔ Procedimiento Administrativo
- Régimen Disciplinario ↔ Derechos y Deberes
- Ministerio Defensa ↔ Organización FFAA

### Conexiones Temporales (Secuencia Procesal)
- Procedimiento Administrativo → Iniciativas y Quejas → Régimen Disciplinario
- Seguridad Nacional → Doctrina Empleo → Misiones Internacionales
- Constitución → Defensa Nacional → Organización FFAA

---

## 🛠️ PLAN DE IMPLEMENTACIÓN

### FASE 1: FUNDACIÓN NEURAL (Semanas 1-4)

**Objetivos:**
- Crear la estructura base de datos
- Implementar el motor de conexiones
- Desarrollar la matriz de 21 temas

**Tareas:**
1. **Diseño de Base de Datos**
   - Tabla `temas` (21 registros)
   - Tabla `subnodos` (conceptos por tema)
   - Tabla `conexiones` (relaciones entre nodos)
   - Tabla `usuarios` y `progreso_usuario`

2. **Motor de Conexiones**
   - Algoritmo de detección de conexiones
   - Sistema de pesos por tipo de conexión
   - Cálculo de fortaleza de conexiones

3. **API Base**
   - Endpoints para temas y conexiones
   - Sistema de autenticación
   - Middleware de logging

**Entregables:**
- Base de datos funcional
- API REST básica
- Documentación técnica

### FASE 2: INTERFAZ NEURAL (Semanas 5-8)

**Objetivos:**
- Crear el dashboard principal
- Implementar visualización 2D del mapa neural
- Sistema básico de preguntas

**Tareas:**
1. **Dashboard Principal**
   - Componente de mapa neural 2D
   - Panel de progreso por tema
   - Navegación entre bloques temáticos

2. **Sistema de Preguntas**
   - Base de datos de preguntas por tema
   - Motor de selección inteligente
   - Sistema de evaluación y feedback

3. **Gestión de Usuario**
   - Perfil de usuario
   - Historial de progreso
   - Configuración de estudio

**Entregables:**
- Interfaz web funcional
- Sistema de preguntas operativo
- Mapa neural básico

### FASE 3: INTELIGENCIA ADAPTATIVA (Semanas 9-12)

**Objetivos:**
- Implementar IA para análisis de patrones
- Sistema de recomendaciones personalizadas
- Predictor de rendimiento

**Tareas:**
1. **Motor de IA**
   - Algoritmos de machine learning
   - Análisis de patrones de estudio
   - Sistema de recomendaciones

2. **Funcionalidades Avanzadas**
   - Modo Ruta Neural
   - Modo Radar de Lagunas
   - NeuroInsights personalizados

3. **Analytics Avanzados**
   - Predictor de probabilidad de éxito
   - Análisis de conexiones emergentes
   - Optimización de rutas de estudio

**Entregables:**
- Sistema de IA funcional
- Recomendaciones personalizadas
- Analytics avanzados

### FASE 4: EXPERIENCIA PREMIUM (Semanas 13-16)

**Objetivos:**
- Visualización 3D completa
- Gamificación avanzada
- Sistema de memoria colectiva

**Tareas:**
1. **Visualización 3D**
   - Migración a Three.js
   - Interacciones 3D
   - Animaciones y efectos

2. **Gamificación**
   - Sistema de logros
   - Rankings y competiciones
   - Recompensas por progreso

3. **Memoria Colectiva**
   - Base de datos de patrones exitosos
   - Casos reales aportados por usuarios
   - Sistema de validación de contenido

**Entregables:**
- Experiencia 3D completa
- Sistema de gamificación
- Plataforma colaborativa

---

## 💻 ESPECIFICACIONES TÉCNICAS

### Stack Tecnológico

**Plugin Moodle:**
- PHP 7.4+ (compatible con Moodle 4.x)
- JavaScript ES6+ para interactividad
- Three.js para visualización 3D
- D3.js para gráficos y mapas
- CSS3 + Moodle Boost theme
- Moodle Web Services API

**Base de Datos:**
- MySQL (integrado con Moodle)
- Tablas personalizadas del plugin
- Integración con tablas existentes de preguntas
- Sistema de usuarios de Moodle

**IA y Analytics:**
- TensorFlow.js para ML en cliente
- PHP ML libraries para análisis en servidor
- Moodle Analytics API
- Moodle Search API para búsquedas

**Integración Moodle:**
- Moodle Plugin API
- Moodle Database API
- Moodle User Management
- Moodle Course Integration
- Moodle Gradebook Integration

### Arquitectura del Plugin Moodle

```
┌─────────────────────────────────────────────────────────────┐
│                    MOODLE CORE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Users     │  │   Courses   │  │    Database API     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              NEUROOPOSITOR PLUGIN                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Neural Map  │  │ Questions   │  │   AI Analytics      │ │
│  │ (3D View)   │  │ Engine      │  │   Engine            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Progress    │  │ Connections │  │   Recommendations   │ │
│  │ Tracking    │  │ Matrix      │  │   System            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 MYSQL DATABASE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Moodle      │  │ Plugin      │  │  Existing Question  │ │
│  │ Tables      │  │ Tables      │  │  Tables             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Modelo de Datos del Plugin

**Tabla: mdl_neuroopositor_temas**
```sql
CREATE TABLE mdl_neuroopositor_temas (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    bloque INT(11) NOT NULL,
    numero INT(11) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion LONGTEXT,
    nivel_dificultad INT(11) DEFAULT 1,
    posicion_x DECIMAL(10,6) DEFAULT 0,
    posicion_y DECIMAL(10,6) DEFAULT 0,
    posicion_z DECIMAL(10,6) DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3498db',
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_bloque (bloque),
    KEY idx_numero (numero)
);
```

**Tabla: mdl_neuroopositor_connections**
```sql
CREATE TABLE mdl_neuroopositor_connections (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    tema_origen_id BIGINT(10) NOT NULL,
    tema_destino_id BIGINT(10) NOT NULL,
    tipo_conexion VARCHAR(50) NOT NULL, -- 'directa', 'conceptual', 'practica', 'temporal'
    peso DECIMAL(3,2) DEFAULT 1.0,
    descripcion LONGTEXT,
    activa TINYINT(1) DEFAULT 1,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_tema_origen (tema_origen_id),
    KEY idx_tema_destino (tema_destino_id),
    KEY idx_tipo_conexion (tipo_conexion),
    FOREIGN KEY (tema_origen_id) REFERENCES mdl_neuroopositor_temas(id),
    FOREIGN KEY (tema_destino_id) REFERENCES mdl_neuroopositor_temas(id)
);
```

**Tabla: mdl_neuroopositor_user_progress**
```sql
CREATE TABLE mdl_neuroopositor_user_progress (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    tema_id BIGINT(10) NOT NULL,
    courseid BIGINT(10) NOT NULL,
    porcentaje_dominio DECIMAL(5,2) DEFAULT 0.0,
    preguntas_correctas INT(11) DEFAULT 0,
    preguntas_totales INT(11) DEFAULT 0,
    tiempo_estudio_segundos BIGINT(10) DEFAULT 0,
    nivel_confianza DECIMAL(3,2) DEFAULT 0.0,
    ultima_actividad BIGINT(10) NOT NULL,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_user_tema_course (userid, tema_id, courseid),
    KEY idx_userid (userid),
    KEY idx_tema_id (tema_id),
    KEY idx_courseid (courseid),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (tema_id) REFERENCES mdl_neuroopositor_temas(id),
    FOREIGN KEY (courseid) REFERENCES mdl_course(id)
);
```

**Tabla: mdl_neuroopositor_neural_paths**
```sql
CREATE TABLE mdl_neuroopositor_neural_paths (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    courseid BIGINT(10) NOT NULL,
    path_data LONGTEXT NOT NULL, -- JSON con la ruta neural recomendada
    tipo_ruta VARCHAR(50) NOT NULL, -- 'optima', 'refuerzo', 'exploracion'
    activa TINYINT(1) DEFAULT 1,
    progreso DECIMAL(5,2) DEFAULT 0.0,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_userid (userid),
    KEY idx_courseid (courseid),
    KEY idx_tipo_ruta (tipo_ruta),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (courseid) REFERENCES mdl_course(id)
);
```

---

## 🗓️ ROADMAP DE DESARROLLO

### Cronograma Detallado

**Semana 1-2: Configuración Plugin Moodle ✅**
- [x] Estructura básica del plugin NeuroOpositor
- [x] Archivo version.php y configuración inicial
- [x] Análisis de tablas existentes de preguntas
- [x] Setup de entorno de desarrollo Moodle
- [x] Archivos de idioma (español e inglés)
- [x] Biblioteca principal (lib.php)
- [x] Página principal (index.php)
- [x] Vistas básicas (dashboard, neuralmap)
- [x] Estilos CSS base
- [x] JavaScript principal

**Semana 3-4: Core Plugin ✅**
- [x] Implementación de install.xml (esquema de BD)
- [x] Clases PHP para manejo de datos
- [x] Integración con sistema de usuarios Moodle
- [x] Páginas principales del plugin

**Semana 5-6: Interfaz Base ✅**
- [x] Templates Mustache para vistas
- [x] JavaScript modular para interactividad
- [x] CSS integrado con tema Boost
- [x] Navegación y menús del plugin

**Semana 7-8: Mapa Neural 2D**
- [ ] Implementación con D3.js
- [ ] Visualización de nodos y conexiones
- [ ] Interactividad básica
- [ ] Responsive design

**Semana 9-10: Sistema de Preguntas**
- [ ] Base de datos de preguntas
- [ ] Motor de selección de preguntas
- [ ] Interfaz de examen
- [ ] Sistema de evaluación

**Semana 11-12: Analytics Básicos**
- [ ] Tracking de progreso usuario
- [ ] Cálculo de porcentajes de dominio
- [ ] Dashboard de estadísticas
- [ ] Reportes básicos

**Semana 13-14: IA y Recomendaciones**
- [ ] Algoritmos de detección de patrones
- [ ] Sistema de recomendaciones
- [ ] Predictor de rendimiento
- [ ] Optimización de rutas de estudio

**Semana 15-16: Visualización 3D**
- [ ] Migración a Three.js
- [ ] Mapa neural 3D interactivo
- [ ] Animaciones y transiciones
- [ ] Optimización de rendimiento

---

## 🎯 PRÓXIMOS PASOS

### Decisiones Pendientes
1. **¿Qué tecnología prefieres para el frontend?** (React confirmado)
2. **¿Base de datos?** MYSQL
DATOS DE CONEXIÓN: u449034524_moodel_telegra
Usuario MySQL: u449034524_opomelilla_25
CONTRASEÑA: Sirius//03072503//
3. **¿Hosting?** HOSTINGER
4. **¿Metodología de desarrollo?** Agile

### Preguntas para el Cliente
1. **¿Tienes ya contenido de preguntas para cada tema?** SI, YA HAY CONTENIDO DE PREGUNTAS EN LA BASE DE DATOS. LAS TABLAS DONDE SE ENCUENTRAN LAS PREGUNTAS SON:
constitucion
defensanacional
rio (que seria regimen juridico del sector publico)
minisdef
organizacionfas
emad
et
armada
aire
carrera
tropa
rroo
derechosydeberes
regimendisciplinario
iniciativasyquejas
igualdad
omi
pac
seguridadnacional
pdc
onu
otan
osce
ue
misionesinternacionales
2. **¿Hay algún sistema existente que debamos integrar?** NO
3. **¿Cuál es el presupuesto y timeline objetivo?** NO SABRIA RESPONDERTE
4. **¿Necesitas funcionalidades específicas no mencionadas?** NO

### Recursos Necesarios
- **Desarrollador Full-Stack** (tú + yo) TU DESARROLLAS YO DECIDO SI SE IMPLEMENTA DE UNA MANERA O DE OTRA.
- **Diseñador UX/UI** SI
- **Experto en contenido militar** (para validar conexiones) SI
- **Servidor de desarrollo** (local o cloud) EL PROYECTO ESTA EN MI MAQUINA LOCAL Y LA BASEDE DATOS SE ENCUENTRA EN HOSTING

---

**¿Estás listo para comenzar? ¿Por dónde quieres que empecemos?**
ESTOY LISTO. COMO ERES TU EL QUE LO VA A DESARROLLAR, ORGANIZA EL SISTEMA POR DONDE CREAS CONVENIENTE.
PARA SABER QUE ESTAS DESARROLLANDO Y QUE QUEDA PENDIENTE. VE MARCANDO LO QUE HAS COMPLETADO Y LO POR DONDE ESTAS TRABAJANDO.
*NeuroOpositor - Conectando mentes, forjando militares.*