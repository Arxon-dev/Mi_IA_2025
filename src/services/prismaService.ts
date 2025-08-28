import { PrismaClient, Prisma } from '@prisma/client';
import type { 
  document, 
  section, 
  question, 
  config, 
  statistics, 
  bloomlevel, 
  prompt as PrismaPrompt,
  questionconfig,
  aiconfig as PrismaAIConfig
} from '@prisma/client';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { withRetry } from '@/lib/prisma-retry';
import { AIConfig, AIConfigCreate, AIConfigUpdate, TextProcessingConfig, FormatConfig, FeedbackConfig, DistributionConfig, QuestionTypePercentages, DifficultyPercentages } from '../types/ai';
import { randomUUID } from 'crypto';

// Parser para SectionQuestion
interface ParsedSectionQuestion {
  question: string;
  options: string[];
  correctanswerindex: number;
  success: boolean;
  error?: string;
}

function parseSectionQuestionContent(content: string): ParsedSectionQuestion {
  try {
    // 1. Limpiar el contenido inicial
    let cleanContent = content;
    
    // Remover comentarios iniciales (// Pregunta X...)
    cleanContent = cleanContent.replace(/^\/\/[^\n]*\n/, '');
    
    // Remover HTML tags pero mantener el texto
    cleanContent = cleanContent.replace(/<[^>]*>/g, ' ');
    
    // Normalizar espacios
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim();
    
    // 2. Extraer la pregunta principal
    let questionText = '';
    
    // Buscar donde empiezan las opciones (a), b), c), d) o A), B), C), D))
    const optionsPattern = /\s*[a-d]\)\s*/i;
    const optionsMatch = cleanContent.search(optionsPattern);
    
    if (optionsMatch > 0) {
      questionText = cleanContent.substring(0, optionsMatch).trim();
    } else {
      // Si no encuentra opciones con formato a), buscar otros patrones
      const alternativePattern = /\s*{\s*=/;
      const altMatch = cleanContent.search(alternativePattern);
      if (altMatch > 0) {
        questionText = cleanContent.substring(0, altMatch).trim();
      } else {
        // Como último recurso, tomar los primeros 200 caracteres
        questionText = cleanContent.substring(0, 200).trim();
      }
    }
    
    // 3. Extraer opciones
    let options: string[] = [];
    
    // Buscar patrones de opciones a), b), c), d)
    const optionMatches = cleanContent.match(/[a-d]\)\s*([^a-d\)]*?)(?=[a-d]\)|$)/gi);
    
    if (optionMatches && optionMatches.length > 0) {
      optionMatches.forEach(match => {
        // Limpiar la opción
        const option = match.replace(/^[a-d]\)\s*/i, '').trim();
        if (option.length > 0 && option.length < 200) { // Filtrar opciones muy largas
          options.push(option);
        }
      });
    }
    
    // Si no encontró opciones con el patrón a), crear opciones genéricas
    if (options.length === 0) {
      options.push('Verdadero', 'Falso', 'No sabe', 'No contesta');
    } else if (options.length < 4) {
      // Si hay menos de 4 opciones, añadir opciones genéricas hasta completar 4
      const genericOptions = ['Todas son correctas', 'Ninguna es correcta', 'No sabe', 'No contesta'];
      let i = 0;
      while (options.length < 4 && i < genericOptions.length) {
        options.push(genericOptions[i]);
        i++;
      }
    }
    
    // 4. Determinar respuesta correcta
    let correctanswerindex = 0;
    
    // Buscar indicadores de respuesta correcta {=...}
    const correctAnswerPattern = /{\s*=([^}]*?)}/;
    const correctMatch = cleanContent.match(correctAnswerPattern);
    
    if (correctMatch && options.length > 2) {
      const correctText = correctMatch[1].toLowerCase().trim();
      // Buscar en las opciones cual coincide mejor
      for (let i = 0; i < options.length; i++) {
        if (options[i].toLowerCase().includes(correctText.substring(0, 20))) {
          correctanswerindex = i;
          break;
        }
      }
    }
    
    // 5. Validar resultado
    if (questionText.length === 0) {
      return {
        question: '',
        options: [],
        correctanswerindex: 0,
        success: false,
        error: 'No se pudo extraer la pregunta'
      };
    }
    
    // Verificar longitud para Telegram (con prefijo)
    const telegramFormat = `🧪 PRUEBA SECTIONQUESTION\n\n${questionText}`;
    if (telegramFormat.length > 300) {
      // Truncar la pregunta para que quepa
      const maxQuestionLength = 300 - 35; // 35 chars para el prefijo
      questionText = questionText.substring(0, maxQuestionLength - 3) + '...';
    }
    
    // Asegurar que siempre haya 4 opciones
    if (options.length === 0) {
      options = ['Verdadero', 'Falso', 'No sabe', 'No contesta'];
    } else if (options.length < 4) {
      // Si hay menos de 4 opciones, añadir opciones genéricas hasta completar 4
      const genericOptions = ['Todas son correctas', 'Ninguna es correcta', 'No sabe', 'No contesta'];
      let i = 0;
      while (options.length < 4 && i < genericOptions.length) {
        options.push(genericOptions[i]);
        i++;
      }
    }
    
    return {
      question: questionText,
      options: options,
      correctanswerindex,
      success: true
    };
    
  } catch (error) {
    return {
      question: '',
      options: [],
      correctanswerindex: 0,
      success: false,
      error: `Error al parsear: ${error}`
    };
  }
}

// Export the prisma instance for backward compatibility
// Prisma instance is already imported at the top of the file

