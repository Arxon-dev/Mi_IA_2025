import { DocumentSegment } from '../types';

/**
 * Utilidades para procesamiento y limpieza de texto
 */

// Palabras clave que indican procesos secuenciales
export const PROCESS_INDICATORS = [
  'primero', 'segundo', 'tercero', 'luego', 'después', 'entonces', 'finalmente',
  'paso', 'etapa', 'fase', 'procedimiento', 'proceso', 'método',
  'comenzar', 'iniciar', 'empezar', 'continuar', 'terminar', 'finalizar',
  'siguiente', 'anterior', 'antes de', 'después de'
];

// Palabras que indican relaciones causales
export const CAUSAL_INDICATORS = [
  'porque', 'debido a', 'como resultado', 'por tanto', 'por lo tanto',
  'causa', 'efecto', 'consecuencia', 'resulta en', 'lleva a',
  'provoca', 'genera', 'produce', 'origina'
];

// Palabras que indican jerarquías
export const HIERARCHY_INDICATORS = [
  'incluye', 'contiene', 'se divide en', 'consiste en', 'comprende',
  'está formado por', 'se compone de', 'abarca', 'engloba',
  'categoría', 'tipo', 'clase', 'grupo', 'familia'
];

// Palabras que indican decisiones o condiciones
export const DECISION_INDICATORS = [
  'si', 'entonces', 'sino', 'en caso de', 'cuando', 'mientras',
  'depende de', 'según', 'opción', 'alternativa', 'elección'
];

/**
 * Limpia y normaliza el texto
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,;:!?¿¡()-]/g, '')
    .trim();
}

/**
 * Divide un documento en segmentos lógicos
 */
export function segmentDocument(content: string): DocumentSegment[] {
  const segments: DocumentSegment[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  let currentId = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    let type: DocumentSegment['type'] = 'paragraph';
    let level: number | undefined;

    // Detectar encabezados
    if (trimmedLine.match(/^#{1,6}\s/)) {
      type = 'heading';
      level = (trimmedLine.match(/^#+/) || [''])[0].length;
    } else if (trimmedLine.match(/^(\d+\.|[•\-*])\s/)) {
      type = 'list';
    } else if (trimmedLine.includes(':') && trimmedLine.split(':').length === 2) {
      type = 'definition';
    }

    segments.push({
      id: `segment_${currentId++}`,
      type,
      content: cleanText(trimmedLine),
      level,
      keywords: extractKeywords(trimmedLine)
    });
  }

  return segments;
}

/**
 * Extrae palabras clave de un texto
 */
export function extractKeywords(text: string): string[] {
  const words = cleanText(text)
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Filtrar palabras comunes (stop words básicas en español)
  const stopWords = new Set([
    'para', 'con', 'por', 'como', 'una', 'uno', 'que', 'del', 'las', 'los',
    'este', 'esta', 'estos', 'estas', 'son', 'está', 'están', 'tiene', 'tienen'
  ]);

  return words.filter(word => !stopWords.has(word));
}

/**
 * Detecta patrones específicos en el texto
 */
export function detectPatterns(text: string) {
  const lowerText = text.toLowerCase();
  
  return {
    hasProcesses: PROCESS_INDICATORS.some(indicator => lowerText.includes(indicator)),
    hasCausalRelations: CAUSAL_INDICATORS.some(indicator => lowerText.includes(indicator)),
    hasHierarchy: HIERARCHY_INDICATORS.some(indicator => lowerText.includes(indicator)),
    hasDecisions: DECISION_INDICATORS.some(indicator => lowerText.includes(indicator))
  };
}

/**
 * Identifica verbos de acción en el texto
 */
export function extractActionVerbs(text: string): string[] {
  const actionVerbs = [
    'crear', 'hacer', 'generar', 'producir', 'construir', 'desarrollar',
    'implementar', 'ejecutar', 'realizar', 'llevar', 'establecer',
    'configurar', 'instalar', 'activar', 'desactivar', 'eliminar',
    'verificar', 'comprobar', 'revisar', 'analizar', 'evaluar'
  ];

  const words = text.toLowerCase().split(/\s+/);
  return actionVerbs.filter(verb => 
    words.some(word => word.includes(verb))
  );
}

/**
 * Genera un ID único para elementos
 */
export function generateId(prefix: string = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 