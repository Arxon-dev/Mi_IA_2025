# Análisis del Proyecto de Generación de Preguntas Moodle

## Funcionamiento General

El sistema está diseñado para generar preguntas en formato Moodle GIFT, utilizando una Inteligencia Artificial (IA) para la creación del contenido de las preguntas a partir de un texto base. Estas preguntas luego pueden ser visualizadas, gestionadas, almacenadas en una base de datos, y potencialmente importadas a una plataforma Moodle.

## Generación de Preguntas

1.  **Entrada:** Se proporciona un contenido de texto fuente.
2.  **Configuración de Generación:**
    *   Se define una distribución de tipos de preguntas (ej. textuales, espacios en blanco, identificar incorrectas, ninguna es correcta) con porcentajes específicos para cada tipo.
    *   Se define una distribución de niveles de dificultad (difícil, muy difícil, extremadamente difícil) con pesos específicos.
    *   Existen configuraciones más avanzadas para la IA, incluyendo niveles de la Taxonomía de Bloom y características especiales (ej. trampas conceptuales, distractores de precisión). Estas configuraciones pueden ser gestionadas y almacenadas en la base de datos (a través de la tabla `AIConfig` o similar, gestionada por `prismaService.ts` y definida en `aiService.ts`).
3.  **Prompt para IA:** Se construye un prompt detallado utilizando `src/services/questionGeneratorService.ts`. Este prompt instruye a la IA para:
    *   Generar un número específico de preguntas.
    *   Basarse en el contenido proporcionado.
    *   Seguir las distribuciones de tipo y dificultad configuradas.
    *   Producir las preguntas en el **formato Moodle GIFT** especificado.
    *   Incluir **retroalimentación detallada** para cada pregunta.
4.  **Salida de la IA:** La IA genera el conjunto de preguntas en formato Moodle GIFT.

## Formato de Preguntas (Moodle GIFT)

*   El sistema utiliza un parser dedicado (`src/utils/moodleGiftParser.ts`) para interpretar y procesar el formato GIFT.
*   Las preguntas se identifican y delimitan por la presencia de los caracteres `{` y `}`.
*   Se pueden incluir líneas de comentario en el archivo GIFT, que son ignoradas por el parser (líneas que empiezan con `//`).
*   Se soporta la definición de una categoría opcional para una o varias preguntas mediante el formato `::Categoría::` o `::Categoría\nTextoAdicional::`. El parser extrae esta información.
*   El contenido completo de la pregunta –incluyendo el enunciado, las opciones de respuesta (definidas dentro de los `{}`), y la retroalimentación asociada– se consolida y se denomina `rawGiftContent`.
*   Por una decisión de diseño explícita en el código (`// Note: Separate fields for options/feedback are NOT included here as per user's request`), el parser no desglosa las opciones y el feedback en campos separados dentro de su estructura de datos interna (`QuestionData`). Todo se mantiene unido en `rawGiftContent`.
*   El parser está diseñado para manejar diferentes tipos de finales de línea (Windows `\r\n` y Unix `\n`).
*   Se incluyen validaciones básicas para asegurar que los bloques de preguntas contengan los marcadores `{` y `}`. Si un bloque no cumple esta condición, se considera malformado o no es una pregunta GIFT válida, y se omite con una advertencia en la consola.
*   La función `parseSingleGiftQuestion` dentro del parser es responsable de procesar un bloque de pregunta individual. Si la pregunta incluye un prefijo de categoría (ej. `::Mi Categoría::Texto de la pregunta...`), este prefijo se elimina del `rawGiftContent` final que se almacena, aunque el nombre de la categoría se extrae y se conserva.

## Visualización y Manejo de Preguntas

*   La interfaz de usuario para la generación y gestión de preguntas se implementa como un componente React, probablemente `src/components/QuestionGenerator.tsx`.
*   Esta interfaz permite al usuario:
    *   Iniciar el proceso de generación de preguntas (disparando `onGenerate`).
    *   Visualizar las preguntas generadas por la IA.
    *   Alternar entre dos modos de visualización para cada pregunta:
        *   **Formato GIFT crudo:** Muestra el texto de la pregunta tal cual fue generado por la IA, dentro de una etiqueta `<pre>`.
        *   **Vista Moodle:** Utiliza un componente específico (`src/components/MoodleQuestionView.tsx`) para renderizar la pregunta parseada de una forma que simula su apariencia en una plataforma Moodle.
    *   El modo de visualización preferido por el usuario (`gift` o `moodle`) se guarda en el `localStorage` del navegador para persistencia entre sesiones.
*   Se proporciona funcionalidad para copiar el contenido de las preguntas generadas al portapapeles. Esto facilita la exportación manual de las preguntas para su uso en Moodle u otras plataformas compatibles con GIFT.
*   La interfaz también parece manejar la eliminación de preguntas y la interacción con una base de datos para obtener y actualizar preguntas asociadas a secciones específicas de un documento (`sectionQuestionsDB`, `fetchSectionQuestions`).
*   Existe una funcionalidad potencial para enviar preguntas individuales a Telegram (`onSendToTelegram`), lo que sugiere integraciones adicionales.

## Almacenamiento de Preguntas

*   Las preguntas generadas y gestionadas por el sistema se almacenan en una base de datos, utilizando Prisma como ORM.
*   **Tabla `Question` (Modelo de Prisma):**
    *   El `rawGiftContent` (la pregunta completa en formato GIFT, después del parseo inicial y la posible eliminación del prefijo de categoría) se almacena en el campo `content` de esta tabla.
    *   Cada pregunta se asocia a un `documentId`, que vincula la pregunta con un documento o contexto específico.
    *   Campos adicionales como `type` (tipo de pregunta, ej. 'multiplechoice'), `difficulty` (nivel de dificultad), y `bloomLevel` (nivel cognitivo según la Taxonomía de Bloom) también se almacenan. Durante la importación desde archivos GIFT, estos campos pueden tomar valores por defecto (ej. 'multiplechoice', 'unknown', `null` respectivamente) si el formato GIFT no los provee explícitamente.
*   **Script de Importación (`scripts/importMoodleQuestions.ts`):**
    *   Se proporciona un script de Node.js para importar masivamente preguntas desde archivos de texto en formato Moodle GIFT directamente a la base de datos.
    *   Este script toma la ruta del archivo `.txt` como argumento.
    *   Utiliza el `moodleGiftParser.ts` para procesar el contenido del archivo.
    *   Las preguntas parseadas se insertan en la tabla `Question` en lotes (por defecto, `BATCH_SIZE = 50`) para optimizar el rendimiento y la gestión de transacciones.
    *   Durante la importación mediante este script, todas las preguntas se asocian a un `PROVIDED_DOCUMENT_ID` (un ID de documento fijo codificado en el script).
    *   El script incluye un sistema de registro de errores (`import-errors.log`) para facilitar la depuración de problemas durante la importación.
    *   Utiliza `Prisma.$transaction` para asegurar la atomicidad en la inserción de cada lote de preguntas.

## Configuraciones Clave del Sistema

*   **Configuraciones de Generación de Preguntas (`src/services/questionGeneratorService.ts`):**
    *   **Tipos de Pregunta (`questionTypes`):** Se define un array de objetos, donde cada objeto representa un tipo de pregunta y especifica:
        *   `id`: Identificador único (ej. `textual`, `blank_spaces`).
        *   `name`: Nombre legible para el usuario (ej. "Preguntas textuales", "Espacios en blanco").
        *   `description`: Breve explicación del tipo de pregunta.
        *   `percentage`: El porcentaje deseado para este tipo de pregunta en el conjunto total generado.
    *   **Niveles de Dificultad (`difficultyLevels`):** Similar a los tipos, se define un array de objetos para los niveles de dificultad, cada uno con:
        *   `id`: Identificador único (ej. `difficult`, `extremely_difficult`).
        *   `name`: Nombre legible (ej. "Difícil", "Extremadamente difícil").
        *   `description`: Explicación del nivel de dificultad, a menudo relacionada con la complejidad cognitiva o el tipo de información que evalúa.
        *   `weight`: El peso o porcentaje deseado para este nivel de dificultad en el conjunto total.
    *   El servicio incluye validaciones para asegurar que la suma de porcentajes (para tipos) y pesos (para dificultades) sea 100%.
*   **Configuraciones de IA (`src/services/aiService.ts`, `src/services/prismaService.ts`):**
    *   Interfaces como `GenerationConfig` y `GenerateQuestionsConfig` definen la estructura de las configuraciones para la IA.
    *   Estas configuraciones pueden incluir, además de los tipos y dificultades, referencias a niveles de la Taxonomía de Bloom y la activación de "características avanzadas" de la IA (ej. `conceptualTrap`, `precisionDistractors`, `legalTextProcessing`).
    *   El `prismaService.ts` sugiere que estas configuraciones de IA (`AIConfig`) también pueden ser persistidas y recuperadas de la base de datos, permitiendo una personalización flexible del proceso de generación.

