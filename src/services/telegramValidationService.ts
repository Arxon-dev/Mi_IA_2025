/**
 * Servicio de validación específico para los límites de caracteres de Telegram
 * Valida que las preguntas cumplan con los requisitos estrictos de Telegram
 */

export interface TelegramLimits {
  question: number;  // 300 caracteres máximo
  option: number;    // 100 caracteres máximo por opción (truncamiento automático)
  feedback: number;  // 200 caracteres máximo (con truncamiento permitido)
}

export interface TelegramValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  questionLength: number;
  optionLengths: number[];
  feedbackLength: number;
}

export interface TelegramQuestionData {
  question: string;
  options: string[];
  feedback: string;
}

export class TelegramValidationService {
  private static readonly LIMITS: TelegramLimits = {
    question: 300,
    option: 100,
    feedback: 200
  };

  /**
   * Valida una pregunta completa contra los límites de Telegram
   */
  static validateQuestion(questionData: TelegramQuestionData): TelegramValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validar longitud de la pregunta (sin truncamiento)
    const questionLength = questionData.question.length;
    if (questionLength > this.LIMITS.question) {
      errors.push(`Pregunta excede ${this.LIMITS.question} caracteres: ${questionLength} caracteres`);
    }

    // Validar longitud de cada opción (sin truncamiento)
    const optionLengths = questionData.options.map(option => option.length);
    optionLengths.forEach((length, index) => {
      if (length > this.LIMITS.option) {
        errors.push(`Opción ${index + 1} excede ${this.LIMITS.option} caracteres: ${length} caracteres`);
      }
    });

    // Validar longitud del feedback (con truncamiento permitido)
    const feedbackLength = questionData.feedback.length;
    if (feedbackLength > this.LIMITS.feedback) {
      warnings.push(`Feedback excede ${this.LIMITS.feedback} caracteres: ${feedbackLength} caracteres (se truncará automáticamente)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      questionLength,
      optionLengths,
      feedbackLength
    };
  }

  /**
   * Valida múltiples preguntas
   */
  static validateQuestions(questions: TelegramQuestionData[]): {
    validQuestions: TelegramQuestionData[];
    invalidQuestions: Array<{ question: TelegramQuestionData; validation: TelegramValidationResult }>;
    totalValid: number;
    totalInvalid: number;
  } {
    const validQuestions: TelegramQuestionData[] = [];
    const invalidQuestions: Array<{ question: TelegramQuestionData; validation: TelegramValidationResult }> = [];

    questions.forEach(question => {
      const validation = this.validateQuestion(question);
      if (validation.isValid) {
        validQuestions.push(question);
      } else {
        invalidQuestions.push({ question, validation });
      }
    });

    return {
      validQuestions,
      invalidQuestions,
      totalValid: validQuestions.length,
      totalInvalid: invalidQuestions.length
    };
  }

  /**
   * Trunca automáticamente el feedback si excede el límite
   */
  static truncateFeedback(feedback: string): string {
    if (feedback.length <= this.LIMITS.feedback) {
      return feedback;
    }

    // Truncar manteniendo palabras completas cuando sea posible
    const truncated = feedback.substring(0, this.LIMITS.feedback - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > this.LIMITS.feedback * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Aplica el truncamiento automático al feedback en una pregunta
   */
  static applyTelegramLimits(questionData: TelegramQuestionData): TelegramQuestionData {
    return {
      ...questionData,
      feedback: this.truncateFeedback(questionData.feedback)
    };
  }

  /**
   * Aplica los límites de Telegram a múltiples preguntas
   */
  static applyTelegramLimitsToQuestions(questions: TelegramQuestionData[]): TelegramQuestionData[] {
    return questions.map(question => this.applyTelegramLimits(question));
  }

  /**
   * Obtiene un reporte detallado de validación
   */
  static getValidationReport(questions: TelegramQuestionData[]): {
    summary: {
      total: number;
      valid: number;
      invalid: number;
      validPercentage: number;
    };
    details: Array<{
      index: number;
      isValid: boolean;
      validation: TelegramValidationResult;
    }>;
    recommendations: string[];
  } {
    const details = questions.map((question, index) => ({
      index: index + 1,
      isValid: true,
      validation: this.validateQuestion(question)
    }));

    details.forEach(detail => {
      detail.isValid = detail.validation.isValid;
    });

    const valid = details.filter(d => d.isValid).length;
    const invalid = details.length - valid;

    const recommendations: string[] = [];
    
    if (invalid > 0) {
      recommendations.push(`${invalid} preguntas no cumplen los límites de Telegram`);
      recommendations.push('Considera regenerar las preguntas inválidas con instrucciones más específicas');
    }

    const longQuestions = details.filter(d => d.validation.questionLength > this.LIMITS.question * 0.9).length;
    if (longQuestions > 0) {
      recommendations.push(`${longQuestions} preguntas están cerca del límite de caracteres`);
    }

    return {
      summary: {
        total: questions.length,
        valid,
        invalid,
        validPercentage: questions.length > 0 ? (valid / questions.length) * 100 : 0
      },
      details,
      recommendations
    };
  }

  /**
   * Obtiene los límites actuales de Telegram
   */
  static getLimits(): TelegramLimits {
    return { ...this.LIMITS };
  }
}