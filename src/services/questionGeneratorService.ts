import { BloomLevel } from './bloomTaxonomyService';

// Renombramos las interfaces para evitar conflictos
export interface QuestionTypeConfig {
  id: string;
  name: string;
  description: string;
  percentage: number;
}

export interface DifficultyLevelConfig {
  id: string;
  name: string;
  description: string;
  weight: number;
}

// Mantenemos los enums para los identificadores
export enum QuestionTypeId {
  TEXT = 'text',
  FILL_BLANK = 'fill_blank',
  IDENTIFY_INCORRECT = 'identify_incorrect',
  NONE_CORRECT = 'none_correct'
}

export enum DifficultyLevelId {
  DIFFICULT = 'difficult',
  VERY_DIFFICULT = 'very_difficult',
  EXTREMELY_DIFFICULT = 'extremely_difficult'
}

export interface QuestionConfig {
  types: QuestionTypeId[];
  difficulties: DifficultyLevelId[];
  bloomLevels?: BloomLevel[]; // Agregamos los niveles cognitivos de Bloom
}

export const questionTypes: QuestionTypeConfig[] = [
  {
    id: 'blank_spaces',
    name: 'Espacios en blanco',
    description: 'Preguntas que requieren completar términos clave o datos numéricos',
    percentage: 5
  },
  {
    id: 'textual',
    name: 'Preguntas textuales',
    description: 'Preguntas basadas directamente en el documento',
    percentage: 75
  },
  {
    id: 'identify_incorrect',
    name: 'Identificación de incorrectas',
    description: 'Preguntas que requieren identificar la respuesta INCORRECTA',
    percentage: 10
  },
  {
    id: 'none_correct',
    name: 'Ninguna es correcta',
    description: 'Preguntas donde ninguna de las opciones es correcta',
    percentage: 10
  }
];

export const difficultyLevels: DifficultyLevelConfig[] = [
  {
    id: 'difficult',
    name: 'Difícil',
    description: 'Basadas en aspectos específicos de la normativa que requieren una lectura atenta',
    weight: 5
  },
  {
    id: 'very_difficult',
    name: 'Muy difícil',
    description: 'Basadas en excepciones, matices o condiciones especiales dentro de la normativa',
    weight: 25
  },
  {
    id: 'extremely_difficult',
    name: 'Extremadamente difícil',
    description: 'Basadas en la integración de múltiples disposiciones normativas',
    weight: 70
  }
];

export class QuestionGeneratorService {
  private static config = {
    selectedQuestionTypes: questionTypes,
    selectedDifficultyLevels: difficultyLevels
  };

  static getQuestionTypeDistribution(): QuestionTypeConfig[] {
    return this.config.selectedQuestionTypes;
  }

  static getDifficultyLevels(): DifficultyLevelConfig[] {
    return this.config.selectedDifficultyLevels;
  }

  static validateDistribution(): boolean {
    const totalPercentage = this.config.selectedQuestionTypes.reduce(
      (sum, type) => sum + type.percentage,
      0
    );
    return totalPercentage === 100;
  }

  static validateDifficultyWeights(): boolean {
    const totalWeight = this.config.selectedDifficultyLevels.reduce(
      (sum, level) => sum + level.weight,
      0
    );
    return totalWeight === 100;
  }

  static generateQuestionPrompt(content: string, numQuestions: number): string {
    const questionTypeDistribution = this.getQuestionTypeDistribution()
      .map(type => `${type.name} (${type.percentage}%)`)
      .join('\n');

    const difficultyDistribution = this.getDifficultyLevels()
      .map(level => `${level.name} (${level.weight}%)`)
      .join('\n');

    return `
    INSTRUCCIONES PARA GENERACIÓN DE PREGUNTAS

    Generar ${numQuestions} preguntas basadas en el siguiente contenido:
    "${content}"

    DISTRIBUCIÓN DE TIPOS DE PREGUNTAS:
    ${questionTypeDistribution}

    NIVELES DE DIFICULTAD:
    ${difficultyDistribution}

    Asegúrate de que cada pregunta:
    1. Siga el formato GIFT especificado
    2. Incluya retroalimentación detallada
    3. Cumpla con los criterios de calidad establecidos
    4. Se ajuste a la distribución de tipos y dificultad indicada
    `;
  }
}

/**
 * Dada una lista de preguntas y la configuración de tipos, selecciona exactamente la cantidad de cada tipo según la proporción.
 * Si faltan preguntas de algún tipo, rellena con las que haya disponibles.
 */
export function selectQuestionsByType(
  questions: { type: string; content: string }[],
  typeConfig: QuestionTypeConfig[],
  total: number
): { type: string; content: string }[] {
  // Calcular cuántas preguntas de cada tipo se necesitan
  const typeCounts: Record<string, number> = {};
  let assigned = 0;
  typeConfig.forEach((type, idx) => {
    // Último tipo: asigna el resto para asegurar suma exacta
    if (idx === typeConfig.length - 1) {
      typeCounts[type.id] = total - assigned;
    } else {
      const count = Math.floor((type.percentage / 100) * total);
      typeCounts[type.id] = count;
      assigned += count;
    }
  });

  // Agrupar preguntas por tipo
  const grouped: Record<string, { type: string; content: string }[]> = {};
  for (const type of typeConfig) {
    grouped[type.id] = [];
  }
  for (const q of questions) {
    if (grouped[q.type]) {
      grouped[q.type].push(q);
    } else {
      // Si el tipo no está en la config, lo ignora
    }
  }

  // Seleccionar la cantidad exacta de cada tipo
  const result: { type: string; content: string }[] = [];
  for (const type of typeConfig) {
    const needed = typeCounts[type.id];
    const available = grouped[type.id] || [];
    result.push(...available.slice(0, needed));
  }

  // Si faltan preguntas, rellenar con cualquier tipo disponible
  if (result.length < total) {
    const all = questions.filter(q => !result.includes(q));
    result.push(...all.slice(0, total - result.length));
  }

  return result.slice(0, total);
} 