## Flujo de Uso Principal (Inferido)

1.  Un usuario o un proceso automatizado proporciona un texto fuente como base para la generación de preguntas.
2.  Se establecen o recuperan las configuraciones para la generación: cantidad de preguntas, distribución deseada de tipos y niveles de dificultad, y otras configuraciones avanzadas de la IA.
3.  El sistema, a través del `QuestionGeneratorService` y el `aiService`, construye un prompt específico y lo envía a un modelo de IA.
4.  El modelo de IA procesa el prompt y el texto fuente, y devuelve un conjunto de preguntas formuladas en formato Moodle GIFT.
5.  Estas preguntas generadas pueden ser:
    *   Visualizadas en la interfaz de usuario (`QuestionGenerator.tsx`), con la opción de ver el formato GIFT crudo o una representación estilo Moodle.
    *   Copiadas por el usuario para su importación manual en una plataforma Moodle u otro sistema compatible.
    *   Almacenadas directamente en la base de datos del sistema (tabla `Question` vía Prisma).
    *   Editadas o gestionadas dentro del sistema.
6.  Alternativamente, se pueden importar preguntas existentes desde archivos `.txt` en formato GIFT a la base de datos utilizando el script `scripts/importMoodleQuestions.ts`.

Este análisis provee una visión comprensiva del funcionamiento del proyecto en relación con la generación, manejo y almacenamiento de preguntas Moodle GIFT. 

## Implementación de Envío Directo a Moodle

Se propone añadir una funcionalidad para enviar las preguntas generadas directamente a una instancia de Moodle, permitiendo guardarlas en categorías específicas del banco de preguntas.

### Investigación de la API de Moodle (Web Services)

Para implementar esta funcionalidad, se requiere interactuar con los Web Services de Moodle. La estrategia general y las funciones clave identificadas (sujetas a verificación en la documentación de la versión específica de Moodle) son:

#### Detalles de la Instancia de Moodle del Usuario (Para Pruebas y Desarrollo)

*   **Versión de Moodle:** 4.5 (Build: 20241007)
*   **URL de la Plataforma:** `https://campus.opomelilla.com`
*   **Token de Web Service (Sensible - Guardado para referencia según solicitud del usuario bajo su responsabilidad):** `68c2d9278fc7879bb6ebd7a3032acd66`
*   **URL Documentación API Específica:** `https://campus.opomelilla.com/admin/webservice/documentation.php` (El usuario ha indicado que esta URL muestra la información de `core_files_upload` pero no encontró otras funciones relevantes directamente).
*   **Guía Creación Cliente Web Service:** `https://docs.moodle.org/dev/Creating_a_web_service_client`
*   **Documentación General de Funciones de Web Service Moodle (Referencia):** `https://docs.moodle.org/dev/Web_service_API_functions`

1.  **Autenticación:**
    *   Se necesitará la URL del sitio Moodle y un Token de Web Service.
    *   Este token debe estar asociado a un usuario de Moodle con los permisos necesarios. Para las operaciones deseadas, los permisos podrían incluir: `moodle/question:managecategory`, `moodle/question:add`, `moodle/course:manageactivities` (si las categorías se gestionan en contexto de curso), y permisos para `core_files_upload`.

2.  **Gestión de Categorías del Banco de Preguntas (Investigación Actualizada):**
    *   **Estado:** La investigación y la información proporcionada de la instancia específica del usuario (`https://campus.opomelilla.com/admin/webservice/documentation.php`) indican que **no se han encontrado funciones de Web Service estándar fácilmente identificables o directamente nombradas para la gestión granular de categorías específicas del banco de preguntas (ej. `core_question_get_categories`, `core_question_add_category`)**.
    *   **Posible Uso de Funciones de Categorías de Curso:** Funciones como `core_course_get_categories` y `core_course_create_categories` existen para gestionar categorías de cursos. Es teóricamente posible que las categorías del banco de preguntas puedan ser gestionadas usando estas funciones si se utiliza un `contextid` apropiado (ej. el contexto de un curso específico, o el contexto del sistema (`contextid=1`) para categorías "globales"). Sin embargo:
        *   Esto requiere una cuidadosa determinación del `contextid` correcto.
        *   La creación de categorías del banco de preguntas a nivel de sistema de esta manera podría no ser la práctica estándar o deseada en todas las configuraciones de Moodle.
        *   Esta aproximación necesita validación y pruebas exhaustivas en la instancia de Moodle destino.
    *   **Conclusión Parcial:** La gestión directa, programática y granular de categorías *del banco de preguntas* a través de Web Services estándar de Moodle es incierta y podría no ser factible sin soluciones alternativas o una comprensión más profunda de cómo la instancia específica maneja los contextos de estas categorías.

3.  **Importación de Preguntas (Formato GIFT) (Investigación Actualizada):**

    *   **Paso 1: Subir el archivo GIFT (`core_files_upload`) - CONFIRMADO**
        *   **Propósito:** Subir un archivo de texto (`.txt`) conteniendo las preguntas en formato GIFT al área de archivos de borrador (draft) o archivos privados del usuario en Moodle.
        *   **Disponibilidad:** Esta función está confirmada y disponible en la instancia del usuario.
        *   **Argumentos Clave (según documentación proporcionada por el usuario para su instancia):**
            *   `contextid` (int, opcional, por defecto null): ID del contexto.
            *   `component` (string, requerido): Componente (ej. 'user').
            *   `filearea` (string, requerido): Área del archivo (ej. 'draft').
            *   `itemid` (int, requerido): ID asociado (ej. 0 para nueva área de borrador, o ID de un borrador existente).
            *   `filepath` (string, requerido): Ruta dentro del área de archivos (ej. '/').
            *   `filename` (string, requerido): Nombre del archivo (ej. `preguntas_a_importar.txt`).
            *   `filecontent` (string, requerido): Contenido del archivo (el string GIFT) codificado en base64.
            *   `contextlevel` (string, opcional, por defecto null): Nivel del contexto (block, course, coursecat, system, user, module).
            *   `instanceid` (int, opcional, por defecto null): ID de la instancia asociada al nivel del contexto.
        *   **Respuesta esperada (estructura general):** Un objeto con `contextid`, `component`, `filearea`, `itemid`, `filepath`, `filename`, y `url` del archivo subido.
    *   **Paso 2: Procesar el archivo subido para la importación a una categoría - NO HAY WEBSERVICE ESTÁNDAR DIRECTO IDENTIFICADO**
        *   **Estado:** Tras la investigación (incluida la revisión de la documentación de la instancia del usuario y búsquedas generales en la documentación de Moodle 4.x), **no se ha identificado un Web Service estándar en Moodle que tome un `itemid` (del archivo subido por `core_files_upload`) y lo importe directamente a una categoría específica del banco de preguntas, especificando el formato ('gift')**.
        *   La importación de preguntas en Moodle (que ocurre, por ejemplo, a través de la interfaz web en `question/import.php`) es un proceso complejo que Moodle maneja internamente y no parece exponer de forma sencilla como un único Web Service post-subida de archivo.

### Alternativas para la Integración de la Importación y Gestión de Categorías

Dada la ausencia de Web Services estándar directos para todos los pasos deseados, se deben considerar las siguientes alternativas:

