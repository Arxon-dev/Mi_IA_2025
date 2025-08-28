---
description: Instrucciones para trabajar con Microsoft Playwright MCP y Context7 MCP
globs: "**/*.{js,ts,jsx,tsx}"
alwaysApply: true
---
# Instrucciones para la IA

Este documento detalla las instrucciones y herramientas que la IA debe utilizar cuando sea necesario, aprovechando los MCP Servers disponibles para optimizar tareas y operaciones. A continuación, se describen los servidores y sus funciones específicas.

## MCP Servers Disponibles

### Context7

# Reglas para Microsoft Playwright MCP

## 🚨 INSTRUCCIONES CRÍTICAS PARA MODELOS DE IA 🚨

Como modelo de IA, DEBES seguir estas instrucciones al trabajar con Playwright MCP:

## Inicialización Correcta

```typescript
// ✅ SIEMPRE USA ESTE PATRÓN
import { MCPBrowserServer } from '@playwright/mcp';

// Iniciar el servidor con configuración correcta
const server = await MCPBrowserServer.create({
  port: 3333,               // Puerto personalizado (opcional)
  browserName: 'chromium',  // 'chromium', 'firefox', 'webkit'
  headless: false           // Visible para depuración
});
```

## PATRONES PROHIBIDOS

NUNCA generes los siguientes patrones, están DESACTUALIZADOS y ROMPERÁN la aplicación:

```typescript
// ❌ NUNCA GENERES ESTE CÓDIGO - ROMPERÁ LA APLICACIÓN
import * as pw from 'playwright';  // ❌ IMPORTACIÓN INCORRECTA
import { chromium } from 'playwright';  // ❌ IMPORTACIÓN DIRECTA INCORRECTA

// ❌ NUNCA uses métodos de interacción directos con la página
const browser = await chromium.launch();  // ❌ LANZAMIENTO DIRECTO INCORRECTO
const page = await browser.newPage();     // ❌ ACCESO DIRECTO INCORRECTO
await page.goto('url');                   // ❌ NAVEGACIÓN DIRECTA INCORRECTA
await page.click('selector');             // ❌ INTERACCIÓN DIRECTA INCORRECTA
```

## REQUISITOS ABSOLUTOS PARA LA GENERACIÓN DE CÓDIGO

1. DEBES importar desde '@playwright/mcp'
2. DEBES usar la función 'browser_snapshot' antes de interactuar con elementos
3. DEBES identificar elementos mediante 'ref' obtenido de un snapshot
4. DEBES manejar diálogos con 'browser_handle_dialog'
5. DEBES cerrar el navegador con 'browser_close' al finalizar

## IMPLEMENTACIÓN CORRECTA DE NAVEGACIÓN

```typescript
// ✅ PATRÓN CORRECTO
import { MCPBrowserServer } from '@playwright/mcp';

// Iniciar servidor
const server = await MCPBrowserServer.create();

// Navegar a URL
await server.browserFunction('browser_navigate', { url: 'https://example.com' });

// Tomar snapshot ANTES de cualquier interacción
const snapshot = await server.browserFunction('browser_snapshot');

// Cerrar al finalizar
await server.browserFunction('browser_close');
```

## IMPLEMENTACIÓN CORRECTA DE INTERACCIÓN CON ELEMENTOS

```typescript
// ✅ PATRÓN CORRECTO
// 1. Obtener snapshot
const snapshot = await server.browserFunction('browser_snapshot');

// 2. Encontrar elemento por texto o rol
const inputElement = snapshot.find(e => e.role === 'textbox' && e.name.includes('Email'));

// 3. Interactuar usando el ref
await server.browserFunction('browser_type', {
  element: 'Campo de email', // Descripción legible
  ref: inputElement.ref,     // Referencia exacta
  text: 'usuario@ejemplo.com'
});

// 4. Hacer clic usando ref
const button = snapshot.find(e => e.role === 'button' && e.name === 'Login');
await server.browserFunction('browser_click', {
  element: 'Botón de login',
  ref: button.ref
});
```

