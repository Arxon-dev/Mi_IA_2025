import { marked } from 'marked';

export class MarkdownService {
  static async parseMarkdown(content: string): Promise<string> {
    try {
      // Configuración básica de marked
      marked.setOptions({
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Convierte los saltos de línea en <br>
      });

      // Validar que el contenido no esté vacío
      if (!content.trim()) {
        throw new Error('El contenido está vacío');
      }

      // Eliminar referencias a imágenes de Aspose.Words
      const cleanContent = content.replace(/!\[.*?\]\(Aspose\.Words\.[a-f0-9-]+\.(png|jpg|jpeg|gif)\)/gi, '');

      // Preservar etiquetas HTML específicas antes de renderizar
      const preservedContent = this.preserveHtmlTags(cleanContent);
      
      // Renderizar el markdown
      const rendered = marked.parse(preservedContent);
      
      // Restaurar las etiquetas HTML preservadas
      const finalContent = this.restoreHtmlTags(rendered as string);
      
      return finalContent;
    } catch (error) {
      console.error('Error al procesar el Markdown:', error);
      if (error instanceof Error) {
        throw new Error(`Error al procesar el archivo Markdown: ${error.message}`);
      }
      throw new Error('Error al procesar el archivo Markdown');
    }
  }

  // Método para preservar etiquetas HTML específicas
  private static preserveHtmlTags(content: string): string {
    // Reemplazar temporalmente las etiquetas HTML que queremos preservar
    return content
      // Preservar etiquetas <b>
      .replace(/<b>(.*?)<\/b>/g, '___BOLD_START___$1___BOLD_END___')
      // Preservar etiquetas <br>
      .replace(/<br>/g, '___BR___')
      // Preservar etiquetas <div> personalizadas para bloques de código
      .replace(/<div class="gift-code-block">([\s\S]*?)<\/div>/g, '___DIV_GIFT_START___$1___DIV_GIFT_END___')
      // Preservar emojis
      .replace(/(🔍|⚖️|🧠)/g, '___EMOJI_$1___');
  }

  // Método para restaurar etiquetas HTML preservadas
  private static restoreHtmlTags(content: string): string {
    // Restaurar las etiquetas HTML preservadas
    return content
      .replace(/___BOLD_START___(.*?)___BOLD_END___/g, '<b>$1</b>')
      .replace(/___BR___/g, '<br>')
      .replace(/___DIV_GIFT_START___([\s\S]*?)___DIV_GIFT_END___/g, '<div class="gift-code-block">$1</div>')
      .replace(/___EMOJI_(🔍|⚖️|🧠)___/g, '$1');
  }

  static async readMarkdownFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') {
            throw new Error('El contenido del archivo no es texto válido');
          }

          // Limpiar el contenido de referencias a imágenes de Aspose.Words
          const cleanText = text.replace(/!\[.*?\]\(Aspose\.Words\.[a-f0-9-]+\.(png|jpg|jpeg|gif)\)/gi, '');
          resolve(cleanText);
        } catch (error) {
          console.error('Error al leer el archivo:', error);
          reject(new Error('Error al leer el archivo Markdown'));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error en FileReader:', error);
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsText(file);
    });
  }

  static validateMarkdown(content: string): boolean {
    try {
      // Limpiar el contenido de referencias a imágenes de Aspose.Words
      const cleanContent = content.replace(/!\[.*?\]\(Aspose\.Words\.[a-f0-9-]+\.(png|jpg|jpeg|gif)\)/gi, '');
      
      // Intentar parsear el markdown
      const result = marked.parse(cleanContent);
      // Verificar que el resultado sea una cadena y no esté vacío
      return typeof result === 'string' && result.length > 0 && result !== cleanContent;
    } catch {
      return false;
    }
  }
} 