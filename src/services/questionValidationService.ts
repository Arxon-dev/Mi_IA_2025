import { AIService, availableModels } from './aiService';

// Enum para niveles de confianza en la validación
export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Interface para issues de validación
export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
}

// Interface para resultados de validación
export interface ValidationResult {
  isValid: boolean;
  feedback: string;
  questionid: string;
  confidenceLevel?: ConfidenceLevel;
  issues?: ValidationIssue[];
}

interface ValidationOptions {
  provider?: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba';
  model?: string;
  sourceText?: string;
}

const VALIDATION_PROMPT = `Eres un experto en validación de preguntas de examen en formato GIFT. Analiza la siguiente pregunta y responde:
1. ¿Cumple con TODAS las instrucciones y el formato que se usan para generar preguntas en este sistema? (claridad, formato GIFT, opciones, retroalimentación, longitud, etc.)
2. Si no cumple, explica exactamente qué está mal y sugiere cómo corregirlo.
3. Si cumple, responde brevemente "Cumple con las instrucciones".
Pregunta:
`;

export class QuestionValidationService {
  /**
   * Valida una pregunta usando IA
   */
  static async validateQuestion(
    questionContent: string,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    try {
      const { provider = 'anthropic', model, sourceText } = options;
      
      // Obtener el modelo apropiado
      let aiModelObj = availableModels.find(m => m.provider === provider);
      if (model) {
        const specificModel = availableModels.find(m => m.id === model);
        if (specificModel) {
          aiModelObj = specificModel;
        }
      }
      
      if (!aiModelObj) {
        throw new Error(`Modelo no encontrado para el proveedor: ${provider}`);
      }

      // Construir el prompt
      let prompt = '';
      if (sourceText && sourceText.trim().length > 0) {
        prompt = `Eres un experto en validación de preguntas de examen en formato GIFT. Analiza la siguiente pregunta y sus opciones en base al siguiente texto fuente:

TEXTO FUENTE:
${sourceText}

PREGUNTA:
${questionContent}

1. ¿La opción marcada como correcta es realmente la correcta según el texto fuente?
2. ¿Las opciones incorrectas son realmente incorrectas?
3. Explica cualquier error y sugiere correcciones.
4. Si todo es correcto, responde brevemente "Cumple con las instrucciones y el texto fuente".`;
      } else {
        prompt = VALIDATION_PROMPT + questionContent;
      }

      // Llamar al servicio de IA
      const feedback = await AIService.validateWithAI(prompt, aiModelObj);
      
      // Determinar si es válida
      const isValid = this.isValidFeedback(feedback);
      
      return {
        isValid,
        feedback,
        questionid: Date.now().toString(), // temporal ID
        confidenceLevel: isValid ? ConfidenceLevel.HIGH : ConfidenceLevel.LOW,
        issues: isValid ? [] : [{ type: 'error', message: feedback }]
      };
    } catch (error: any) {
      console.error('Error en validación:', error);
      return {
        isValid: false,
        feedback: `Error en la validación: ${error.message || 'Error desconocido'}`,
        questionid: Date.now().toString(),
        confidenceLevel: ConfidenceLevel.LOW,
        issues: [{ type: 'error', message: error.message || 'Error desconocido' }]
      };
    }
  }

  /**
   * Valida múltiples preguntas
   */
  static async validateMultipleQuestions(
    questions: Array<{ id: string; content: string }>,
    options: ValidationOptions = {}
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const question of questions) {
      const result = await this.validateQuestion(question.content, options);
      result.questionid = question.id;
      results.push(result);
    }
    
    return results;
  }

  /**
   * Determina si el feedback indica que la pregunta es válida
   */
  private static isValidFeedback(content: string): boolean {
    // ✅ VALIDACIÓN NUEVA (FORMATO ESPECTACULAR): Reconocer el nuevo formato con **negrita**
    const newFormatPattern = /✅\s*\*\*VÁLIDA\*\*\s*-\s*Contenido verificado y opciones correctamente clasificadas|✅\s*\*\*VÁLIDA\*\*|🏆.*\[✅.*\*\*VÁLIDA\*\*.*\]/i.test(content);
    
    // ✅ VALIDACIÓN RIGUROSA: Formato anterior
    const rigorousValidPattern = /✅ VÁLIDA - Contenido verificado y opciones correctamente clasificadas|✅ VÁLIDA/i.test(content);
    
    // 🔄 LÓGICA ANTIGUA: Mantener para compatibilidad
    const positive = /cumple con las instrucciones y el texto fuente/i.test(content);
    
    // ❌ ERRORES CRÍTICOS: Detectar problemas serios
    const hasCorrection = /❌.*\*\*RECHAZADA\*\*|❌ ERROR DE CONTENIDO|corrección sugerida|corrección necesaria|no es la respuesta correcta|no cumple con las instrucciones|error principal|la opción correcta debe ser|no es literal|imprecisión|preferible usar la palabra exacta|debería decir|no es exactamente literal|palabra exacta|referencia incorrecta|discrepancia en la palabra clave/i.test(content);
    
    return (newFormatPattern || rigorousValidPattern || positive) && !hasCorrection;
  }

  /**
   * Obtiene las configuraciones de validación guardadas del localStorage
   */
  static getValidationSettings(): {
    provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba';
    model: string;
    sourceText: string;
  } {
    if (typeof window === 'undefined') {
      return {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-v2',
        sourceText: ''
      };
    }

    return {
      provider: (localStorage.getItem('validator-provider') as any) || 'anthropic',
      model: localStorage.getItem('validator-model') || 'claude-3-5-sonnet-v2',
      sourceText: localStorage.getItem('validator-source-text') || ''
    };
  }

  /**
   * Guarda las configuraciones de validación en localStorage
   */
  static saveValidationSettings(settings: {
    provider?: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba';
    model?: string;
    sourceText?: string;
  }): void {
    if (typeof window === 'undefined') return;

    if (settings.provider) {
      localStorage.setItem('validator-provider', settings.provider);
    }
    if (settings.model) {
      localStorage.setItem('validator-model', settings.model);
    }
    if (settings.sourceText !== undefined) {
      localStorage.setItem('validator-source-text', settings.sourceText);
    }
  }
}