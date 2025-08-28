'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownContent = `
# Guía de Usuario: Generador de Preguntas GIFT para Oposiciones

¡Bienvenido al Generador de Preguntas GIFT! Esta plataforma está diseñada para ayudarte a crear preguntas de examen de alta calidad, especialmente enfocadas en el ámbito legal y militar, para tus oposiciones y estudios.

## 1. Introducción y Propósito Principal

El objetivo principal de esta herramienta es transformar tus documentos y textos base en cuestionarios interactivos en formato GIFT, listos para ser importados en plataformas como Moodle. Nos centramos en:

- **Precisión**: Preguntas basadas estrictamente en el contenido que proporcionas.
- **Profundidad**: Generación de preguntas que evalúan diferentes niveles cognitivos (Taxonomía de Bloom).
- **Retroalimentación Detallada**: Cada pregunta incluye explicaciones para facilitar el aprendizaje y la memorización.
- **Personalización**: Amplias opciones para configurar la IA, los tipos de preguntas, la dificultad y mucho más.

Está dirigido a opositores, estudiantes, educadores y cualquier persona que necesite crear material de evaluación específico y técnico.

## 2. Primeros Pasos y Configuración Inicial

### 2.1. Dashboard (Página de Inicio)

Al ingresar a la aplicación, serás recibido por el Dashboard. Aquí encontrarás:

- **Resumen General**: Estadísticas clave como documentos procesados, preguntas generadas y tokens consumidos.
- **Documentos Recientes**: Acceso rápido a los últimos documentos con los que has trabajado.
- **Configuración de IA**: Un atajo para ir a la página de configuración de la IA.

### 2.2. Configuración de IA (\`/ai-settings\`)

Esta es una sección crucial para personalizar cómo la IA genera las preguntas. Puedes acceder a ella desde el Dashboard o el menú lateral.

#### 2.2.1. Gestión de API Keys

Para que la aplicación se comunique con los diferentes modelos de Inteligencia Artificial (OpenAI, Anthropic, Google, etc.), necesitarás tus propias API keys.

- **Ubicación**: En la parte superior de la página de Configuración de IA, encontrarás el "Administrador de Claves API".
- **Funcionamiento**: Introduce tus claves API para cada proveedor que desees utilizar. La aplicación las guardará de forma segura para futuras sesiones.
- **Verificación**: El sistema intentará verificar la validez de las claves introducidas.

#### 2.2.2. Selección del Modelo de IA

- **Proveedor y Modelo**: Elige primero el proveedor (ej. Anthropic) y luego el modelo específico (ej. Claude 3.5 Sonnet) que prefieras.
- **Descripción**: Cada modelo viene con una breve descripción de sus capacidades.
- **Parámetros por Defecto**: Al seleccionar un modelo, se cargarán sus valores recomendados para "Tokens Máximos" y "Temperatura".

#### 2.2.3. Parámetros del Modelo

- **Tokens Máximos**: Define la longitud máxima de la respuesta que la IA generará. Un token es aproximadamente 4 caracteres en inglés.
- **Temperatura**: Controla la "creatividad" o aleatoriedad de las respuestas de la IA. Valores más bajos (ej. 0.2) producen respuestas más deterministas y enfocadas, mientras que valores más altos (ej. 0.8) generan respuestas más creativas pero potencialmente menos precisas. El rango suele ser de 0.0 a 1.0.
- **Restablecer**: Puedes volver a los valores predeterminados del modelo seleccionado en cualquier momento.

## 3. Flujo Principal: Generación de Preguntas a partir de Documentos

Este es el flujo de trabajo principal para crear preguntas basadas en tus materiales de estudio.

### 3.1. Paso 1: Cargar Documentos (\`/upload\`)

- **Acceso**: Desde el menú lateral "Documentos" -> "Cargar Nuevo".
- **Métodos de Carga**:
    - Haz clic en "Selecciona un archivo" para buscarlo en tu dispositivo.
    - Arrastra y suelta el archivo directamente en el área designada.
- **Formatos Soportados**: PDF, TXT, Markdown (.md), DOCX.
- **Tamaño Máximo**: 50MB por archivo.
- **Proceso**: Una vez seleccionado, haz clic en "Subir Documento". El sistema procesará el archivo y lo guardará. Serás redirigido a la lista de documentos.

