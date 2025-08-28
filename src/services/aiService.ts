import { QuestionTypeConfig, DifficultyLevelConfig } from './questionGeneratorService';
import { getBloomInstructions, BloomLevel } from './bloomTaxonomyService';
import { PromptService } from './promptService';
import { PromptValidationService } from './promptValidationService';
import { PrismaService } from './prismaService';
import { PromptSelectorService } from './promptSelectorService';

// INICIO DE NUEVOS IMPORTS
import { difficultyPrompt } from '../config/prompts/difficultyPrompt';
import { distractorsPrompt } from '../config/prompts/distractorsPrompt';
import { documentationPrompt } from '../config/prompts/documentationPrompt';
import { expertPrompt } from '../config/prompts/expertPrompt';
import { formatPrompt } from '../config/prompts/formatPrompt';
import { qualityPrompt } from '../config/prompts/qualityPrompt';
// FIN DE NUEVOS IMPORTS

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba' | 'mistral' | 'cohere';

export interface AIModelConfig {
  modelId: string;
  apiEndpoint: string;
  maxTokens: number;
  temperature: number;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: AIProvider;
  config: AIModelConfig;
}

export const availableModels: AIModel[] = [
  {
    id: 'gemini-2.5-pro-preview-03-25',
    name: 'Gemini 2.5 Pro',
    description: 'Modelo más avanzado de Google',
    provider: 'google',
    config: {
      modelId: 'gemini-2.5-pro-preview-03-25',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent',
      maxTokens: 30720,
      temperature: 0.3
    }
  },
  {
    id: 'gemini-2.5-flash-preview-04-17',
    name: 'Gemini 2.5 flash',
    description: 'Modelo de lenguaje avanzado de Google con capacidades multimodales',
    provider: 'google',
    config: {
      modelId: 'gemini-2.5-flash-preview-04-17',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent',
      maxTokens: 11000,
      temperature: 0.3
    }
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Versión rápida y eficiente de Gemini 2.0',
    provider: 'google',
    config: {
      modelId: 'gemini-2.0-flash',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
      maxTokens: 30720,
      temperature: 0.3
    }
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Modelo más avanzado de OpenAI',
    provider: 'openai',
    config: {
      modelId: 'gpt-4',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 8192,
      temperature: 0.3
    }
  },
  {
    id: 'gemini-2.0-flash-thinking',
    name: 'Google Gemini Flash Thinking',
    description: 'Modelo avanzado de Google combinando velocidad y rendimiento',
    provider: 'google',
    config: {
      modelId: 'gemini-2.0-flash-thinking-exp-01-21',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent',
      maxTokens: 30720,
      temperature: 0.3
    }
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Modelo más avanzado de Anthropic',
    provider: 'anthropic',
    config: {
      modelId: 'claude-3-opus-20240229',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 4096,
      temperature: 0.3
    }
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Modelo intermedio de Anthropic',
    provider: 'anthropic',
    config: {
      modelId: 'claude-3-sonnet-20240229',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 40000, // Límite oficial: https://docs.anthropic.com/claude/docs/models-overview
      temperature: 0.3
    }
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Modelo rápido y económico de Anthropic',
    provider: 'anthropic',
    config: {
      modelId: 'claude-3-haiku-20240307',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 50000, // Límite oficial: https://docs.anthropic.com/claude/docs/models-overview
      temperature: 0.3
    }
  },
  {
    id: 'deepseek-chat',
    name: 'Deepseek Chat',
    description: 'Modelo conversacional de Deepseek',
    provider: 'deepseek',
    config: {
      modelId: 'deepseek-chat',
      apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
      maxTokens: 8192,
      temperature: 0.3
    }
  },
  {
    id: 'gpt-4-5-preview',
    name: 'GPT-4.5 Preview',
    description: 'Última versión preview de GPT-4.5',
    provider: 'openai',
    config: {
      modelId: 'gpt-4.5-preview-2025-02-27',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 128000,
      temperature: 0.3
    }
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4 Optimized',
    description: 'Versión optimizada de GPT-4',
    provider: 'openai',
    config: {
      modelId: 'gpt-4o',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 128000,
      temperature: 0.3
    }
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Versión más rápida de GPT-4',
    provider: 'openai',
    config: {
      modelId: 'gpt-4-turbo',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 128000,
      temperature: 0.3
    }
  },
  {
    id: 'gpt-3-5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Modelo equilibrado de OpenAI',
    provider: 'openai',
    config: {
      modelId: 'gpt-3.5-turbo',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 16385,
      temperature: 0.3
    }
  },
  {
    id: 'gpt-4-1',
    name: 'GPT-4.1',
    description: 'Última versión avanzada de OpenAI (GPT-4.1)',
    provider: 'openai',
    config: {
      modelId: 'gpt-4.1-2025-04-14',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 32768, // Límite oficial por solicitud para GPT-4.1
      temperature: 0.3
    }
  },
  // Modelo añadido según https://platform.openai.com/docs/models/gpt-4.1-mini y anuncios oficiales
  {
    id: 'gpt-4-1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Versión mini de GPT-4.1, más eficiente y económica (OpenAI)',
    provider: 'openai',
    config: {
      modelId: 'gpt-4.1-mini-2025-04-14', // Nombre exacto según la documentación oficial
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 128000, // Según capacidades anunciadas
      temperature: 0.3
    }
  },
  // Modelos Grok 3 de xAI añadidos según https://x.ai/api y https://glama.ai/models/grok-3
  {
    id: 'grok-3',
    name: 'Grok 3',
    description: 'Modelo avanzado de xAI (Grok 3)',
    provider: 'xai',
    config: {
      modelId: 'grok-3',
      apiEndpoint: 'https://api.x.ai/v1/chat/completions', // Endpoint oficial xAI
      maxTokens: 131072, // Según documentación
      temperature: 0.3
    }
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 Mini',
    description: 'Versión mini de Grok 3, más eficiente y económica (xAI)',
    provider: 'xai',
    config: {
      modelId: 'grok-3-mini',
      apiEndpoint: 'https://api.x.ai/v1/chat/completions',
      maxTokens: 131072, // Según documentación
      temperature: 0.3
    }
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Modelo Anthropic Claude 3.7 Sonnet (API oficial)',
    provider: 'anthropic',
    config: {
      modelId: 'claude-3-7-sonnet-20250219',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 200000, // Según documentación oficial
      temperature: 0.3
    }
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    description: 'Modelo Anthropic Claude 3.5 Haiku (API oficial)',
    provider: 'anthropic',
    config: {
      modelId: 'claude-3-5-haiku-20241022',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 200000, // Según documentación oficial
      temperature: 0.3
    }
  },
  {
    id: 'claude-3-5-sonnet-v2',
    name: 'Claude 3.5 Sonnet v2',
    description: 'Modelo Anthropic Claude 3.5 Sonnet v2 (API oficial)',
    provider: 'anthropic',
    config: {
      modelId: 'claude-3-5-sonnet-latest',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 8000, // Según documentación oficial
      temperature: 0.3
    }
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Modelo Anthropic Claude 3.5 Sonnet (API oficial)',
    provider: 'anthropic',
    config: {
      modelId: 'claude-3-5-sonnet-20240620',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 8000, // Según documentación oficial
      temperature: 0.3
    }
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4 (2025-05-14)',
    description: 'Modelo Sonnet 4 de Anthropic, versión 2025-05-14. Alto rendimiento, razonamiento avanzado, visión, multilingüe.',
    provider: 'anthropic',
    config: {
      modelId: 'claude-sonnet-4-20250514',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 64000, // Máximo de salida por petición según documentación oficial
      temperature: 0.3
    }
  }
];

type ApiKeyType = `${AIModel['provider']}ApiKey`;

export interface AIConfig {
  id: string;
  provider: string;
  model: string;
  apiKey: string | null;
  temperature: number | null;
  maxTokens: number | null;
  systemPrompt: string | null;
  textProcessing?: TextProcessingConfig;
  format?: FormatConfig;
  feedback?: FeedbackConfig;
  distribution?: DistributionConfig;
  questionsPerChunk?: number;
  createdAt: Date;
  updatedAt: Date;
  telegramSchedulerEnabled?: boolean;
  telegramSchedulerFrequency?: string;
  telegramSchedulerQuantity?: number;
  telegramSchedulerLastRun?: Date | null;
  telegramChatId?: string | null;
}

export interface AIConfigInput {
  id?: string;
  provider: string;
  model: string;
  apiKey?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  systemPrompt?: string | null;
}

// Tipo para las respuestas de las APIs
interface AIModelResponse {
  text: string;
  error?: string;
}

export type OptionLengthType = 'muy_corta' | 'media' | 'larga' | 'aleatoria' | 'telegram';

export interface GenerateQuestionsConfig {
  types: QuestionTypeConfig[];
  difficulties: DifficultyLevelConfig[];
  bloomLevels?: BloomLevel[];
  advancedFeatures?: {
    conceptualTrap?: boolean;
    precisionDistractors?: boolean;
    legalTextProcessing?: boolean;
  };
  optionLength?: OptionLengthType; // Nueva opción para la longitud de las opciones de respuesta
}

export interface TextProcessingConfig {
  tokenLimit: number;
  minLength: number;
  maxLength: number;
  language: string;
  chunkSize: number;
  processBySection: boolean;
  maintainArticleOrder: boolean;
}

export interface FormatConfig {
  includeMnemonicRules: boolean;
  includePracticalCases: boolean;
  includeCrossReferences: boolean;
}

export interface FeedbackConfig {
  detailLevel: 'basic' | 'detailed';
  includeNormativeReferences: boolean;
  includeTopicConnections: boolean;
}

export interface DistributionConfig {
  sectionDistribution: {
    sectionId: string;
    percentage: number;
  }[];
  theoreticalPracticalRatio: number; // 0-100, donde 100 es todo teórico
  difficultyTypeDistribution: {
    difficulty: string;
    typeDistribution: {
      type: string;
      percentage: number;
    }[];
  }[];
}