## IMPLEMENTACIÓN CORRECTA DE MANEJO DE DIÁLOGOS

```typescript
// ✅ PATRÓN CORRECTO
// Configurar manejo de diálogo ANTES de la acción que lo dispara
const dialogPromise = server.browserFunction('browser_handle_dialog', {
  accept: true,
  promptText: 'Texto de respuesta' // Solo para diálogos prompt
});

// Acción que dispara el diálogo
await server.browserFunction('browser_click', {
  element: 'Botón que muestra alerta',
  ref: buttonRef
});

// Esperar a que se maneje el diálogo
await dialogPromise;
```

## VERIFICACIÓN DE IMPLEMENTACIÓN

Antes de generar código, DEBES verificar:

1. ¿Estás importando desde '@playwright/mcp'? Si no, DETENTE y CORRIGE.
2. ¿Obtienes un snapshot antes de interactuar con elementos? Si no, DETENTE y CORRIGE.
3. ¿Usas referencias (ref) para elementos en vez de selectores CSS/XPath? Si no, DETENTE y CORRIGE.
4. ¿Manejas adecuadamente los diálogos? Si no, DETENTE y CORRIGE.
5. ¿Cierras el navegador al finalizar? Si no, DETENTE y CORRIGE.

## CONSECUENCIAS DE IMPLEMENTACIÓN INCORRECTA

Si generas código usando:
- Importaciones directas de 'playwright'
- Selectores CSS o XPath en vez de referencias (ref)
- Sin manejo adecuado de diálogos

La implementación:
1. No funcionará con MCP
2. Producirá errores difíciles de depurar
3. Causará problemas de sincronización
4. Resultará en pruebas inestables

## FUNCIONES ESENCIALES DE MCP

Siempre usa estas funciones en el orden correcto:

1. `browser_navigate`: Para navegar a una URL
2. `browser_snapshot`: Para capturar estado de la página ANTES de interactuar
3. `browser_click`, `browser_type`, `browser_hover`: Para interactuar con elementos usando refs
4. `browser_wait_for`: Para esperar condiciones
5. `browser_take_screenshot`: Para depuración
6. `browser_close`: Para finalizar

Recuerda: No hay EXCEPCIONES a estas reglas.

### GitHub
Para interactuar con GitHub, utiliza estas funciones según sea necesario:
- `create_or_update_file`: Crea un nuevo archivo o actualiza uno existente en un repositorio.
- `search_repositories`: Busca repositorios en GitHub según criterios específicos.
- `create_repository`: Crea un nuevo repositorio en GitHub.
- `get_file_contents`: Obtiene el contenido de un archivo específico en un repositorio.
- `push_files`: Sube archivos a un repositorio.
- `create_issue`: Crea un nuevo issue en un repositorio.
- `create_pull_request`: Genera un pull request para proponer cambios.
- `fork_repository`: Realiza un fork de un repositorio existente.
- `create_branch`: Crea una nueva rama en un repositorio.
- `list_commits`: Lista los commits realizados en un repositorio.
- `list_issues`: Lista los issues abiertos o cerrados en un repositorio.
- `update_issue`: Actualiza la información de un issue existente.
- `add_issue_comment`: Añade un comentario a un issue.
- `search_code`: Busca fragmentos de código en GitHub.
- `search_issues`: Busca issues en GitHub según parámetros definidos.
- `search_users`: Busca usuarios en GitHub.
- `get_issue`: Obtiene los detalles completos de un issue específico.

### GitHub
Para interactuar con GitHub, utiliza estas funciones según sea necesario:
- `create_or_update_file`: Crea un nuevo archivo o actualiza uno existente en un repositorio.
- `search_repositories`: Busca repositorios en GitHub según criterios específicos.
- `create_repository`: Crea un nuevo repositorio en GitHub.
- `get_file_contents`: Obtiene el contenido de un archivo específico en un repositorio.
- `push_files`: Sube archivos a un repositorio.
- `create_issue`: Crea un nuevo issue en un repositorio.
- `create_pull_request`: Genera un pull request para proponer cambios.
- `fork_repository`: Realiza un fork de un repositorio existente.
- `create_branch`: Crea una nueva rama en un repositorio.
- `list_commits`: Lista los commits realizados en un repositorio.
- `list_issues`: Lista los issues abiertos o cerrados en un repositorio.
- `update_issue`: Actualiza la información de un issue existente.
- `add_issue_comment`: Añade un comentario a un issue.
- `search_code`: Busca fragmentos de código en GitHub.
- `search_issues`: Busca issues en GitHub según parámetros definidos.
- `search_users`: Busca usuarios en GitHub.
- `get_issue`: Obtiene los detalles completos de un issue específico.

