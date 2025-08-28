import { DocumentSectionService } from './documentSectionService';
import { StorageService } from './storageService';
import { AIService } from './aiService';
import { PromptValidationService } from './promptValidationService';
import { parseGiftQuestion } from '../utils/giftParser';
// ✅ NUEVA IMPORTACIÓN AGREGADA
import type { OptionLengthType } from './aiService';

export interface AutomationConfig {
  targetCategoryPattern: string; // Ej: "L21", "P21", "B21"
  maxQuestionsPerCategory: number; // 20 por defecto
  questionsPerSection: number;
  useIntelligentMode: boolean;
  moodleContextId: number;
  autoAdvanceCategory: boolean;
  questionTypeCounts?: Record<string, number>;
  optionLength?: string;
  customTitle?: string;
}

export interface ProcessingResult {
  totalSections: number;
  processedSections: number;
  totalQuestionsGenerated: number;
  categoriesUsed: string[];
  errors: string[];
  validationResults: {
    totalValid: number;
    totalInvalid: number;
    averageScore: number;
  };
}

export interface MoodleCategory {
  id: number;
  name: string;
  parent?: number;
  contextid: number;
  questioncount?: number;
}

export class AutomatedSectionProcessor {
  private config: AutomationConfig;
  private currentCategoryId: number | null = null;
  private currentCategoryName: string = '';
  private processedSections: number = 0;
  private totalQuestionsGenerated: number = 0;
  private categoriesUsed: string[] = [];
  private errors: string[] = [];
  private validationResults = {
    totalValid: 0,
    totalInvalid: 0,
    scores: [] as number[]
  };

  constructor(config: AutomationConfig) {
    this.config = config;
    this.currentCategoryName = config.targetCategoryPattern;
  }

