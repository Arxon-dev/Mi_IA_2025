'use client';

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  AIService, 
  TextProcessingConfig as ServiceTextProcessingConfig,
  FormatConfig as ServiceFormatConfig,
  FeedbackConfig as ServiceFeedbackConfig,
  DistributionConfig as ServiceDistributionConfig,
  availableModels,
  AIModel,
  AIProvider
} from '@/services/aiService';
import PromptsConfig from './PromptsConfig';
import { ApiKeyManager } from './ApiKeyManager';
import { toast } from 'react-hot-toast';
import { 
  AIConfig as AIConfigType,
  QuestionTypePercentages,
  DifficultyPercentages,
  TextProcessingConfig as TypesTextProcessingConfig,
  FormatConfig as TypesFormatConfig,
  FeedbackConfig as TypesFeedbackConfig,
  DistributionConfig as TypesDistributionConfig
} from '@/types/ai';
import { ModelSelector } from './ModelSelector';
import { 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  FileText, 
  Bot, 
  Bell, 
  Send, 
  Save,
  AlertCircle,
  Check,
  Info,
  Zap,
  Brain,
  MessageSquare
} from 'lucide-react';
import { shuffleOptionsForTelegram } from '@/utils/questionUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface ExtendedAIConfig extends AIConfigType {
  questionsPerChunk?: number;
  telegramSchedulerEnabled?: boolean;
  telegramSchedulerFrequency?: string;
  telegramSchedulerQuantity?: number;
  telegramSchedulerLastRun?: Date | string | null;
  telegramSchedulerStartHour?: number;
  telegramSchedulerEndHour?: number;
}

const FREQUENCY_OPTIONS = [
  { value: "NEVER", label: "Nunca (Desactivado)" },
  { value: "HOURLY", label: "Cada Hora" },
  { value: "EVERY_3_HOURS", label: "Cada 3 Horas" },
  { value: "EVERY_6_HOURS", label: "Cada 6 Horas" },
  { value: "EVERY_12_HOURS", label: "Cada 12 Horas" },
  { value: "DAILY_MIDNIGHT_UTC", label: "Diariamente (Medianoche UTC)" },
  { value: "DAILY_9AM_SERVER", label: "Diariamente (9 AM Hora Servidor)" },
];

// Tab configuration
const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'prompts', label: 'Prompts', icon: FileText },
  { id: 'telegram', label: 'Telegram', icon: MessageSquare },
] as const;

type TabId = typeof TABS[number]['id'];

