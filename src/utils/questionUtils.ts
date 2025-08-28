/**
 * Aleatoriza un array in-place usando el algoritmo Fisher-Yates
 * y devuelve una nueva instancia del array aleatorizado.
 * @param array El array a aleatorizar.
 * @returns Un nuevo array con los elementos aleatorizados.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]; // Crear una copia para no mutar el original directamente si se pasa por referencia
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Intercambio de elementos
  }
  return newArray;
}

interface TelegramPollPayload {
  question: string;
  options: string[];
  correct_option_id: number;
  explanation?: string;
  chat_id?: string;
  // Cualquier otro campo que pueda tener el payload
  [key: string]: any; 
}

/**
 * Aleatoriza las opciones de una pregunta para un poll de Telegram.
 * @param pollData El payload original de la pregunta para Telegram.
 * @returns Un nuevo payload con las opciones aleatorizadas y el correct_option_id actualizado.
 */
export function shuffleOptionsForTelegram(pollData: TelegramPollPayload): TelegramPollPayload {
  if (!pollData || !pollData.options || pollData.options.length === 0) {
    return pollData; // No hay opciones para aleatorizar
  }

  const correctAnswerText = pollData.options[pollData.correct_option_id];
  
  // Aleatorizar todas las opciones
  const shuffledOptions = shuffleArray([...pollData.options]);
  
  // Encontrar el nuevo índice de la respuesta correcta
  const newCorrectIndex = shuffledOptions.findIndex(option => option === correctAnswerText);

  // Asegurarse de que la respuesta correcta fue encontrada.
  // Esto debería ser siempre true si correctAnswerText estaba en pollData.options.
  if (newCorrectIndex === -1) {
    console.error("Error: La respuesta correcta no se encontró después de aleatorizar.", pollData, shuffledOptions);
    // Devolver el original para evitar errores, aunque esto indica un problema.
    return pollData; 
  }

  return {
    ...pollData,
    options: shuffledOptions,
    correct_option_id: newCorrectIndex,
  };
}

/**
 * Configuración para el cálculo de preguntas sugeridas
 */
interface QuestionSuggestionConfig {
  wordsPerQuestion: number;
  roundingMethod: 'floor' | 'round' | 'ceil';
  useRobustTextProcessing: boolean;
}

/**
 * Configuración por defecto para sugerencias de preguntas
 */
const DEFAULT_SUGGESTION_CONFIG: QuestionSuggestionConfig = {
  wordsPerQuestion: 100,
  roundingMethod: 'round', // Usamos round como compromiso entre ambas implementaciones
  useRobustTextProcessing: true
};

/**
 * Calcula la cantidad sugerida de preguntas basado en el contenido de texto.
 * 
 * @param text - El texto del cual calcular preguntas sugeridas
 * @param config - Configuración opcional para personalizar el cálculo
 * @returns Número entero de preguntas sugeridas (mínimo 1)
 * 
 * @example
 * ```typescript
 * // Uso básico (comportamiento por defecto)
 * const suggested = getSuggestedQuestions(text);
 * 
 * // Uso con configuración personalizada para mantener compatibilidad
 * const suggestedFloor = getSuggestedQuestions(text, { roundingMethod: 'floor' });
 * const suggestedRound = getSuggestedQuestions(text, { roundingMethod: 'round' });
 * ```
 */
export function getSuggestedQuestions(
  text: string, 
  config: Partial<QuestionSuggestionConfig> = {}
): number {
  if (!text || typeof text !== 'string') {
    return 1; // Fallback seguro
  }

  const finalConfig = { ...DEFAULT_SUGGESTION_CONFIG, ...config };
  
  let wordCount: number;
  
  if (finalConfig.useRobustTextProcessing) {
    // Procesamiento robusto: trim + filter empty strings
    wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  } else {
    // Procesamiento simple (compatible con implementación original)
    wordCount = text.split(/\s+/).length;
  }
  
  if (wordCount === 0) {
    return 1; // Fallback seguro para texto vacío
  }
  
  const rawSuggestion = wordCount / finalConfig.wordsPerQuestion;
  
  let result: number;
  switch (finalConfig.roundingMethod) {
    case 'floor':
      result = Math.floor(rawSuggestion);
      break;
    case 'ceil':
      result = Math.ceil(rawSuggestion);
      break;
    case 'round':
    default:
      result = Math.round(rawSuggestion);
      break;
  }
  
  return Math.max(1, result);
}

/**
 * Función de compatibilidad que mantiene el comportamiento exacto 
 * de DocumentSectionSelector.tsx
 */
export function getSuggestedQuestionsLegacyFloor(text: string): number {
  return getSuggestedQuestions(text, { 
    roundingMethod: 'floor',
    useRobustTextProcessing: false 
  });
}

/**
 * Función de compatibilidad que mantiene el comportamiento exacto 
 * de manual-question-generator/page.tsx
 */