1.  **Desarrollo de un Plugin Local en Moodle (Opción Altamente Recomendada para Integración Completa):**
    *   **Descripción:** Consiste en crear un pequeño plugin personalizado para tu instancia de Moodle (ej. un plugin de tipo "local" o "admin tool").
    *   **Funcionalidad del Plugin:** Este plugin expondría nuevos Web Services personalizados que podrían:
        *   Gestionar categorías del banco de preguntas de forma granular y directa si fuera necesario (crear, listar con el contexto adecuado para el banco de preguntas).
        *   Crucialmente, ofrecer un Web Service que reciba el `itemid` de un archivo GIFT (previamente subido mediante `core_files_upload`), el `categoryid` de destino en el banco de preguntas, y el formato (`'gift'`). Este servicio utilizaría internamente las APIs de Moodle (las mismas que usa la interfaz de importación `question/import.php`) para procesar el archivo e importar las preguntas a la categoría especificada.
    *   **Ventajas:**
        *   Proporciona la integración más fluida, robusta y automatizada.
        *   Otorga control total sobre el proceso de importación y gestión de categorías.
        *   Mantiene la lógica de importación específica de Moodle dentro de Moodle.
    *   **Desventajas:**
        *   Requiere desarrollo en PHP dentro del entorno Moodle.
        *   Necesita acceso al servidor Moodle para instalar y gestionar el plugin.
    *   **Recursos de Referencia:** [Moodle Docs - Web services](https://docs.moodle.org/dev/Web_services), [Moodle Docs - Local plugins](https://docs.moodle.org/dev/Local_plugins).

2.  **Interfaz Humana Asistida (Fallback / Solución Parcialmente Automatizada):**
    *   **Descripción del Flujo:**
        1.  Tu aplicación utiliza `core_files_upload` para subir el archivo GIFT generado al área de borrador (draft) del usuario en Moodle.
        2.  Tras una subida exitosa, tu aplicación informa al usuario que el archivo ha sido subido y le proporciona un enlace profundo (si es posible construirlo) o instrucciones claras para navegar a la página de importación de preguntas de Moodle (usualmente `MOODLE_URL/question/import.php`).
        3.  El usuario debe entonces, manualmente en la interfaz de Moodle:
            *   Seleccionar el archivo subido desde su área de borrador.
            *   Elegir el formato "GIFT".
            *   Seleccionar la categoría de destino (que podría haber creado manualmente o ya existir).
            *   Completar el proceso de importación.
    *   **Ventajas:**
        *   No requiere desarrollo de plugins en Moodle.
        *   Implementable utilizando únicamente el Web Service `core_files_upload` estándar.
    *   **Desventajas:**
        *   El proceso no está completamente automatizado y requiere múltiples pasos manuales por parte del usuario dentro de Moodle.
        *   Menor fluidez en la experiencia de usuario.
        *   La creación y selección de categorías se realizaría manualmente en Moodle.

3.  **Uso de Herramientas CLI de Moodle en el Servidor (Si se tiene acceso y control):**
    *   **Descripción:** Moodle ofrece una interfaz de línea de comandos (CLI) para diversas tareas administrativas. Si tu aplicación tiene la capacidad de ejecutar comandos en el servidor donde reside Moodle (lo cual es poco común para aplicaciones cliente remotas y tiene consideraciones de seguridad), se podría:
        1.  Subir el archivo GIFT usando `core_files_upload`.
        2.  Invocar un script CLI de Moodle (existente o personalizado) que tome la ruta del archivo subido (accesible en el sistema de archivos del servidor Moodle) y lo importe a la categoría deseada.
    *   **Ventajas:** Potencial para automatización completa si la invocación remota segura es posible.
    *   **Desventajas:** Requiere acceso directo al sistema de archivos y capacidad de ejecución de comandos en el servidor Moodle, lo cual es una barrera significativa para la mayoría de las integraciones de terceros. Complejidad en la gestión de permisos y seguridad.

4.  **Web Scraping / Simulación de Navegador (Altamente Desaconsejado):**
    *   **Descripción:** Intentar automatizar la interacción con la interfaz web de Moodle mediante técnicas de web scraping para simular los clics y envíos de formularios que un usuario realizaría.
    *   **Ventajas:** Prácticamente ninguna que compense los inconvenientes.
    *   **Desventajas:** Extremadamente frágil (cualquier cambio mínimo en la estructura HTML o el flujo de la UI de Moodle rompería la integración), propenso a errores difíciles de depurar, problemas de seguridad inherentes al manejo de sesiones y credenciales de esta forma, y posible violación de los términos de servicio de la plataforma Moodle. **Esta opción no se recomienda bajo ninguna circunstancia.**

**Conclusión de la Investigación y Próximos Pasos Sugeridos:**
La función `core_files_upload` está disponible y es el primer paso. Sin embargo, la importación automatizada y la gestión de categorías del banco de preguntas directamente mediante Web Services estándar de Moodle presentan desafíos significativos.

**La vía más prometedora para una integración completa y fluida es el desarrollo de un plugin local en Moodle (Alternativa A).**

Si el desarrollo de un plugin no es una opción inmediata, la **Alternativa B (Interfaz Humana Asistida)** podría servir como una solución provisional, aunque con una experiencia de usuario menos integrada.

### Desarrollo de un Plugin Local en Moodle (para Moodle 4.5+)

Para una integración completa y robusta, se recomienda desarrollar un plugin local en Moodle. Este plugin expondrá servicios web personalizados que tu aplicación podrá consumir.

#### 1. Tipo y Estructura del Plugin

*   **Tipo:** Plugin local (`local`).
*   **Directorio:** Se instalará en `MOODLE_ROOT/local/yourpluginname/` (reemplazar `yourpluginname` con un nombre descriptivo, ej., `local_questionimporter`).
*   **Archivos Esenciales:**
    *   `version.php`:
        ```php
        <?php
        defined('MOODLE_INTERNAL') || die();
        $plugin->component = 'local_yourpluginname'; // Componente principal del plugin.
        $plugin->version = 2024100700; // YYYYMMDDXX (fecha actual + contador).
        $plugin->requires = 2023042400; // Versión de Moodle requerida (Moodle 4.2 = 2023042400, ajustar para 4.5 si se conoce el exacto o usar una base reciente).
        $plugin->maturity = MATURITY_STABLE;
        $plugin->release = 'v1.0';
        ```
    *   `db/services.php`: Define los servicios web externos que el plugin expondrá.
    *   `externallib.php`: Contiene la implementación de las funciones de los servicios web.
    *   `lib.php` (opcional): Para funciones de utilidad internas.
    *   `lang/en/local_yourpluginname.php`: Archivo de idioma para strings del plugin.
        ```php
        <?php
        $string['pluginname'] = 'Your Plugin Name';
        // Definiciones de otros strings...
        ```

#### 2. Exposición de Servicios Web Personalizados

*   **`local/yourpluginname/db/services.php`:**
    ```php
    <?php
    defined('MOODLE_INTERNAL') || die();

    $functions = array(
        'local_yourpluginname_get_question_categories' => array(
            'classname' => 'local_yourpluginname_external',
            'methodname' => 'get_question_categories',
            'classpath' => 'local/yourpluginname/externallib.php',
            'description' => 'Get question bank categories for a given context.',
            'type' => 'read',
            'capabilities' => 'moodle/question:managecategory', // O un capability más específico si se crea.
        ),
        'local_yourpluginname_create_question_category' => array(
            'classname' => 'local_yourpluginname_external',
            'methodname' => 'create_question_category',
            'classpath' => 'local/yourpluginname/externallib.php',
            'description' => 'Create a new question bank category.',
            'type' => 'write',
            'capabilities' => 'moodle/question:managecategory',
        ),
        'local_yourpluginname_import_questions' => array(
            'classname' => 'local_yourpluginname_external',
            'methodname' => 'import_questions',
            'classpath' => 'local/yourpluginname/externallib.php',
            'description' => 'Import questions from a previously uploaded file to a specific category.',
            'type' => 'write',
            'capabilities' => 'moodle/question:add', // Y posiblemente moodle/question:managecategory si la importación implica creación implícita.
        )
    );

    // Definición de servicios (agrupación de funciones).
    $services = array(
        'YourPluginName Services' => array(
            'functions' => array_keys($functions),
            'restrictedusers' => 0,
            'enabled' => 1,
            'shortname' => 'yourpluginname_services',
        )
    );
    ```
*   **`local/yourpluginname/externallib.php`:**
    ```php
    <?php
    require_once($CFG->libdir . "/externallib.php");
    require_once($CFG->dirroot . '/question/category_class.php'); // Para gestionar categorías.
    require_once($CFG->dirroot . '/question/format.php'); // Para formatos de importación.

    class local_yourpluginname_external extends external_api {

        public static function get_question_categories_parameters() {
            return new external_function_parameters(
                array('contextid' => new external_value(PARAM_INT, 'The context id for which to retrieve categories.'))
            );
        }

        public static function get_question_categories_returns() {
            return new external_multiple_structure(
                new external_single_structure(
                    array(
                        'id' => new external_value(PARAM_INT, 'Category ID'),
                        'name' => new external_value(PARAM_TEXT, 'Category name'),
                        'parent' => new external_value(PARAM_INT, 'Parent category ID', VALUE_OPTIONAL),
                        'contextid' => new external_value(PARAM_INT, 'Context ID of the category'),
                        'questioncount' => new external_value(PARAM_INT, 'Number of questions in this category', VALUE_OPTIONAL)
                    )
                )
            );
        }

        public static function get_question_categories($contextid) {
            global $DB;
            self::validate_context($contextid);
            // Lógica para obtener categorías del banco de preguntas para el contexto dado.
            // Ejemplo simplificado (requiere adaptación a APIs de Moodle 4.5):
            // $questioncategories = question_category_list_enhanced($contextid, true, true, 'name ASC', true);
            // $categories = array();
            // foreach ($questioncategories as $qc) {
            //    $categories[] = array(
            //        'id' => $qc->id,
            //        'name' => $qc->name,
            //        'parent' => $qc->parent,
            //        'contextid' => $qc->contextid,
            //        'questioncount' => $qc->questioncount
            //    );
            // }
            // return $categories;
            // Placeholder: Implementar con las funciones correctas de Moodle 4.5
            // como core_question\category\question_category_list_enhanced::get_categories() o similar.
            // Consultar question/classes/category/manager.php en Moodle 4.5
            return array(); // Devuelve array vacío hasta implementación.
        }

        public static function create_question_category_parameters() {
            return new external_function_parameters(
                array(
                    'contextid' => new external_value(PARAM_INT, 'Context ID where the category will be created'),
                    'name' => new external_value(PARAM_TEXT, 'Name for the new category'),
                    'parentid' => new external_value(PARAM_INT, 'Parent category ID', VALUE_OPTIONAL, 0),
                    'description' => new external_value(PARAM_TEXT, 'Description for the category', VALUE_OPTIONAL, '')
                )
            );
        }

        public static function create_question_category_returns() {
            return new external_single_structure(
                array(
                    'id' => new external_value(PARAM_INT, 'ID of the newly created category'),
                    'name' => new external_value(PARAM_TEXT, 'Name of the category')
                    // Otros campos relevantes.
                )
            );
        }

        public static function create_question_category($contextid, $name, $parentid = 0, $description = '') {
            global $DB, $USER;
            self::validate_context($contextid);
            // Lógica para crear una nueva categoría del banco de preguntas.
            // Ejemplo simplificado (requiere adaptación a APIs de Moodle 4.5):
            // $category = new stdClass();
            // $category->name = $name;
            // $category->contextid = $contextid;
            // $category->parent = $parentid;
            // $category->info = $description;
            // $category->infoformat = FORMAT_HTML; // o FORMAT_MOODLE
            // $category->stamp = make_unique_id_code(); // Asegurar un stamp único.
            // $category->sortorder = 999; // O calcular adecuadamente.
            // $newcategoryid = $DB->insert_record('question_categories', $category);
            // return array('id' => $newcategoryid, 'name' => $name);
            // Placeholder: Implementar con las funciones correctas de Moodle 4.5
            // como core_question\category\management\manager::create_category() o similar.
            return array('id' => 0, 'name' => 'Not implemented'); // Devuelve datos placeholder.
        }

        public static function import_questions_parameters() {
            return new external_function_parameters(
                array(
                    'draft_itemid' => new external_value(PARAM_INT, 'Item ID of the uploaded file in user draft area'),
                    'categoryid' => new external_value(PARAM_INT, 'Target question category ID'),
                    'format' => new external_value(PARAM_ALPHANUMEXT, 'Question file format (e.g., gift, moodlexml)')
                )
            );
        }

        public static function import_questions_returns() {
            return new external_single_structure(
                array(
                    'status' => new external_value(PARAM_BOOL, 'Import status (true for success)'),
                    'message' => new external_value(PARAM_TEXT, 'Import message or error'),
                    'importedcount' => new external_value(PARAM_INT, 'Number of questions imported', VALUE_OPTIONAL)
                )
            );
        }

        public static function import_questions($draft_itemid, $categoryid, $formatname) {
            global $CFG, $USER, $DB;
            self::validate_context($USER->id, CONTEXT_USER); // Validar el contexto del usuario que subió el archivo.

            // 1. Obtener el archivo del área de borrador.
            $fs = get_file_storage();
            $usercontext = context_user::instance($USER->id);
            $file = $fs->get_file($usercontext->id, 'user', 'draft', $draft_itemid, '/', 'filename.txt'); // 'filename.txt' será el nombre real.
                                                                                                      // Es crucial que el filename sea el correcto.
                                                                                                      // La llamada a core_files_upload desde la app externa debe guardar/devolver este nombre.

            if (!$file) {
                return array('status' => false, 'message' => 'Uploaded file not found for itemid: ' . $draft_itemid);
            }

            // 2. Obtener la categoría destino.
            $category = $DB->get_record('question_categories', array('id' => $categoryid), '*', MUST_EXIST);
            self::validate_context($category->contextid); // Validar que el usuario tiene acceso a este contexto de categoría.

            // 3. Instanciar el formato de importación.
            $qformat = question_bank::get_qformat($formatname);
            if (!$qformat) {
                return array('status' => false, 'message' => 'Unsupported question format: ' . $formatname);
            }

            // 4. Configurar y ejecutar la importación.
            $qformat->set_category($category);
            $qformat->set_context($category->get_context()); // Asegurar que el contexto de la categoría se usa.
            // $qformat->set_course($course); // Si es relevante y la categoría está en un curso.
            $qformat->set_file($file->get_content()); // Pasar el contenido del archivo.
                                                   // Algunos formatos podrían requerir una ruta de archivo en lugar de contenido directo.
                                                   // revisar la implementación de qformat_<formatname>->importprocess()

            // La importación real ocurre aquí. Puede lanzar excepciones.
            try {
                if (!$qformat->importprocess()) { // O el método equivalente para iniciar la importación.
                    $message = 'Import process failed. ';
                    if (method_exists($qformat, 'get_errors')) {
                       // $message .= implode(", ", $qformat->get_errors()); // Si el formato provee errores.
                    }
                    return array('status' => false, 'message' => $message);
                }
                // $importedcount = $qformat->count_imported_questions(); // Si existe tal método.
                return array('status' => true, 'message' => 'Questions imported successfully.', 'importedcount' => 0 /* $importedcount */);

            } catch (Exception $e) {
                return array('status' => false, 'message' => 'Error during import: ' . $e->getMessage());
            }
        }
    }
    ```
    **Nota Importante sobre `externallib.php`:** El código anterior es una plantilla y ESQUEMA. Las llamadas exactas a las APIs internas de Moodle para gestión de categorías (`question_category_list_enhanced`, creación de categorías) y el proceso de importación con `qformat->importprocess()` deben ser verificadas y adaptadas según las clases y métodos exactos en Moodle 4.5. Consultar `question/category/management/classes/manager.php`, `lib/questionlib.php`, `question/format.php` y los archivos específicos de formato (ej. `question/format/gift/format.php`, `question/format/xml/format.php`) en el código fuente de Moodle 4.5 es indispensable.

#### 3. APIs Internas de Moodle (PHP) a Utilizar Dentro del Plugin

*   **Gestión de Categorías del Banco de Preguntas (Moodle 4.5+):**
    *   Moodle utiliza el concepto de "contextos" (`context_system::instance()`, `context_course::instance($courseid)`, `context_module::instance($cmid)`). Las categorías del banco de preguntas residen en un contexto.
    *   Para listar categorías, funciones como las de la clase `core_question\category\question_category_list_enhanced` o similar.
    *   Para crear/actualizar categorías, las clases dentro de `question/classes/category/` (ej. `manager.php`) o funciones relacionadas con `question_category_edit_form` y su procesamiento.
*   **Importación de Preguntas:**
    *   **Obtención del Archivo:** Utilizar la API de `stored_file` de Moodle para acceder al archivo subido al área de borrador (`user/draft`) usando el `itemid` devuelto por `core_files_upload`.
        ```php
        $fs = get_file_storage();
        $usercontext = context_user::instance($USER->id); // O el contexto donde se subió.
        $file = $fs->get_file($usercontext->id, 'user', 'draft', $draft_itemid, '/', $filename_real);
        $file_content = $file->get_content();
        ```
    *   **Procesamiento del Formato:**
        *   Instanciar la clase del formato de importación: `question_bank::get_qformat('gift')` o `question_bank::get_qformat('moodlexml')`.
        *   Configurar la categoría destino en el objeto formato: `$format->set_category(question_category::load($categoryid));` (o método similar).
        *   Configurar el contexto: `$format->set_context(context_system::instance());` (o el contexto de la categoría).
        *   Pasar el contenido del archivo al objeto formato: `$format->set_file($file_content);` o similar.
        *   Ejecutar el proceso de importación: `$format->importprocess();`.
    *   **Formato Moodle XML (`moodlexml`):** Es el formato nativo de Moodle y a menudo el más completo para importaciones programáticas, ya que puede representar todos los aspectos de una pregunta de Moodle. Si es viable generar este formato desde tu aplicación, podría ser preferible a GIFT para una integración más rica, aunque GIFT es más simple.
    *   **Validación:** Asegurarse de que el usuario que invoca el servicio web (y por lo tanto el plugin) tiene los permisos necesarios (`moodle/question:add`, `moodle/question:managecategory` en el contexto apropiado).

#### 4. Consideraciones de Seguridad y Permisos

*   Las funciones del servicio web deben definir `capabilities` requeridas (ej. `moodle/question:add`, `moodle/question:managecategory`). Moodle verificará estos permisos antes de ejecutar la función.
*   Validar siempre los contextos (`self::validate_context()`) para asegurar que el usuario tiene permiso para operar en el contexto dado (ej. crear una categoría en un curso específico).

#### 5. Pruebas y Depuración

*   **Entorno de Desarrollo Moodle:** Es crucial tener un entorno de desarrollo Moodle local para instalar y probar el plugin incrementalmente.
*   **Cliente de Prueba de Servicios Web de Moodle:** Una vez que el servicio web esté definido y el plugin instalado, Moodle proporciona una interfaz para probar los servicios web (Administración del sitio > Extensiones > Servicios web > Cliente de prueba de servicio web). Esto permite enviar parámetros y ver la respuesta. *Actualización: El cliente de prueba estándar podría no listar funciones de plugins locales fácilmente; se recomienda usar Postman.*
*   **Postman/Insomnia:** Para pruebas más robustas y flexibles de los servicios web, especialmente durante el desarrollo.
    *   **Prueba Exitosa (15-Jul-2024):** La función `local_opomoodletools_get_question_categories` fue probada exitosamente utilizando Postman. Con el `contextid: 18` (curso "Permanencia") y el token `68c2d9278fc7879bb6ebd7a3032acd66`, la función devolvió correctamente la lista de categorías de preguntas en formato JSON. Esto valida la configuración del servicio web del plugin, el token, y la implementación actual de `get_question_categories` en `externallib.php`.
    *   **Prueba Exitosa (Fecha Actual):** La función `local_opomoodletools_create_question_category` fue probada exitosamente utilizando Postman. Con `contextid: 18`, `name: "Viva la IA"`, `parentid: 0` (o el ID de padre correspondiente), y el token `68c2d9278fc7879bb6ebd7a3032acd66`, la función creó la categoría y devolvió su `id`, `name`, `parent` y `contextid`. Esto valida la implementación de creación de categorías.
*   **Logs de Moodle y PHP:** Utilizar `error_log()` en PHP y revisar los logs de errores de Moodle/PHP es esencial para la depuración.
*   **Modo Desarrollador de Moodle:** Activar el modo desarrollador en Moodle para obtener mensajes de error más detallados.

#### 6. Implementación de las Funciones en `externallib.php`

*   **Gestión de Categorías del Banco de Preguntas (Moodle 4.5+):**
    *   Moodle utiliza el concepto de "contextos" (`context_system::instance()`, `context_course::instance($courseid)`, `context_module::instance($cmid)`). Las categorías del banco de preguntas residen en un contexto.
    *   Para listar categorías, funciones como las de la clase `core_question\category\question_category_list_enhanced` o similar.
    *   Para crear/actualizar categorías, las clases dentro de `question/classes/category/` (ej. `manager.php`) o funciones relacionadas con `question_category_edit_form` y su procesamiento.
*   **Importación de Preguntas:**
    *   **Obtención del Archivo:** Utilizar la API de `stored_file` de Moodle para acceder al archivo subido al área de borrador (`user/draft`) usando el `itemid` devuelto por `core_files_upload`.
        ```php
        $fs = get_file_storage();
        $usercontext = context_user::instance($USER->id); // O el contexto donde se subió.
        $file = $fs->get_file($usercontext->id, 'user', 'draft', $draft_itemid, '/', $filename_real);
        $file_content = $file->get_content();
        ```
    *   **Procesamiento del Formato:**
        *   Instanciar la clase del formato de importación: `question_bank::get_qformat('gift')` o `question_bank::get_qformat('moodlexml')`.
        *   Configurar la categoría destino en el objeto formato: `$format->set_category(question_category::load($categoryid));` (o método similar).
        *   Configurar el contexto: `$format->set_context(context_system::instance());` (o el contexto de la categoría).
        *   Pasar el contenido del archivo al objeto formato: `$format->set_file($file_content);` o similar.
        *   Ejecutar el proceso de importación: `$format->importprocess();`.
    *   **Formato Moodle XML (`moodlexml`):** Es el formato nativo de Moodle y a menudo el más completo para importaciones programáticas, ya que puede representar todos los aspectos de una pregunta de Moodle. Si es viable generar este formato desde tu aplicación, podría ser preferible a GIFT para una integración más rica, aunque GIFT es más simple.
    *   **Validación:** Asegurarse de que el usuario que invoca el servicio web (y por lo tanto el plugin) tiene los permisos necesarios (`moodle/question:add`, `moodle/question:managecategory` en el contexto apropiado).

#### 7. Consideraciones de Seguridad y Permisos

*   Las funciones del servicio web deben definir `capabilities` requeridas (ej. `moodle/question:add`, `moodle/question:managecategory`). Moodle verificará estos permisos antes de ejecutar la función.
*   Validar siempre los contextos (`self::validate_context()`) para asegurar que el usuario tiene permiso para operar en el contexto dado (ej. crear una categoría en un curso específico).

#### 8. Instalación y Configuración del Plugin

1.  Colocar la carpeta del plugin (ej. `yourpluginname`) en `MOODLE_ROOT/local/`.
2.  Como administrador de Moodle, ir a `Site administration > Notifications` para que Moodle detecte e instale el plugin.
3.  Ir a `Site administration > Plugins > Web services > External services`, encontrar "YourPluginName Services", habilitarlo y añadirle usuarios autorizados (o un usuario específico con un token).
4.  Ir a `Site administration > Server > Web services > Manage tokens` para crear un token para el usuario autorizado y el servicio "YourPluginName Services". Este token será el que tu aplicación externa utilice.

#### Próximos Pasos para el Desarrollo del Plugin

1.  **Configurar un Entorno de Desarrollo Moodle 4.5.**
2.  **Crear la Estructura Básica del Plugin Local.**
3.  **Implementar `externallib.php` con las funciones detalladas, investigando a fondo las APIs internas de Moodle 4.5 para las operaciones exactas de categorías e importación.** (Este es el paso más complejo y requiere bucear en el código de Moodle).
4.  **Probar exhaustivamente** cada servicio web expuesto.

Esta información proporciona una base sólida para comenzar el desarrollo del plugin. El punto crucial será la correcta implementación de la lógica dentro de `externallib.php` utilizando las APIs internas de Moodle 4.5.

### Propuesta de Integración en el Proyecto (Ajustada a los Hallazgos)

A continuación, se detalla una propuesta ajustada, considerando la alta probabilidad de necesitar un plugin en Moodle para la funcionalidad completa, o un flujo manual asistido como alternativa.

#### Backend

1.  **Nuevo Servicio (`src/services/moodleApiService.ts`):**
    *   Se creará un servicio dedicado para encapsular toda la lógica de comunicación con la API de Web Services de Moodle.
    *   Este servicio utilizará una librería HTTP cliente estándar (ej. `axios`, `node-fetch`) para realizar las llamadas a los endpoints de Moodle.
    *   **Métodos principales a implementar (escenario con Plugin Local en Moodle - RECOMENDADO):**
        *   `constructor(moodleUrl: string, wsToken: string)`: Para configurar la URL base de Moodle y el token de autenticación.
        *   `async uploadGiftFileToDraft(giftContent: string, filename: string, userId: number): Promise<MoodleUploadedFile>`: Llama a `core_files_upload` para subir al área de borrador del usuario. El `userId` podría usarse para determinar el `contextid` (contexto de usuario). El `filename` devuelto por `core_files_upload` (o el que se usó para subir) es importante para que el plugin lo pueda encontrar.
        *   `async callCustomImportService(itemid: number, targetCategoryId: number, filenameForPlugin: string, moodleFormat: string = 'gift'): Promise<PluginImportResult>`: Este método llamaría al Web Service `local_yourpluginname_import_questions` expuesto por el plugin local de Moodle, pasándole el `itemid` y `filenameForPlugin` del archivo subido y el ID de la categoría destino. `PluginImportResult` definiría la respuesta del plugin.
        *   `async getCustomQuestionCategories(contextId: number): Promise<PluginCategory[]>`: Llamaría a `local_yourpluginname_get_question_categories`. `PluginCategory` sería la interfaz para estos datos.
        *   `async createCustomQuestionCategory(name: string, parentId: number, contextId: number, description?: string): Promise<PluginCategory>`: Llamaría a `local_yourpluginname_create_question_category`.
    *   **Métodos principales (escenario SIN Plugin Local - Flujo Manual Asistido / Fallback):**
        *   `constructor(moodleUrl: string, wsToken: string)`.
        *   `async uploadGiftFileToDraft(giftContent: string, filename: string, userId: number): Promise<MoodleUploadedFile>`: Sube el archivo. El backend informaría a la UI que el usuario debe proceder manualmente en Moodle. La gestión de categorías (listar/crear) no sería manejada por la API del backend, sino que el usuario lo haría en Moodle.
    *   Se implementará un manejo de errores detallado para todas las interacciones.

2.  **Gestión de Configuración y Credenciales de Moodle:** (Sin cambios respecto a la propuesta anterior: almacenamiento seguro de URL y token, ya sea por usuario o global).

3. **Nuevos Endpoints de API en el Backend (Ajustados según el enfoque):**
    *   **Si se usa Plugin:**
        *   `POST /api/moodle/import-to-category`: Body: `{ giftContent: string, categoryId: number, contextIdForUpload: number, filename:string }`. Este endpoint orquestaría la subida (`core_files_upload` primero) y luego la llamada al WS del plugin (`local_yourpluginname_import_questions`).
        *   `GET /api/moodle/question-categories?contextId=...`: Llamaría a `getCustomQuestionCategories` del `moodleApiService`.
        *   `POST /api/moodle/question-categories`: Body: `{ name, parentId, contextId, description }`. Llamaría a `createCustomQuestionCategory` del `moodleApiService`.
    *   **Si es Flujo Manual Asistido:**
        *   `POST /api/moodle/upload-for-manual-import`: Body: `{ giftContent: string, userId: number (o de sesión), filename:string }`. Respuesta: `{ uploadedFileItemId: number, uploadedFilename: string, moodleImportUrl: string, message: string }` (mensaje guiando al usuario).
        *   (Los endpoints para categorías del banco de preguntas probablemente no existirían, ya que se manejarían en Moodle).

#### Frontend (UI) (Ajustado según el enfoque)

1.  **Componente de Configuración de Moodle:** (Sin cambios).

2.  **Modificaciones en `src/components/QuestionGenerator.tsx`:**
    *   **Botón "Enviar a Moodle" o "Subir a Moodle para Importar Manual":** El texto y la funcionalidad del botón se adaptarán.
    *   **Modal/Panel de Envío:**
        *   **Si se usa Plugin:** El modal permitirá seleccionar/crear una categoría del banco de preguntas (poblada desde el WS del plugin) y luego iniciará el proceso de importación completo a través del backend. Se deberá poder elegir el formato de importación (ej. GIFT, MoodleXML) si el plugin y el backend lo soportan.
        *   **Si es Flujo Manual Asistido:** El modal confirmaría la subida exitosa del archivo al área de borrador de Moodle. A continuación, mostraría instrucciones claras y un enlace directo (si es posible construirlo) a la página de importación de Moodle (`MOODLE_URL/question/import.php`). Indicaría al usuario que debe seleccionar el archivo de su área de borrador, elegir el formato GIFT (o el que se haya subido) y la categoría de destino (que gestionaría manualmente en Moodle).
    *   El feedback al usuario (mensajes de carga, éxito, error) se adaptará al flujo implementado.

**Flujo de Usuario Detallado (Revisado según Alternativas):**

*   **Con Plugin Local en Moodle (Ideal y Recomendado):**
    1.  Usuario genera preguntas en la aplicación.
    2.  Clica "Enviar a Moodle".
    3.  (Se le pide configurar credenciales de Moodle si es la primera vez).
    4.  Aparece un modal que carga (desde el Web Service del plugin, vía el backend de tu aplicación) y muestra las categorías existentes del banco de preguntas. El usuario puede seleccionar una o usar una opción para crear una nueva categoría (que también usaría un Web Service del plugin). Se podría ofrecer un selector de formato (GIFT/MoodleXML).
    5.  Usuario selecciona/crea la categoría, elige formato y clica "Importar".
    6.  La UI llama a un endpoint del backend de tu aplicación (ej. `/api/moodle/import-to-category`).
    7.  El backend:
        a.  Llama a `moodleApiService.uploadGiftFileToDraft` para subir el archivo (GIFT o MoodleXML) al área de borrador del usuario en Moodle (usando `core_files_upload`). Esto devuelve un `itemid` y el `filename` real con el que se guardó en Moodle.
        b.  Con el `itemid`, `filenameForPlugin`, y `categoryId` seleccionado, llama a `moodleApiService.callCustomImportService` (que a su vez invoca el Web Service `local_yourpluginname_import_questions` del plugin en Moodle, pasándole el formato elegido).
    8.  El plugin en Moodle realiza la importación de las preguntas desde el archivo a la categoría especificada, usando el formato indicado.
    9.  Se devuelve un mensaje de éxito o error a través del backend a la UI, que lo muestra al usuario.
*   **Sin Plugin (Interfaz Humana Asistida / Fallback):**
    1.  Usuario genera preguntas.
    2.  Clica "Subir a Moodle para Importar Manualmente".
    3.  (Configura credenciales si es la primera vez).
    4.  La UI llama a un endpoint del backend (ej. `/api/moodle/upload-for-manual-import`).
    5.  El backend llama a `moodleApiService.uploadGiftFileToDraft` para subir el archivo GIFT al área de borrador del usuario en Moodle.
    6.  El backend devuelve a la UI una confirmación de la subida, el nombre del archivo subido (`uploadedFilename`), y posiblemente un enlace a la página general de importación de Moodle (`MOODLE_URL/question/import.php`).
    7.  La UI muestra un mensaje al usuario: "El archivo '{uploadedFilename}' ha sido subido a tu área de borrador en Moodle. Para completar la importación, por favor, ve a [Enlace a Moodle Import], selecciona el archivo de tu área de borrador, elige el formato 'GIFT' y la categoría de destino donde deseas importar las preguntas. La gestión de categorías debes realizarla directamente en Moodle."
    8.  El resto del proceso (selección de archivo, formato, categoría e importación final) es manual y ocurre enteramente dentro de la interfaz de Moodle.

**Nota Final sobre la Documentación:** La información detallada sobre `core_files_upload` proporcionada por el usuario ha sido incorporada. La ausencia de otros webservices directos para categorías de preguntas y para la importación post-subida también ha sido reflejada. La recomendación principal sigue siendo explorar la creación de un plugin local en Moodle para una integración óptima. 

## Resumen del Proceso de Implementación del Plugin `local_opomoodletools` y Resolución de Problemas

Esta sección resume los pasos clave, desafíos y soluciones implementadas durante el desarrollo del plugin `local_opomoodletools`, cuyo objetivo principal fue permitir la importación directa de preguntas a Moodle desde una aplicación externa.

### 1. Inicio y Planificación
La necesidad surgió de integrar una aplicación Next.js generadora de preguntas con una instancia de Moodle (`https://campus.opomelilla.com`, versión 4.5). Tras investigar las capacidades de los Web Services estándar de Moodle, se concluyó que para una integración fluida (especialmente para la importación de preguntas a categorías específicas), sería necesario desarrollar un plugin local en Moodle.

### 2. Desarrollo del Plugin `local_opomoodletools`

Se procedió a crear la estructura básica del plugin en `local/opomoodletools/`:
*   `version.php`: Para gestionar la versión del plugin.
*   `db/services.php`: Para definir los servicios web externos.
*   `externallib.php`: Para implementar la lógica de los servicios web.
*   `lang/en/local_opomoodletools.php`: Para las cadenas de idioma.

Se definieron e implementaron progresivamente las siguientes funciones de servicio web:

*   **`local_opomoodletools_get_question_categories`**:
    *   Implementada para obtener la lista de categorías de preguntas de un contexto específico.
    *   Probada con éxito usando Postman y el `contextid=18` del curso "Permanencia".

*   **`local_opomoodletools_create_question_category`**:
    *   Implementada para crear nuevas categorías de preguntas en un contexto dado.
    *   Probada con éxito usando Postman (ej. creando la categoría "Viva la IA").

*   **`local_opomoodletools_import_questions` (Proceso Iterativo y Desafíos Clave):**
    Esta fue la función más compleja y requirió múltiples iteraciones.

    *   **Enfoque Inicial (Plan A - Bajo Nivel):**
        *   Se intentó manejar directamente el contenido del archivo (GIFT, codificado en base64 desde el parámetro `filecontent`), decodificarlo, guardarlo en un archivo temporal en el servidor Moodle, y luego usar la clase `qformat_gift` directamente para procesar este archivo temporal.
        *   **Problemas Encontrados (Plan A):**
            *   `Call to undefined method question_bank::get_qformat()`: Se corrigió instanciando directamente `new qformat_gift()`.
            *   Errores con métodos de `qformat_gift` como `set_category()`, `set_file()`, `get_errors()`.
            *   Problemas con el manejo de transacciones de Moodle: `Call to undefined method moodle_transaction::is_active()` y errores en `rollback_delegated_transaction` debido a argumentos incorrectos.
            *   Error persistente `errorcode: "errorimport_process", message: "local_opomoodletools/errorimport_process"`, incluso con archivos GIFT válidos. Los logs indicaban que `importpreprocess()` tenía éxito pero `importprocess()` fallaba sin detalles claros a través de las propiedades del objeto `$qformat`.

    *   **Cambio de Estrategia (Plan B - Emular la Interfaz de Usuario de Moodle):**
        *   Debido a los persistentes problemas con el enfoque de bajo nivel, se decidió cambiar la estrategia para emular más de cerca cómo la interfaz de importación de Moodle (`question/bank/importquestions/import.php` y `qbank_importquestions\form\question_import_form`) maneja el proceso.
        *   Esto implicó estudiar el código de Moodle para identificar los métodos `set...` clave del objeto `$qformat` (ej. `setCategory`, `setContexts`, `setCourse`, `setFilename`, `setRealfilename`) y las opciones de importación.
        *   La función `import_questions` en `externallib.php` fue reescrita significativamente para adoptar esta nueva lógica, manteniendo el manejo del archivo temporal.

    *   **Ajustes y Resolución de Errores en Plan B (Iteraciones Clave):**
        1.  **`contextid` añadido como parámetro:** Para consistencia y para asegurar que el contexto correcto se utiliza durante todo el proceso de importación. Esto requirió actualizar `db/services.php` y la firma de la función en `externallib.php`.
        2.  **Error `Undefined constant "PARAM_FILEPATH"`:**
            *   Detectado a través de Postman y los logs de Moodle.
            *   Solución: En `import_questions_parameters` (en `externallib.php`), se cambió el tipo de `filecontent` de `PARAM_FILEPATH` (que era incorrecto para contenido base64) a `PARAM_RAW`.
            *   Adicionalmente, se corrigió un warning "invalid OPTIONAL value specified" para `parentid` en `create_question_category_parameters` añadiendo `VALUE_DEFAULT, 0`.
        3.  **Error `"Call to protected method qformat_default::count_questions()"`:**
            *   Este error surgió porque se intentaba llamar a un método protegido para obtener el número de preguntas importadas.
            *   Solución: Se comentó temporalmente la sección de código en `externallib.php` que intentaba obtener este conteo, priorizando la importación exitosa sobre el conteo exacto en la respuesta. El mensaje de retorno se ajustó para reflejar esto.
        4.  **Warnings `Use of undefined constant CONTEXT_COURSE` y problemas con `question_edit_contexts.php`:**
            *   Estos warnings indicaban un problema en cómo se obtenían o establecían los contextos para la importación. La línea `$importcontexts = $qbankcontexts->having_one_edit_tab_cap('importquestions');` resultaba problemática.
            *   Solución: Se simplificó la asignación de contextos llamando directamente a `$qformat->setContexts(array($provided_context));`, donde `$provided_context` ya se había validado como el contexto del curso.
        5.  **Mensaje de Éxito No Traducido `[[importprocesssuccessful]]`:**
            *   Después de que la importación finalmente tuvo éxito, el mensaje devuelto por Postman era una cadena de idioma sin traducir.
            *   Solución: Se añadió la cadena de idioma `importprocesssuccessful` (y otras relevantes para errores y éxito) al archivo `local/opomoodletools/lang/en/local_opomoodletools.php`.

    *   **Actualizaciones de Versión del Plugin:**
        *   Después de cada conjunto significativo de cambios en los archivos del plugin (especialmente `db/services.php`, `externallib.php`, `version.php`), se incrementó el número de versión en `local/opomoodletools/version.php` (ej. de `2024111500` a `2024111501`, luego a `2024111502`, y así sucesivamente).
        *   Tras subir los archivos actualizados al servidor, se purgaban todas las cachés de Moodle para asegurar que los cambios fueran detectados y aplicados.

### 3. Resultado Final
Tras varias iteraciones de desarrollo, depuración y pruebas con Postman (enviando el contenido de un archivo GIFT de prueba codificado en base64), se logró el objetivo:
*   Las preguntas se importaron correctamente a la categoría especificada dentro del curso "Permanencia" (`contextid=18`).
*   La respuesta de Postman fue un JSON indicando éxito (`"status": "success"`) y un mensaje traducido: `"message": "Import process completed successfully for file: testimport.gift. Please verify the questions in the category."`.
*   Las preguntas importadas fueron visibles y funcionales dentro del banco de preguntas de Moodle.

### 4. Nota Adicional sobre Logs
A lo largo del proceso de depuración, los logs de error de PHP en el servidor Moodle mostraron consistentemente una noticia (Notice) relacionada con un plugin diferente: `Invalid get_string() identifier: 'pluginname' or component 'local_bulkenrol'`. Se determinó que este error es ajeno al plugin `local_opomoodletools` y no afectaba su funcionalidad.

Este proceso iterativo, combinando el análisis del código de Moodle, la experimentación y la depuración basada en los mensajes de error y logs, fue crucial para alcanzar la solución funcional.

### Posibles Siguientes Pasos (Opcionales, para Mejoras Futuras):

*   **Conteo Exacto de Preguntas Importadas:** Si se necesita que la respuesta del servicio web devuelva el número exacto de preguntas importadas, se podría investigar una forma segura de obtener esta información. Las clases `qformat_` podrían tener métodos públicos para obtener un resumen o log de la importación, o se podría realizar una consulta a la base de datos después de la importación (aunque esto último es menos ideal y más propenso a errores si la importación es parcial).
*   **Manejo de Errores Más Específico del Formato:** Las clases `qformat_` suelen tener propiedades (como `$qformat->error` o `$qformat->errors`) que acumulan errores específicos del procesamiento del archivo. En el bloque `catch` o después de que `importpreprocess()` o `importprocess()` devuelvan `false`, se podría intentar acceder a estos errores para proporcionar mensajes más detallados al usuario si la importación falla debido a un problema en el formato del archivo GIFT/XML.
*   **Opciones de Importación Avanzadas:** Si fuera necesario, se podrían exponer más opciones de la importación estándar de Moodle (como `matchgrades`, `stoponerror`, `catfromfile`, etc.) como parámetros opcionales en el servicio web `local_opomoodletools_import_questions`. Esto permitiría un control más granular sobre el proceso de importación desde la aplicación externa.
*   **Limpieza de *Notices* Ajenos:** Aunque no afectan directamente al plugin `local_opomoodletools`, los *notices* persistentes en los logs de PHP (como el relacionado con `local_bulkenrol` o posibles `mdb->get_record() found more than one record!`) podrían ser investigados y solucionados por separado para mantener una buena "salud general" de la instancia de Moodle y facilitar la depuración de futuros problemas.

## Tareas Pendientes y Próximos Pasos

Lista de tareas para completar la integración con Moodle:

1.  **Configuración y Verificación Inicial:**
    *   **Variables de Entorno:** Confirmar que `MOODLE_API_URL` y `MOODLE_WEBSERVICE_TOKEN` estén correctamente configuradas en los archivos `.env` y `.env.local`. (Realizado por el usuario)
    *   **Ruta de Importación `@/`**: La importación `import MoodleApiService from '@/services/moodleApiService';` en los archivos de API es correcta, según la configuración de `paths` en `tsconfig.json`. (Verificado)

2.  **Desarrollo del Plugin de Moodle:**
    *   **Implementar Funciones Webservice:** Desarrollar las siguientes funciones dentro de un plugin local de Moodle (ej: `local_opomoodletools`):
        *   `local_opomoodletools_import_questions`: Para importar preguntas desde un `itemid` (archivo en borrador) a una `targetCategoryId`. Debe manejar el formato GIFT y Moodle XML.
        *   `local_opomoodletools_get_question_categories`: Para listar las categorías del banco de preguntas según un `contextid`.
        *   `local_opomoodletools_create_question_category`: Para crear nuevas categorías, especificando nombre, contexto, padre (opcional) y descripción (opcional).
    *   **Registrar Servicios Web:** Definir y registrar estas funciones como servicios web en Moodle, asignando los permisos necesarios al token utilizado.
    *   **Formato de Preguntas:** Asegurar que el plugin maneje robustamente los formatos de pregunta (GIFT y, preferiblemente, Moodle XML para importaciones programáticas más fiables).
    *   **Instalación y Pruebas:** Instalar y probar exhaustivamente el plugin en la instancia de Moodle (`https://campus.opomelilla.com`).

3.  **Desarrollo y Pruebas del Backend en Next.js**
    *   **Pruebas y Refinamiento de `MoodleApiService.ts`:**
        *   Probar exhaustivamente el método `uploadGiftFileToDraft` contra la API `core_files_upload` real de Moodle. Asegurarse de que el `userIdForContext` se usa correctamente.
        *   Desarrollar mocks o stubs para los métodos que dependen del plugin (`callCustomImportService`, `getCustomQuestionCategories`, `createCustomQuestionCategory`) para facilitar pruebas unitarias hasta que el plugin esté funcional.
    *   **Pruebas de los Endpoints de API (`pages/api/moodle/*`):**
        *   Probar `POST /api/moodle/upload-gift` de forma integral utilizando herramientas como Postman o Insomnia.
        *   Probar `GET /api/moodle/categories` y `POST /api/moodle/categories` una vez que los métodos correspondientes en `MoodleApiService` estén funcionales y conectados al plugin.
        *   Probar `POST /api/moodle/import-questions` de la misma manera.
        *   Verificar que los logs en los endpoints de API son exhaustivos y útiles para la depuración.

4.  **Desarrollo de la Interfaz de Usuario (Frontend en Next.js)**
    *   **Componente para Subir Preguntas a Moodle:**
        *   Permitir al usuario seleccionar un archivo GIFT local o pegar directamente el contenido GIFT.
        *   Campo para que el usuario ingrese su `userIdForContext` de Moodle (investigar si se puede obtener/cachear de alguna forma tras un login o configuración inicial).
        *   Llamada al endpoint `/api/moodle/upload-gift`.
    *   **Gestión de Categorías en UI:**
        *   Interfaz para visualizar las categorías existentes (obtenidas mediante `GET /api/moodle/moodle_question_categories?contextId=...`).
        *   Permitir al usuario seleccionar una categoría de destino para la importación de preguntas.
            *   **Mejora (Implementada):** Para facilitar la selección en listas potencialmente largas, se ha añadido un campo de filtro en el componente `src/components/moodle/CourseCategorySelector.tsx`. Este filtro permite al usuario escribir parte del nombre de una categoría para acotar dinámicamente las opciones mostradas en el selector. La implementación incluye:
                *   Un estado local (`searchTerm`) en el componente para almacenar el texto del filtro.
                *   Un campo de entrada de texto donde el usuario introduce el término de búsqueda.
                *   Lógica de filtrado (`availableCategories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))`) que actualiza las opciones visibles en el desplegable de categorías existentes.
        *   Formulario para crear nuevas categorías (llamando a `POST /api/moodle/moodle_question_categories`), solicitando nombre, contexto (podría ser preseleccionado o configurable), y opcionalmente categoría padre y descripción.
    *   **Flujo de Importación Completo en UI:**
        *   Guiar al usuario a través del proceso: subir archivo -> obtener `itemid` -> seleccionar/crear categoría -> llamar a `/api/moodle/import-questions`.
    *   **Manejo de Estado y Feedback al Usuario:**
        *   Implementar indicadores visuales para estados de carga (ej: subiendo archivo, importando preguntas).
        *   Mostrar mensajes de éxito y error de forma clara y concisa (utilizar `react-hot-toast` o `sonner`).

5.  **Pruebas de Flujo Completo desde la Interfaz de Usuario:**
    *   Probar todo el ciclo: generar/pegar preguntas -> enviar a Moodle -> subir archivo -> seleccionar/crear categoría -> importar -> verificar en Moodle.

6. **Pruebas Finales, Refinamiento y Documentación**
    *   **Pruebas de Integración End-to-End:** Realizar pruebas exhaustivas del flujo completo con diferentes tipos de preguntas, categorías, y escenarios de error.
    *   **Pruebas de Usabilidad (UX):** Evaluar la facilidad de uso del nuevo flujo y realizar ajustes para mejorar la experiencia del usuario.
    *   **Manejo de Errores Robusto:** Revisar y mejorar el manejo de errores en todas las capas (frontend, API Next.js, MoodleApiService, Plugin Moodle) para que sean informativos y permitan una recuperación o reintento si es posible.
    *   **Revisión de Seguridad:**
        *   Confirmar que el token de Moodle no se expone innecesariamente en el lado del cliente.
        *   Revisar los permisos asignados al token de Moodle para asegurar que sean los mínimos necesarios.
        *   Considerar si el `error.stack` debe eliminarse de las respuestas de API en producción.
    *   **Actualización Final de la Documentación (`proyecto_moodle.md`):**
        *   Reflejar el estado final de la implementación.
        *   Añadir guías de configuración para el plugin de Moodle y las variables de entorno.
        *   Documentar cualquier limitación conocida o solución alternativa implementada.
    *   **Preparación para Despliegue (si aplica):**
        *   Asegurar que las variables de entorno están configuradas correctamente en el entorno de producción.
        *   Considerar la compilación y empaquetado del plugin de Moodle para una fácil instalación. 

## Estado Actual del Proyecto (Resumen General)

**La funcionalidad principal de generación de preguntas a partir de texto fuente, su almacenamiento y gestión básica en la base de datos (PostgreSQL con Prisma) está implementada y operativa.**

**La integración con Moodle para la importación directa de preguntas, incluyendo la gestión de categorías desde una interfaz personalizada en Next.js, se considera COMPLETADA y FUNCIONAL.** Esto abarca:

*   **Plugin Local de Moodle (`local_opomoodletools`):**
    *   Desarrollado e instalado en la instancia de Moodle de destino (`https://campus.opomoodle.com`, Moodle 4.5).
    *   Expone Web Services personalizados para:
        *   **Listar categorías del banco de preguntas** para un `contextid` dado.
        *   **Crear nuevas categorías del banco de preguntas**, permitiendo especificar un `parentid` para subcategorías. La lógica maneja correctamente la asignación a la categoría raíz del contexto si no se especifica un padre.
        *   **Importar preguntas en formato GIFT** a una categoría específica. Este servicio recibe el contenido del archivo GIFT codificado en Base64, el `contextid` y el `categoryid` de destino.
    *   Se han abordado y solucionado múltiples desafíos durante su desarrollo, incluyendo:
        *   Correcto manejo de `contextId` (vs `contextid`).
        *   Supresión de salida HTML inesperada de Moodle usando `ob_start()` y `ob_end_clean()`.
        *   Correcta codificación y decodificación Base64 del contenido del archivo GIFT.
        *   Gestión adecuada de transacciones de base de datos (`$DB->commit_delegated_transaction()`).
        *   Conteo (o indicación de no conteo) de preguntas importadas para el formato GIFT.
        *   Internacionalización de los mensajes del plugin con strings de idioma para inglés y español (`local/opomoodletools/lang/en/` y `local/opomoodletools/lang/es/`).

*   **Interfaz de Usuario en Next.js (`http://localhost:3000/admin/moodle-import`):**
    *   Desarrollada utilizando React y TypeScript.
    *   Permite al usuario:
        *   Seleccionar un `contextId` de Moodle (ID del curso).
        *   Visualizar las categorías de preguntas existentes para ese contexto.
        *   Filtrar la lista de categorías por nombre.
        *   Seleccionar una categoría existente o crear una nueva (como raíz del contexto o como subcategoría de una existente).
        *   Pegar o escribir contenido en formato GIFT.
        *   Iniciar el proceso de importación, que se comunica con el plugin de Moodle.
        *   Recibir feedback sobre el estado y resultado de la operación.
    *   **Estilo y Layout:**
        *   La página se ha movido al App Router de Next.js (`src/app/(admin_panel)/admin/moodle-import/page.tsx`).
        *   Utiliza un layout específico para la administración (`src/app/(admin_panel)/layout.tsx`) que incluye una barra de navegación simple (`src/components/nav/AdminNavbar.tsx`) sin el sidebar principal, maximizando el espacio para el contenido.
        *   Se han aplicado estilos de Tailwind CSS a todos los componentes involucrados (`MoodleImportOrchestrator.tsx`, `GiftContentInput.tsx`, `CourseCategorySelector.tsx`, `ImportProcessView.tsx`) para asegurar una apariencia visual consistente con el tema general de la aplicación (tema oscuro, colores primarios, estilos de input/botones, etc.).
        *   El formulario ocupa el ancho disponible de la página, mejorando la utilización del espacio.
    *   Se ha integrado con el menú lateral principal (`src/components/Sidebar.tsx`) para un fácil acceso.

**En resumen, el flujo completo desde la interfaz de Next.js hasta la importación de preguntas en categorías específicas de Moodle, a través del plugin local, está implementado y operativo.**

### Alternativas para la Integración de la Importación y Gestión de Categorías

**ESTADO: Se optó por la Alternativa A (Desarrollo de un Plugin Local en Moodle), la cual ha sido implementada con éxito.** Las otras alternativas (Interfaz Humana Asistida, Herramientas CLI, Web Scraping) se descartaron o se consideraron como fallback si el desarrollo del plugin no era viable.

## Tareas Pendientes y Próximos Pasos (Revisado)

Con la implementación principal de la importación a Moodle completada, las tareas pendientes se reorientan hacia:

1.  **Pruebas Exhaustivas y Refinamiento (Ciclo Continuo):**
    *   Probar la importación con diversos escenarios de archivos GIFT (complejos, con errores leves, etc.).
    *   Verificar el comportamiento en diferentes contextos de Moodle si es aplicable.
    *   Recopilar feedback de uso para posibles mejoras menores en la UI/UX.

2.  **Documentación Final y Limpieza de Código:**
    *   Asegurar que toda la documentación (como este archivo `proyecto_moodle.md`) esté completamente actualizada.
    *   Revisar el código en busca de comentarios obsoletos, logs de depuración innecesarios o áreas que puedan simplificarse.

3.  **Consideraciones de Seguridad (Plugin de Moodle):**
    *   Revisar los capabilities definidos para los Web Services del plugin y asegurar que siguen el principio de menor privilegio.
    *   Asegurar que todas las entradas de datos en `externallib.php` se manejan de forma segura (aunque Moodle y Prisma ya proveen capas de protección).

4.  **Optimización (Si se detectan cuellos de botella):**
    *   Monitorizar el rendimiento durante importaciones grandes.
    *   Optimizar consultas o procesos si es necesario.

5.  **Despliegue y Configuración en Entorno de Producción:**
    *   Pasos para instalar y configurar el plugin `local_opomoodletools` en la instancia de Moodle de producción.
    *   Configuración de la aplicación Next.js para apuntar a la URL de producción de Moodle y gestionar el token de Web Service de forma segura.

6.  **Nuevas Funcionalidades (Post-Implementación Principal):**
    *   **(PROPUESTA PENDIENTE DEL USUARIO)** - *Espacio para la nueva propuesta que el usuario mencionará.*
    *   Internacionalización completa de la interfaz de Next.js (si se requiere).
    *   Mejoras en el parser GIFT si se identifican nuevos casos de uso o formatos no soportados.
    *   Integración con otras funcionalidades del proyecto `Mi_IA_11_17_Telegram`.


// ... existing code ...

</rewritten_file> 