function AIConfigComponent(): React.ReactElement {
  const questionTypeDetails = [
    { id: 'textual', name: 'Preguntas textuales', description: 'Preguntas basadas directamente en el documento' },
    { id: 'blank', name: 'Espacios en blanco', description: 'Preguntas que requieren completar términos clave o datos numéricos' },
    { id: 'incorrect', name: 'Identificación de incorrectas', description: 'Preguntas que requieren identificar la respuesta INCORRECTA' },
    { id: 'none', name: 'Ninguna es correcta', description: 'Preguntas donde ninguna de las opciones es correcta' },
  ];

  const difficultyLevelDetails = [
    { id: 'difficult', name: 'Difícil', description: 'Basadas en aspectos específicos de la normativa que requieren una lectura atenta' },
    { id: 'veryDifficult', name: 'Muy difícil', description: 'Basadas en excepciones, matices o condiciones especiales dentro de la normativa' },
    { id: 'extremelyDifficult', name: 'Extremadamente difícil', description: 'Basadas en la integración de múltiples disposiciones normativas' },
  ];

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [conceptTrapEnabled, setConceptTrapEnabled] = useState(false);
  const [precisionDistractorsEnabled, setPrecisionDistractorsEnabled] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<QuestionTypePercentages>({
    textual: 75,
    blank: 5,
    incorrect: 10,
    none: 10
  });
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyPercentages>({
    difficult: 33,
    veryDifficult: 33,
    extremelyDifficult: 34
  });

  const [isQuestionTypesConfigExpanded, setIsQuestionTypesConfigExpanded] = useState(true);
  const [isDifficultyLevelsConfigExpanded, setIsDifficultyLevelsConfigExpanded] = useState(true);

  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [telegramSchedulerEnabled, setTelegramSchedulerEnabled] = useState<boolean>(false);
  const [telegramSchedulerFrequency, setTelegramSchedulerFrequency] = useState<string>(FREQUENCY_OPTIONS.find(opt => opt.value === "DAILY_MIDNIGHT_UTC")!.value);
  const [telegramSchedulerQuantity, setTelegramSchedulerQuantity] = useState<number>(1);
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingChatId, setIsSavingChatId] = useState(false);

  const [maxTokensInput, setMaxTokensInput] = useState<number | ''>('');
  const [temperatureInput, setTemperatureInput] = useState<number | ''>(0.3);

  const [textProcessing, setTextProcessing] = useState<TypesTextProcessingConfig>({
    tokenLimit: 8000, minLength: 100, maxLength: 1000, language: 'es',
    chunkSize: 6000, processBySection: true, maintainArticleOrder: true
  });
  const [format, setFormat] = useState<TypesFormatConfig>({
    includeMnemonicRules: true, includePracticalCases: true, includeCrossReferences: true
  });
  const [feedback, setFeedback] = useState<TypesFeedbackConfig>({
    detailLevel: 'detailed', includeNormativeReferences: true, includeTopicConnections: true
  });
  const [distribution, setDistribution] = useState<TypesDistributionConfig>({
    sectionDistribution: [], theoreticalPracticalRatio: 70, difficultyTypeDistribution: []
  });

  const [isReady, setIsReady] = useState(false);
  const [config, setConfig] = useState<ExtendedAIConfig>({
    id: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    provider: 'google',
    model: '',
    apiKey: null,
    temperature: 0.3,
    maxTokens: 30720,
    systemPrompt: null,
    questionsPerChunk: 5,
    questionTypes: { textual: 75, blank: 5, incorrect: 10, none: 10 },
    difficultyLevels: { difficult: 33, veryDifficult: 33, extremelyDifficult: 34 },
    telegramSchedulerEnabled: false,
    telegramSchedulerFrequency: FREQUENCY_OPTIONS.find(opt => opt.value === "DAILY_MIDNIGHT_UTC")!.value,
    telegramSchedulerQuantity: 1,
    telegramSchedulerLastRun: null,
  });
  
  const [selectedModelDetails, setSelectedModelDetails] = useState<AIModel | undefined>(undefined);
  const [modelsByProvider, setModelsByProvider] = useState<Record<string, AIModel[]>>({});

  const modelsByProviderMemo = useMemo(() => {
    return availableModels.reduce((acc, model) => {
      acc[model.provider] = acc[model.provider] || [];
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, AIModel[]>);
  }, []);

  const currentSelectedModelDetails = useMemo((): AIModel | undefined => {
    if (config.provider && config.model) {
      const currentProvider = config.provider as AIProvider;
      const modelsForProvider = modelsByProviderMemo[currentProvider] || [];
      return modelsForProvider.find(m => m.id === config.model);
    }
    return undefined;
  }, [config.model, config.provider, modelsByProviderMemo]);

  useEffect(() => {
    if (config.maxTokens !== null && config.maxTokens !== undefined) {
      console.log('🔢 useEffect: Actualizando maxTokensInput desde config:', config.maxTokens);
      setMaxTokensInput(config.maxTokens);
    } else if (currentSelectedModelDetails) {
      console.log('🔢 useEffect: Actualizando maxTokensInput desde modelo:', currentSelectedModelDetails.config.maxTokens);
      setMaxTokensInput(currentSelectedModelDetails.config.maxTokens);
    } else {
      console.log('🔢 useEffect: No hay valor de maxTokens, usando valor por defecto');
      setMaxTokensInput('');
    }
  }, [config.maxTokens, currentSelectedModelDetails]);

  useEffect(() => {
    if (config.temperature !== null && config.temperature !== undefined) {
      setTemperatureInput(config.temperature);
    } else if (currentSelectedModelDetails) {
      setTemperatureInput(currentSelectedModelDetails.config.temperature);
    } else {
      setTemperatureInput(0.3);
    }
  }, [config.temperature, currentSelectedModelDetails]);

  // Effect to populate modelsByProvider for the model selector dropdown
  useEffect(() => {
    const grouped = availableModels.reduce((acc, model) => {
      acc[model.provider] = acc[model.provider] || [];
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, AIModel[]>);
    setModelsByProvider(grouped);
  }, []); // Empty dependency array ensures this runs once on mount

  const processPercentageChange = async (type: keyof QuestionTypePercentages, value: number) => {
    try {
      console.group('Procesando cambio de porcentaje');
      console.log(`Tipo: ${type}, Valor original:`, value);
      
      const newValue = Math.max(0, Math.min(100, value));
      console.log('Valor ajustado:', newValue);
      
      await new Promise<void>(resolve => {
        setQuestionTypes(prev => {
          const newState = { ...prev, [type]: newValue };
          console.log('Estado actualizado:', newState);
          resolve();
          return newState;
        });
      });

      const otherTypes = Object.entries(questionTypes).filter(([key]) => key !== type) as [string, number][];
      console.log('Otros tipos:', otherTypes);
      
      const remainingPercentage = 100 - newValue;
      console.log('Porcentaje restante:', remainingPercentage);
      
      if (remainingPercentage >= 0) {
        const totalOtherPercentages = otherTypes.reduce((sum: number, [, val]) => sum + (val || 0), 0);
        
        if (totalOtherPercentages > 0) {
          const scalingFactor = remainingPercentage / totalOtherPercentages;
          console.log('Factor de escalado:', scalingFactor);
          
          setQuestionTypes(prev => {
            const scaled: QuestionTypePercentages = { ...prev };
            
            otherTypes.forEach(([key]) => {
              if (key !== type) {
                const scaledValue = Math.round((prev[key as keyof QuestionTypePercentages] || 0) * scalingFactor);
                (scaled as any)[key] = Math.max(0, scaledValue);
              }
            });
            
            // Verificar que sume 100%
            const total = Object.values(scaled).reduce((sum, val) => (sum || 0) + (val || 0), 0);
            if (total !== 100) {
              // Ajustar el primer tipo disponible
              const firstOtherType = otherTypes[0]?.[0];
              if (firstOtherType && firstOtherType !== type) {
                const currentValue = (scaled as any)[firstOtherType] || 0;
                const adjustment = 100 - (total || 0);
                (scaled as any)[firstOtherType] = Math.max(0, currentValue + adjustment);
              }
            }
            
            console.log('Estado final escalado:', scaled);
            return scaled;
          });
        }
      }
    } catch (error) {
      console.error('Error en processPercentageChange:', error);
    } finally {
      console.groupEnd();
    }
  };

  const handleDifficultyChange = (level: keyof DifficultyPercentages, value: number) => {
    setDifficultyLevels(prev => {
      const newValue = Math.max(0, Math.min(100, value));
      const updated = { ...prev, [level]: newValue };
      
      // Obtener las claves de los otros niveles
      const allKeys = ['difficult', 'veryDifficult', 'extremelyDifficult'] as const;
      const otherKeys = allKeys.filter(key => key !== level);
      const remainingPercentage = 100 - newValue;
      
      if (remainingPercentage >= 0 && otherKeys.length > 0) {
        // Calcular total de otros porcentajes
        let totalOther = 0;
        otherKeys.forEach(key => {
          const val = updated[key];
          if (typeof val === 'number') {
            totalOther += val;
          }
        });
        
        if (totalOther > 0) {
          const scalingFactor = remainingPercentage / totalOther;
          
          otherKeys.forEach(key => {
            const currentValue = updated[key];
            const prevValue = prev[key];
            if (typeof currentValue === 'number' && typeof prevValue === 'number') {
              updated[key] = Math.round(prevValue * scalingFactor) as any;
            }
          });
        }
      }
      
      return updated;
    });
  };

  useEffect(() => {
    const initConfig = async () => {
      try {
        await loadConfig();
        await loadFeatures();
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing config:', error);
        toast.error('Error al cargar la configuración');
        setIsReady(true);
      }
    };

    initConfig();
  }, []);

  const handleConfigChange = async (field: keyof ExtendedAIConfig | string, value: any) => {
    console.log(`🔄 handleConfigChange: Cambiando ${field} a ${value}`);
    
    if (field === 'maxTokens') {
      setMaxTokensInput(value);
    } else if (field === 'temperature') {
      setTemperatureInput(value);
    } else if (field === 'telegramChatId') {
      setTelegramChatId(value);
    } else if (field === 'telegramSchedulerEnabled') {
      setTelegramSchedulerEnabled(value);
    } else if (field === 'telegramSchedulerFrequency') {
      setTelegramSchedulerFrequency(value);
    } else if (field === 'telegramSchedulerQuantity') {
      console.log('🔢 handleConfigChange: Actualizando telegramSchedulerQuantity:', {
        value,
        type: typeof value,
        isNumber: !isNaN(Number(value))
      });
      setTelegramSchedulerQuantity(value);
    }
    
    try {
      let configToUpdate: Partial<ExtendedAIConfig> = {};
      
      if (field === 'model') {
        console.log(`🔄 Cambiando modelo a: ${value}`);
        
        // Buscar el modelo seleccionado para obtener su proveedor
        const selectedModel = availableModels.find(m => m.id === value);
        
        if (selectedModel) {
          console.log(`📌 Modelo encontrado:`, {
            id: selectedModel.id,
            name: selectedModel.name,
            description: selectedModel.description,
            provider: selectedModel.provider,
            config: selectedModel.config
          });
          
          // Utilizar el método setModelAndProvider para garantizar que tanto el modelo como el proveedor se actualicen juntos
          try {
            setIsSaving(true);
            await AIService.setModelAndProvider(selectedModel.provider, value);
            
            // Actualizar estados locales después de la actualización exitosa
            setConfig(prev => ({
              ...prev, 
              provider: selectedModel.provider, 
              model: selectedModel.id
            }));
            setSelectedModelDetails(selectedModel);
            setMaxTokensInput(selectedModel.config.maxTokens);
            setTemperatureInput(selectedModel.config.temperature);
            
            console.log(`✅ Modelo y proveedor actualizados correctamente a:`, {
              provider: selectedModel.provider,
              model: selectedModel.id
            });
            
            // No es necesario continuar con la actualización, ya que setModelAndProvider ya lo ha hecho
            setIsSaving(false);
            return;
          } catch (error) {
            console.error(`❌ Error al actualizar modelo y proveedor:`, error);
            toast.error(`Error al actualizar modelo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            setIsSaving(false);
            return;
          }
        } else {
          console.error(`❌ Modelo no encontrado: ${value}`);
          toast.error(`Modelo no encontrado: ${value}`);
          return;
        }
      } else if (field === 'provider') {
        // Si se cambia el proveedor directamente, actualizar solo ese campo
        configToUpdate = { provider: value };
      } else if (field === 'maxTokens') {
        // Para maxTokens, convertir a entero y validar
        const numValue = parseInt(value);
        console.log(`🔢 Procesando cambio de maxTokens: valor=${value}, convertido=${numValue}`);
        
        if (isNaN(numValue)) {
          console.error(`❌ Error al convertir maxTokens a número: ${value}`);
          toast.error('El valor de tokens máximos debe ser un número válido');
          return;
        }
        
        // Validar que esté dentro de límites razonables
        if (numValue < 1000 || numValue > 1000000) {
          console.warn(`⚠️ Valor de maxTokens fuera de rango recomendado: ${numValue}`);
          // Opcional: mostrar una advertencia pero permitir continuar
        }
        
        configToUpdate = { maxTokens: numValue };
        console.log(`📋 Configuración de maxTokens a actualizar: ${numValue}`);
      } else if (field === 'temperature') {
        configToUpdate = { temperature: parseFloat(value) };
      } else if (field === 'telegramChatId') {
        configToUpdate = { telegramChatId: value };
      } else if (field === 'telegramSchedulerEnabled') {
        configToUpdate = { telegramSchedulerEnabled: value };
      } else if (field === 'telegramSchedulerFrequency') {
        configToUpdate = { telegramSchedulerFrequency: value };
      } else if (field === 'telegramSchedulerQuantity') {
        const numValue = parseInt(value);
        console.log('🔢 handleConfigChange: Preparando telegramSchedulerQuantity para API:', {
          original: value,
          parsed: numValue,
          type: typeof numValue,
          finalValue: isNaN(numValue) ? value : numValue
        });
        configToUpdate = { telegramSchedulerQuantity: isNaN(numValue) ? value : numValue };
      } else {
        // Para otros campos no especificados
        configToUpdate = { [field]: value };
      }
      
      console.log(`📋 Configuración a actualizar:`, configToUpdate);
      
      // Si llegamos aquí, es porque no estamos actualizando el modelo o ha ocurrido un error
      // así que actualizamos la configuración normalmente
      setIsSaving(true);
      const updatedConfig = await AIService.setConfig(configToUpdate as unknown as Partial<import('@/services/aiService').aiconfig>);
      
      // Actualizar estados locales según el campo actualizado
      setConfig(prev => {
        const updatedConfig = {
          ...prev,
          ...configToUpdate
        };
        console.log('📊 Estado actualizado después de setConfig:', updatedConfig);
        return updatedConfig;
      });
      
      // Si estamos actualizando maxTokens, recargar completamente la configuración para asegurar sincronización
      if (field === 'maxTokens') {
        console.log('🔄 Recargando configuración completa después de actualizar maxTokens');
        await loadConfig();
        console.log('✅ Configuración recargada después de actualizar maxTokens');
      }
      
      console.log(`✅ Configuración actualizada correctamente`);
      toast.success('Configuración actualizada correctamente');
    } catch (error) {
      console.error(`❌ Error al actualizar configuración:`, error);
      toast.error(`Error al actualizar configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const loadConfig = async () => {
    try {
      console.log('🔄 AIConfig.loadConfig: Iniciando carga de configuración...');
      const loadedConfig = await AIService.getConfig();
      
      console.log('📥 AIConfig.loadConfig: Datos recibidos:', {
        provider: loadedConfig?.provider,
        model: loadedConfig?.model,
        maxTokens: loadedConfig?.maxTokens,
        temperature: loadedConfig?.temperature,
        questionTypes: (loadedConfig as any)?.questionTypes ? 'presente' : 'ausente',
        difficultyLevels: (loadedConfig as any)?.difficultyLevels ? 'presente' : 'ausente'
      });
      
      if (loadedConfig) {
        // Valores por defecto para usar solo si los datos están ausentes
        const defaultQuestionTypes = { textual: 75, blank: 5, incorrect: 10, none: 10 };
        const defaultDifficultyLevels = { difficult: 33, veryDifficult: 33, extremelyDifficult: 34 };
        
        // Verificar si los valores cargados son válidos
        const hasValidQuestionTypes = 
          (loadedConfig as any).questionTypes && 
          typeof (loadedConfig as any).questionTypes === 'object' && 
          Object.keys((loadedConfig as any).questionTypes).length > 0;
        
        const hasValidDifficultyLevels = 
          (loadedConfig as any).difficultyLevels && 
          typeof (loadedConfig as any).difficultyLevels === 'object' && 
          Object.keys((loadedConfig as any).difficultyLevels).length > 0;
        
        console.log('🔍 AIConfig.loadConfig: Estado de validación:', {
          hasValidQuestionTypes,
          hasValidDifficultyLevels
        });
        
        const extendedConfig: ExtendedAIConfig = {
          ...loadedConfig,
          questionTypes: hasValidQuestionTypes ? (loadedConfig as any).questionTypes : defaultQuestionTypes,
          difficultyLevels: hasValidDifficultyLevels ? (loadedConfig as any).difficultyLevels : defaultDifficultyLevels,
          telegramSchedulerEnabled: (loadedConfig as any).telegramSchedulerEnabled !== null && (loadedConfig as any).telegramSchedulerEnabled !== undefined ? (loadedConfig as any).telegramSchedulerEnabled : false,
          telegramSchedulerFrequency: (loadedConfig as any).telegramSchedulerFrequency !== null && (loadedConfig as any).telegramSchedulerFrequency !== undefined ? (loadedConfig as any).telegramSchedulerFrequency : FREQUENCY_OPTIONS.find(opt => opt.value === "DAILY_MIDNIGHT_UTC")!.value,
          telegramSchedulerQuantity: (loadedConfig as any).telegramSchedulerQuantity !== null && (loadedConfig as any).telegramSchedulerQuantity !== undefined ? (loadedConfig as any).telegramSchedulerQuantity : 1,
          telegramSchedulerLastRun: (loadedConfig as any).telegramSchedulerLastRun !== null && (loadedConfig as any).telegramSchedulerLastRun !== undefined ? (loadedConfig as any).telegramSchedulerLastRun : null,
        };
        
        console.log('📊 AIConfig.loadConfig: Configuración extendida preparada', {
          provider: extendedConfig.provider,
          model: extendedConfig.model,
          maxTokens: extendedConfig.maxTokens,
          temperature: extendedConfig.temperature,
          questionTypesPresente: !!extendedConfig.questionTypes,
          difficultyLevelsPresente: !!extendedConfig.difficultyLevels
        });
        
        // Guardamos los valores en el estado, usando los valores cargados si existen
        setConfig(extendedConfig);
        
        // Para los questionTypes y difficultyLevels, usamos los valores de la configuración extendida
        // que ya tiene la lógica para usar valores por defecto solo si es necesario
        console.log('🔢 AIConfig.loadConfig: Configurando questionTypes:', hasValidQuestionTypes ? 'Usando valores guardados' : 'Usando valores por defecto');
        setQuestionTypes(extendedConfig.questionTypes || defaultQuestionTypes);
        
        console.log('🔢 AIConfig.loadConfig: Configurando difficultyLevels:', hasValidDifficultyLevels ? 'Usando valores guardados' : 'Usando valores por defecto');
        setDifficultyLevels(extendedConfig.difficultyLevels || defaultDifficultyLevels);
        
        console.log('🔢 AIConfig.loadConfig: Actualizando maxTokensInput con valor:', loadedConfig.maxTokens);
        setMaxTokensInput(loadedConfig.maxTokens !== null && loadedConfig.maxTokens !== undefined ? loadedConfig.maxTokens : 30720);
        
        setTemperatureInput(loadedConfig.temperature !== null && loadedConfig.temperature !== undefined ? loadedConfig.temperature : 0.3);
        setTelegramSchedulerEnabled(
          extendedConfig.telegramSchedulerEnabled !== undefined && extendedConfig.telegramSchedulerEnabled !== null
            ? extendedConfig.telegramSchedulerEnabled
            : false
        );
        setTelegramSchedulerFrequency(
          extendedConfig.telegramSchedulerFrequency || FREQUENCY_OPTIONS.find(opt => opt.value === "DAILY_MIDNIGHT_UTC")!.value
        );
        setTelegramSchedulerQuantity(
          extendedConfig.telegramSchedulerQuantity !== undefined && extendedConfig.telegramSchedulerQuantity !== null
            ? extendedConfig.telegramSchedulerQuantity
            : 1
        );
        
        const selectedModel = availableModels.find(m => m.id === loadedConfig.model && m.provider === loadedConfig.provider);
        if (selectedModel) {
          setSelectedModelDetails(selectedModel);
        }
        
        console.log('✅ AIConfig.loadConfig: Configuración cargada completamente');
      }
    } catch (error) {
      console.error('❌ AIConfig.loadConfig: Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    }
  };

  const handleDifficultyLevelChange = (difficulty: string, value: number) => {
    const difficultyKey = difficulty as keyof DifficultyPercentages;
    handleDifficultyChange(difficultyKey, value);
  };

  const handleQuestionTypeChange = (type: string, value: number) => {
    const typeKey = type as keyof QuestionTypePercentages;
    processPercentageChange(typeKey, value);
  };

  const handleTextProcessingChange = (field: string, value: boolean) => {
    setTextProcessing(prev => ({ ...prev, [field]: value }));
  };

  const handleFormatChange = (field: string, value: boolean) => {
    setFormat(prev => ({ ...prev, [field]: value }));
  };

  const handleFeedbackChange = (field: string, value: boolean) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleDistributionChange = (field: string, value: number) => {
    setDistribution(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      
      // Asegurarse de que maxTokens sea un número
      const maxTokensValue = typeof maxTokensInput === 'number' 
        ? maxTokensInput 
        : parseInt(String(maxTokensInput), 10);
      
      console.log('💾 handleSaveConfig: Guardando con maxTokens =', maxTokensValue);
      
      // Crear un objeto compatible con el tipo esperado por AIService
      const configToSave = {
        provider: config.provider,
        model: config.model,
        maxTokens: maxTokensValue,
        temperature: typeof temperatureInput === 'number' ? temperatureInput : parseFloat(String(temperatureInput)),
        questionTypes: questionTypes,
        difficultyLevels: difficultyLevels,
        // Mantener los otros campos necesarios
        questionsPerChunk: config.questionsPerChunk,
        telegramSchedulerEnabled: telegramSchedulerEnabled,
        telegramSchedulerFrequency: telegramSchedulerFrequency,
        telegramSchedulerQuantity: telegramSchedulerQuantity,
        telegramSchedulerStartHour: config.telegramSchedulerStartHour,
        telegramSchedulerStartMinute: config.telegramSchedulerStartMinute,
        telegramSchedulerEndHour: config.telegramSchedulerEndHour,
        telegramSchedulerEndMinute: config.telegramSchedulerEndMinute,
      };
      
      console.log('💾 handleSaveConfig: Guardando configuración:', {
        provider: configToSave.provider,
        model: configToSave.model,
        maxTokens: configToSave.maxTokens,
        temperature: configToSave.temperature,
        questionTypes: configToSave.questionTypes ? 'presente' : 'ausente',
        difficultyLevels: configToSave.difficultyLevels ? 'presente' : 'ausente'
      });
      
      // Paso 1: Guardar la configuración principal
      await AIService.setConfig(configToSave);
      console.log('✅ handleSaveConfig: Configuración guardada exitosamente');
      
      // Paso 2: Guardar las demás configuraciones (si es necesario)
      const textProcessingConfig: ServiceTextProcessingConfig = {
        tokenLimit: textProcessing.tokenLimit || 8000,
        minLength: textProcessing.minLength || 100,
        maxLength: textProcessing.maxLength || 1000,
        language: textProcessing.language || 'es',
        chunkSize: textProcessing.chunkSize || 6000,
        processBySection: textProcessing.processBySection ?? true,
        maintainArticleOrder: textProcessing.maintainArticleOrder ?? true,
      };
      
      const formatConfig: ServiceFormatConfig = {
        includeMnemonicRules: format.includeMnemonicRules ?? true,
        includePracticalCases: format.includePracticalCases ?? true,
        includeCrossReferences: format.includeCrossReferences ?? true,
      };
      
      const feedbackConfig: ServiceFeedbackConfig = {
        detailLevel: (feedback.detailLevel === 'detailed' || feedback.detailLevel === 'basic') ? feedback.detailLevel : 'detailed',
        includeNormativeReferences: feedback.includeNormativeReferences ?? true,
        includeTopicConnections: feedback.includeTopicConnections ?? true,
      };
      
      const distributionConfig: ServiceDistributionConfig = {
        sectionDistribution: distribution.sectionDistribution || [],
        theoreticalPracticalRatio: distribution.theoreticalPracticalRatio || 70,
        difficultyTypeDistribution: distribution.difficultyTypeDistribution || [],
      };
      
      // Guardar todas las configuraciones
      await Promise.all([
        AIService.setTextProcessing(textProcessingConfig),
        AIService.setFormatConfig(formatConfig),
        AIService.setFeedbackConfig(feedbackConfig),
        AIService.setDistributionConfig(distributionConfig),
      ]);
      
      // Paso 3: Sincronizar con la configuración de preguntas
      console.log('🔄 handleSaveConfig: Sincronizando con configuración de preguntas...');
      try {
        const syncResponse = await fetch('/api/ai-config/sync-question-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const syncResult = await syncResponse.json();
        console.log('🔄 handleSaveConfig: Resultado de sincronización:', syncResult);
        
        if (syncResult.success) {
          console.log('✅ handleSaveConfig: Sincronización exitosa');
        } else {
          console.error('⚠️ handleSaveConfig: Error en sincronización:', syncResult.message);
        }
      } catch (syncError) {
        console.error('❌ handleSaveConfig: Error al sincronizar:', syncError);
      }
      
      // Paso 4: Recargar la configuración para verificar que se guardó correctamente
      console.log('🔄 handleSaveConfig: Recargando configuración para verificar...');
      await loadConfig();
      
      // Actualizar la UI para indicar éxito
      toast.success('Configuración guardada correctamente');
      setIsSaving(false);
      
    } catch (error) {
      console.error('❌ handleSaveConfig: Error al guardar:', error);
      toast.error('Error al guardar la configuración');
      setIsSaving(false);
    }
  };

  const loadFeatures = async () => {
    try {
      console.log('🔄 Cargando características de IA...');
      const features = await AIService.getFeatures();
      console.log('📥 Características cargadas:', features);
      
      setConceptTrapEnabled(features.conceptTrap !== null && features.conceptTrap !== undefined ? features.conceptTrap : false);
      setPrecisionDistractorsEnabled(features.precisionDistractors !== null && features.precisionDistractors !== undefined ? features.precisionDistractors : false);
      
      console.log('✅ Características aplicadas al estado local');
    } catch (error) {
      console.error('❌ Error loading features:', error);
      // Valores por defecto en caso de error
      setConceptTrapEnabled(false);
      setPrecisionDistractorsEnabled(false);
    }
  };

  const handleFeatureChange = async (feature: string, enabled: boolean) => {
    try {
      console.log(`🎯 Cambiando ${feature} a ${enabled}`);
      
      // Actualizar el estado local inmediatamente para feedback visual
      if (feature === 'conceptTrap') {
        setConceptTrapEnabled(enabled);
      } else if (feature === 'precisionDistractors') {
        setPrecisionDistractorsEnabled(enabled);
      }
      
      // Guardar en la base de datos
      await AIService.updateFeature(feature, enabled);
      
      toast.success(`Función ${enabled ? 'activada' : 'desactivada'} correctamente`);
      console.log(`✅ ${feature} ${enabled ? 'activado' : 'desactivado'} y guardado`);
    } catch (error) {
      console.error('❌ Error updating feature:', error);
      toast.error('Error al actualizar la función');
      
      // Revertir el estado local en caso de error
      if (feature === 'conceptTrap') {
        setConceptTrapEnabled(!enabled);
      } else if (feature === 'precisionDistractors') {
        setPrecisionDistractorsEnabled(!enabled);
      }
    }
  };

  const handleSaveTelegramConfig = async () => {
    setIsSavingChatId(true);
    try {
      await AIService.setConfig({ telegramChatId: telegramChatId || null });
      toast.success('Chat ID de Telegram guardado correctamente');
    } catch (error) {
      toast.error('Error al guardar el Chat ID de Telegram');
    } finally {
      setIsSavingChatId(false);
    }
  };

  const handleTestTelegramSend = async () => {
    if (!telegramChatId.trim()) {
      toast.error('Por favor, configura el Chat ID de Telegram primero');
      return;
    }

    try {
      setIsTestingSend(true);
      
      const testQuestion = {
        id: 'test',
        content: `::Test Question:: ¿Cuál de las siguientes opciones es correcta para probar la configuración de Telegram?
{
=Esta es la respuesta correcta
~Opción incorrecta 1
~Opción incorrecta 2
~Opción incorrecta 3
}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatid: telegramChatId,
          question: testQuestion,
          shuffle: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      toast.success('Pregunta de prueba enviada a Telegram correctamente');
    } catch (error) {
      console.error('Error sending test question:', error);
      toast.error('Error al enviar la pregunta de prueba');
    } finally {
      setIsTestingSend(false);
    }
  };

  const renderGeneralConfig = () => {
    return (
      <div className="space-y-6">
        {/* Model Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span>Modelo de IA</span>
            </CardTitle>
            <CardDescription>
              Selecciona el modelo de inteligencia artificial para generar preguntas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Modelo disponible
                </label>
                <select
                  value={config?.model || ''}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {Object.entries(modelsByProvider).map(([providerKey, models]) => (
                    <optgroup key={providerKey} label={providerKey.toUpperCase()}>
                      {models.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {currentSelectedModelDetails && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currentSelectedModelDetails.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary" />
              <span>Parámetros del Modelo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Tokens */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Tokens Máximos
                </label>
                <Input
                  type="number"
                  value={maxTokensInput}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    console.log(`🔢 Input maxTokens cambio: ${e.target.value} -> ${newValue}`);
                    setMaxTokensInput(newValue || 0);
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      console.log(`🔢 Input maxTokens blur: actualizando con valor ${value}`);
                      handleConfigChange('maxTokens', value);
                    }
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Tamaño máximo de respuesta que generará el modelo
                </p>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Temperatura ({typeof temperatureInput === 'number' ? temperatureInput.toFixed(1) : '0.3'})
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((typeof temperatureInput === 'number' ? temperatureInput : 0.3) * 100)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) / 100;
                    setTemperatureInput(value);
                    handleConfigChange('temperature', value);
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controla la creatividad/aleatoriedad de las respuestas (0.0 - 1.0)
                </p>
              </div>
            </div>

            {/* Questions per Chunk */}
            <div className="mt-6 space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Preguntas por lote de procesamiento
              </label>
              <Input
                type="number"
                value={config?.questionsPerChunk || 5}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 100) {
                    handleConfigChange('questionsPerChunk', value);
                  }
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Número de preguntas que se generarán en cada llamada al modelo de IA
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Question Types Card */}
        <Card>
          <CardHeader>
            <button 
              className="w-full flex justify-between items-center text-left"
              onClick={() => setIsQuestionTypesConfigExpanded(!isQuestionTypesConfigExpanded)}
            >
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>Tipos de Preguntas</span>
              </CardTitle>
              {isQuestionTypesConfigExpanded ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </button>
          </CardHeader>
          {isQuestionTypesConfigExpanded && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questionTypeDetails.map(qt => (
                  <div key={qt.id} className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      {qt.name}
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={questionTypes[qt.id as keyof QuestionTypePercentages] || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          processPercentageChange(qt.id as keyof QuestionTypePercentages, Math.max(0, Math.min(100, value)));
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{qt.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Difficulty Levels Card */}
        <Card>
          <CardHeader>
            <button 
              className="w-full flex justify-between items-center text-left"
              onClick={() => setIsDifficultyLevelsConfigExpanded(!isDifficultyLevelsConfigExpanded)}
            >
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                <span>Niveles de Dificultad</span>
              </CardTitle>
              {isDifficultyLevelsConfigExpanded ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </button>
          </CardHeader>
          {isDifficultyLevelsConfigExpanded && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {difficultyLevelDetails.map(dl => (
                  <div key={dl.id} className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      {dl.name}
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={difficultyLevels[dl.id as keyof DifficultyPercentages] || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          handleDifficultyChange(dl.id as keyof DifficultyPercentages, Math.max(0, Math.min(100, value)));
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{dl.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Advanced Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-primary" />
              <span>Características Avanzadas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">Trampas Conceptuales</h4>
                  <p className="text-xs text-muted-foreground">
                    Genera distractores que usan terminología correcta en contextos incorrectos
                  </p>
                </div>
                <button
                  onClick={() => handleFeatureChange('conceptTrap', !conceptTrapEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    conceptTrapEnabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                      conceptTrapEnabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">Distractores de Precisión</h4>
                  <p className="text-xs text-muted-foreground">
                    Genera distractores con variaciones sutiles pero significativas
                  </p>
                </div>
                <button
                  onClick={() => handleFeatureChange('precisionDistractors', !precisionDistractorsEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    precisionDistractorsEnabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                      precisionDistractorsEnabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPromptsConfig = () => {
    return (
      <Card>
        <CardContent className="p-0">
          <PromptsConfig />
        </CardContent>
      </Card>
    );
  };

  const renderTelegramConfig = () => {
    return (
      <div className="space-y-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>Configuración Básica</span>
            </CardTitle>
            <CardDescription>
              Configura el Chat ID de Telegram para envío de preguntas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Telegram Chat ID
                </label>
                <Input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-100xxxxxxxxxx"
                  className="w-full"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Este Chat ID se usará para enviar preguntas manualmente y para los envíos programados
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveTelegramConfig}
                  className="flex-1"
                  disabled={isSavingChatId}
                >
                  {isSavingChatId ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Chat ID
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestTelegramSend}
                  disabled={isTestingSend || !telegramChatId.trim()}
                  className="flex-1"
                >
                  {isTestingSend ? (
                    <>
                      <Send className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Probar Envío
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Sending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-primary" />
              <span>Envíos Programados</span>
            </CardTitle>
            <CardDescription>
              Configura el envío automático de preguntas a intervalos regulares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">Habilitar envíos programados</h4>
                  <p className="text-xs text-muted-foreground">
                    Activa el envío automático de preguntas según la frecuencia configurada
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newValue = !telegramSchedulerEnabled;
                    setTelegramSchedulerEnabled(newValue);
                    handleConfigChange('telegramSchedulerEnabled', newValue);
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    telegramSchedulerEnabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                      telegramSchedulerEnabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {telegramSchedulerEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Frecuencia de envío
                    </label>
                    <select
                      value={telegramSchedulerFrequency}
                      onChange={(e) => {
                        setTelegramSchedulerFrequency(e.target.value);
                        handleConfigChange('telegramSchedulerFrequency', e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {FREQUENCY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Cantidad de preguntas por envío
                    </label>
                    <Input
                      type="number"
                      value={telegramSchedulerQuantity}
                      onChange={(e) => {
                        const value = Math.max(1, parseInt(e.target.value, 10) || 1);
                        console.log('🔢 Input telegramSchedulerQuantity cambio:', {
                          original: e.target.value,
                          parsed: value,
                          type: typeof value
                        });
                        setTelegramSchedulerQuantity(value);
                        handleConfigChange('telegramSchedulerQuantity', value);
                      }}
                      min="1"
                      max="10"
                      className="w-32"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Número de preguntas que se enviarán en cada intervalo (1-10)
                    </p>
                  </div>

                  <Alert variant="info">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Los envíos programados dependen de un Cron Job configurado en el servidor que llama a un endpoint específico. 
                      Esta configuración se guarda automáticamente al realizarla.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Cargando configuración...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración de IA</h1>
          <p className="text-muted-foreground">
            Configura los modelos de inteligencia artificial y parámetros para la generación de preguntas
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'general' && renderGeneralConfig()}
          {activeTab === 'prompts' && renderPromptsConfig()}
          {activeTab === 'telegram' && renderTelegramConfig()}
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleSaveConfig}
            disabled={isSaving}
            size="lg"
            className="shadow-lg"
          >
            {isSaving ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AIConfigComponent;