export function getSuggestedQuestionsLegacyRound(text: string): number {
  return getSuggestedQuestions(text, { 
    roundingMethod: 'round',
    useRobustTextProcessing: true 
  });
}

/**
 * Configuración para análisis inteligente de contenido
 */
interface ContentAnalysisConfig {
  useAI: boolean;
  fallbackToWordCount: boolean;
  maxAnalysisLength: number;
  analysisPrompt?: string;
}

/**
 * Resultado del análisis de contenido
 */
interface ContentAnalysis {
  suggestedQuestions: number;
  reasoning: string;
  contentType: 'theoretical' | 'practical' | 'mixed' | 'filler';
  conceptDensity: 'low' | 'medium' | 'high';
  importance: 'low' | 'medium' | 'high';
  keyTopics: string[];
}

/**
 * Configuración por defecto para análisis inteligente
 */
const DEFAULT_ANALYSIS_CONFIG: ContentAnalysisConfig = {
  useAI: true,
  fallbackToWordCount: true,
  maxAnalysisLength: 2000, // Caracteres máximos para análisis AI
  analysisPrompt: `Analiza este contenido educativo y determina:
1. Número recomendado de preguntas (1-20)
2. Tipo de contenido (theoretical/practical/mixed/filler)
3. Densidad conceptual (low/medium/high)
4. Importancia educativa (low/medium/high)
5. Temas clave principales

Considera:
- Conceptos únicos y definiciones importantes
- Complejidad del material
- Relevancia educativa
- Densidad de información valiosa
- Necesidad de evaluación

Responde SOLO en formato JSON:
{
  "suggestedQuestions": number,
  "reasoning": "string",
  "contentType": "theoretical|practical|mixed|filler",
  "conceptDensity": "low|medium|high", 
  "importance": "low|medium|high",
  "keyTopics": ["topic1", "topic2"]
}`
};

/**
 * Analiza el contenido usando IA para sugerir preguntas inteligentemente.
 * 
 * @param text - Texto a analizar
 * @param config - Configuración del análisis
 * @returns Análisis completo del contenido y sugerencia de preguntas
 */
export async function getSuggestedQuestionsIntelligent(
  text: string,
  config: Partial<ContentAnalysisConfig> = {}
): Promise<ContentAnalysis> {
  const finalConfig = { ...DEFAULT_ANALYSIS_CONFIG, ...config };
  
  // Validación básica
  if (!text || text.trim().length === 0) {
    return {
      suggestedQuestions: 1,
      reasoning: "Texto vacío - se sugiere mínimo 1 pregunta",
      contentType: 'filler',
      conceptDensity: 'low',
      importance: 'low',
      keyTopics: []
    };
  }

  // Si el texto es muy largo, truncar para análisis
  const analysisText = text.length > finalConfig.maxAnalysisLength 
    ? text.substring(0, finalConfig.maxAnalysisLength) + "..."
    : text;

  try {
    // Análisis con IA
    if (finalConfig.useAI) {
      const analysis = await analyzeContentWithAI(analysisText, finalConfig.analysisPrompt!);
      if (analysis) {
        return analysis;
      }
    }
  } catch (error) {
    console.warn('Error en análisis AI, usando fallback:', error);
  }

  // Fallback: análisis heurístico
  if (finalConfig.fallbackToWordCount) {
    return analyzeContentHeuristic(text);
  }

  // Fallback final
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return {
    suggestedQuestions: Math.max(1, Math.round(wordCount / 100)),
    reasoning: "Análisis AI no disponible - usando conteo de palabras estándar",
    contentType: 'mixed',
    conceptDensity: 'medium',
    importance: 'medium',
    keyTopics: []
  };
}

/**
 * Análisis heurístico del contenido (sin IA)
 */
