import {  aiconfig as PrismaAIConfig  } from '@prisma/client';

export interface TextProcessingConfig {
  tokenLimit: number;
  minLength: number;
  maxLength: number;
  language: string;
  chunkSize?: number;
  processBySection?: boolean;
  maintainArticleOrder?: boolean;
}

export interface FormatConfig {
  includeMnemonicRules: boolean;
  includePracticalCases: boolean;
  includeCrossReferences: boolean;
}

export interface FeedbackConfig {
  detailLevel: string;
  includeNormativeReferences: boolean;
  includeTopicConnections: boolean;
}

export interface DistributionConfig {
  sectionDistribution: any[];
  theoreticalPracticalRatio: number;
  difficultyTypeDistribution: any[];
}

export interface QuestionTypePercentages {
  textual?: number;
  blank?: number;
  incorrect?: number;
  none?: number;
  [key: string]: number | undefined;
}

export interface DifficultyPercentages {
  difficult?: number;
  veryDifficult?: number;
  extremelyDifficult?: number;
  [key: string]: number | undefined;
}

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
  questionTypes: QuestionTypePercentages | null;
  difficultyLevels: DifficultyPercentages | null;
  telegramSchedulerEnabled?: boolean | null;
  telegramSchedulerFrequency?: string | null;
  telegramSchedulerQuantity?: number | null;
  telegramSchedulerLastRun?: Date | string | null;
  telegramSchedulerStartHour?: number | null;
  telegramSchedulerStartMinute?: number | null;
  telegramSchedulerEndHour?: number | null;
  telegramSchedulerEndMinute?: number | null;
  telegramChatId?: string | null;
  providerKeys?: {
    id: string;
    provider: string;
    apiKey: string;
  }[];
}

export interface AIConfigCreate {
  provider: string;
  model: string;
  apiKey?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  systemPrompt?: string | null;
  questionsPerChunk?: number;
  textProcessing?: TextProcessingConfig | null;
  format?: FormatConfig | null;
  feedback?: FeedbackConfig | null;
  distribution?: DistributionConfig | null;
  questionTypes?: QuestionTypePercentages | null;
  difficultyLevels?: DifficultyPercentages | null;
  telegramSchedulerEnabled?: boolean | null;
  telegramSchedulerFrequency?: string | null;
  telegramSchedulerQuantity?: number | null;
  telegramSchedulerStartHour?: number | null;
  telegramSchedulerStartMinute?: number | null;
  telegramSchedulerEndHour?: number | null;
  telegramSchedulerEndMinute?: number | null;
  telegramChatId?: string | null;
  providerKeys?: { provider: string; apiKey: string; }[];
}

export interface AIConfigUpdate {
  provider?: string;
  model?: string;
  apiKey?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  systemPrompt?: string | null;
  questionsPerChunk?: number;
  textProcessing?: TextProcessingConfig | null;
  format?: FormatConfig | null;
  feedback?: FeedbackConfig | null;
  distribution?: DistributionConfig | null;
  questionTypes?: QuestionTypePercentages | null;
  difficultyLevels?: DifficultyPercentages | null;
  telegramSchedulerEnabled?: boolean | null;
  telegramSchedulerFrequency?: string | null;
  telegramSchedulerQuantity?: number | null;
  telegramSchedulerLastRun?: Date | null;
  telegramSchedulerStartHour?: number | null;
  telegramSchedulerStartMinute?: number | null;
  telegramSchedulerEndHour?: number | null;
  telegramSchedulerEndMinute?: number | null;
  telegramChatId?: string | null;
  providerKeys?: { id?: string; provider?: string; apiKey?: string; }[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  config: {
    maxTokens: number;
    temperature: number;
  };
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
} 