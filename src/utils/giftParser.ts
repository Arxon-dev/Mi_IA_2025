// giftParser.ts
// Parser propio para preguntas tipo test en formato GIFT con bloques de retroalimentación, desglose y aplicación práctica.

export interface GiftOption {
  text: string;
  iscorrect: boolean;
}

export interface GiftParsedQuestion {
  enunciado: string;
  opciones: GiftOption[];
  retroalimentacion?: string;
  desgloseEstructurado?: string;
  aplicacionPractica?: string;
  bloqueReglaMnemotecnica?: string;
  bloqueReferencia?: string;
}

export interface ParsedGiftOption {
  text: string;
  iscorrect: boolean;
  feedback?: string;
  percentage?: number;
}

export interface ParsedGiftQuestion {
  title?: string;
  questionText: string;
  options: ParsedGiftOption[];
  generalFeedback?: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
}

// Limpiar llaves '}' y saltos de línea al final de los bloques informativos
function cleanBlock(text?: string): string | undefined {
  return text ? text.trim() : undefined;
}

/**
 * Parsea una pregunta tipo test en formato GIFT extendido (con bloques HTML y etiquetas)
 * @param giftText Pregunta en formato GIFT (string)
 * @returns GiftParsedQuestion
 */
export function parseGiftQuestion(giftText: string): GiftParsedQuestion {
  try {
    console.log(`[GIFT Parser] Iniciando parseo...`);
    
    if (!giftText || giftText.trim().length === 0) {
      throw new Error('El texto de la pregunta está vacío');
    }

    // Extraer enunciado (antes de la llave)
    const enunciadoMatch = giftText.match(/^([\s\S]*?){/);
    let enunciado = enunciadoMatch ? enunciadoMatch[1].trim().replace(/\n+$/, '') : '';

    // Eliminar prefijo tipo '// ::IDENTIFICADOR::' si existe (solo la primera línea)
    enunciado = enunciado.replace(/^\/\/.*?::.*?::\n?/, '');

    console.log(`[GIFT Parser] Enunciado extraído: "${enunciado.substring(0, 100)}..."`);
    console.log(`[GIFT Parser] Longitud del enunciado: ${enunciado.length} caracteres`);

    if (!enunciado || enunciado.trim().length === 0) {
      console.warn(`[GIFT Parser] ⚠️ No se pudo extraer enunciado válido del texto`);
    }

    // Extraer opciones (entre llaves)
    const opcionesMatch = giftText.match(/{([\s\S]*?)}/);
    const opcionesRaw = opcionesMatch ? opcionesMatch[1] : '';
    
    console.log(`[GIFT Parser] Opciones raw extraídas: "${opcionesRaw.substring(0, 200)}..."`);

    if (!opcionesRaw || opcionesRaw.trim().length === 0) {
      throw new Error('No se encontraron opciones de respuesta entre llaves {}');
    }

    const opciones: GiftOption[] = [];
    
    // Dividir opciones por líneas y procesar cada una
    const lineasOpciones = opcionesRaw.split(/\n/);
    
    for (const line of lineasOpciones) {
      // ✅ ACTUALIZADO: Usar regex que reconoce porcentajes: =%100%, ~%-33.33333%
      // Mantiene compatibilidad con formato antiguo: =, ~
      const optMatch = line.match(/^\s*([=~])(%[-+]?\d*\.?\d*%)?(.*)$/);
      if (optMatch) {
        const iscorrect = optMatch[1] === '=';
        // optMatch[2] contiene el porcentaje (si existe): %100%, %-33.33333%, etc.
        // optMatch[3] contiene el texto de la opción
        const text = optMatch[3].trim();
        
        if (text.length > 0) {
          opciones.push({
            text,
            iscorrect
          });
          console.log(`[GIFT Parser] Opción agregada: ${iscorrect ? 'CORRECTA' : 'INCORRECTA'} - "${text.substring(0, 50)}..."`);
        }
      }
    }

    console.log(`[GIFT Parser] Total opciones encontradas: ${opciones.length}`);

    if (opciones.length === 0) {
      throw new Error('No se encontraron opciones válidas en el formato correcto (=opción_correcta o ~opción_incorrecta)');
    }

    const opcionesCorrectas = opciones.filter(op => op.iscorrect);
    const opcionesIncorrectas = opciones.filter(op => !op.iscorrect);

    console.log(`[GIFT Parser] Opciones correctas: ${opcionesCorrectas.length}, Opciones incorrectas: ${opcionesIncorrectas.length}`);

    if (opcionesCorrectas.length === 0) {
      console.warn(`[GIFT Parser] ⚠️ No se encontró ninguna opción correcta (marcada con =)`);
    }

    // Extraer bloques especiales (retroalimentación, desglose, aplicación práctica, regla mnemotécnica, referencia)
    // Usar etiquetas claras y HTML si existen
    const retroMatch = giftText.match(/####([\s\S]*?)(?=####|\})/);
    const retroalimentacion = retroMatch ? retroMatch[1].trim() : undefined;
    
    const desgloseMatch = giftText.match(/#### DESGLOSE ESTRUCTURADO:(.*?)(?=####|$)/);
    const aplicacionMatch = giftText.match(/#### APLICACIÓN PRÁCTICA:(.*?)(?=####|$)/);
    const reglaMatch = giftText.match(/#### REGLA MNEMOTÉCNICA:(.*?)(?=####|$)/);
    const referenciaMatch = giftText.match(/Referencia:(.*?)(?=\n|$)/);

    console.log(`[GIFT Parser] Retroalimentación encontrada: ${!!retroalimentacion}`);

    // Lógica para evitar duplicidad: si la referencia ya está dentro de la retroalimentación, no mostrarla aparte
    let bloqueReferencia: string | undefined = undefined;
    if (referenciaMatch && retroalimentacion) {
      // Si la referencia está dentro de la retroalimentación, no la mostramos aparte
      if (!retroalimentacion.includes(referenciaMatch[0])) {
        bloqueReferencia = referenciaMatch[1].trim();
      }
    } else if (referenciaMatch) {
      bloqueReferencia = referenciaMatch[1].trim();
    }

    const resultado = {
      enunciado,
      opciones,
      retroalimentacion: cleanBlock(retroalimentacion),
      desgloseEstructurado: cleanBlock(desgloseMatch ? desgloseMatch[1].trim() : undefined),
      aplicacionPractica: cleanBlock(aplicacionMatch ? aplicacionMatch[1].trim() : undefined),
      bloqueReglaMnemotecnica: cleanBlock(reglaMatch ? reglaMatch[1].trim() : undefined),
      bloqueReferencia: cleanBlock(bloqueReferencia),
    };

    console.log(`[GIFT Parser] ✅ Parseo completado exitosamente`);
    return resultado;

  } catch (error) {
    console.error(`[GIFT Parser] ❌ Error durante el parseo:`, error);
    console.error(`[GIFT Parser] Texto problemático:`, giftText.substring(0, 500) + '...');
    throw error;
  }
}

export class GiftParser {
  private parseOption(optionLine: string): ParsedGiftOption | null {
    // Updated regex to handle percentages: =%100%, ~%-33.33333%, =%, ~%
    const optionMatch = optionLine.match(/^\s*([=~])(%[-+]?\d*\.?\d*%)?(.*)$/);
    
    if (!optionMatch) {
      return null;
    }

    const [, prefix, percentageStr, text] = optionMatch;
    const iscorrect = prefix === '=';
    
    // Parse percentage if present
    let percentage: number | undefined;
    if (percentageStr) {
      const percentageMatch = percentageStr.match(/%([-+]?\d*\.?\d*)%/);
      if (percentageMatch) {
        percentage = parseFloat(percentageMatch[1]);
      }
    }

    // Handle feedback in option (format: option#feedback)
    const feedbackMatch = text.match(/^(.*?)#(.*)$/);
    let optionText = text.trim();
    let feedback: string | undefined;
    
    if (feedbackMatch) {
      optionText = feedbackMatch[1].trim();
      feedback = feedbackMatch[2].trim();
    }

    return {
      text: optionText,
      iscorrect,
      feedback,
      percentage
    };
  }

  // Method to format options back to GIFT format with percentages
  public formatOption(option: ParsedGiftOption): string {
    const prefix = option.iscorrect ? '=' : '~';
    const percentage = option.iscorrect ? '' : '%-33.33333%';
    const feedback = option.feedback ? `#${option.feedback}` : '';
    
    return `${prefix}${percentage}${option.text}${feedback}`;
  }

  // Method to format a complete question back to GIFT format
  public formatQuestion(question: ParsedGiftQuestion): string {
    let result = '';
    
    if (question.title) {
      result += `::${question.title}::\n`;
    }
    
    result += `${question.questionText} {\n`;
    
    question.options.forEach(option => {
      result += `${this.formatOption(option)}\n`;
    });
    
    if (question.generalFeedback) {
      result += `#### ${question.generalFeedback}\n`;
    }
    
    result += '}\n';
    
    return result;
  }
}

/**
 * Ejemplo de uso:
 *
 * import { parseGiftQuestion } from './giftParser';
 * const parsed = parseGiftQuestion(giftText);
 * // parsed.enunciado, parsed.opciones, parsed.retroalimentacion, ...
 */ 