interface GenerationOptions {
  progressive?: boolean;
  batchSize?: number;
  continueFromLast?: boolean;
}

interface GenerationConfig {
  types: QuestionTypeConfig[];
  difficulties: DifficultyLevelConfig[];
  numberOfQuestions?: number;
}

interface Document {
  id: string;
  title: string;
  content: string;
  date: Date;
  type: string;
}

// Importar los prompts por defecto
import { expertPrompt as defaultExpertPrompt } from '../config/prompts/expertPrompt';
import { formatPrompt as defaultFormatPrompt } from '../config/prompts/formatPrompt';
import { difficultyPrompt as defaultDifficultyPrompt } from '../config/prompts/difficultyPrompt';
import { distractorsPrompt as defaultDistractorsPrompt } from '../config/prompts/distractorsPrompt';
import { documentationPrompt as defaultDocumentationPrompt } from '../config/prompts/documentationPrompt';
import { qualityPrompt as defaultQualityPrompt } from '../config/prompts/qualityPrompt';
import { telegramPrompt } from '../config/prompts/telegramPrompt';

const DEFAULT_PROMPTS: Record<string, string> = {
  expertPrompt: defaultExpertPrompt,
  formatPrompt: defaultFormatPrompt,
  difficultyPrompt: defaultDifficultyPrompt,
  distractorsPrompt: defaultDistractorsPrompt,
  documentationPrompt: defaultDocumentationPrompt,
  qualityPrompt: defaultQualityPrompt
};

export class AIService {
  private static config: AIConfig | null = null;
  private static isInitialized = false;
  private static prismaService = new PrismaService();
  private static useConceptTrap: boolean = false;
  private static usePrecisionDistractors: boolean = false;
  private static currentBatchSize = 0;
  private static API_KEY = process.env.NEXT_PUBLIC_GPT_API_KEY;
  private static API_URL = 'https://api.openai.com/v1/chat/completions';
  private static MODEL = 'gpt-4';