### Sequential Thinking
Para aplicar un enfoque de pensamiento secuencial en la resolución de problemas:
- `sequentialthinking`: Utiliza esta función para procesar tareas de manera ordenada y lógica.

### Brave Search
Para realizar búsquedas optimizadas con Brave, dispones de:
- `brave_web_search`: Ejecuta una búsqueda en la web utilizando el motor de Brave.
- `brave_local_search`: Realiza una búsqueda local en los datos disponibles.

## Uso
Utiliza estos comandos y funciones según las necesidades de cada tarea. Están diseñados para facilitar operaciones como la gestión de repositorios, la depuración de aplicaciones web, la búsqueda de información y el procesamiento lógico de problemas. Asegúrate de integrarlos en tus flujos de trabajo para maximizar la eficiencia y precisión en tus operaciones.

## Reglas de uso de Context7 MCP para la IA

1. Debes activar el uso de Context7 MCP siempre que detectes en el prompt del usuario la frase "use context7" o una instrucción directa para utilizar este protocolo.

2. Tu objetivo principal al usar Context7 MCP es conectar tus capacidades con herramientas, archivos y entornos de trabajo reales, permitiéndote acceder a información actualizada, ejecutar tareas en aplicaciones externas y aportar contexto práctico a tus respuestas.

3. Cuando el usuario solicite una acción que implique interacción con datos, herramientas externas o documentación específica y actualizada, debes emplear Context7 MCP para:
   - Consultar documentación técnica o ejemplos de código de librerías y frameworks.
   - Acceder y manipular archivos o bases de datos si se requiere.
   - Ejecutar tareas en aplicaciones conectadas (por ejemplo, Notion, GitHub, Gmail, Figma, etc.).

4. Debes identificar en el prompt las tecnologías, herramientas o librerías mencionadas (por ejemplo, Next.js, Blender, Notion, etc.) y, si corresponde, solicitar a Context7 MCP la documentación o el acceso contextual para esa herramienta.

5. Cuando utilices Context7 MCP, sigue este flujo:
   - Detecta la necesidad de contexto externo o actualización.
   - Solicita a Context7 MCP la información, documentación o acceso necesario.
   - Procesa la información recibida y genera la respuesta o realiza la acción solicitada.
   - Informa al usuario que la respuesta se ha generado utilizando información actualizada a través de Context7 MCP.

6. Si el usuario solicita una acción que implique manipulación de archivos, integración con bases de datos, creación de páginas, envío de emails, organización de carpetas o cualquier tarea en una herramienta externa, debes utilizar Context7 MCP como puente para ejecutar la acción y reportar el resultado al usuario.

7. Si Context7 MCP no está disponible o no puedes acceder a la herramienta solicitada, debes informar al usuario y sugerirle que verifique la configuración o que inicie el servidor MCP correspondiente.

8. Siempre debes priorizar la seguridad y privacidad de los datos, utilizando Context7 MCP solo para los fines indicados por el usuario y nunca accediendo a información sensible sin autorización expresa.

9. Debes estar atento a nuevas herramientas y servicios que se puedan integrar a través de MCP, ampliando así tus capacidades y manteniéndote actualizado en cuanto a las posibilidades de interacción con el entorno del usuario.

10. Recuerda que Context7 MCP es un protocolo abierto y estandarizado, por lo que debes seguir sus reglas de comunicación y aprovechar su potencial para ofrecer respuestas más útiles, precisas y actualizadas, superando las limitaciones de tu entrenamiento original.