### 3.2. Paso 2: Gestionar Documentos (\`/documents\`)

Esta página muestra todos los documentos que has subido.

- **Visualización**: Puedes ver tus documentos en formato de cuadrícula o lista.
- **Búsqueda y Filtros**:
    - **Buscar**: Por título del documento.
    - **Filtrar por Tipo**: Legal, Militar, Técnico, General (el tipo se infiere del nombre del archivo).
    - **Ordenar**: Por más recientes, más antiguos, o mayor número de preguntas generadas.
- **Acciones por Documento**:
    - **Ver Documento**: Te lleva a la página de detalle del documento para trabajar con él.
    - **Descargar Preguntas**: Si ya se han generado preguntas, puedes descargarlas en un archivo .txt en formato GIFT.
    - **Eliminar**: Borra el documento y sus preguntas asociadas (requiere confirmación).

### 3.3. Paso 3: Trabajar con un Documento Específico (\`/documents/[id]\`)

Al hacer clic en "Ver Documento", accedes al espacio de trabajo principal.

- **Visualización del Contenido**: Se muestra el contenido de tu documento.
- **Panel de Secciones (\`DocumentSectionSelector\`)**:
    - La aplicación intenta dividir tu documento en secciones lógicas (ej. por artículos en textos legales). Puedes ver estas secciones y su contenido.
    - **Seleccionar Sección**: Haz clic en una sección para ver su contenido y, opcionalmente, generar preguntas solo para esa parte.
- **Generación de Preguntas**:
    - **Cantidad de Preguntas**: Especifica cuántas preguntas deseas generar para la sección seleccionada o para todo el documento.
    - **Longitud de Opciones**: Define si las opciones de respuesta deben ser "muy cortas", "medias" o "largas".
    - **Botón "Generar preguntas"**: Inicia el proceso. Puede tomar un tiempo dependiendo de la longitud del texto y el modelo de IA.
    - **Modo de Progreso**: Configura si la generación se hace sobre todo el texto (\`full\`) o de forma progresiva.
- **Resultados de Validación**: Una vez generadas, las preguntas son validadas (formato GIFT y calidad). Verás un resumen de esta validación.
- **Copiar Preguntas**: Un botón te permite copiar todas las preguntas generadas en formato GIFT al portapapeles.

## 4. Funcionalidades Avanzadas de Generación (desde \`/ai-settings\`)

La página de "Configuración de IA" te permite un control granular sobre cómo se crean las preguntas:

- **Distribución de Tipos de Preguntas**: Define el porcentaje de preguntas textuales, de rellenar espacios, de identificar la incorrecta, o del tipo "ninguna es correcta". La suma debe ser 100%.
- **Niveles de Dificultad**: Similarmente, distribuye el porcentaje entre preguntas difíciles, muy difíciles y extremadamente difíciles.
- **Características Avanzadas de Distractores**:
    - **Trampas Conceptuales**: Activa esta opción para que la IA genere opciones incorrectas que usan terminología correcta pero en contextos erróneos, ideal para detectar estudio superficial.
    - **Distractores de Precisión**: Genera opciones incorrectas con variaciones sutiles pero significativas (cifras, fechas, competencias), para evaluar el conocimiento detallado.
- **Procesamiento de Texto**: Opciones como procesar el documento por secciones detectadas automáticamente o mantener el orden original de los artículos en textos legales.
- **Formato y Riqueza de la Retroalimentación**: Decide si la retroalimentación debe incluir reglas mnemotécnicas, casos prácticos, o referencias cruzadas a otras normativas.

### 4.1. Taxonomía de Bloom (\`/bloom\`)

- **Propósito**: Esta sección te permite configurar la distribución de preguntas según los seis niveles cognitivos de la Taxonomía de Bloom (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear).
- **Configuración**: Para cada nivel, puedes definir el porcentaje de preguntas deseado y activarlo o desactivarlo.
- **Impacto**: Esta configuración influye en el tipo de habilidad cognitiva que las preguntas generadas intentarán evaluar.

## 5. Generador Manual de Preguntas (\`/manual-question-generator\`)

Esta herramienta es útil si tienes un fragmento de texto específico y no quieres pasar por el proceso de carga de un documento completo.

- **Entrada**: Pega directamente el texto en el área provista.
- **Normativa**: Indica el nombre de la norma o artículo al que pertenece el texto (ej. "Ley 39/2015, Artículo 10").
- **Configuración Rápida**: Selecciona el proveedor/modelo de IA, la cantidad de preguntas a generar y la longitud de las opciones de respuesta.
- **Generación**: Haz clic en "Generar preguntas".
- **Resultados**: Las preguntas aparecerán en formato GIFT, con un botón para copiarlas. Se realizará una validación básica del formato GIFT y se mostrarán los errores si los hay.

## 6. Validador Avanzado de Preguntas (\`/validator-chat\`)

Si ya tienes preguntas en formato GIFT y quieres una revisión o feedback por parte de la IA, esta es tu herramienta.

- **Entrada**: Pega el texto fuente original (el documento base de tus preguntas) en el campo "Documento fuente". Luego, pega tus preguntas en formato GIFT en el campo principal.
- **Selección de IA**: Elige el proveedor y modelo que realizará la validación.
- **Proceso**: Haz clic en "Validar". La IA analizará tus preguntas en relación con el texto fuente y te dará feedback sobre su corrección, claridad, y adecuación.
- **Historial de Validación**: Se muestra un chat con tus entradas y las respuestas del validador. Avisos visuales te indicarán si las preguntas son consideradas válidas o no por la IA.
- **Limpiar**: El botón "Limpiar historial" borra tanto el chat de validación como el texto de las preguntas que habías pegado.

## 7. Historial (\`/history\`)

La página de Historial te permite consultar los documentos que has procesado anteriormente.

- **Información**: Verás el título, fecha, tipo, y número de preguntas generadas para cada documento.
- **Distribución Bloom**: Se muestra una barra visual con la distribución de niveles de Bloom que se aplicó (o se intentó aplicar) a ese documento.
- **Acciones**: Puedes (o podrás en futuras versiones) ver el detalle, descargar las preguntas o eliminar entradas del historial.

## 8. Consejos y Buenas Prácticas

- **Calidad del Texto Fuente**: Cuanto mejor estructurado y más claro sea tu documento original, mejores serán las preguntas generadas.
- **API Keys**: Mantén tus API keys seguras. La aplicación las necesita para funcionar, pero eres responsable de su gestión.
- **Experimenta**: Prueba diferentes modelos de IA, configuraciones de temperatura y prompts (si la personalización de prompts está disponible) para ver qué resultados se adaptan mejor a tus necesidades.
- **Revisión Manual**: Aunque la IA es potente, siempre es recomendable revisar las preguntas generadas, especialmente para exámenes críticos.
- **Feedback Detallado**: Aprovecha la retroalimentación que acompaña a cada pregunta. Está diseñada para ser una herramienta de estudio en sí misma.

## 9. Solución de Problemas Comunes (FAQ)

- **P: No se generan preguntas o aparece un error.**
    - **R**: Verifica que tu API key sea correcta y tenga saldo/créditos. Asegúrate de que el modelo de IA seleccionado esté activo y no haya excedido los límites de tu plan. Revisa que el texto no sea excesivamente largo para el modelo (la estimación de tokens te puede ayudar).

- **P: Las preguntas no son precisas o no se ajustan al texto.**
    - **R**: Intenta usar un modelo de IA más avanzado si tienes acceso a él. Ajusta la "Temperatura" a un valor más bajo (ej. 0.1-0.3) para respuestas más literales. Asegúrate de que el texto fuente sea claro y no ambiguo.

- **P: El formato GIFT no se importa correctamente en Moodle.**
    - **R**: Copia el texto de las preguntas generadas y pégalo en un validador GIFT online para verificar la sintaxis. A veces, pequeños errores de formato pueden causar problemas. La herramienta intenta generar un formato correcto, pero pueden ocurrir fallos.


¡Esperamos que esta guía te sea de utilidad! Si tienes más preguntas o encuentras algún problema, no dudes en consultar los recursos de ayuda adicionales o contactar al soporte si está disponible.
`;

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose lg:prose-xl dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdownContent}
        </ReactMarkdown>
      </article>
    </div>
  );
} 