  async processAllSections(documentId: string): Promise<ProcessingResult> {
    try {
      console.log('🚀 [AutomatedSectionProcessor] Iniciando procesamiento automatizado');
      
      // 1. Obtener todas las secciones del documento
      const sections = await DocumentSectionService.getSections(documentId);
      console.log(`📄 [AutomatedSectionProcessor] Encontradas ${sections.length} secciones`);

      if (sections.length === 0) {
        throw new Error('No se encontraron secciones en el documento');
      }

      // 2. Configurar categoría inicial
      await this.setupInitialCategory();

      // 3. Procesar cada sección
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        console.log(`🔄 [AutomatedSectionProcessor] Procesando sección ${i + 1}/${sections.length}: ${section.title}`);
        
        try {
          await this.processSingleSection(section, documentId);
          this.processedSections++;
        } catch (error) {
          const errorMsg = `Error en sección "${section.title}": ${error instanceof Error ? error.message : 'Error desconocido'}`;
          console.error(`❌ [AutomatedSectionProcessor] ${errorMsg}`);
          this.errors.push(errorMsg);
        }
      }

      // 4. Generar resultado final
      return this.generateFinalResult(sections.length);

    } catch (error) {
      console.error('❌ [AutomatedSectionProcessor] Error general:', error);
      throw error;
    }
  }

  private async setupInitialCategory(): Promise<void> {
    try {
      // Buscar categoría existente
      const categories = await this.getQuestionCategories(this.config.moodleContextId);
      const existingCategory = categories.find(cat => cat.name === this.currentCategoryName);
      
      if (existingCategory) {
        this.currentCategoryId = existingCategory.id;
        console.log(`✅ [AutomatedSectionProcessor] Usando categoría existente: ${this.currentCategoryName} (ID: ${this.currentCategoryId})`);
      } else {
        // Crear nueva categoría
        const newCategory = await this.createQuestionCategory(
          this.currentCategoryName,
          this.config.moodleContextId
        );
        this.currentCategoryId = newCategory.id;
        console.log(`✅ [AutomatedSectionProcessor] Creada nueva categoría: ${this.currentCategoryName} (ID: ${this.currentCategoryId})`);
      }
      
      this.categoriesUsed.push(this.currentCategoryName);
    } catch (error) {
      throw new Error(`Error configurando categoría inicial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private async processSingleSection(section: any, documentId: string): Promise<void> {
    // 1. Generar preguntas para la sección
    const questions = await AIService.generateQuestions(
      section.content,
      this.config.questionsPerSection,
      this.config.questionTypeCounts || {},
      (this.config.optionLength || 'medium') as OptionLengthType,
      undefined,
      this.config.customTitle
    );

    // 2. Parsear y validar preguntas
    const validQuestions = await this.parseAndValidateQuestions(questions);
    
    if (validQuestions.length === 0) {
      throw new Error('No se generaron preguntas válidas para esta sección');
    }

    // 3. Guardar en base de datos local
    await this.saveSectionQuestions(section.id, validQuestions);

    // 4. Verificar límite de categoría antes de importar
    await this.checkAndAdvanceCategoryIfNeeded();

    // 5. Importar a Moodle
    await this.importQuestionsToMoodle(validQuestions);

    this.totalQuestionsGenerated += validQuestions.length;
    console.log(`✅ [AutomatedSectionProcessor] Sección procesada: ${validQuestions.length} preguntas generadas e importadas`);
  }

  private async parseAndValidateQuestions(rawQuestions: string): Promise<string[]> {
    // Parsear preguntas usando el mismo método que handleGenerateQuestions
    const questionPattern = /<b>[^<]+<\/b><br><br>[\s\S]*?{[\s\S]*?}/g;
    const questionMatches = rawQuestions.match(questionPattern);
    
    let questionsArray: string[] = [];
    if (questionMatches && questionMatches.length > 0) {
      questionsArray = questionMatches.map(q => q.trim());
    } else {
      // Fallback
      const fallbackPattern = /[^}]*{[^}]*}/g;
      const fallbackMatches = rawQuestions.match(fallbackPattern);
      if (fallbackMatches && fallbackMatches.length > 0) {
        questionsArray = fallbackMatches.map(q => q.trim());
      } else {
        questionsArray = [rawQuestions];
      }
    }

    // Validar preguntas
    const validQuestions: string[] = [];
    for (const q of questionsArray) {
      try {
        const parsed = parseGiftQuestion(q);
        if (parsed && parsed.opciones && parsed.opciones.length > 0) {
          validQuestions.push(q);
        }
      } catch (error) {
        console.warn('[AutomatedSectionProcessor] Pregunta inválida omitida:', q.substring(0, 100) + '...');
        this.validationResults.totalInvalid++;
      }
    }

    // Validación adicional con PromptValidationService
    if (validQuestions.length > 0) {
      const validation = await PromptValidationService.validateQuestionSet(validQuestions);
      this.validationResults.totalValid += validation.validCount;
      this.validationResults.scores.push(validation.totalScore);
    }

    return validQuestions;
  }

  private async saveSectionQuestions(sectionId: string, questions: string[]): Promise<void> {
    const questionsPayload = questions.map((q) => ({
      content: q,
      type: 'gift',
      difficulty: 'medium',
      bloomLevel: null,
      lastScheduledSendAt: null,
      sendCount: 0,
      lastsuccessfulsendat: null,
      isActive: true
    }));

    await StorageService.addMultipleSectionQuestions(sectionId, questionsPayload);
  }

  private async checkAndAdvanceCategoryIfNeeded(): Promise<void> {
    if (!this.config.autoAdvanceCategory || !this.currentCategoryId) return;

    // Obtener conteo actual de preguntas en la categoría
    const categories = await this.getQuestionCategories(this.config.moodleContextId);
    const currentCategory = categories.find(cat => cat.id === this.currentCategoryId);
    
    if (currentCategory && (currentCategory.questioncount || 0) >= this.config.maxQuestionsPerCategory) {
      console.log(`🔄 [AutomatedSectionProcessor] Categoría ${this.currentCategoryName} alcanzó el límite (${currentCategory.questioncount}/${this.config.maxQuestionsPerCategory})`);
      
      // Detectar siguiente categoría
      const nextCategoryName = this.detectNextCategory(this.currentCategoryName);
      
      // Buscar o crear siguiente categoría
      const existingNext = categories.find(cat => cat.name === nextCategoryName);
      if (existingNext) {
        this.currentCategoryId = existingNext.id;
        console.log(`✅ [AutomatedSectionProcessor] Cambiado a categoría existente: ${nextCategoryName} (ID: ${this.currentCategoryId})`);
      } else {
        const newCategory = await this.createQuestionCategory(nextCategoryName, this.config.moodleContextId);
        this.currentCategoryId = newCategory.id;
        console.log(`✅ [AutomatedSectionProcessor] Creada y cambiado a nueva categoría: ${nextCategoryName} (ID: ${this.currentCategoryId})`);
      }
      
      this.currentCategoryName = nextCategoryName;
      this.categoriesUsed.push(nextCategoryName);
    }
  }

  private detectNextCategory(currentCategory: string): string {
    const match = currentCategory.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const prefix = match[1]; // "L", "P", "B"
      const number = parseInt(match[2]); // 21
      return `${prefix}${number + 1}`; // "L22", "P22", "B22"
    }
    throw new Error(`Formato de categoría no reconocido: ${currentCategory}`);
  }

  private async importQuestionsToMoodle(questions: string[]): Promise<void> {
    if (!this.currentCategoryId) {
      throw new Error('No hay categoría configurada para importación');
    }

    const giftContent = questions.join('\n\n');
    const filename = `auto_import_${Date.now()}.gift`;
    
    // Codificar a Base64
    const fileContentBase64 = btoa(unescape(encodeURIComponent(giftContent)));

    const response = await fetch('/api/moodle/import-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contextid: this.config.moodleContextId,
        categoryid: this.currentCategoryId,
        filename: filename,
        filecontent: fileContentBase64
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Error durante la importación a Moodle');
    }

    console.log(`✅ [AutomatedSectionProcessor] Importadas ${questions.length} preguntas a Moodle`);
  }

  private async getQuestionCategories(contextId: number): Promise<MoodleCategory[]> {
    const response = await fetch(`/api/moodle/moodle_question_categories?contextId=${contextId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener categorías');
    }
    return await response.json();
  }

  private async createQuestionCategory(name: string, contextId: number): Promise<MoodleCategory> {
    const response = await fetch('/api/moodle/moodle_question_categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contextid: contextId,
        name: name,
        parentid: 0
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear la categoría');
    }
    
    return await response.json();
  }

  private generateFinalResult(totalSections: number): ProcessingResult {
    const averageScore = this.validationResults.scores.length > 0 
      ? this.validationResults.scores.reduce((a, b) => a + b, 0) / this.validationResults.scores.length 
      : 0;

    return {
      totalSections,
      processedSections: this.processedSections,
      totalQuestionsGenerated: this.totalQuestionsGenerated,
      categoriesUsed: this.categoriesUsed,
      errors: this.errors,
      validationResults: {
        totalValid: this.validationResults.totalValid,
        totalInvalid: this.validationResults.totalInvalid,
        averageScore
      }
    };
  }
}