  private static readonly availableModels: Record<AIProvider, AIModel[]> = {
    google: [
      {
        id: 'gemini-2.5-pro-latest',
        name: 'Gemini 2.5 Pro',
        description: 'Modelo más avanzado de Google (2024)',
        provider: 'google',
        config: {
          modelId: 'gemini-2.5-pro-latest',
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-latest:generateContent',
          maxTokens: 30720,
          temperature: 0.4
        }
      },
      {
        id: 'gemini-2.5-flash-preview-04-17',
        name: 'Gemini 2.5 Flash',
        description: 'Modelo rápido y eficiente de Google (2024)',
        provider: 'google',
        config: {
          modelId: 'gemini-2.5-flash-preview-04-17',
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent',
          maxTokens: 30720,
          temperature: 0.4
        }
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Versión rápida y eficiente de Gemini 2.0',
        provider: 'google',
        config: {
          modelId: 'gemini-2.0-flash',
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
          maxTokens: 30720,
          temperature: 0.3
        }
      },
      {
        id: 'gemini-2.0-flash-thinking',
        name: 'Google Gemini Flash Thinking',
        description: 'Modelo avanzado de Google combinando velocidad y rendimiento',
        provider: 'google',
        config: {
          modelId: 'gemini-2.0-flash-thinking-exp-01-21',
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent',
          maxTokens: 30720,
          temperature: 0.3
        }
      }
    ],
    openai: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Modelo más avanzado de OpenAI',
        provider: 'openai',
        config: {
          modelId: 'gpt-4',
          apiEndpoint: 'https://api.openai.com/v1/chat/completions',
          maxTokens: 8192,
          temperature: 0.3
        }
      }
    ],
    anthropic: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Modelo más avanzado de Anthropic',
        provider: 'anthropic',
        config: {
          modelId: 'claude-3-opus-20240229',
          apiEndpoint: 'https://api.anthropic.com/v1/messages',
          maxTokens: 4096,
          temperature: 0.3
        }
      }
    ],
    deepseek: [],
    xai: [],
    alibaba: [],
    mistral: [],
    cohere: []
  };

  // Utilidad para obtener la URL absoluta en backend y relativa en frontend
  static getApiConfigUrl() {
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer ? process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' : '';
    return isServer ? `${baseUrl}/api/ai-config` : '/api/ai-config';
  }

  static async initialize(): Promise<void> {
    console.log('🔄 Inicializando AIService...');
    
    try {
      // Cargar configuración desde la base de datos
      const apiConfigUrl = this.getApiConfigUrl();
      console.log('📍 URL de configuración:', apiConfigUrl);
      
      try {
        const response = await fetch(apiConfigUrl);
        console.log('📊 Estado de respuesta:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No se pudo leer el cuerpo de la respuesta');
          console.error('❌ Error en respuesta:', errorText);
          throw new Error(`Error al cargar la configuración: ${response.status} ${response.statusText}`);
        }
        
        const dbConfig = await response.json();
        console.log('📥 Configuración cargada de la base de datos:', dbConfig);
        
        // Si no hay configuración en la BD, crear una por defecto
        if (!dbConfig) {
          console.log('⚠️ No se encontró configuración en la BD, creando configuración por defecto...');
          const defaultConfig = {
            provider: 'google' as AIProvider,
            model: 'gemini-2.0-flash-thinking',
            temperature: 0.3,
            maxTokens: 8072
          };
          
          // Guardar configuración por defecto en la BD
          const saveResponse = await fetch(this.getApiConfigUrl(), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultConfig)
          });
          
          if (!saveResponse.ok) {
            const saveErrorText = await saveResponse.text().catch(() => 'No se pudo leer el cuerpo de la respuesta');
            console.error('❌ Error al guardar configuración por defecto:', saveErrorText);
            throw new Error('Error al guardar la configuración por defecto');
          }
          
          this.config = await saveResponse.json();
          console.log('✅ Configuración por defecto guardada:', this.config);
        } else {
          // Usar la configuración existente sin modificarla
          this.config = dbConfig;
          console.log('📝 Usando configuración existente:', {
            provider: this.config?.provider,
            model: this.config?.model
          });
        }
      } catch (fetchError) {
        console.error('❌ Error al realizar la petición fetch:', fetchError);
        throw fetchError;
      }
      
      // Verificar que tenemos una configuración válida
      if (!this.config?.provider || !this.config?.model) {
        console.error('❌ Configuración inválida:', this.config);
        throw new Error('Configuración inválida: falta provider o model');
      }

      // Verificar el estado de la API key
      if (this.config.apiKey) {
        await this.verificarEstadoAPIKey();
        console.log('✅ API key verificada correctamente');
      } else {
        console.warn('⚠️ No hay API key configurada');
      }
      
      this.isInitialized = true;
      console.log('✅ AIService inicializado correctamente');
    } catch (error) {
      console.error('❌ Error en inicialización de AIService:', error);
      throw error;
    }
  }

  static async setConfig(configUpdate: Partial<AIConfig>): Promise<AIConfig> {
    try {
      console.log('🔄 AIService.setConfig: Actualizando configuración con:', {
        provider: configUpdate.provider,
        model: configUpdate.model,
        temperature: configUpdate.temperature,
        maxTokens: configUpdate.maxTokens,
        apiKey: configUpdate.apiKey ? '[REDACTED]' : null,
        // Omitiendo otros campos para claridad
      });

      // Si hay un cambio en el proveedor y una nueva API key, guardarla
      if (configUpdate.provider && configUpdate.apiKey) {
        console.log(`🔑 Guardando API key para el proveedor ${configUpdate.provider}`);
        // Guardar la API key en la base de datos para este proveedor
        await this.saveApiKeyForProvider(configUpdate.provider as AIProvider, configUpdate.apiKey);
      }

      const response = await fetch('/api/ai-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configUpdate),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const updatedConfig = await response.json();
      console.log('✅ AIService.setConfig: Configuración actualizada correctamente:', {
        provider: updatedConfig.provider,
        model: updatedConfig.model,
        temperature: updatedConfig.temperature,
        maxTokens: updatedConfig.maxTokens,
      });
      
      // Actualizamos la configuración en memoria
      if (updatedConfig) {
        this.config = updatedConfig;
      }
      
      return updatedConfig;
    } catch (error) {
      console.error('❌ AIService.setConfig: Error:', error);
      throw error;
    }
  }
  
  /**
   * Guarda la API key para un proveedor específico en la base de datos
   * @param provider El proveedor para el que se guarda la API key
   * @param apiKey La API key a guardar
   */
  private static async saveApiKeyForProvider(provider: AIProvider, apiKey: string): Promise<void> {
    try {
      console.log(`💾 AIService.saveApiKeyForProvider: Guardando API key para ${provider}`);
      
      const response = await fetch('/api/ai-provider-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error al guardar API key para ${provider}: ${response.status} ${errorText}`);
      } else {
        console.log(`✅ API key guardada correctamente para ${provider}`);
      }
    } catch (error) {
      console.error(`❌ Error al guardar API key para ${provider}:`, error);
    }
  }

  static async getConfig(): Promise<AIConfig> {
    try {
      if (!this.config) {
        // Intentar cargar la configuración desde la API
        const response = await fetch(this.getApiConfigUrl());
        if (!response.ok) {
          throw new Error('Error al obtener la configuración de la API');
        }
        
        const dbConfig = await response.json();
        
        // Si no hay configuración en la base de datos, crear una por defecto
        if (!dbConfig) {
          // Intentar obtener la API key del .env
          const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
          
          if (!envApiKey) {
            console.warn('⚠️ No se encontró API key en las variables de entorno');
          }

          const defaultConfig: AIConfigInput = {
            provider: 'google',
            model: 'gemini-2.5-flash-preview-04-17',
            apiKey: envApiKey || null,
            temperature: 0.3,
            maxTokens: 30720,
            systemPrompt: null
          };

          console.log('Creando configuración por defecto con API key del .env');

          const createResponse = await fetch(this.getApiConfigUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(defaultConfig),
          });

          if (!createResponse.ok) {
            throw new Error('Error al crear la configuración inicial');
          }

          const newConfig = await createResponse.json();
          this.config = newConfig;
        } else {
          // Si la configuración existe pero no tiene API key, intentar usar la del .env
          if (!dbConfig.apiKey) {
            const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            
            if (envApiKey) {
              console.log('Actualizando configuración con API key del .env');
              
              const updateResponse = await fetch(this.getApiConfigUrl(), {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...dbConfig,
                  apiKey: envApiKey
                }),
              });

              if (!updateResponse.ok) {
                throw new Error('Error al actualizar la configuración con la API key del .env');
              }

              const updatedConfig = await updateResponse.json();
              this.config = updatedConfig;
            } else {
              this.config = dbConfig;
            }
          } else {
            this.config = dbConfig;
          }
        }
      }

      if (!this.config) {
        throw new Error('No se pudo inicializar la configuración de IA');
      }

      return this.config;
    } catch (error) {
      console.error('Error al obtener la configuración:', error);
      throw new Error('No se pudo obtener la configuración de IA');
    }
  }

  static getSelectedModel(): AIModel | null {
    try {
      console.log('🔎 getSelectedModel llamado. Configuración actual:', 
        this.config ? { provider: this.config.provider, model: this.config.model } : 'No hay configuración');
      
      if (!this.config || !this.config.provider || !this.config.model) {
        console.warn('⚠️ No hay configuración o falta información del modelo/proveedor');
        
        // Si no hay configuración, intentar cargar la configuración más reciente desde la API
        if (!this.isInitialized) {
          console.log('📌 AIService no está inicializado, inicializando...');
          // No podemos llamar directamente a initialize() aquí porque es async
          // y getSelectedModel() es síncrono, pero marcamos para inicializar próximamente
          setTimeout(() => { this.initialize(); }, 0);
        }
        
        // Si no hay configuración, devolver un modelo predeterminado
        if (!this.config) {
          console.log('📌 Usando modelo predeterminado de Google (último valor conocido)');
          return this.getDefaultModelForProvider('google' as AIProvider);
        }
        
        // Si hay configuración pero falta el modelo o proveedor, intentar devolver un modelo predeterminado para el proveedor
        if (this.config.provider && !this.config.model) {
          console.log(`📌 Usando modelo predeterminado para ${this.config.provider}`);
          return this.getDefaultModelForProvider(this.config.provider as AIProvider);
        }
        
        return null;
      }
      
      const provider = this.config.provider as AIProvider;
      const modelId = this.config.model;
      
      // Primero buscar en el array global de modelos, que es lo que usa la página de AI Settings
      const globalModels = availableModels.filter(m => m.provider === provider);
      const selectedModelFromGlobal = globalModels.find(model => model.id === modelId);
      
      if (selectedModelFromGlobal) {
        console.log('✅ Modelo seleccionado (desde array global):', selectedModelFromGlobal.name);
        return selectedModelFromGlobal;
      }
      
      // Si no se encuentra en el array global, buscar en el objeto de modelos disponibles
      const models = this.availableModels[provider] || [];
      const selectedModel = models.find(model => model.id === modelId);
      
      if (!selectedModel) {
        console.warn(`⚠️ Modelo ${modelId} no encontrado para el proveedor ${provider}`);
        
        // Si el modelo no se encuentra, devolver un modelo predeterminado para el proveedor
        console.log(`📌 Usando modelo predeterminado para ${provider}`);
        return this.getDefaultModelForProvider(provider);
      }
      
      console.log('✅ Modelo seleccionado (desde objeto privado):', selectedModel.name);
      return selectedModel;
    } catch (error) {
      console.error('❌ Error en getSelectedModel:', error);
      return null;
    }
  }
  
  private static getApiEndpointForProvider(provider: AIProvider, modelId: string): string {
    switch(provider) {
      case 'google':
        return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions';
      case 'xai':
        return 'https://api.x.ai/v1/chat/completions';
      case 'alibaba':
        return 'https://api.alibaba-inc.com/v1/chat/completions';
      default:
        return 'https://api.openai.com/v1/chat/completions';
    }
  }

  private static getApiKeyFromEnv(provider: AIProvider | string | undefined): string | null {
    if (!provider) {
      console.error('❌ Proveedor de IA no definido o inválido en getApiKeyFromEnv');
      return null;
    }
    
    console.log(`🔍 Buscando API key para ${provider} en variables de entorno`);
    
    // Mapa de providers a variables de entorno - PRIMERO las del servidor, luego cliente como fallback
    const envMap: Record<string, string | undefined> = {
      'openai': process.env.GPT_API_KEY || process.env.NEXT_PUBLIC_GPT_API_KEY,
      'anthropic': process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      'google': process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      'deepseek': process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
      'xai': process.env.XAI_API_KEY || process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || process.env.NEXT_PUBLIC_XAI_API_KEY,
      'alibaba': process.env.QWEN_API_KEY || process.env.NEXT_PUBLIC_QWEN_API_KEY,
      'mistral': process.env.MISTRAL_API_KEY || process.env.NEXT_PUBLIC_MISTRAL_API_KEY,
      'cohere': process.env.COHERE_API_KEY || process.env.NEXT_PUBLIC_COHERE_API_KEY
    };
    
    const apiKey = envMap[provider];
    if (apiKey) {
      // Determinar si es server-side o client-side
      const isServerSide = apiKey === process.env.GPT_API_KEY || 
                          apiKey === process.env.ANTHROPIC_API_KEY || 
                          apiKey === process.env.GEMINI_API_KEY ||
                          apiKey === process.env.XAI_API_KEY ||
                          apiKey === process.env.GROK_API_KEY;
      console.log(`✅ API key encontrada en variables de entorno para ${provider} (${isServerSide ? 'server-side' : 'client-side'})`);
      return apiKey;
    }
    
    console.warn(`⚠️ No se encontró API key para ${provider} en variables de entorno`);
    return null;
  }

  private static async getPrompt(promptName: string): Promise<string> {
    try {
      console.log(`🔄 Obteniendo prompt ${promptName}...`);
      
      // Obtener el prompt usando PromptService
      const prompt = await PromptService.getPrompt(promptName);
      
      if (prompt) {
        console.log(`✅ Prompt ${promptName} obtenido correctamente`);
        return prompt.content;
      }
      
      throw new Error(`Prompt ${promptName} no encontrado`);
    } catch (error) {
      console.error(`❌ Error al obtener el prompt ${promptName}:`, error);
      throw new Error(`Error al obtener el prompt ${promptName}`);
    }
  }

  /**
   * Calcula aproximadamente el número de tokens en un texto
   * Aproximación: 1 token ≈ 4 caracteres en español
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Trunca el contenido del documento si es necesario para que el prompt completo quepa en el límite de tokens
   */
  private static truncateContentForTokenLimit(content: string, basePromptTokens: number, maxTokens: number, maxOutputTokens: number = 2000): string {
    const availableTokensForContent = maxTokens - basePromptTokens - maxOutputTokens;
    const contentTokens = this.estimateTokens(content);
    
    console.log(`📊 Token analysis:`, {
      basePromptTokens,
      contentTokens,
      maxTokens,
      maxOutputTokens,
      availableTokensForContent
    });

    if (contentTokens <= availableTokensForContent) {
      return content;
    }

    // Truncar el contenido manteniendo párrafos completos
    const targetLength = Math.floor(availableTokensForContent * 4 * 0.9); // 90% del límite para margen de seguridad
    const paragraphs = content.split('\n\n');
    let truncatedContent = '';
    
    for (const paragraph of paragraphs) {
      if ((truncatedContent + paragraph).length > targetLength) {
        break;
      }
      truncatedContent += (truncatedContent ? '\n\n' : '') + paragraph;
    }

    console.log(`⚠️ Contenido truncado de ${content.length} a ${truncatedContent.length} caracteres`);
    return truncatedContent + '\n\n[... contenido truncado para ajustar límite de tokens ...]';
  }

  /**
   * Genera un prompt optimizado que respeta el límite de tokens del modelo
   */
  private static async generateOptimizedPrompt(config: AIConfig, document: Document, numberOfQuestions: number, optionLength?: OptionLengthType, normativa?: string, maxTokens: number = 8192): Promise<string> {
    try {
      console.log('🔄 Generando prompt optimizado...', { numberOfQuestions, maxTokens });
      
      // 🎯 FIX: Usar el título personalizado si está disponible
      const tituloFormato = normativa 
        ? `<b>${normativa}</b><br><br>`
        : `<b>TÍTULO DE LA PREGUNTA</b><br><br>`;
      
      // Prompt base mínimo (sin ejemplos extensos)
      const basePrompt = `
Genera preguntas tipo test en formato GIFT para Moodle siguiendo EXACTAMENTE esta estructura:

**FORMATO OBLIGATORIO:**
${tituloFormato}
Texto de la pregunta {
=opción correcta
~%-33.33333%opción incorrecta 1
~%-33.33333%opción incorrecta 2  
~%-33.33333%opción incorrecta 3
#### RETROALIMENTACIÓN:<br><br>
[Explicación detallada de la respuesta correcta]
}

**REGLAS ESTRICTAS:**
- Respuesta correcta: =
- Respuestas incorrectas: ~%-33.33333%
- Título siempre en <b></b><br><br>
- Retroalimentación siempre con #### RETROALIMENTACIÓN:<br><br>
- 4 opciones total (1 correcta + 3 incorrectas)
- Usar HTML para formato cuando sea necesario

${normativa ? `**INSTRUCCIÓN ESPECÍFICA DE TÍTULO:**
OBLIGATORIO: En cada pregunta, usa "${normativa}" como título exacto.

` : ''}Genera ${numberOfQuestions} preguntas basadas en el siguiente contenido:

${document.content}
      `;

      const baseTokens = this.estimateTokens(basePrompt);
      const optimizedContent = this.truncateContentForTokenLimit(document.content, baseTokens, maxTokens);
      
      return basePrompt + optimizedContent;
      
    } catch (error) {
      console.error('❌ Error al generar prompt optimizado:', error);
      throw new Error('No se pudo generar el prompt optimizado');
    }
  }

  private static async generatePrompt(config: AIConfig, document: Document, numberOfQuestions: number, optionLength?: OptionLengthType, normativa?: string): Promise<string> {
    try {
      console.log('🔄 Generando prompt con configuración...', { ...config, numberOfQuestions });
      
      const [
        expertPromptContent,
        rawFormatPromptContent,
        difficultyPromptContent,
        documentationPromptContent,
        qualityPromptContent
      ] = await Promise.all([
        this.getPrompt('expertPrompt'),
        this.getPrompt('formatPrompt'),
        this.getPrompt('difficultyPrompt'),
        this.getPrompt('documentationPrompt'),
        this.getPrompt('qualityPrompt')
      ]);
      
      const formatPromptInterpolated = normativa
        ? rawFormatPromptContent.replace(/\[NOMBRE DE LA NORMA SEGÚN EL TEXTO FUENTE\]/g, normativa)
        : rawFormatPromptContent;

      // Ya no necesitamos isRegimenDisciplinarioDocument
      // selectDistractorsPrompt ahora siempre devuelve el prompt general
      const distractorsPromptSelected = PromptSelectorService.selectDistractorsPrompt(
        document.title, // Todavía se pueden pasar por si en el futuro se reutilizan
        document.content
      );
      
      console.log('📝 Prompt de distractores seleccionado: distractorsPrompt (general)');
      console.log('📝 Contenido del prompt de distractores (primeras líneas):', 
        distractorsPromptSelected.split('\n').slice(0, 3).join('\n')
      );

      const optionLengthInstruction = getOptionLengthInstruction(optionLength);

      // Usar prompt específico de Telegram si se selecciona esa opción
      const telegramSpecificPrompt = optionLength === 'telegram' ? `
${telegramPrompt}
` : '';

      // Instrucción explícita y ejemplo oficial para reforzar el estilo sencillo y claro
      const instruccionesEstilo = optionLength === 'telegram' ? telegramSpecificPrompt : `
IMPORTANTE: Formula las preguntas de manera sencilla, clara y directa, como en los exámenes oficiales. El enunciado debe ser breve, fácil de entender y referenciar la norma o artículo correspondiente si aplica. NO uses frases complejas ni introducciones largas. Sigue el formato exacto indicado a continuación.
`;

      // Ejemplo reducido para ahorrar tokens
      const ejemploOficial = `
// EJEMPLO DE PREGUNTA OFICIAL
<b>Instrucción 55/2021, de 27 de octubre, del Jefe de Estado Mayor de la Defensa.</b><br><br>
La Unidad de Verificación (UVE) tendrá como responsabilidad: {
=el desarme, el control de armamentos y el establecimiento de medidas de fomento de la confianza y seguridad
~%-33.33333%la gestión de la ayuda humanitaria y la respuesta ante catástrofes naturales
~%-33.33333%el control de armamentos y la verificación de su cumplimiento por otros Estados
~%-33.33333%la planificación operativa conjunta y el desarrollo de la doctrina
#### RETROALIMENTACIÓN:<br><br>
<b>Referencia:</b> "La UVE tendrá como responsabilidad... compromisos internacionales relacionados con <b>el desarme, el control de armamentos y el establecimiento de medidas de fomento de la confianza y seguridad</b>."<br>
Explicación breve del fundamento legal.<br>
}
`;

      // Instrucciones específicas para el título personalizado
      const titleInstruction = normativa 
        ? `\nINSTRUCCIÓN ESPECÍFICA DE TÍTULO:
OBLIGATORIO: En cada pregunta, usa "${normativa}" como título.
`
        : '';

      // Construir el prompt completo
      const fullPrompt = `
${instruccionesEstilo}
${ejemploOficial}

FORMATO:
${formatPromptInterpolated}

${titleInstruction}

DIFICULTAD:
${difficultyPromptContent}

DISTRACTORES:
${distractorsPromptSelected}

DOCUMENTACIÓN:
${documentationPromptContent}

CALIDAD:
${qualityPromptContent}

${optionLengthInstruction}

NÚMERO DE PREGUNTAS:
OBLIGATORIO: Generar EXACTAMENTE ${numberOfQuestions} preguntas.

DOCUMENTO A PROCESAR:
${document.content}

CONFIGURACIÓN:
${JSON.stringify({provider: config.provider, model: config.model, numberOfQuestions}, null, 2)}
`;

      // Verificar tamaño del prompt
      const promptTokens = this.estimateTokens(fullPrompt);
      console.log(`📊 Prompt generado: ~${promptTokens} tokens estimados`);

      return fullPrompt;
    } catch (error) {
      console.error('❌ Error al generar el prompt:', error);
      throw new Error('No se pudieron cargar los prompts necesarios');
    }
  }

  private static generateInstructions(numPreguntas: number, isLegalText: boolean, config: GenerateQuestionsConfig): string {
    // Verificar si hay configuraciones avanzadas en el objeto config
    const useLegalText = isLegalText || (config.advancedFeatures?.legalTextProcessing === true);
    const useConceptTrap = this.useConceptTrap || (config.advancedFeatures?.conceptualTrap === true);
    const usePrecisionDistractors = this.usePrecisionDistractors || (config.advancedFeatures?.precisionDistractors === true);
    
    console.log('🔄 Generando instrucciones con configuración:', {
      textoLegal: useLegalText ? '✅ Activado' : '❌ No activado',
      trampaConceptual: useConceptTrap ? '✅ Activada' : '❌ No activada',
      distractoresPrecision: usePrecisionDistractors ? '✅ Activados' : '❌ No activados'
    });

    const legalTextInstructions = useLegalText ? `
    INSTRUCCIONES ESPECÍFICAS PARA TEXTO LEGAL:
    1. OBLIGATORIO: Genera preguntas SIGUIENDO EL ORDEN de los artículos en el texto.
    2. OBLIGATORIO: Cada pregunta debe estar basada en un artículo específico.
    3. OBLIGATORIO: Respeta la progresión natural de los artículos.
    4. OBLIGATORIO: Incluye el número del artículo en el título de la pregunta.
    5. OBLIGATORIO: Cita textualmente el artículo relevante en la retroalimentación.
    ` : '';

    const conceptTrapInstructions = useConceptTrap ? `
    INSTRUCCIONES PARA TRAMPAS CONCEPTUALES:
    1. OBLIGATORIO: Al menos 2 de las 3 opciones incorrectas deben ser "trampas conceptuales".
    2. OBLIGATORIO: Las trampas conceptuales deben usar terminología correcta del texto, pero aplicada incorrectamente.
    3. OBLIGATORIO: Las trampas conceptuales deben parecer plausibles para estudiantes que han memorizado términos sin entender conceptos.
    ` : '';

    const precisionDistractorsInstructions = usePrecisionDistractors ? `
    INSTRUCCIONES PARA DISTRACTORES DE PRECISIÓN:
    1. OBLIGATORIO: Crea distractores que contengan variaciones sutiles pero significativas.
    2. OBLIGATORIO: Aplica técnicas de precisión en los distractores.
    3. OBLIGATORIO: Estos distractores deben parecer correctos a quien no domina los detalles exactos.
    ` : '';

    return `
    ${legalTextInstructions}
    ${conceptTrapInstructions}
    ${precisionDistractorsInstructions}
    
    IMPORTANTE:
    1. OBLIGATORIO: Genera EXACTAMENTE ${numPreguntas} preguntas.
    2. OBLIGATORIO: Sigue ESTRICTAMENTE el formato GIFT especificado.
    3. OBLIGATORIO: Incluye TODAS las etiquetas HTML y emojis requeridos.
    4. OBLIGATORIO: Proporciona retroalimentación detallada para cada pregunta.
    5. OBLIGATORIO: Las respuestas incorrectas deben tener una longitud y complejidad similar a la respuesta correcta:
       - Cada respuesta incorrecta debe ser tan detallada y elaborada como la correcta
       - Evita respuestas incorrectas demasiado cortas o simplistas
       - Mantén un nivel de detalle y especificidad consistente en todas las opciones
       - Las respuestas incorrectas deben ser plausibles y bien construidas
    `;
  }

  private static splitContentIntoChunks(content: string, chunkSize: number): string[] {
    // Estimación aproximada: 1 token ≈ 4 caracteres
    const MAX_CHUNK_LENGTH = 6000; // Dejamos margen para el prompt y otros elementos
    const chunks: string[] = [];
    
    // Dividir por párrafos
    const paragraphs = content.split('\n\n');
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // Si el párrafo por sí solo excede el límite, subdivídelo
      if (paragraph.length > MAX_CHUNK_LENGTH) {
        const sentences = paragraph.split(/[.!?]+/);
        let tempChunk = '';
        
        for (const sentence of sentences) {
          if ((tempChunk + sentence).length > MAX_CHUNK_LENGTH) {
            if (tempChunk) chunks.push(tempChunk.trim());
            tempChunk = sentence;
          } else {
            tempChunk += sentence + '. ';
          }
        }
        if (tempChunk) chunks.push(tempChunk.trim());
        continue;
      }
      
      // Agregar párrafo al chunk actual o crear uno nuevo
      if ((currentChunk + paragraph).length > MAX_CHUNK_LENGTH) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Agregar el último chunk si existe
    if (currentChunk) chunks.push(currentChunk.trim());
    
    console.log(`📊 Texto dividido en ${chunks.length} fragmentos`);
    chunks.forEach((chunk, i) => {
      console.log(`Fragmento ${i + 1}: ${Math.round(chunk.length / 4)} tokens estimados`);
    });
    
    return chunks;
  }

  private static async processContentInChunks(content: string, maxChunkSize: number = 4000): Promise<string[]> {
    // Dividir el contenido en párrafos
    const paragraphs = content.split('\n\n');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      // Si el párrafo actual más el siguiente excederían el tamaño máximo
      if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
      }
    }

    // Añadir el último chunk si existe
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  public static async generateQuestions(
    content: string,
    numberOfQuestions: number = 5,
    questionTypeCounts?: Record<string, number>,
    optionLength?: OptionLengthType,
    modelOverride?: AIModel, // Nuevo argumento opcional
    normativa?: string // Nuevo argumento para la norma
  ): Promise<string> {
    try {
      if (!this.config) {
        throw new Error('AIService no inicializado');
      }

      if (!content) {
        throw new Error('No se proporcionó contenido para generar preguntas');
      }

      // Validar el número de preguntas
      if (numberOfQuestions < 1 || numberOfQuestions > 500) {
        throw new Error('El número de preguntas debe estar entre 1 y 500');
      }

      // Usar el modelo pasado como override, si existe
      const selectedModel = modelOverride || this.getSelectedModel();
      if (!selectedModel) {
        throw new Error('No se ha seleccionado ningún modelo de IA');
      }
      
      // Obtener la API key para el proveedor seleccionado
      console.log(`🔑 Obteniendo API key para proveedor: ${selectedModel.provider}`);
      const apiKey = this.getApiKeyFromEnv(selectedModel.provider);
      
      if (!apiKey) {
        console.error(`❌ No se encontró API key para el proveedor ${selectedModel.provider}`);
        throw new Error(`No se encontró API key para el proveedor ${selectedModel.provider}`);
      }
      
      console.log(`✅ API key obtenida para ${selectedModel.provider}, generando preguntas...`);

      // --- NUEVO PROMPT DE TIPOS DE PREGUNTA ---
      let typeInstruction = '';
      if (questionTypeCounts && Object.values(questionTypeCounts).some(v => v > 0)) {
        const typeLabels: Record<string, string> = {
          textual: 'preguntas textuales',
          blank_spaces: 'preguntas de espacios en blanco',
          identify_incorrect: 'preguntas de identificar la incorrecta',
          none_correct: 'preguntas de ninguna es correcta',
        };
        const parts = Object.entries(questionTypeCounts)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `${v} ${typeLabels[k] || k}`);
        typeInstruction = `IMPORTANTE: Genera exactamente ${parts.join(', ')}. No generes más ni menos de cada tipo. Cada pregunta debe estar claramente identificada por su tipo.`;
      }
      // --- FIN NUEVO PROMPT ---

      // --- INCLUYO SIEMPRE EL PROMPT DE FORMATO Y UNA INSTRUCCIÓN EXTRA ---
      const formatReinforcement = `Cada pregunta debe tener exactamente 4 opciones: 1 correcta y 3 incorrectas. No expliques los distractores en las opciones. Sigue el formato de ejemplo.`;

      // Determinar el número de preguntas por chunk
      const questionsPerChunk = this.config.questionsPerChunk || 5;
      const chunks = await this.processContentInChunks(content);
      let allQuestions: string[] = [];

      console.log(`Procesando ${chunks.length} chunks de contenido...`);

      // Distribuir el número de preguntas entre los chunks
      const questionsPerChunkArray = this.distributeQuestions(numberOfQuestions, chunks.length, questionsPerChunk);

      // Palabras prohibidas para filtrar - ACTUALIZADO: lista más específica
      // Evita términos absolutos obvios pero permite terminología técnica válida
      const forbiddenWords = [
        'únicamente.*respuesta.*correcta', // Frases obvias
        'exclusivamente.*opción.*válida',
        'todas.*anteriores.*correctas',
        'ninguna.*anteriores.*correcta',
        'nada más que.*opción',
        'obviamente.*respuesta'
      ];
      const forbiddenRegex = new RegExp(forbiddenWords.join('|'), 'i');

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const questionsForThisChunk = questionsPerChunkArray[i];

        if (questionsForThisChunk === 0) continue;

        const document = {
          id: crypto.randomUUID(),
          title: `Chunk ${i + 1}/${chunks.length}`,
          content: chunk,
          date: new Date(),
          type: 'text/plain'
        };

        // Generar prompt y verificar límite de tokens
        let prompt = '';
        let useOptimizedPrompt = false;
        
        try {
          // Primero intentar con el prompt completo
          prompt = await this.generatePrompt(this.config, document, questionsForThisChunk, optionLength, normativa);
          const promptTokens = this.estimateTokens(prompt);
          const maxTokens = selectedModel.config.maxTokens;
          
          // Si excede ~70% del límite, usar prompt optimizado
          if (promptTokens > maxTokens * 0.7) {
            console.log(`⚠️ Prompt demasiado largo (${promptTokens} tokens), usando versión optimizada...`);
            prompt = await this.generateOptimizedPrompt(this.config, document, questionsForThisChunk, optionLength, normativa, maxTokens);
            useOptimizedPrompt = true;
          }
        } catch (error) {
          console.error('❌ Error generando prompt:', error);
          // Fallback al prompt optimizado
          prompt = await this.generateOptimizedPrompt(this.config, document, questionsForThisChunk, optionLength, normativa);
          useOptimizedPrompt = true;
        }

        let response = '';
        let questions: string[] = [];
        let attempts = 0;
        
        do {
          try {
            response = await this.callAIService(selectedModel, prompt, apiKey);
            
            // 🔍 DEBUG: Mostrar respuesta de la IA para diagnóstico
            console.log('🔍 [DEBUG] Respuesta completa de la IA:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
            
            // ✅ ACTUALIZADO: Buscar preguntas en formato GIFT sin comentarios
            // Antes: buscaba '::' en los comentarios eliminados
            // Ahora: busca el patrón GIFT: texto que termine con '{'
            const allSplitParts = response.split('\n\n');
            console.log('🔍 [DEBUG] Partes después de split por \\n\\n:', allSplitParts.length);
            allSplitParts.forEach((part, index) => {
              console.log(`🔍 [DEBUG] Parte ${index}: "${part.substring(0, 100)}${part.length > 100 ? '...' : ''}"`);
            });
            
            questions = allSplitParts.filter(q => {
              const trimmed = q.trim();
              const hasContent = trimmed && (trimmed.includes('{') || trimmed.includes('<b>'));
              console.log(`🔍 [DEBUG] Filtro - "${trimmed.substring(0, 50)}..." -> ${hasContent ? 'VÁLIDA' : 'DESCARTADA'}`);
              return hasContent;
            });
            
            console.log(`🔍 [DEBUG] Preguntas filtradas: ${questions.length}`);
            
            // Si alguna opción contiene palabras prohibidas, pide regenerar
            const hasForbidden = questions.some(q => forbiddenRegex.test(q));
            if (!hasForbidden) break;
            attempts++;
            console.warn('⚠️ Pregunta(s) con palabras prohibidas detectada(s). Reintentando generación...');
          } catch (error: any) {
            console.error(`❌ Error en intento ${attempts + 1}:`, error.message);
            
            // Si es un error de límite de tokens y no hemos usado el prompt optimizado, usarlo
            if (error.message.includes('maximum context length') && !useOptimizedPrompt) {
              console.log('🔄 Cambiando a prompt optimizado por error de tokens...');
              prompt = await this.generateOptimizedPrompt(this.config, document, questionsForThisChunk, optionLength, normativa);
              useOptimizedPrompt = true;
              attempts--; // No contar este intento
              continue;
            }
            
            attempts++;
            if (attempts >= 3) {
              throw error;
            }
          }
        } while (attempts < 3);

        // Filtrar preguntas válidas
        questions = questions.filter(q => !forbiddenRegex.test(q));
        allQuestions = [...allQuestions, ...questions];
      }

      // Verificar si tenemos el número correcto de preguntas
      if (allQuestions.length !== numberOfQuestions) {
        console.warn(`⚠️ Se generaron ${allQuestions.length} preguntas en lugar de ${numberOfQuestions} solicitadas`);
        if (allQuestions.length < numberOfQuestions) {
          const remainingQuestions = numberOfQuestions - allQuestions.length;
          console.log(`Intentando generar ${remainingQuestions} preguntas adicionales...`);
          
          try {
            const additionalPrompt = await this.generateOptimizedPrompt(this.config, {
              id: crypto.randomUUID(),
              title: 'Preguntas adicionales',
              content: `${content}\n\nNOTA: Generar ${remainingQuestions} preguntas ADICIONALES diferentes a las anteriores.`,
              date: new Date(),
              type: 'text/plain'
            }, remainingQuestions, optionLength, normativa);

            let additionalResponse = '';
            let newQuestions: string[] = [];
            let attempts = 0;
            do {
              additionalResponse = await this.callAIService(selectedModel, additionalPrompt, apiKey);
              // ✅ ACTUALIZADO: Buscar preguntas adicionales en formato GIFT sin comentarios
              // Antes: buscaba '::' en los comentarios eliminados
              // Ahora: busca el patrón GIFT: texto que termine con '{'
              newQuestions = additionalResponse.split('\n\n').filter(q => {
                const trimmed = q.trim();
                return trimmed && (trimmed.includes('{') || trimmed.includes('<b>'));
              });
              const hasForbidden = newQuestions.some(q => forbiddenRegex.test(q));
              if (!hasForbidden) break;
              attempts++;
              console.warn('⚠️ Pregunta(s) adicional(es) con palabras prohibidas detectada(s). Reintentando generación...');
            } while (attempts < 3);

            newQuestions = newQuestions.filter(q => !forbiddenRegex.test(q));
            allQuestions = [...allQuestions, ...newQuestions];
          } catch (error) {
            console.error('❌ Error generando preguntas adicionales:', error);
            // Continuar con las preguntas que tenemos
          }
        }
      }

      // Asegurar que no excedemos el número de preguntas solicitado
      // Paso 1: Clasificar preguntas por tipo (heurística simple)
      const typeConfig = require('./questionGeneratorService').questionTypes;
      const classifiedQuestions = allQuestions.map((q: string) => {
        const lower = q.toLowerCase();
        if (lower.includes('rellena el espacio') || lower.includes('completar')) return { type: 'blank_spaces', content: q };
        if (lower.includes('ninguna es correcta')) return { type: 'none_correct', content: q };
        if (lower.includes('incorrecta') || lower.includes('no es correcta')) return { type: 'identify_incorrect', content: q };
        // Por defecto, textual
        return { type: 'textual', content: q };
      });

      // Paso 2: Seleccionar la cantidad exacta de cada tipo
      const { selectQuestionsByType } = require('./questionGeneratorService');
      let seleccionadas: { type: string; content: string }[];
      if (questionTypeCounts) {
        // Selección exacta por tipo
        seleccionadas = [];
        for (const [type, count] of Object.entries(questionTypeCounts)) {
          if (count > 0) {
            const disponibles = classifiedQuestions.filter((q: { type: string; content: string }) => q.type === type);
            seleccionadas.push(...disponibles.slice(0, count));
          }
        }
        // Si faltan preguntas, rellenar con cualquier tipo
        if (seleccionadas.length < numberOfQuestions) {
          const resto = classifiedQuestions.filter((q: { type: string; content: string }) => !seleccionadas.includes(q));
          seleccionadas.push(...resto.slice(0, numberOfQuestions - seleccionadas.length));
        }
        seleccionadas = seleccionadas.slice(0, numberOfQuestions);
      } else {
        seleccionadas = selectQuestionsByType(classifiedQuestions, typeConfig, numberOfQuestions);
      }

      // Paso 3: Devolver como string GIFT
      return seleccionadas.map((q: { type: string; content: string }) => q.content).join('\n\n');
    } catch (error) {
      console.error('Error en la generación de preguntas:', error);
      throw error;
    }
  }

  private static distributeQuestions(totalquestions: number, numChunks: number, maxPerChunk: number): number[] {
    const distribution = new Array(numChunks).fill(0);
    let remainingQuestions = totalquestions;
    
    // Distribuir preguntas equitativamente
    const baseQuestions = Math.min(Math.floor(totalquestions / numChunks), maxPerChunk);
    distribution.fill(baseQuestions);
    remainingQuestions -= baseQuestions * numChunks;

    // Distribuir preguntas restantes
    let chunkIndex = 0;
    while (remainingQuestions > 0 && chunkIndex < numChunks) {
      if (distribution[chunkIndex] < maxPerChunk) {
        distribution[chunkIndex]++;
        remainingQuestions--;
      }
      chunkIndex++;
    }

    return distribution;
  }

  private static async callAIService(model: AIModel, prompt: string, apiKey: string): Promise<string> {
    try {
      switch (model.provider) {
        case 'google':
          return await this.callGoogleAI(model, prompt, apiKey);
        case 'openai':
          return await this.callOpenAI(model, prompt, apiKey);
        case 'anthropic':
          return await this.callAnthropic(model, prompt, apiKey);
        case 'xai':
          return await this.callXaiAI(model, prompt, apiKey);
        default:
          throw new Error(`Proveedor no soportado: ${model.provider}`);
      }
    } catch (error) {
      console.error(`Error al llamar al servicio de IA (${model.provider}):`, error);
      throw error;
    }
  }

  private static async callGoogleAI(model: AIModel, prompt: string, apiKey: string): Promise<string> {
    const endpoint = `${model.config.apiEndpoint}?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: this.config?.temperature || model.config.temperature,
          maxOutputTokens: this.config?.maxTokens || model.config.maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error de Google AI: ${error.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    
    // Verificar que la respuesta tenga la estructura esperada
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('❌ Respuesta de Google AI sin candidatos:', data);
      throw new Error('Error de Google AI: Respuesta sin candidatos válidos');
    }

    const candidate = data.candidates[0];
    
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('❌ Respuesta de Google AI sin contenido válido:', candidate);
      throw new Error('Error de Google AI: Respuesta sin contenido válido');
    }

    const part = candidate.content.parts[0];
    
    if (!part.text || typeof part.text !== 'string') {
      console.error('❌ Respuesta de Google AI sin texto válido:', part);
      throw new Error('Error de Google AI: Respuesta sin texto válido');
    }

    return part.text;
  }

  private static async callOpenAI(model: AIModel, prompt: string, apiKey: string): Promise<string> {
    try {
      // Ajustar max_tokens según el modelo
      const maxAllowedTokens = model.config.maxTokens;
      const requestedMaxTokens = this.config?.maxTokens || model.config.maxTokens;
      const max_tokens = Math.min(requestedMaxTokens, maxAllowedTokens);

      const response = await fetch(model.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model.config.modelId,
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en generar preguntas de examen en formato GIFT. Sigues estrictamente las instrucciones proporcionadas.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.config?.temperature || model.config.temperature,
          max_tokens: max_tokens
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error de OpenAI: ${error.error?.message || 'Error desconocido'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error al llamar al servicio de OpenAI:', error);
      throw error;
    }
  }

  private static async callAnthropic(model: AIModel, prompt: string, apiKey: string): Promise<string> {
    try {
      // Determinar la URL absoluta o relativa según entorno
      const isServer = typeof window === 'undefined';
      const baseUrl = isServer ? process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' : '';
      const endpoint = isServer ? `${baseUrl}/api/anthropic-proxy` : '/api/anthropic-proxy';
      // Llamada al endpoint proxy backend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model: model.config.modelId,
          max_tokens: this.config?.maxTokens || model.config.maxTokens
        })
      });
      if (!response.ok) {
        let errorMsg = 'Error desconocido';
        try {
          const error = await response.json();
          errorMsg = error.error || JSON.stringify(error);
        } catch (e) {
          errorMsg = await response.text();
        }
        throw new Error(`Error de Anthropic (proxy): ${errorMsg}`);
      }
      const data = await response.json();
      // Claude v3 responde con 'content' como array de objetos {type, text}
      if (data?.content) {
        if (Array.isArray(data.content)) {
          return data.content.map((c: any) => c.text).join('');
        }
        return data.content;
      }
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      throw new Error('Respuesta inesperada de Anthropic (proxy)');
    } catch (error) {
      console.error('Error al llamar al servicio de Anthropic (proxy):', error);
      throw error;
    }
  }

  /**
   * Llama al endpoint oficial de xAI/Grok para chat completions.
   * Documentación: https://docs.x.ai/docs/api-reference
   * El formato es similar a OpenAI, pero requiere el header 'Authorization: Bearer <apiKey>' y 'Content-Type: application/json'.
   */
  private static async callXaiAI(model: AIModel, prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(model.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model.config.modelId,
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en generar preguntas de examen en formato GIFT. Sigues estrictamente las instrucciones proporcionadas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config?.temperature || model.config.temperature,
        max_tokens: this.config?.maxTokens || model.config.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error de xAI/Grok: ${error.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    // El formato de respuesta es similar a OpenAI
    return data.choices[0].message.content;
  }

  // Getters y setters para características
  static async enableConceptTrap(): Promise<void> {
    this.useConceptTrap = true;
    await this.enableFeature('conceptTrap');
  }

  static async disableConceptTrap(): Promise<void> {
    this.useConceptTrap = false;
    await this.disableFeature('conceptTrap');
  }

  static async enablePrecisionDistractors(): Promise<void> {
    this.usePrecisionDistractors = true;
    await this.enableFeature('precisionDistractors');
  }

  static async disablePrecisionDistractors(): Promise<void> {
    this.usePrecisionDistractors = false;
    await this.disableFeature('precisionDistractors');
  }

  static async loadFeatures(): Promise<void> {
    try {
      console.log('🔄 Cargando características...');
      const features = await this.getFeatures();
      this.useConceptTrap = features.conceptTrap;
      this.usePrecisionDistractors = features.precisionDistractors;
      console.log('✅ Características cargadas:', {
        'Trampas Conceptuales': features.conceptTrap ? '✅ Activado' : '❌ Desactivado',
        'Distractores de Precisión': features.precisionDistractors ? '✅ Activado' : '❌ Desactivado'
      });
    } catch (error) {
      console.error('❌ Error al cargar características:', error);
      throw error;
    }
  }

  // Función para establecer directamente la API key
  static async setProviderApiKey(provider: AIProvider, apiKey: string): Promise<void> {
    console.log(`🔄 Configurando API key de ${provider}...`);
    
    try {
      // Obtener la configuración actual de la base de datos
      const configResponse = await fetch(this.getApiConfigUrl());
      const currentConfig = await configResponse.json();
      
      console.log('📥 Configuración actual:', {
        provider: currentConfig?.provider,
        model: currentConfig?.model
      });

      // Verificar primero si la API key es válida
      console.log('🔑 Verificando nueva API key...');
      const verifyResponse = await fetch('/api/ai-config/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          apiKey: apiKey
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        console.error('❌ API key inválida:', errorData);
        throw new Error('API key inválida');
      }

      console.log('✅ API key verificada correctamente');

      // Mantener el modelo actual si el proveedor es el mismo, si no, usar el modelo por defecto
      let modelToUse;
      if (currentConfig?.provider === provider && currentConfig?.model) {
        modelToUse = currentConfig.model;
        console.log('📝 Manteniendo modelo actual:', modelToUse);
      } else {
        const defaultModel = this.getDefaultModelForProvider(provider);
        modelToUse = defaultModel.id;
        console.log('📝 Usando modelo por defecto:', modelToUse);
      }

      // Preparar la configuración a guardar
      const configToSave = {
        provider: provider,
        model: modelToUse,
        apiKey: apiKey,
        temperature: currentConfig?.temperature || 0.3,
        maxTokens: currentConfig?.maxTokens || 30720
      };

      console.log('💾 Guardando configuración en la base de datos...');
      const saveResponse = await fetch(this.getApiConfigUrl(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        console.error('❌ Error al guardar la configuración:', errorData);
        throw new Error('Error al guardar la configuración en la base de datos');
      }

      // Actualizar la configuración local con los datos guardados
      const savedConfig = await saveResponse.json();
      this.config = savedConfig;
      console.log('✅ Configuración guardada en la base de datos:', {
        provider: savedConfig.provider,
        model: savedConfig.model
      });

      // Reinicializar el servicio para asegurar que todo está sincronizado
      this.isInitialized = false;
      await this.initialize();

      console.log(`✅ API key de ${provider} configurada y guardada correctamente`);
    } catch (error) {
      console.error(`❌ Error al configurar la API key de ${provider}:`, error);
      throw error;
    }
  }

  static async verificarEstadoAPIKey(): Promise<void> {
    console.log('🔍 Verificando estado de la API key...');

    if (!this.config || !this.config.apiKey) {
      console.error('❌ No hay API key configurada');
      throw new Error('No hay API key configurada');
    }

    if (!this.config.provider) {
      console.error('❌ No hay proveedor configurado');
      throw new Error('No hay proveedor configurado');
    }

    try {
      console.log(`📡 Intentando verificar API key para ${this.config.provider}...`);
      
      const response = await fetch('/api/ai-config/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: this.config.provider,
          apiKey: this.config.apiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error al verificar API key:', errorData);
        throw new Error(errorData.message || 'API key inválida');
      }

      const data = await response.json();
      console.log('✅ API key válida:', data);

    } catch (error) {
      console.error('❌ Error al verificar API key:', error);
      throw error;
    }
  }

  static getGoogleApiKey(): string | null {
    return this.config?.apiKey || null;
  }

  static async setApiKey(apiKey: string): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      
      // Actualizar la API key en la base de datos
      const updatedConfig = await PrismaService.updateAIConfig(
        currentConfig.id,
        {
          ...currentConfig,
          apiKey
        }
      );

      if (!updatedConfig) {
        throw new Error('No se pudo actualizar la configuración');
      }

      // Actualizar la configuración en memoria asegurando que todos los campos requeridos estén presentes
      this.config = {
        id: updatedConfig.id || crypto.randomUUID(),
        provider: updatedConfig.provider || 'google',
        model: updatedConfig.model || 'gemini-pro',
        apiKey: updatedConfig.apiKey || null,
        temperature: updatedConfig.temperature || null,
        maxTokens: updatedConfig.maxTokens || null,
        systemPrompt: updatedConfig.systemPrompt || null,
        // Convertir explícitamente los objetos de configuración
        textProcessing: updatedConfig.textProcessing ? {
          tokenLimit: updatedConfig.textProcessing.tokenLimit || 8000,
          minLength: updatedConfig.textProcessing.minLength || 100,
          maxLength: updatedConfig.textProcessing.maxLength || 1000,
          language: updatedConfig.textProcessing.language || 'es',
          chunkSize: updatedConfig.textProcessing.chunkSize || 6000,
          processBySection: updatedConfig.textProcessing.processBySection || true,
          maintainArticleOrder: updatedConfig.textProcessing.maintainArticleOrder || true
        } : undefined,
        format: updatedConfig.format ? {
          includeMnemonicRules: updatedConfig.format.includeMnemonicRules || false,
          includePracticalCases: updatedConfig.format.includePracticalCases || false,
          includeCrossReferences: updatedConfig.format.includeCrossReferences || false
        } : undefined,
        feedback: updatedConfig.feedback ? {
          detailLevel: (updatedConfig.feedback.detailLevel as 'basic' | 'detailed') || 'detailed',
          includeNormativeReferences: updatedConfig.feedback.includeNormativeReferences || false,
          includeTopicConnections: updatedConfig.feedback.includeTopicConnections || false
        } : undefined,
        distribution: updatedConfig.distribution,
        createdAt: updatedConfig.createdAt || new Date(),
        updatedAt: updatedConfig.updatedAt || new Date()
      };
      
      // Reinicializar el servicio con la nueva API key
      this.isInitialized = false;
      await this.initialize();
    } catch (error) {
      console.error('Error al configurar la API key:', error);
      throw new Error('No se pudo guardar la API key');
    }
  }

  static async testApiKey(): Promise<void> {
    try {
      const selectedModel = this.getSelectedModel();
      if (!selectedModel) {
        throw new Error('No se ha seleccionado ningún modelo');
      }

      if (!this.config?.apiKey) {
        throw new Error('No hay API key configurada');
      }

      let testEndpoint = '';
      let testBody = {};

      switch (selectedModel.provider) {
        case 'google':
          testEndpoint = `https://generativelanguage.googleapis.com/v1/models?key=${this.config.apiKey}`;
          break;
        case 'openai':
          testEndpoint = 'https://api.openai.com/v1/models';
          testBody = {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`
            }
          };
          break;
        default:
          throw new Error(`Proveedor no soportado: ${selectedModel.provider}`);
      }

      const response = await fetch(testEndpoint, testBody);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error al validar la API key: ${error.error?.message || 'Error desconocido'}`);
      }

      console.log('✅ API key válida');
    } catch (error) {
      console.error('❌ Error al validar la API key:', error);
      throw error;
    }
  }

  static async verificarTodasLasAPIKeys(): Promise<Record<string, boolean>> {
    const resultados: Record<string, boolean> = {
      google: false,
      openai: false,
      anthropic: false
    };

    console.log('🔍 Verificando todas las API keys...');

    // Verificar Google (Gemini)
    try {
      const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (geminiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`
        );
        resultados.google = response.ok;
        console.log(`Google API Key: ${response.ok ? '✅ Válida' : '❌ Inválida'}`);
      } else {
        console.log('❌ Google API Key no configurada');
      }
    } catch (error) {
      console.error('Error al verificar Google API Key:', error);
    }

    // Verificar OpenAI
    try {
      const openaiKey = process.env.NEXT_PUBLIC_GPT_API_KEY;
      if (openaiKey) {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${openaiKey}`
          }
        });
        resultados.openai = response.ok;
        console.log(`OpenAI API Key: ${response.ok ? '✅ Válida' : '❌ Inválida'}`);
      } else {
        console.log('❌ OpenAI API Key no configurada');
      }
    } catch (error) {
      console.error('Error al verificar OpenAI API Key:', error);
    }

    // Verificar Anthropic
    try {
      const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
      if (anthropicKey) {
        // En lugar de hacer una llamada directa a la API, verificamos que la key tenga el formato correcto
        const isValidFormat = anthropicKey.startsWith('sk-ant-');
        resultados.anthropic = isValidFormat;
        console.log(`Anthropic API Key: ${isValidFormat ? '✅ Formato válido' : '❌ Formato inválido'}`);
      } else {
        console.log('❌ Anthropic API Key no configurada');
      }
    } catch (error) {
      console.error('Error al verificar Anthropic API Key:', error);
    }

    return resultados;
  }

  // Configuración de tipos de preguntas
  static async setQuestionTypes(types: any) {
    try {
      console.log('🎯 Configurando tipos de preguntas...');
      // Temporal: usar localStorage hasta resolver inconsistencia de tipos
      if (typeof window !== 'undefined') {
        localStorage.setItem('questionTypes', JSON.stringify(types));
      }
      console.log('✅ Tipos de preguntas configurados correctamente');
      return { success: true, data: types };
    } catch (error) {
      console.error('❌ Error al configurar tipos de preguntas:', error);
      throw new Error('Error al configurar tipos de preguntas');
    }
  }

  // Configuración de niveles de dificultad
  static async setDifficultyLevels(difficulties: any) {
    try {
      console.log('🎯 Configurando niveles de dificultad...');
      // Temporal: usar localStorage hasta resolver inconsistencia de tipos
      if (typeof window !== 'undefined') {
        localStorage.setItem('difficultyLevels', JSON.stringify(difficulties));
      }
      console.log('✅ Niveles de dificultad configurados correctamente');
      return { success: true, data: difficulties };
    } catch (error) {
      console.error('❌ Error al configurar niveles de dificultad:', error);
      throw new Error('Error al configurar niveles de dificultad');
    }
  }

  // Configuración de procesamiento de texto
  static async setTextProcessing(processingConfig: any) {
    try {
      console.log('🎯 Configurando procesamiento de texto...');
      // Usar AIConfig en lugar de QuestionConfig para textProcessing
      const currentConfig = await this.getConfig();
      const updatedConfig = {
        ...currentConfig,
        textProcessing: processingConfig
      };
      await this.setConfig(updatedConfig);
      console.log('✅ Procesamiento de texto configurado correctamente');
      return updatedConfig;
    } catch (error) {
      console.error('❌ Error al configurar procesamiento de texto:', error);
      throw new Error('Error al configurar procesamiento de texto');
    }
  }

  // Configuración de formato
  static async setFormatConfig(formatConfig: any) {
    try {
      console.log('🎯 Configurando formato de preguntas...');
      // Usar AIConfig en lugar de QuestionConfig para format
      const currentConfig = await this.getConfig();
      const updatedConfig = {
        ...currentConfig,
        format: formatConfig
      };
      await this.setConfig(updatedConfig);
      console.log('✅ Formato de preguntas configurado correctamente');
      return updatedConfig;
    } catch (error) {
      console.error('❌ Error al configurar formato de preguntas:', error);
      throw new Error('Error al configurar formato de preguntas');
    }
  }

  // Configuración de retroalimentación
  static async setFeedbackConfig(feedbackConfig: any) {
    try {
      console.log('🎯 Configurando retroalimentación...');
      // Usar AIConfig en lugar de QuestionConfig para feedback
      const currentConfig = await this.getConfig();
      const updatedConfig = {
        ...currentConfig,
        feedback: feedbackConfig
      };
      await this.setConfig(updatedConfig);
      console.log('✅ Retroalimentación configurada correctamente');
      return updatedConfig;
    } catch (error) {
      console.error('❌ Error al configurar retroalimentación:', error);
      throw new Error('Error al configurar retroalimentación');
    }
  }

  // Configuración de distribución
  static async setDistributionConfig(distributionConfig: any) {
    try {
      console.log('🎯 Configurando distribución de preguntas...');
      // Usar AIConfig en lugar de QuestionConfig para distribution
      const currentConfig = await this.getConfig();
      const updatedConfig = {
        ...currentConfig,
        distribution: distributionConfig
      };
      await this.setConfig(updatedConfig);
      console.log('✅ Distribución de preguntas configurada correctamente');
      return updatedConfig;
    } catch (error) {
      console.error('❌ Error al configurar distribución de preguntas:', error);
      throw new Error('Error al configurar distribución de preguntas');
    }
  }

  // Configuración de ratio teórico/práctico
  static async setTheoryPracticeRatio(ratio: number) {
    try {
      console.log('🎯 Configurando ratio teórico/práctico...');
      // Actualizar la configuración dentro de distribution
      const currentConfig = await this.getConfig();
      const currentDistribution = currentConfig.distribution || {
        sectionDistribution: [],
        theoreticalPracticalRatio: 70,
        difficultyTypeDistribution: []
      };
      
      const updatedDistribution: DistributionConfig = {
        ...currentDistribution,
        theoreticalPracticalRatio: ratio
      };
      
      const updatedConfig = {
        ...currentConfig,
        distribution: updatedDistribution
      };
      await this.setConfig(updatedConfig);
      console.log('✅ Ratio teórico/práctico configurado correctamente');
      return updatedConfig;
    } catch (error) {
      console.error('❌ Error al configurar ratio teórico/práctico:', error);
      throw new Error('Error al configurar ratio teórico/práctico');
    }
  }

  // Métodos para habilitar/deshabilitar características
  static async enableFeature(feature: string): Promise<void> {
    console.log(`🎯 Activando ${feature}...`);
    try {
      const currentFeatures = await this.getFeatures();
      const updatedFeatures = { ...currentFeatures, [feature]: true };
      
      const response = await fetch('/api/ai-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFeatures),
      });

      if (!response.ok) throw new Error(`Error al activar ${feature}`);
      console.log(`✅ ${feature} activado y guardado en la API`);
    } catch (error) {
      console.error(`❌ Error al activar ${feature}:`, error);
      throw error;
    }
  }

  static async disableFeature(feature: string): Promise<void> {
    console.log(`🎯 Desactivando ${feature}...`);
    try {
      const currentFeatures = await this.getFeatures();
      const updatedFeatures = { ...currentFeatures, [feature]: false };
      
      const response = await fetch('/api/ai-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFeatures),
      });

      if (!response.ok) throw new Error(`Error al desactivar ${feature}`);
      console.log(`❌ ${feature} desactivado y guardado en la API`);
    } catch (error) {
      console.error(`❌ Error al desactivar ${feature}:`, error);
      throw error;
    }
  }

  // Hacer público el método getFeatures
  static async getFeatures(): Promise<Record<string, boolean>> {
    const response = await fetch('/api/ai-features');
    if (!response.ok) throw new Error('Error al obtener características');
    return response.json();
  }

  // Agregar método updateFeature que espera el frontend
  static async updateFeature(feature: string, enabled: boolean): Promise<void> {
    try {
      console.log(`🎯 Actualizando ${feature}: ${enabled}`);
      const currentFeatures = await this.getFeatures();
      const updatedFeatures = { ...currentFeatures, [feature]: enabled };
      
      const response = await fetch('/api/ai-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFeatures),
      });

      if (!response.ok) throw new Error(`Error al actualizar ${feature}`);
      console.log(`✅ ${feature} actualizado correctamente`);
    } catch (error) {
      console.error(`❌ Error al actualizar ${feature}:`, error);
      throw error;
    }
  }

  private static getDefaultModelForProvider(provider: AIProvider): AIModel {
    // Primero intentamos obtener el modelo de la configuración actual
    if (this.config?.model) {
        const modelFromConfig = this.availableModels[provider]?.find(m => m.id === this.config?.model);
        if (modelFromConfig) {
            console.log('📝 Usando modelo de la configuración:', modelFromConfig.name);
            return modelFromConfig;
        }
    }

    // Si no hay modelo en la configuración o no es válido, usamos el modelo Flash Thinking para Google
    if (provider === 'google') {
        const flashThinkingModel = this.availableModels[provider]?.find(m => m.id === 'gemini-2.0-flash-thinking');
        if (flashThinkingModel) {
            console.log('📝 Usando modelo Flash Thinking por defecto');
            return flashThinkingModel;
        }
    }

    // Si no encontramos el modelo específico, usamos el primer modelo disponible del proveedor
    const models = this.availableModels[provider];
    if (!models || models.length === 0) {
        throw new Error(`No hay modelos disponibles para el proveedor ${provider}`);
    }

    console.log('📝 Usando primer modelo disponible:', models[0].name);
    return models[0];
  }

  static getAvailableModels(provider: AIProvider): AIModel[] {
    return this.availableModels[provider] || [];
  }

  public static async setModelAndProvider(provider: AIProvider, modelId: string): Promise<void> {
    console.log('🔄 Cambiando modelo a:', modelId);
    try {
      // Buscar el modelo en el array global, filtrando por proveedor
      const model = availableModels.find(m => m.provider === provider && m.id === modelId);
      if (!model) {
        throw new Error(`Modelo ${modelId} no encontrado para el proveedor ${provider}`);
      }
      // Obtener la configuración actual de la BD
      const response = await fetch(this.getApiConfigUrl());
      const currentConfig = await response.json();
      // Obtener la API key del environment para el nuevo proveedor
      const apiKey = this.getApiKeyFromEnv(provider);
      // Preparar nueva configuración
      const newConfig = {
        provider: provider,
        model: modelId,
        apiKey: apiKey, // <-- Aquí se actualiza siempre
        temperature: currentConfig.temperature || model.config.temperature,
        maxTokens: currentConfig.maxTokens || model.config.maxTokens
      };
      // Guardar en la base de datos
      const saveResponse = await fetch(this.getApiConfigUrl(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (!saveResponse.ok) {
        throw new Error('Error al guardar la configuración');
      }
      // Actualizar configuración local
      this.config = await saveResponse.json();
      // Reinicializar el servicio
      this.isInitialized = false;
      await this.initialize();
      console.log('✅ Modelo cambiado correctamente');
    } catch (error) {
      console.error('❌ Error al cambiar el modelo:', error);
      throw error;
    }
  }

  /**
   * Valida un texto usando la IA configurada y devuelve el feedback.
   * @param prompt Texto a validar (prompt completo)
   * @param model Modelo a usar (opcional)
   */
  public static async validateWithAI(prompt: string, model?: AIModel): Promise<string> {
    try {
      const selectedModel = model || this.getSelectedModel();
      if (!selectedModel) {
        throw new Error('No se ha seleccionado ningún modelo de IA');
      }
      
      // Obtener API key
      const apiKey = this.getApiKeyFromEnv(selectedModel.provider);
      if (!apiKey) {
        throw new Error(`No se encontró API key para el proveedor ${selectedModel.provider}`);
      }
      
      return await this.callAIService(selectedModel, prompt, apiKey);
    } catch (error) {
      console.error('Error en validateWithAI:', error);
      throw error;
    }
  }

  /**
   * Obtiene la API key para un proveedor específico
   * @param provider El proveedor para el que se desea obtener la API key
   * @returns La API key para el proveedor o null si no existe
   */
  static async getApiKeyForProvider(provider: AIProvider): Promise<string | null> {
    try {
      console.log(`🔑 AIService.getApiKeyForProvider: Buscando API key para ${provider}`);
      
      // Verificar si ya tenemos la API key en la configuración actual
      if (this.config && this.config.provider === provider && this.config.apiKey) {
        console.log(`✅ Usando API key actual para ${provider}`);
        return this.config.apiKey;
      }
      
      // Intentar obtener la API key desde la API
      try {
        const response = await fetch(`/api/ai-provider-key?provider=${provider}`);
        console.log(`📊 Respuesta de la API: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.apiKey) {
            console.log(`✅ API key recuperada desde la API para ${provider}`);
            return data.apiKey;
          }
        }
      } catch (error) {
        console.error(`❌ Error al obtener API key desde la API: ${error}`);
      }
      
      // Si no se encuentra en la API, usar la variable de entorno
      const envApiKey = this.getApiKeyFromEnv(provider);
      if (envApiKey) {
        console.log(`✅ Usando API key de variables de entorno para ${provider}`);
        return envApiKey;
      }
      
      console.warn(`⚠️ No se encontró API key para ${provider}`);
      return null;
    } catch (error) {
      console.error('❌ Error en getApiKeyForProvider:', error);
      return null;
    }
  }

  async syncQuestionConfig(): Promise<void> {
    console.log('🔄 AIService.syncQuestionConfig: Iniciando sincronización con la configuración de preguntas...');
    try {
      const response = await fetch('/api/ai-config/sync-question-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al sincronizar configuración: ${response.status}`);
      }

      console.log('✅ AIService.syncQuestionConfig: Sincronización completada con éxito');
    } catch (error) {
      console.error('❌ AIService.syncQuestionConfig: Error durante sincronización:', error);
      throw error;
    }
  }
}

// Añadir después de las importaciones y tipos
export function getOptionLengthInstruction(optionLength?: OptionLengthType): string {
  switch (optionLength) {
    case 'muy_corta':
      return `OBLIGATORIO: Cada opción de respuesta debe ser muy corta (máximo 1-3 palabras, estilo test oficial). Si alguna opción supera ese límite, vuelve a acortarla.\nIMPORTANTE: Observa el ejemplo de pregunta con opciones muy cortas incluido en el prompt. Si no puedes cumplirlo, genera la opción más breve posible.`;
    case 'media':
      return 'OBLIGATORIO: Cada opción de respuesta debe tener una longitud media (3-7 palabras, máximo 15 palabras).';
    case 'larga':
      return 'OBLIGATORIO: Cada opción de respuesta debe ser extensa y detallada (1-2 frases, hasta 25 palabras).';
    case 'aleatoria':
      return 'Las opciones de respuesta pueden variar en longitud (corta, media o larga) de forma aleatoria.';
    case 'telegram':
      return `OBLIGATORIO TELEGRAM: LÍMITES ESTRICTOS DE CARACTERES:
- Pregunta (enunciado): MÁXIMO 300 caracteres (sin truncamiento)
- Cada opción de respuesta: MÁXIMO 100 caracteres (truncamiento automático si supera el límite)
- Explicación (retroalimentación): MÁXIMO 200 caracteres (con truncamiento permitido)

IMPORTANTE: Procura mantener las opciones dentro de 100 caracteres para evitar truncado automático. NO uses frases largas, NO uses explicaciones extensas en las opciones. Prioriza la claridad y brevedad extrema.`;
    default:
      return '';
  }
}

export const getAvailableModelsArray = (): AIModel[] => {
  return availableModels;
};

