---
description: Directrices y contexto para trabajar con archivos CSS, estilos de componentes, responsive, rendimiento y estructura en el proyecto.
globs: 
alwaysApply: false
---
Al trabajar con archivos CSS o su configuración en este proyecto, por favor recuerda:

- **Priorizar TailwindCSS:** Para la mayoría de los estilos, utiliza las clases de utilidad de TailwindCSS directamente en tus archivos de componentes (TSX/JSX).
    - Para la configuración del tema y las personalizaciones de Tailwind, consulta principalmente `@tailwind.config.ts`. Si ese no es el activo, revisa `@tailwind.config.js`.

- **Archivos CSS Globales:** Si necesitas estilos globales, estilos base que no se pueden representar fácilmente con Tailwind, o estilos para componentes muy específicos que no usan Tailwind, utiliza los archivos designados:
    - `@src/app/globals.css`
    - `@src/styles/globals.css` (si existe y se utiliza)

- **Procesamiento CSS:** Ten en cuenta la configuración en `@postcss.config.js`, ya que puede afectar el resultado final del CSS, especialmente cómo se integra Tailwind y otros plugins.

- **Linting con Stylelint:** Si Stylelint está configurado en el proyecto (revisar `package.json` y configuraciones de Stylelint), asegúrate de que cualquier CSS personalizado que escribas cumpla con sus reglas para mantener la consistencia y calidad del código.

- **Consistencia:** Mantén un enfoque consistente en cómo se escriben y organizan los estilos CSS que no son de Tailwind.

- **Evitar Redundancia:** No dupliques estilos que ya pueden ser logrados fácilmente con TailwindCSS.

**Archivos de referencia clave para CSS:**
- `@tailwind.config.ts`
- `@tailwind.config.js` (como alternativa o si `ts` no es el principal)
- `@src/app/globals.css`
- `@src/styles/globals.css`
- `@postcss.config.js`