interface AIFeatures {
  id: string;
  conceptTrap: boolean;
  precisionDistractors: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentProgress {
  id: string;
  documentId: string;
  totalSections: number;
  processedSections: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Prompt {
  id: string;
  name: string;
  content: string;
  file: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para preguntas programables del Telegram
interface SchedulableQuestion {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  bloomLevel: string | null;
  sourcemodel: 'document' | 'section' | 'validQuestion' | 'examenOficial2018' | 'examenoficial2024' | 'sectionQuestion';
  lastScheduledSendAt: Date | null;
  sendCount: number;
  lastsuccessfulsendat: Date | null;
}

// Tipo personalizado para los resultados de Prisma con providerKeys incluidos
type PrismaAIConfigResult = {
  id: string;
  createdat: Date;
  updatedat: Date;
  provider: string;
  model: string;
  apikey?: string | null;  // Cambio: hago apiKey opcional
  temperature: number | null;
  maxtokens: number | null;
  questionsperchunk: number | null;
  systemprompt: string | null;
  textprocessing: string | null;
  format: string | null;
  feedback: string | null;
  distribution: string | null;
  questiontypes: string | null;
  difficultylevels: string | null;
  telegramschedulerenabled: boolean | null;
  telegramschedulerfrequency: string | null;
  telegramschedulerquantity: number | null;
  telegramschedulerlastrun: Date | null;
  telegramschedulerstarthour: number | null;
  telegramschedulerendhour: number | null;
  telegramschedulerstartminute: number | null;
  telegramschedulerendminute: number | null;
  telegram_chat_id: string | null;
  providerKeys?: {
    id: string;
    createdat: Date;
    updatedat: Date;
    provider: string;
    apiKey: string;
    aiconfigid: string;
  }[];
};

// Tipo para los datos de entrada de Prisma
type PrismaAIConfigInput = {
  provider?: string;
  model?: string;
  apiKey?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  systemPrompt?: string | null;
  textProcessing?: string | null;
  format?: string | null;
  feedback?: string | null;
  distribution?: string | null;
  questionTypes?: string | null;
  difficultyLevels?: string | null;
};

export class PrismaService {

  private static async handlePrismaError<T>(error: any, operation: string): Promise<T> {
    console.error(`Error en operación ${operation}:`, {
      error: error instanceof Error ? error.message : String(error),
      code: error?.code,
      meta: error?.meta,
      details: error?.details,
      hint: error?.hint
    });

    // Errores específicos de conexión - intentar reconectar
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
      console.warn('⚠️ Error de conexión detectado, intentando reconectar...');
      const reconnected = await ensurePrismaConnection();
      if (reconnected) {
        throw new Error('Conexión restablecida. Por favor, intenta la operación nuevamente.');
      } else {
        throw new Error('No se pudo restablecer la conexión a la base de datos');
      }
    }

    // Errores específicos de Prisma/MySQL
    if (error?.code) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          throw new Error(`Error de restricción única en ${error?.meta?.target}`);
        case 'P2025': // Record not found
          throw new Error('Registro no encontrado');
        case 'P2021': // Table does not exist
          throw new Error('La tabla no existe');
        case '42P01': // Undefined table
          throw new Error('Tabla no definida en la base de datos');
        case '23505': // Unique violation
          throw new Error('Violación de restricción única');
        case '23503': // Foreign key violation
          throw new Error('Violación de clave foránea');
        default:
          if (error.code.startsWith('P')) { // Errores de Prisma
            throw new Error(`Error de Prisma: ${error.message}`);
          } else { // Errores de base de datos
            throw new Error(`Error de base de datos: ${error.message}`);
          }
      }
    }

    // Para errores de conexión legacy
    if (error?.errorCode) {
      console.error('Error de conexión a base de datos:', {
        errorCode: error.errorCode,
        message: error.message,
        database_url: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')
      });
      throw new Error('Error de conexión a la base de datos');
    }

    // Error genérico
    throw new Error(`Error en la operación ${operation}: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Documents
  static async getDocuments(): Promise<document[]> {
    try {
      console.log('Obteniendo todos los documentos');
      
      const documents = await withRetry(async () => {
        return await prisma.document.findMany({
          // Elimino include ya que no está disponible en MySQL
        });
      }, 3, 'getDocuments');
      
      console.log(`Encontrados ${documents.length} documentos`);
      return documents;
    } catch (error) {
      throw this.handlePrismaError<document[]>(error, 'getDocuments');
    }
  }

  static async getDocumentById(id: string): Promise<document | null> {
    try {
      console.log('Buscando documento con ID:', id);
      
      const document = await withRetry(async () => {
        return await prisma.document.findUnique({
          where: { id },
          // Elimino include ya que no está disponible en MySQL
        });
      }, 3, `getDocumentById(${id})`);
      
      if (!document) {
        console.log('No se encontró el documento:', id);
        return null;
      }
      
      console.log('Documento encontrado:', document.id);
      return document;
    } catch (error) {
      return this.handlePrismaError<document | null>(error, 'getDocumentById');
    }
  }

  static async saveDocument(document: Omit<document, 'createdat' | 'updatedat'> & { sections?: section[], questions?: question[] }): Promise<document> {
    try {
      console.log('Iniciando guardado de documento:', {
        id: document.id,
        title: document.title,
        contentLength: document.content.length
      });

      // Usar una transacción para asegurar la consistencia
      return await prisma.$transaction(async (tx) => {
        // Guardar o actualizar el documento principal
        const savedDoc = await tx.document.upsert({
          where: { id: document.id },
          update: {
            title: document.title,
            content: document.content,
            date: document.date,
            type: document.type,
            questioncount: document.questioncount || 0,
            updatedat: new Date()
          },
          create: {
            id: document.id,
            title: document.title,
            content: document.content,
            date: document.date,
            type: document.type,
            questioncount: document.questioncount || 0
          }
        });

        console.log('Documento base guardado:', {
          id: savedDoc.id,
          title: savedDoc.title
        });

        // Si hay secciones, actualizarlas de forma segura
        if (document.sections?.length) {
          console.log(`Procesando ${document.sections.length} secciones...`);
          
          // Obtener secciones actuales para comparar
          const currentSections = await tx.section.findMany({
            where: { documentid: savedDoc.id },
            select: { id: true, title: true, order: true }
          });
          
          // Verificar si las secciones han cambiado realmente
          const newSectionIds = new Set(document.sections.map(s => s.id));
          const currentSectionIds = new Set(currentSections.map(s => s.id));
          
          const sectionsChanged = currentSections.length !== document.sections.length ||
            !currentSections.every(s => newSectionIds.has(s.id));
          
          if (sectionsChanged) {
            console.log('🔄 Secciones han cambiado, actualizando...');
            // Eliminar secciones existentes solo si han cambiado
            await tx.section.deleteMany({
              where: { documentid: savedDoc.id }
            });

            // Crear nuevas secciones en lotes
            for (let i = 0; i < document.sections.length; i += 100) {
              const batch = document.sections.slice(i, i + 100);
              await tx.section.createMany({
                data: batch.map(section => ({
                  id: section.id,
                  documentid: savedDoc.id,
                  title: section.title,
                  content: section.content,
                  type: section.type,
                  order: section.order,
                  processed: section.processed || false
                }))
              });
            }
          } else {
            console.log('✅ Secciones sin cambios, conservando preguntas de sección...');
            // No eliminar secciones si no han cambiado, preservando las SectionQuestion
          }
        }

        // Si hay preguntas, actualizarlas
        if (document.questions?.length) {
          console.log(`Procesando ${document.questions.length} preguntas...`);
          
          // Eliminar preguntas existentes
          await tx.question.deleteMany({
            where: { documentid: savedDoc.id }
          });

          // Crear nuevas preguntas en lotes
          for (let i = 0; i < document.questions.length; i += 100) {
            const batch = document.questions.slice(i, i + 100);
            await tx.question.createMany({
              data: batch.map(question => ({
                id: question.id,
                documentid: savedDoc.id,
                content: question.content,
                type: question.type,
                difficulty: question.difficulty,
                bloomlevel: question.bloomlevel
              }))
            });
          }
        }

        // Obtener el documento actualizado
        const finalDoc = await tx.document.findUnique({
          where: { id: savedDoc.id }
        });

        if (!finalDoc) {
          throw new Error(`No se pudo encontrar el documento después de guardarlo: ${savedDoc.id}`);
        }

        console.log('Documento guardado exitosamente con todas sus relaciones');
        return finalDoc;
      }, {
        timeout: 60000
      });
    } catch (error: any) {
      return this.handlePrismaError<document>(error, 'saveDocument');
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    await prisma.document.delete({
      where: { id },
    });
  }

  // Sections
  static async getSections(documentId: string): Promise<section[]> {
    return prisma.section.findMany({
      where: { documentid: documentId },
      orderBy: { order: 'asc' },
    });
  }

  static async saveSection(section: Omit<section, 'createdat' | 'updatedat'>): Promise<section> {
    return prisma.section.upsert({
      where: { id: section.id },
      update: section,
      create: section,
    });
  }

  // Questions
  static async getQuestions(documentId: string): Promise<question[]> {
    return withRetry(async () => {
      return await prisma.question.findMany({
        where: { documentid: documentId },
      });
    }, 3, `getQuestions(${documentId})`);
  }

  static async getRecentQuestions(quantity: number): Promise<question[]> {
    try {
      console.log(`🔍 PrismaService: Obteniendo ${quantity} preguntas recientes`);
      const questions = await prisma.question.findMany({
        take: quantity,
        orderBy: {
          createdat: 'desc', // Asume que tienes un campo createdAt en tu modelo Question
        },
      });
      console.log(`✅ PrismaService: ${questions.length} preguntas recientes encontradas`);
      return questions as question[];
    } catch (error) {
      console.error('❌ PrismaService: Error al obtener preguntas recientes:', error);
      return this.handlePrismaError<question[]>(error, 'getRecentQuestions');
    }
  }

  static async saveQuestion(question: Omit<question, 'createdat'>): Promise<question> {
    return prisma.question.create({
      data: question,
    });
  }

  // Config
  static async getConfig(key: string): Promise<string | null> {
    const config = await prisma.config.findUnique({
      where: { key },
    });
    return config?.value ?? null;
  }

  static async saveConfig(key: string, value: string): Promise<void> {
    await prisma.config.upsert({
      where: { key },
      update: { value, updatedat: new Date() },
      create: { 
        id: randomUUID(),
        key, 
        value,
        createdat: new Date(),
        updatedat: new Date()
      },
    });
  }

  // Statistics
  static async getStats(): Promise<statistics | null> {
    return prisma.statistics.findFirst();
  }

  static async updateStats(stats: Partial<statistics>): Promise<void> {
    const currentStats = await this.getStats();
    if (currentStats) {
      await prisma.statistics.update({
        where: { id: currentStats.id },
        data: { ...stats, updatedat: new Date() },
      });
    } else {
      await prisma.statistics.create({
        data: {
          id: randomUUID(),
          processeddocs: stats.processeddocs ?? 0,
          generatedquestions: stats.generatedquestions ?? 0,
          bloomaverage: stats.bloomaverage ?? 0,
          savedtime: stats.savedtime ?? 0,
          createdat: new Date(),
          updatedat: new Date(),
        },
      });
    }
  }

  // Bloom Levels
  static async getBloomLevels(): Promise<bloomlevel[]> {
    return prisma.bloomlevel.findMany({
      orderBy: { createdat: 'asc' },
    });
  }

  static async saveBloomLevel(level: Omit<bloomlevel, 'id' | 'createdat' | 'updatedat'>): Promise<bloomlevel> {
    return prisma.bloomlevel.create({
      data: {
        id: randomUUID(),
        ...level,
        createdat: new Date(),
        updatedat: new Date()
      },
    });
  }

  // Obtener la API key de un proveedor para una configuración
  static async getProviderApiKey(aiConfigId: string, provider: string): Promise<string | null> {
    try {
      const key = await prisma.aiproviderkey.findFirst({
        where: { aiconfigid: aiConfigId, provider },
      });
      return key?.apikey || null;
    } catch (error) {
      throw this.handlePrismaError<string | null>(error, 'getProviderApiKey');
    }
  }

  /**
   * Guarda una API key para un proveedor específico en la base de datos
   * @param aiConfigId ID de la configuración de IA
   * @param provider Proveedor (openai, google, anthropic, etc.)
   * @param apiKey API key a guardar
   * @returns Promise<boolean> Indica si la operación fue exitosa
   */
  static async setProviderApiKey(
    aiConfigId: string,
    provider: string,
    apiKey: string
  ): Promise<boolean> {
    try {
      console.log(`💾 PrismaService.setProviderApiKey: Guardando API key para ${provider}`);
      
      // Verificar si ya existe una entrada para este proveedor
      const existingKey = await prisma.aiproviderkey.findFirst({
        where: {
          aiconfigid: aiConfigId,
          provider
        }
      });
      
      if (existingKey) {
        // Actualizar la API key existente
        console.log(`🔄 Actualizando API key existente para ${provider}`);
        await prisma.aiproviderkey.update({
          where: {
            id: existingKey.id
          },
          data: {
            apikey: apiKey,
            updatedat: new Date()
          }
        });
      } else {
        // Crear una nueva entrada para esta API key
        console.log(`➕ Creando nueva API key para ${provider}`);
        await prisma.aiproviderkey.create({
          data: {
            id: aiConfigId + '_' + provider + '_' + Date.now(),
            aiconfigid: aiConfigId,
            provider,
            apikey: apiKey,
            createdat: new Date(),
            updatedat: new Date()
          }
        });
      }
      
      console.log(`✅ API key para ${provider} guardada exitosamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando API key para ${provider}:`, error);
      throw this.handlePrismaError<boolean>(error, 'setProviderApiKey');
    }
  }

  // Obtener la configuración de IA actual
  static async getAIConfig(): Promise<AIConfig | null> {
    try {
      const configFromDb = await prisma.aiconfig.findFirst();
      if (!configFromDb) {
        // Si no existe configuración, crear una por defecto
        return this.createAIConfig({
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: 'Eres un asistente experto en generar preguntas.',
          textProcessing: {} as TextProcessingConfig,
          format: {} as FormatConfig,
          feedback: {} as FeedbackConfig,
          distribution: {} as DistributionConfig,
          questionTypes: {} as QuestionTypePercentages,
          difficultyLevels: {} as DifficultyPercentages
        });
      }
      // Transformar primero, luego añadir/determinar la apiKey activa
      const transformedConfig = this.transformPrismaConfig(configFromDb as unknown as PrismaAIConfigResult);
      // Lógica para determinar la apiKey activa (puede permanecer o ajustarse)
      // Buscar provider key por separado
      const providerKey = await prisma.aiproviderkey.findFirst({
        where: { 
          provider: configFromDb.provider 
        }
      });
      let activeApiKey = providerKey?.apikey || null;
      if (!activeApiKey) {
        const envKeys: Record<string, string | undefined> = {
          openai: process.env.NEXT_PUBLIC_GPT_API_KEY,
          google: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
          deepseek: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
          xai: process.env.NEXT_PUBLIC_GROK_API_KEY || process.env.NEXT_PUBLIC_XAI_API_KEY,
          alibaba: process.env.NEXT_PUBLIC_QWEN_API_KEY
        };
        activeApiKey = envKeys[configFromDb.provider] || null;
      }
      return {
        ...transformedConfig,
        apiKey: activeApiKey,
        telegramSchedulerStartHour: configFromDb.telegramschedulerstarthour,
        telegramSchedulerStartMinute: configFromDb.telegramschedulerstartminute,
        telegramSchedulerEndHour: configFromDb.telegramschedulerendhour,
        telegramSchedulerEndMinute: configFromDb.telegramschedulerendminute,
        telegramChatId: configFromDb.telegram_chat_id,
      };
    } catch (error) {
      throw this.handlePrismaError<AIConfig | null>(error, 'getAIConfig');
    }
  }

  static async createAIConfig(data: AIConfigCreate): Promise<AIConfig> {
    try {
      const createDataPrisma: any = {
        provider: data.provider,
        model: data.model,
        temperature: data.temperature ?? null,
        maxtokens: data.maxTokens ?? null,
        questionsperchunk: data.questionsPerChunk ?? null,
        systemprompt: data.systemPrompt ?? null,
        textprocessing: data.textProcessing ? JSON.stringify(data.textProcessing) : null,
        format: data.format ? JSON.stringify(data.format) : null,
        feedback: data.feedback ? JSON.stringify(data.feedback) : null,
        distribution: data.distribution ? JSON.stringify(data.distribution) : null,
        questiontypes: data.questionTypes ? JSON.stringify(data.questionTypes) : null,
        difficultylevels: data.difficultyLevels ? JSON.stringify(data.difficultyLevels) : null,
        telegramschedulerenabled: data.telegramSchedulerEnabled ?? false,
        telegramschedulerfrequency: data.telegramSchedulerFrequency ?? "DAILY_MIDNIGHT_UTC",
        telegramschedulerquantity: data.telegramSchedulerQuantity ?? 1,
        telegramschedulerstarthour: data.telegramSchedulerStartHour,
        telegramschedulerstartminute: data.telegramSchedulerStartMinute,
        telegramschedulerendhour: data.telegramSchedulerEndHour,
        telegramschedulerendminute: data.telegramSchedulerEndMinute,
        telegram_chat_id: data.telegramChatId ?? null,
      };
      const resultFromDb = await prisma.aiconfig.create({
        data: createDataPrisma
      });
      return this.transformPrismaConfig(resultFromDb as unknown as PrismaAIConfigResult);
    } catch (error) {
      return this.handlePrismaError<AIConfig>(error, 'createAIConfig');
    }
  }

  static async updateAIConfig(id: string, data: AIConfigUpdate): Promise<AIConfig> {
    try {
      const updateDataPrisma: any = {
        provider: data.provider,
        model: data.model,
        temperature: data.temperature,
        maxtokens: data.maxTokens,
        questionsperchunk: data.questionsPerChunk,
        systemprompt: data.systemPrompt,
        textprocessing: data.textProcessing ? JSON.stringify(data.textProcessing) : undefined,
        format: data.format ? JSON.stringify(data.format) : undefined,
        feedback: data.feedback ? JSON.stringify(data.feedback) : undefined,
        distribution: data.distribution ? JSON.stringify(data.distribution) : undefined,
        questiontypes: data.questionTypes ? JSON.stringify(data.questionTypes) : undefined,
        difficultylevels: data.difficultyLevels ? JSON.stringify(data.difficultyLevels) : undefined,
        telegramschedulerenabled: data.telegramSchedulerEnabled,
        telegramschedulerfrequency: data.telegramSchedulerFrequency,
        telegramschedulerquantity: data.telegramSchedulerQuantity,
        telegramschedulerstarthour: data.telegramSchedulerStartHour,
        telegramschedulerstartminute: data.telegramSchedulerStartMinute,
        telegramschedulerendhour: data.telegramSchedulerEndHour,
        telegramschedulerendminute: data.telegramSchedulerEndMinute,
        telegram_chat_id: data.telegramChatId,
      };
      Object.keys(updateDataPrisma).forEach(key => {
        const k = key as keyof Prisma.aiconfigUpdateInput;
        if (updateDataPrisma[k] === undefined) delete updateDataPrisma[k];
      });
      const resultFromDb = await prisma.aiconfig.update({
        where: { id },
        data: updateDataPrisma
      });
      return this.transformPrismaConfig(resultFromDb as unknown as PrismaAIConfigResult);
    } catch (error) {
      return this.handlePrismaError<AIConfig>(error, 'updateAIConfig');
    }
  }

  static async saveAIConfig(data: Partial<AIConfig>): Promise<AIConfig> {
    console.log('💾 PrismaService.saveAIConfig: Configuración recibida:', {
      id: data.id,
      provider: data.provider,
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      apiKey: data.apiKey ? '[REDACTED]' : null
    });

    // Añadir log específico para telegramSchedulerQuantity
    if ('telegramSchedulerQuantity' in data) {
      console.log('🔢 PrismaService.saveAIConfig: Valor de telegramSchedulerQuantity:', {
        value: data.telegramSchedulerQuantity,
        type: typeof data.telegramSchedulerQuantity,
        isNumber: !isNaN(Number(data.telegramSchedulerQuantity))
      });
    }

    console.log('💾 PrismaService.saveAIConfig: Datos importantes para Prisma:', {
      provider: data.provider,
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.maxTokens
    });

    // Función para asegurar que los campos JSON se serialicen correctamente (una sola vez)
    const safeJsonStringify = (value: any): string | null => {
      if (value === null || value === undefined) {
        return null;
      }
      
      // Si ya es un string, verificar si parece ser JSON
      if (typeof value === 'string') {
        try {
          // Intenta parsear para ver si es JSON válido
          JSON.parse(value);
          // Si se pudo parsear, es un string que ya contiene JSON, devolverlo tal cual
          return value;
        } catch (e) {
          // No es JSON, así que serializarlo
          return JSON.stringify(value);
        }
      }
      
      // Si es un objeto, serializarlo
      return JSON.stringify(value);
    };

    // Preparar datos para guardar, asegurando que los campos JSON no se serialicen múltiples veces
    const jsonFields = {
      questionTypes: data.questionTypes ? safeJsonStringify(data.questionTypes) : undefined,
      difficultyLevels: data.difficultyLevels ? safeJsonStringify(data.difficultyLevels) : undefined,
      textProcessing: data.textProcessing ? safeJsonStringify(data.textProcessing) : undefined,
      format: data.format ? safeJsonStringify(data.format) : undefined,
      feedback: data.feedback ? safeJsonStringify(data.feedback) : undefined,
      distribution: data.distribution ? safeJsonStringify(data.distribution) : undefined,
    };

    // Remover campos que no se deben pasar a Prisma directamente
    const { apiKey, providerKeys, ...otherFields } = data;
    
    // Asegurar que los campos numéricos se mantengan como números
    const numericFields = {
      telegramSchedulerQuantity: data.telegramSchedulerQuantity !== undefined 
        ? Number(data.telegramSchedulerQuantity) 
        : undefined,
      maxTokens: data.maxTokens !== undefined 
        ? Number(data.maxTokens) 
        : undefined,
      temperature: data.temperature !== undefined 
        ? Number(data.temperature) 
        : undefined,
    };
    
    // Combinar campos normales con campos JSON procesados y campos numéricos
    const dataToSave = {
      ...otherFields,
      ...jsonFields,
      ...numericFields
    };

    console.log('📊 PrismaService.saveAIConfig: Datos finales a guardar:', {
      telegramSchedulerQuantity: dataToSave.telegramSchedulerQuantity,
      telegramSchedulerQuantityType: typeof dataToSave.telegramSchedulerQuantity
    });

    try {
      const prisma = new PrismaClient();
      
      // Verificar si la configuración ya existe
      const existingConfig = await prisma.aiconfig.findFirst();
      
      if (existingConfig) {
        // Si existe, actualizar
        console.log(`💾 PrismaService.saveAIConfig: Actualizando config ID: ${existingConfig.id}`);
        
        // Si se proporciona una API key, manejarla por separado
        if (apiKey) {
          console.log(`🔑 PrismaService.saveAIConfig: Guardando API key para proveedor ${data.provider}`);
          await this.setProviderApiKey(existingConfig.id, data.provider || existingConfig.provider, apiKey);
        }
        
        // Actualizar configuración
        console.log('🔄 PrismaService.saveAIConfig: Datos finales para actualización:', {
          provider: dataToSave.provider,
          model: dataToSave.model,
          temperature: dataToSave.temperature,
          maxTokens: dataToSave.maxTokens
        });
        
        // Mapear campos camelCase a lowercase para MySQL
        const mappedData: any = {};
        Object.keys(dataToSave).forEach(key => {
          const value = dataToSave[key as keyof typeof dataToSave];
          if (value !== undefined) {
            switch (key) {
              case 'createdAt':
                mappedData.createdat = value;
                break;
              case 'updatedAt':
                mappedData.updatedat = value;
                break;
              case 'maxTokens':
                mappedData.maxtokens = value;
                break;
              case 'questionsPerChunk':
                mappedData.questionsperchunk = value;
                break;
              case 'systemPrompt':
                mappedData.systemprompt = value;
                break;
              case 'textProcessing':
                mappedData.textprocessing = value;
                break;
              case 'questionTypes':
                mappedData.questiontypes = value;
                break;
              case 'difficultyLevels':
                mappedData.difficultylevels = value;
                break;
              case 'telegramSchedulerEnabled':
                mappedData.telegramschedulerenabled = value;
                break;
              case 'telegramChatId':
                mappedData.telegram_chat_id = value;
                break;
              case 'telegramSchedulerFrequency':
                mappedData.telegramschedulerfrequency = value;
                break;
              case 'telegramSchedulerQuantity':
                mappedData.telegramschedulerquantity = value;
                break;
              case 'telegramSchedulerLastRun':
                mappedData.telegramschedulerlastrun = value;
                break;
              case 'telegramSchedulerStartHour':
                mappedData.telegramschedulerstarthour = value;
                break;
              case 'telegramSchedulerStartMinute':
                mappedData.telegramschedulerstartminute = value;
                break;
              case 'telegramSchedulerEndHour':
                mappedData.telegramschedulerendhour = value;
                break;
              case 'telegramSchedulerEndMinute':
                mappedData.telegramschedulerendminute = value;
                break;
              default:
                mappedData[key] = value;
            }
          }
        });
        
        const updatedConfig = await prisma.aiconfig.update({
          where: { id: existingConfig.id },
          data: {
            ...mappedData,
            updatedat: new Date()
          }
        });
        
        await prisma.$disconnect();
        
        console.log(`✅ PrismaService.saveAIConfig: Actualización completada: { provider: '${updatedConfig.provider}', model: '${updatedConfig.model}' }`);

        // Transformar los datos para el cliente
        const transformedConfig = this.transformPrismaConfig(updatedConfig);
        console.log('🔄 PrismaService.saveAIConfig: Configuración transformada y retornada:', {
          provider: transformedConfig.provider,
          model: transformedConfig.model,
          maxTokens: transformedConfig.maxTokens,
          temperature: transformedConfig.temperature
        });

        return transformedConfig;
      } else {
        // Crear una nueva configuración si no existe
        console.log('➕ PrismaService.saveAIConfig: Creando nueva configuración');

        // Mapear campos camelCase a lowercase para MySQL (creación)
        const mappedCreateData: any = {};
        Object.keys(dataToSave).forEach(key => {
          const value = dataToSave[key as keyof typeof dataToSave];
          if (value !== undefined) {
            switch (key) {
              case 'createdAt':
                mappedCreateData.createdat = value;
                break;
              case 'updatedAt':
                mappedCreateData.updatedat = value;
                break;
              case 'maxTokens':
                mappedCreateData.maxtokens = value;
                break;
              case 'questionsPerChunk':
                mappedCreateData.questionsperchunk = value;
                break;
              case 'systemPrompt':
                mappedCreateData.systemprompt = value;
                break;
              case 'textProcessing':
                mappedCreateData.textprocessing = value;
                break;
              case 'questionTypes':
                mappedCreateData.questiontypes = value;
                break;
              case 'difficultyLevels':
                mappedCreateData.difficultylevels = value;
                break;
              case 'telegramSchedulerEnabled':
                mappedCreateData.telegramschedulerenabled = value;
                break;
              case 'telegramChatId':
                mappedCreateData.telegram_chat_id = value;
                break;
              case 'telegramSchedulerFrequency':
                mappedCreateData.telegramschedulerfrequency = value;
                break;
              case 'telegramSchedulerQuantity':
                mappedCreateData.telegramschedulerquantity = value;
                break;
              case 'telegramSchedulerLastRun':
                mappedCreateData.telegramschedulerlastrun = value;
                break;
              case 'telegramSchedulerStartHour':
                mappedCreateData.telegramschedulerstarthour = value;
                break;
              case 'telegramSchedulerStartMinute':
                mappedCreateData.telegramschedulerstartminute = value;
                break;
              case 'telegramSchedulerEndHour':
                mappedCreateData.telegramschedulerendhour = value;
                break;
              case 'telegramSchedulerEndMinute':
                mappedCreateData.telegramschedulerendminute = value;
                break;
              default:
                mappedCreateData[key] = value;
            }
          }
        });
        
        // Preparar los datos para la creación - asegurar que provider no sea undefined
        const createData = {
          id: randomUUID(),
          ...mappedCreateData,
          provider: mappedCreateData.provider || 'openai', // Valor por defecto si es undefined
          model: mappedCreateData.model || 'gpt-3.5-turbo', // Valor por defecto si es undefined
          createdat: new Date(),
          updatedat: new Date()
        };

        // Crear la configuración
        const newConfig = await prisma.aiconfig.create({
          data: createData,
        });

        // Si se proporciona una API key, guardarla
        if (apiKey && data.provider) {
          await this.setProviderApiKey(newConfig.id, data.provider, apiKey);
        }

        await prisma.$disconnect();

        console.log(`✅ PrismaService.saveAIConfig: Creación completada: { provider: '${newConfig.provider}', model: '${newConfig.model}' }`);

        // Transformar los datos para el cliente
        return this.transformPrismaConfig({
          ...newConfig,
          providerKeys: [] // No tiene claves aún excepto la que se acaba de agregar posiblemente
        });
      }
    } catch (error) {
      console.error('❌ PrismaService.saveAIConfig: Error al guardar la configuración:', error);
      throw this.handlePrismaError<AIConfig>(error, 'saveAIConfig');
    }
  }

  private static transformPrismaConfig(configFromDb: PrismaAIConfigResult): AIConfig {
    // Función auxiliar para parsear JSON de manera segura
    const safeJsonParse = (jsonString: string | null | undefined, fieldName: string = 'unknown'): any => {
      if (!jsonString) return undefined;
      
      try {
        // Log para depuración
        console.log(`🔍 Parsing ${fieldName}:`, {
          length: jsonString.length,
          preview: jsonString.substring(0, 50),
          startsWithBrace: jsonString.trim().startsWith('{'),
          endsWithBrace: jsonString.trim().endsWith('}')
        });
        
        // Verificar que la cadena parezca JSON válido
        const trimmed = jsonString.trim();
        if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
          console.warn(`⚠️ Campo ${fieldName} no es JSON válido, ignorando: ${trimmed.substring(0, 100)}...`);
          return undefined;
        }
        
        // Verificar específicamente el texto problemático "comprehensive"
        if (trimmed.includes('comprehensive') && !trimmed.startsWith('{"')) {
          console.warn(`⚠️ Campo ${fieldName} contiene texto plano "comprehensive", ignorando`);
          return undefined;
        }
        
        const parsed = JSON.parse(trimmed);
        console.log(`✅ Campo ${fieldName} parseado correctamente`);
        return parsed;
      } catch (error) {
        console.error(`❌ Error parsing JSON field ${fieldName}: ${jsonString.substring(0, 100)}...`, error);
        return undefined;
      }
    };

    console.log(`🔄 Transforming PrismaConfig for ID: ${configFromDb.id}`);

    const transformed = {
      id: configFromDb.id,
      createdAt: configFromDb.createdat,
      updatedAt: configFromDb.updatedat,
      provider: configFromDb.provider,
      model: configFromDb.model,
      apiKey: configFromDb.apikey,
      temperature: configFromDb.temperature,
      maxTokens: configFromDb.maxtokens,
      questionsPerChunk: configFromDb.questionsperchunk,
      systemPrompt: configFromDb.systemprompt,
      textProcessing: safeJsonParse(configFromDb.textprocessing, 'textProcessing'),
      format: safeJsonParse(configFromDb.format, 'format'),
      feedback: safeJsonParse(configFromDb.feedback, 'feedback'),
      distribution: safeJsonParse(configFromDb.distribution, 'distribution'),
      questionTypes: safeJsonParse(configFromDb.questiontypes, 'questionTypes'),
      difficultyLevels: safeJsonParse(configFromDb.difficultylevels, 'difficultyLevels'),
      telegramSchedulerEnabled: configFromDb.telegramschedulerenabled,
      telegramChatId: configFromDb.telegram_chat_id,
      telegramSchedulerFrequency: configFromDb.telegramschedulerfrequency,
      telegramSchedulerQuantity: configFromDb.telegramschedulerquantity,
      telegramSchedulerLastRun: configFromDb.telegramschedulerlastrun,
      telegramSchedulerStartHour: configFromDb.telegramschedulerstarthour,
      telegramSchedulerStartMinute: configFromDb.telegramschedulerstartminute,
      telegramSchedulerEndHour: configFromDb.telegramschedulerendhour,
      telegramSchedulerEndMinute: configFromDb.telegramschedulerendminute,
      providerKeys: configFromDb.providerKeys?.map(pk => ({
        id: pk.id,
        provider: pk.provider,
        apiKey: pk.apiKey,
      })),
    } as AIConfig;
    
    console.log(`✅ Transformación completada para config ID: ${configFromDb.id}`);
    return transformed;
  }

  // Migrar API keys del .env a la base de datos
  static async migrateEnvApiKeysToProviderKeys(): Promise<void> {
    try {
      const config = await prisma.aiconfig.findFirst();
      if (!config) return;

      // Lista de proveedores y sus variables de entorno correspondientes
      const providers = [
        { name: 'openai', envVar: 'OPENAI_API_KEY' },
        { name: 'google', envVar: 'GOOGLE_API_KEY' },
        { name: 'anthropic', envVar: 'ANTHROPIC_API_KEY' },
        { name: 'perplexity', envVar: 'PERPLEXITY_API_KEY' },
        { name: 'mistral', envVar: 'MISTRAL_API_KEY' },
        { name: 'azure', envVar: 'AZURE_OPENAI_API_KEY' },
        { name: 'openrouter', envVar: 'OPENROUTER_API_KEY' },
        { name: 'xai', envVar: 'XAI_API_KEY' },
        { name: 'ollama', envVar: 'OLLAMA_API_KEY' },
      ];

      for (const provider of providers) {
        const apiKey = process.env[provider.envVar];
        if (apiKey) {
          const existing = await prisma.aiproviderkey.findFirst({
            where: { aiconfigid: config.id, provider: provider.name },
          });

          if (!existing) {
            await prisma.aiproviderkey.create({
              data: {
                id: randomUUID(),
                aiconfigid: config.id,
                provider: provider.name,
                apikey: apiKey,
                createdat: new Date(),
                updatedat: new Date(),
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error migrando API keys:', error);
    }
  }

  // Obtener características de IA
  static async getAIFeatures(): Promise<AIFeatures | null> {
    try {
      let features = await prisma.aifeatures.findFirst();
      if (!features) {
        // Crear características por defecto si no existen
        features = await prisma.aifeatures.create({
          data: {
            id: randomUUID(),
            concepttrap: false,
            precisiondistractors: false,
            createdat: new Date(),
            updatedat: new Date(),
          },
        });
      }
      return {
        id: features.id,
        conceptTrap: features.concepttrap,
        precisionDistractors: features.precisiondistractors,
        createdAt: features.createdat,
        updatedAt: features.updatedat,
      };
    } catch (error) {
      throw this.handlePrismaError<AIFeatures | null>(error, 'getAIFeatures');
    }
  }

  // Guardar características de IA
  static async saveAIFeatures(data: { conceptTrap: boolean; precisionDistractors: boolean }): Promise<AIFeatures> {
    try {
      const existingFeatures = await prisma.aifeatures.findFirst();
      if (existingFeatures) {
        return prisma.aifeatures.update({
          where: { id: existingFeatures.id },
          data: {
            concepttrap: data.conceptTrap,
            precisiondistractors: data.precisionDistractors,
            updatedat: new Date(),
          },
        }).then(result => ({
          id: result.id,
          conceptTrap: result.concepttrap,
          precisionDistractors: result.precisiondistractors,
          createdAt: result.createdat,
          updatedAt: result.updatedat,
        }));
      } else {
        return prisma.aifeatures.create({
          data: {
            id: randomUUID(),
            concepttrap: data.conceptTrap,
            precisiondistractors: data.precisionDistractors,
            createdat: new Date(),
            updatedat: new Date(),
          },
        }).then(result => ({
          id: result.id,
          conceptTrap: result.concepttrap,
          precisionDistractors: result.precisiondistractors,
          createdAt: result.createdat,
          updatedAt: result.updatedat,
        }));
      }
    } catch (error) {
      throw this.handlePrismaError<AIFeatures>(error, 'saveAIFeatures');
    }
  }

  // Prompts
  static async getAllPrompts(): Promise<PrismaPrompt[]> {
    try {
      console.log('🔍 PrismaService: Obteniendo todos los prompts');
      const prompts = await prisma.prompt.findMany();
      console.log(`✅ PrismaService: ${prompts.length} prompts encontrados`);
      return prompts;
    } catch (error) {
      console.error('❌ PrismaService: Error al obtener los prompts:', error);
      return this.handlePrismaError<PrismaPrompt[]>(error, 'getAllPrompts');
    }
  }

  static async getPrompt(fileName: string): Promise<PrismaPrompt | null> {
    try {
      console.log(`Buscando prompt en BD con file: ${fileName}`);
      const prompt = await prisma.prompt.findUnique({
        where: { file: fileName },
      });
      
      if (!prompt) {
        console.log(`No se encontró el prompt en BD con file: ${fileName}`);
        return null;
      }
      
      console.log(`Prompt encontrado en BD: ${prompt.name} (file: ${prompt.file})`);
      return prompt;
    } catch (error) {
      console.error(`Error en PrismaService.getPrompt para file ${fileName}:`, error);
      // Devolvemos null para ser consistentes con otros métodos get...ById que pueden no encontrar un registro.
      // Opcionalmente, podrías usar this.handlePrismaError si tienes una forma estandarizada de manejar "no encontrado" vs otros errores.
      return null; 
    }
  }

  static async updatePrompt(file: string, data: { name: string; content: string; file: string }): Promise<PrismaPrompt> {
    try {
      console.log('💾 PrismaService: Intentando actualizar/crear prompt:', {
        file: data.file,
        name: data.name,
      });

      const prompt = await prisma.prompt.upsert({
        where: {
          file: file,
        },
        update: {
          name: data.name,
          content: data.content,
          updatedat: new Date(),
        },
        create: {
          id: randomUUID(),
          name: data.name,
          content: data.content,
          file: data.file,
          createdat: new Date(),
          updatedat: new Date(),
        },
      });
      
      console.log('✅ PrismaService: Prompt guardado exitosamente:', {
        id: prompt.id,
        file: prompt.file,
        name: prompt.name
      });
      return prompt;
    } catch (error) {
      console.error('❌ PrismaService: Error detallado al guardar prompt:', {
        error,
        file,
      });
      return this.handlePrismaError<PrismaPrompt>(error, 'updatePrompt');
    }
  }

  static async getQuestionsForTelegramScheduler(quantity: number, skip: number = 0, minimumIntervalDays: number = 30): Promise<SchedulableQuestion[]> {
    try {
      // 🔄 IMPLEMENTACIÓN DE ROTACIÓN DE TABLAS (OPCIÓN 1)
      // Definir las tablas disponibles para rotación
      const availableTables = [
        'aire',
        'armada',
        'carrera',
        'constitucion',
        'defensanacional',
        'derechosydeberes',
        'emad',
        'et',
        'igualdad'
      ];

      // Obtener la configuración actual del scheduler
      const aiConfig = await prisma.aiconfig.findFirst({
        orderBy: { createdat: 'desc' }
      });

      // Determinar qué tabla usar en esta ejecución
      let currentTable = aiConfig?.telegramschedulercurrenttable || null;
      let currentTableIndex = -1;

      if (currentTable) {
        // Encontrar el índice de la tabla actual
        currentTableIndex = availableTables.indexOf(currentTable);
      }

      // Avanzar a la siguiente tabla (rotación)
      currentTableIndex = (currentTableIndex + 1) % availableTables.length;
      currentTable = availableTables[currentTableIndex];

      // Actualizar la configuración con la nueva tabla actual
      await prisma.aiconfig.updateMany({
        where: { id: aiConfig?.id },
        data: {
          telegramschedulercurrenttable: currentTable,
          updatedat: new Date()
        }
      });

      console.log(`[Scheduler] 🔄 Rotación de tablas: Usando tabla '${currentTable}' para esta ejecución (${currentTableIndex + 1}/${availableTables.length})`);
      console.log(`[Scheduler] 🔄 Buscando ${quantity} preguntas para Telegram de la tabla '${currentTable}', saltando ${skip}. Intervalo: ${minimumIntervalDays} días.`);
      
      // Calcular la fecha límite para reenvíos (ahora - intervalo mínimo)
      const minReSendDate = new Date();
      minReSendDate.setDate(minReSendDate.getDate() - minimumIntervalDays);
      
      console.log(`[Scheduler] Fecha mínima para reenvíos: ${minReSendDate.toISOString()}`);

      // 1. Obtener IDs de preguntas enviadas recientemente (último día) para excluirlas
      const recentlyUsedIds = await prisma.telegramsendlog.findMany({
        where: {
          sendtime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Último día
          },
          success: true,
          sourcemodel: currentTable
        },
        select: {
          questionid: true,
          sourcemodel: true
        }
      });

      const recentQuestionIds = recentlyUsedIds.map(log => log.questionid);

      console.log(`[Scheduler] Excluyendo ${recentQuestionIds.length} preguntas de ${currentTable} enviadas recientemente.`);

      // 2. Buscar preguntas de la tabla actual
      // Usamos prisma dinámico para acceder a la tabla actual
      const questions = await (prisma as any)[currentTable].findMany({
        where: {
          isactive: true,
          id: {
            notIn: recentQuestionIds
          }
        },
        orderBy: [
          { sendcount: 'asc' },                                    // Menos enviadas primero
          { lastsuccessfulsendat: { sort: 'asc', nulls: 'first' } } // Más antiguas primero (nunca enviadas = null van primero)
        ],
        take: quantity,
        skip: skip,
      });

      console.log(`[Scheduler] ✅ Obtenidas ${questions.length} preguntas de ${currentTable}`);

      // 3. Mapear las preguntas al formato SchedulableQuestion
      const schedulableQuestions: SchedulableQuestion[] = questions.map((q: any) => ({
        id: q.id,
        content: JSON.stringify({
          question: q.question,
          options: q.options,
          correctanswerindex: q.correctanswerindex,
          explanation: q.feedback || `Respuesta correcta de la tabla ${currentTable}.`
        }),
        type: q.type || 'multiple_choice',
        difficulty: q.difficulty || 'MEDIA',
        bloomLevel: q.bloomlevel,
        sourcemodel: currentTable as any,
        lastScheduledSendAt: q.lastsuccessfulsendat,
        sendCount: q.sendcount,
        lastsuccessfulsendat: q.lastsuccessfulsendat
      }));

      // 4. Análisis de rotación para la tabla actual
      const neverSent = questions.filter((q: any) => q.sendcount === 0).length;
      const totalQuestions = await (prisma as any)[currentTable].count({ where: { isactive: true } });
      const minSendCount = questions.length > 0 ? Math.min(...questions.map((q: any) => q.sendcount)) : 0;
      
      console.log('\n📊 ESTADO DE ROTACIÓN:');
      console.log(`   📄 TABLA ${currentTable.toUpperCase()}:`);
      console.log(`      Total activas: ${totalQuestions}`);
      console.log(`      Nunca enviadas: ${neverSent}`);
      console.log(`      Próximas tendrán sendCount: ${minSendCount}`);
      
      if (neverSent > 0) {
        console.log('   ✅ Incluyendo preguntas NUNCA enviadas (rotación perfecta)');
      } else {
        console.log('   🔄 Iniciando nuevo ciclo en la tabla');
      }
      
      console.log(`[Scheduler] ✅ Preparadas ${schedulableQuestions.length} preguntas de ${currentTable}.`);
      
      return schedulableQuestions;

    } catch (error) {
      console.error('[Scheduler] Error obteniendo preguntas para Telegram:', error);
      return this.handlePrismaError<SchedulableQuestion[]>(error, 'getQuestionsForTelegramScheduler');
    }
  }

  static async updateLastScheduledSendAt(questionid: string, sourcemodel: 'document' | 'section' | 'validQuestion' | 'examenOficial2018' | 'examenoficial2024' | 'sectionQuestion', success: boolean = true, telegramMsgId?: string, errorMessage?: string): Promise<void> {
    const now = new Date();
    
    try {
      await prisma.$transaction(async (tx) => {
        if (sourcemodel === 'validQuestion') {
          // Actualizar ValidQuestion
          await tx.validquestion.update({
            where: { id: questionid },
            data: { 
              sendcount: { increment: 1 },
              ...(success ? { lastsuccessfulsendat: now } : {}),
              updatedat: now
            },
          });
        } else if (sourcemodel === 'examenOficial2018') {
          // 🆕 Actualizar ExamenOficial2018
          await tx.examenoficial2018.update({
            where: { id: questionid },
            data: { 
              sendcount: { increment: 1 },
              ...(success ? { lastsuccessfulsendat: now } : {})
            },
          });
        } else if (sourcemodel === 'examenoficial2024') {
          // 🆕 Actualizar ExamenOficial2024
          await (tx as any).examenoficial2024.update({
            where: { id: questionid },
            data: { 
              sendcount: { increment: 1 },
              ...(success ? { lastsuccessfulsendat: now } : {})
            },
          });
        } else if (sourcemodel === 'sectionQuestion') {
          // 🆕 Actualizar SectionQuestion
          await tx.sectionquestion.update({
            where: { id: questionid },
            data: { 
              sendcount: { increment: 1 },
              ...(success ? { lastsuccessfulsendat: now } : {}),
              updatedat: now
            },
          });
        } else if (sourcemodel === 'document') {
          // ⚠️ LEGACY: Mantener compatibilidad con tablas originales
          await tx.question.update({
            where: { id: questionid },
            data: { 
              lastscheduledsendat: now,
              sendcount: { increment: 1 },
              ...(success ? { lastsuccessfulsendat: now } : {})
            },
          });
        } else if (sourcemodel === 'section') {
          // ⚠️ LEGACY: Mantener compatibilidad con tablas originales
          await tx.sectionquestion.update({
            where: { id: questionid },
            data: { 
              lastscheduledsendat: now,
              sendcount: { increment: 1 },
              ...(success ? { lastsuccessfulsendat: now } : {})
            },
          });
        }

        // 2. Crear registro en el log de envíos
        await tx.telegramsendlog.create({
          data: {
            id: randomUUID(),
            questionid: questionid,
            sourcemodel: sourcemodel,
            sendtime: now,
            success,
            errormessage: errorMessage,
            telegrammsgid: telegramMsgId
          }
        });
      });
      
      console.log(`[Scheduler] ✅ Actualizado sendCount/lastSuccessfulSendAt para ${sourcemodel} ID: ${questionid} | Éxito: ${success}`);
    } catch (error) {
      console.error(`[Scheduler] ❌ Error actualizando sendCount/lastSuccessfulSendAt para ${sourcemodel} ID: ${questionid}:`, error);
      // Lanzar el error para que el código que llama pueda manejarlo
      throw this.handlePrismaError<void>(error, 'updateLastScheduledSendAt');
    }
  }

  // QuestionConfig: leer la configuración de preguntas
  static async getQuestionConfig(): Promise<questionconfig | null> {
    try {
      const config = await prisma.questionconfig.findFirst();
      return config;
    } catch (error) {
      return this.handlePrismaError<questionconfig | null>(error, 'getQuestionConfig');
    }
  }

  // QuestionConfig: guardar la configuración de preguntas (upsert)
  static async saveQuestionConfig(data: Partial<Prisma.questionconfigCreateInput & Prisma.questionconfigUpdateInput>): Promise<questionconfig> {
    try {
      // Si existe, actualiza; si no, crea
      const existing = await prisma.questionconfig.findFirst();
      if (existing) {
        return await prisma.questionconfig.update({
          where: { id: existing.id },
          data: {
            ...data,
            updatedat: new Date(),
          },
        });
      } else {
        // Filtrar campos undefined para create
        const createData: any = {
          id: data.id || randomUUID(),
          createdat: new Date(),
          updatedat: new Date(),
        };
        
        // Solo agregar campos definidos
        if (data.types !== undefined) createData.types = data.types;
        if (data.difficulties !== undefined) createData.difficulties = data.difficulties;
        if (data.bloomlevels !== undefined) createData.bloomlevels = data.bloomlevels;
        if (data.optionlength !== undefined) createData.optionlength = data.optionlength;
        
        return await prisma.questionconfig.create({
          data: createData,
        });
      }
    } catch (error) {
      return this.handlePrismaError<questionconfig>(error, 'saveQuestionConfig');
    }
  }

  async syncQuestionConfigWithAIConfig(): Promise<boolean> {
    try {
      console.log('🔄 PrismaService.syncQuestionConfigWithAIConfig: Iniciando sincronización...');
      
      // 1. Obtener configuración de IA usando la instancia global
      const aiConfig = await prisma.aiconfig.findFirst();
      if (!aiConfig) {
        console.log('⚠️ No se encontró configuración de IA para sincronizar');
        return false;
      }
      
      // 2. Obtener o crear configuración de preguntas
      let questionConfig = await prisma.questionconfig.findFirst();
      if (!questionConfig) {
        console.log('⚠️ No se encontró configuración de preguntas, creando una nueva');
        questionConfig = await prisma.questionconfig.create({
          data: {
            id: randomUUID(),
            types: "{}",
            difficulties: "{}",
            createdat: new Date(),
            updatedat: new Date()
          }
        });
      }
      
      // 3. Parsear y sincronizar questionTypes
      let questionTypes = null;
      try {
        questionTypes = aiConfig.questiontypes ? JSON.parse(aiConfig.questiontypes) : null;
      } catch (e) {
        console.error('❌ Error al parsear questionTypes:', e);
      }
      
      // 4. Parsear y sincronizar difficultyLevels
      let difficultyLevels = null;
      try {
        difficultyLevels = aiConfig.difficultylevels ? JSON.parse(aiConfig.difficultylevels) : null;
      } catch (e) {
        console.error('❌ Error al parsear difficultyLevels:', e);
      }
      
      // 5. Preparar actualización de configuración de preguntas
      const updateData: any = {
        updatedat: new Date()
      };
      
      if (questionTypes) {
        // Ordenar las propiedades para garantizar consistencia
        const sortedQuestionTypes: Record<string, any> = {};
        Object.keys(questionTypes).sort().forEach(key => {
          (sortedQuestionTypes as any)[key] = (questionTypes as any)[key];
        });
        updateData.types = sortedQuestionTypes;
      }
      
      if (difficultyLevels) {
        // Ordenar las propiedades para garantizar consistencia
        const sortedDifficultyLevels: Record<string, any> = {};
        Object.keys(difficultyLevels).sort().forEach(key => {
          (sortedDifficultyLevels as any)[key] = (difficultyLevels as any)[key];
        });
        updateData.difficulties = sortedDifficultyLevels;
      }
      
      // 6. Actualizar configuración de preguntas
      if (Object.keys(updateData).length > 1) { // > 1 porque siempre tiene updatedAt
        await prisma.questionconfig.update({
          where: {
            id: questionConfig.id
          },
          data: updateData
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en syncQuestionConfigWithAIConfig:', error);
      return false;
    }
  }

  // También actualizar el método syncAIConfigWithQuestionConfig para mantener consistencia
  async syncAIConfigWithQuestionConfig(): Promise<boolean> {
    try {
      // 1. Obtener configuración de preguntas
      const questionConfig = await prisma.questionconfig.findFirst();
      if (!questionConfig) {
        console.log('⚠️ No se encontró configuración de preguntas para sincronizar');
        return false;
      }
      
      // 2. Obtener o crear configuración de IA
      let aiConfig = await prisma.aiconfig.findFirst();
      if (!aiConfig) {
        console.log('⚠️ No se encontró configuración de IA, creando una nueva');
        aiConfig = await prisma.aiconfig.create({
          data: {
            id: randomUUID(),
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
            maxtokens: 30720,
            createdat: new Date(),
            updatedat: new Date()
          }
        });
      }
      
      // 3. Preparar datos para actualizar
      const updateData: Prisma.aiconfigUpdateInput = {
        updatedat: new Date()
      };
      
      // Ordenar las propiedades para garantizar consistencia
      if (questionConfig.types && questionConfig.types !== null) {
        const sortedTypes: Record<string, any> = {};
        Object.keys(questionConfig.types).sort().forEach(key => {
          (sortedTypes as any)[key] = (questionConfig.types as any)![key];
        });
        updateData.questiontypes = JSON.stringify(sortedTypes);
      }
      
      if (questionConfig.difficulties && questionConfig.difficulties !== null) {
        const sortedDifficulties: Record<string, any> = {};
        Object.keys(questionConfig.difficulties).sort().forEach(key => {
          (sortedDifficulties as any)[key] = (questionConfig.difficulties as any)![key];
        });
        updateData.difficultylevels = JSON.stringify(sortedDifficulties);
      }
      
      // 4. Actualizar configuración de IA
      if (Object.keys(updateData).length > 1) { // > 1 porque siempre tiene updatedAt
        await prisma.aiconfig.update({
          where: {
            id: aiConfig.id
          },
          data: updateData
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en syncAIConfigWithQuestionConfig:', error);
      return false;
    }
  }

  /**
   * Obtener transacción por ID externo (PayPal Order ID)
   */
  static async getTransactionByExternalId(externalId: string) {
    try {
      return await prisma.paymenttransaction.findFirst({
        where: {
          OR: [
            { externaltransactionid: externalId },
            { bizumtransactionid: externalId },
            { redsystransactionid: externalId },
            { paypaltransactionid: externalId }
          ]
        }
      });
    } catch (error) {
      console.error('Error obteniendo transacción por ID externo:', error);
      return null;
    }
  }

  /**
   * Crear transacción
   */
  static async createTransaction(data: any) {
    try {
      return await prisma.paymenttransaction.create({
        data
      });
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw error;
    }
  }

  /**
   * Actualizar transacción
   */
  static async updateTransaction(id: string, data: any) {
    try {
      return await prisma.paymenttransaction.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      throw error;
    }
  }
}

// Exportar PrismaService como exportación por defecto para conveniencia
export default PrismaService;

// Re-exportar prisma instance para compatibilidad con imports existentes
export { prisma } from '@/lib/prisma';

// Exportar la instancia de prisma directamente también
export const prismaInstance = prisma;