function analyzeContentHeuristic(text: string): ContentAnalysis {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  // Indicadores de importancia/densidad conceptual (mejorados)
  const definitionMarkers = /\b(es|son|significa|define|concepto|término|caracteriza|consiste|representa|implica|refiere)\b/gi;
  const questionMarkers = /[¿?]/g;
  const enumerationMarkers = /\b(\d+[\.\)]|primero|segundo|tercero|además|también|por último|finalmente|asimismo)\b/gi;
  const technicalMarkers = /\b[A-Z]{2,}|\b\w+[Aa]ción\b|\b\w+[Ii]dad\b|\b\w+[Mm]iento\b|\b\w+[Ii]smo\b/g;
  const emphasisMarkers = /\b(importante|fundamental|esencial|clave|básico|crítico|crucial|principal|primordial|vital)\b/gi;
  const processMarkers = /\b(proceso|método|procedimiento|sistema|técnica|estrategia|algoritmo)\b/gi;
  const scientificMarkers = /\b(teoría|principio|ley|ecuación|fórmula|hipótesis|experimento)\b/gi;
  const educationalMarkers = /\b(aprend|estudi|enseñ|comprend|analiz|evalú|memoriz)\w*/gi;
  
  // Contadores
  const definitions = (text.match(definitionMarkers) || []).length;
  const questions = (text.match(questionMarkers) || []).length;
  const enumerations = (text.match(enumerationMarkers) || []).length;
  const technical = (text.match(technicalMarkers) || []).length;
  const emphasis = (text.match(emphasisMarkers) || []).length;
  const processes = (text.match(processMarkers) || []).length;
  const scientific = (text.match(scientificMarkers) || []).length;
  const educational = (text.match(educationalMarkers) || []).length;
  
  // Cálculo base más agresivo para contenido denso
  let score = Math.max(1, wordCount / 100); // Mínimo 1
  
  // Incrementos más significativos por tipo de contenido
  score += definitions * 0.5;     // Definiciones son muy importantes
  score += scientific * 0.4;      // Contenido científico requiere más evaluación
  score += processes * 0.3;       // Procesos necesitan ser bien entendidos
  score += emphasis * 0.3;        // Palabras de énfasis indican importancia
  score += questions * 0.2;       // Preguntas retóricas
  score += technical * 0.15;      // Términos técnicos
  score += enumerations * 0.15;   // Listas y secuencias
  score += educational * 0.1;     // Contexto educativo
  
  // Bonus por densidad alta (muchos indicadores en poco texto)
  const totalIndicators = definitions + scientific + processes + emphasis + technical;
  const density = totalIndicators / Math.max(1, wordCount / 10); // Indicadores por cada 10 palabras
  
  if (density > 0.5) {
    score *= 1.3; // Bonus del 30% para contenido muy denso
  } else if (density > 0.3) {
    score *= 1.15; // Bonus del 15% para contenido moderadamente denso
  }
  
  const finalQuestions = Math.max(1, Math.round(score));
  
  // Determinar tipo y densidad (criterios más específicos)
  let contentType: ContentAnalysis['contentType'] = 'mixed';
  let conceptDensity: ContentAnalysis['conceptDensity'] = 'medium';
  let importance: ContentAnalysis['importance'] = 'medium';
  
  // Clasificación más precisa
  if (definitions >= 2 || scientific >= 2 || technical >= 3) {
    contentType = 'theoretical';
    conceptDensity = 'high';
    importance = 'high';
  } else if (enumerations >= 2 || processes >= 1 || questions >= 1) {
    contentType = 'practical';
    conceptDensity = density > 0.3 ? 'high' : 'medium';
    importance = emphasis >= 1 ? 'high' : 'medium';
  } else if (definitions === 0 && technical === 0 && emphasis === 0 && scientific === 0) {
    contentType = 'filler';
    conceptDensity = 'low';
    importance = 'low';
  }
  
  // Ajuste final: contenido con muchos indicadores pero pocas palabras
  if (wordCount < 50 && totalIndicators >= 3) {
    conceptDensity = 'high';
    importance = 'high';
  }
  
  return {
    suggestedQuestions: finalQuestions,
    reasoning: `Análisis heurístico mejorado: ${definitions} definiciones, ${scientific} términos científicos, ${technical} términos técnicos, ${emphasis} palabras clave, ${processes} procesos. Densidad: ${density.toFixed(2)}. Base: ${wordCount} palabras → ${finalQuestions} preguntas`,
    contentType,
    conceptDensity,
    importance,
    keyTopics: [] // Heurístico no extrae temas específicos
  };
}

/**
 * Analiza contenido usando IA (implementación mockup - necesita integración con servicio AI)
 */
async function analyzeContentWithAI(text: string, prompt: string): Promise<ContentAnalysis | null> {
  // TODO: Integrar con AIService existente
  // Por ahora retorna null para usar fallback heurístico
  
  /* Implementación futura:
  try {
    const aiService = new AIService();
    const response = await aiService.chat([
      { role: 'system', content: prompt },
      { role: 'user', content: text }
    ]);
    
    const analysis = JSON.parse(response.content);
    return {
      suggestedQuestions: Math.max(1, Math.min(20, analysis.suggestedQuestions)),
      reasoning: analysis.reasoning,
      contentType: analysis.contentType,
      conceptDensity: analysis.conceptDensity,
      importance: analysis.importance,
      keyTopics: analysis.keyTopics || []
    };
  } catch (error) {
    console.error('Error en análisis AI:', error);
    return null;
  }
  */
  
  return null; // Usar fallback por ahora
}

/**
 * Función híbrida que combina análisis inteligente con fallback tradicional
 */
export async function getSuggestedQuestionsHybrid(
  text: string,
  useIntelligentAnalysis: boolean = true
): Promise<{ questions: number; analysis?: ContentAnalysis }> {
  
  if (useIntelligentAnalysis) {
    try {
      const analysis = await getSuggestedQuestionsIntelligent(text);
      return {
        questions: analysis.suggestedQuestions,
        analysis
      };
    } catch (error) {
      console.warn('Error en análisis inteligente, usando método tradicional:', error);
    }
  }
  
  // Fallback al método tradicional
  const questions = getSuggestedQuestions(text);
  return { questions };
} 