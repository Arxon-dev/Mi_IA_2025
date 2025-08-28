import { BloomLevel } from '../types/bloomTaxonomy';
import { 
  expertPrompt,
  difficultyPrompt,
  distractorsPrompt,
  formatPrompt,
  qualityPrompt,
  documentationPrompt
} from '../config/prompts';

interface PromptValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number;
}

interface ValidationIssue {
  type: 'format' | 'content' | 'distractor' | 'difficulty' | 'quality';
  description: string;
  severity: 'warning' | 'error';
}

export class PromptValidationService {
  /**
   * Valida que una pregunta cumpla con todos los requisitos de los prompts
   */
  static validateQuestion(question: string): PromptValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 100;

    // Validar formato GIFT
    const formatIssues = this.validateFormat(question);
    issues.push(...formatIssues);
    score -= formatIssues.length * 10;

    // Validar distractores
    const distractorIssues = this.validateDistractors(question);
    issues.push(...distractorIssues);
    score -= distractorIssues.length * 15;

    // Validar dificultad
    const difficultyIssues = this.validateDifficulty(question);
    issues.push(...difficultyIssues);
    score -= difficultyIssues.length * 10;

    // Validar calidad
    const qualityIssues = this.validateQuality(question);
    issues.push(...qualityIssues);
    score -= qualityIssues.length * 5;

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      score: Math.max(0, score)
    };
  }

  /**
   * Valida el formato GIFT y las etiquetas HTML requeridas
   */
  private static validateFormat(question: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Verificar estructura básica GIFT
    if (!question.includes('::') || !question.includes('{') || !question.includes('}')) {
      issues.push({
        type: 'format',
        description: 'La pregunta no sigue el formato GIFT básico',
        severity: 'error'
      });
    }

    // Verificar etiquetas HTML requeridas
    const requiredTags = ['<b>', '</b>', '<br>'];
    requiredTags.forEach(tag => {
      if (!question.includes(tag)) {
        issues.push({
          type: 'format',
          description: `Falta la etiqueta HTML ${tag}`,
          severity: 'error'
        });
      }
    });

    // Verificar emojis requeridos
    const requiredEmojis = ['🔍', '⚖️', '🧠'];
    requiredEmojis.forEach(emoji => {
      if (!question.includes(emoji)) {
        issues.push({
          type: 'format',
          description: `Falta el emoji ${emoji}`,
          severity: 'error'
        });
      }
    });

    // Verificar secciones de retroalimentación
    const requiredSections = [
      'DESGLOSE ESTRUCTURADO:',
      'APLICACIÓN PRÁCTICA:',
      'REGLA MNEMOTÉCNICA:'
    ];
    requiredSections.forEach(section => {
      if (!question.includes(section)) {
        issues.push({
          type: 'format',
          description: `Falta la sección "${section}"`,
          severity: 'error'
        });
      }
    });

    return issues;
  }

  /**
   * Valida los distractores según las reglas especificadas
   */
  private static validateDistractors(question: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Verificar número de distractores
    const distractorCount = (question.match(/~[^~}]*/g) || []).length;
    if (distractorCount !== 3) {
      issues.push({
        type: 'distractor',
        description: 'La pregunta debe tener exactamente 3 distractores',
        severity: 'error'
      });
    }

    // Extraer solo el bloque de opciones entre llaves
    const optionsBlock = (question.match(/{([^}]*)}/s) || [])[1] || '';
    // Dividir en líneas y filtrar solo las opciones
    const optionLines = optionsBlock.split('\n').map(l => l.trim()).filter(l => l.startsWith('=') || l.startsWith('~'));
    // Extraer la respuesta correcta y los distractores SOLO de esas líneas
    const correctOption = (optionLines.find(l => l.startsWith('=')) || '').replace(/^=/, '').trim();
    const distractors = optionLines.filter(l => l.startsWith('~')).map(l => l.replace(/^~/, '').trim());
    // LOG: Mostrar valores extraídos
    console.log('[VALIDACIÓN] correctOption:', correctOption);
    console.log('[VALIDACIÓN] distractors:', distractors);
    if (correctOption && distractors.length > 0) {
      const correctLength = correctOption.length;
      const avgDistractorLength = distractors.reduce((a, b) => a + b.length, 0) / distractors.length;
      // LOG: Mostrar longitudes
      console.log('[VALIDACIÓN] correctLength:', correctLength, 'avgDistractorLength:', avgDistractorLength);
      if (Math.abs(correctLength - avgDistractorLength) > avgDistractorLength * 0.3) {
        issues.push({
          type: 'distractor',
          description: 'La respuesta correcta debe tener una longitud similar a la media de los distractores',
          severity: 'warning'
        });
      }
    }

    // Verificar trampas conceptuales si están habilitadas
    if (question.includes('🎯')) {
      if (!question.includes('TRAMPA CONCEPTUAL:')) {
        issues.push({
          type: 'distractor',
          description: 'Falta la explicación de la trampa conceptual',
          severity: 'error'
        });
      }
    }

    return issues;
  }

  /**
   * Valida el nivel de dificultad según los criterios establecidos
   */
  private static validateDifficulty(question: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Verificar indicadores de dificultad
    const hasSpecificDetails = question.includes('específicos') || 
                             question.includes('detallada') ||
                             question.includes('precisa');
    
    const hasExceptions = question.includes('excepción') || 
                         question.includes('salvo') ||
                         question.includes('excepto');
    
    const hasMultipleReferences = (question.match(/artículo \d+/gi) || []).length > 1;

    if (!hasSpecificDetails && !hasExceptions && !hasMultipleReferences) {
      issues.push({
        type: 'difficulty',
        description: 'La pregunta no muestra indicadores claros de dificultad',
        severity: 'warning'
      });
    }

    return issues;
  }

  /**
   * Valida la calidad general de la pregunta
   */
  private static validateQuality(question: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Verificar citas textuales
    if (!question.includes('"')) {
      issues.push({
        type: 'quality',
        description: 'Falta cita textual del contenido normativo',
        severity: 'warning'
      });
    }

    // Verificar retroalimentación detallada
    const feedbackSection = question.match(/#### RETROALIMENTACIÓN:.*?(?=\n\n|$)/s);
    if (feedbackSection) {
      const feedback = feedbackSection[0];
      console.log('[VALIDACIÓN] feedback:', feedback);
      // Verificar longitud mínima de retroalimentación
      if (feedback.length < 200) {
        issues.push({
          type: 'quality',
          description: 'La retroalimentación es demasiado breve',
          severity: 'warning'
        });
      }
      // Verificar elementos educativos
      if (!feedback.includes('ejemplo') && !feedback.includes('caso')) {
        issues.push({
          type: 'quality',
          description: 'La retroalimentación debe incluir ejemplos o casos prácticos',
          severity: 'warning'
        });
      }
    }

    return issues;
  }

  /**
   * Valida un conjunto de preguntas y retorna estadísticas
   */
  static validateQuestionSet(questions: string[]): {
    validCount: number;
    totalScore: number;
    commonIssues: { [key: string]: number };
    recommendations: string[];
    distractorLengthWarnings: { index: number; question: string }[];
    issuesByType: { [description: string]: { index: number; question: string }[] };
  } {
    const results = questions.map(q => this.validateQuestion(q));
    
    const validCount = results.filter(r => r.isValid).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0) / questions.length;
    
    // Contar problemas comunes
    const commonIssues: { [key: string]: number } = {};
    const distractorLengthWarnings: { index: number; question: string }[] = [];
    const issuesByType: { [description: string]: { index: number; question: string }[] } = {};
    results.forEach((result, idx) => {
      result.issues.forEach(issue => {
        const key = `${issue.type}:${issue.description}`;
        commonIssues[key] = (commonIssues[key] || 0) + 1;
        if (issue.type === 'distractor' && issue.description.includes('longitud similar')) {
          distractorLengthWarnings.push({ index: idx, question: questions[idx] });
        }
        // Agrupar por descripción de problema
        if (!issuesByType[issue.description]) {
          issuesByType[issue.description] = [];
        }
        issuesByType[issue.description].push({ index: idx, question: questions[idx] });
      });
    });

    // Generar recomendaciones
    const recommendations: string[] = [];
    Object.entries(commonIssues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([issue, count]) => {
        const [type, description] = issue.split(':');
        recommendations.push(
          `Mejorar ${type}: ${description} (presente en ${count} preguntas)`
        );
      });

    return {
      validCount,
      totalScore,
      commonIssues,
      recommendations,
      distractorLengthWarnings,
      issuesByType
    };
  }
} 