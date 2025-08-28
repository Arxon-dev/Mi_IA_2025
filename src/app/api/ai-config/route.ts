import { NextResponse, NextRequest } from 'next/server';
import { PrismaService } from '@/services/prismaService';
import { AIConfig } from '@/types/ai';

export async function GET() {
  try {
    console.log('📤 GET /api/ai-config: Solicitando configuración de IA');
    const config = await PrismaService.getAIConfig();
    console.log('📥 GET /api/ai-config: Configuración obtenida:', config ? 'Datos encontrados' : 'Configuración vacía');
    return NextResponse.json(config);
  } catch (error) {
    console.error('❌ GET /api/ai-config Error:', error);
    let errorMessage = 'Error al obtener la configuración';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    // Agregar información adicional sobre el error para diagnóstico
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('📤 POST /api/ai-config: Creando nueva configuración de IA');
    const data = await request.json();
    console.log('📤 POST /api/ai-config: Datos recibidos:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Extraer las configuraciones
    const {
      provider,
      model,
      apiKey,
      temperature,
      maxTokens,
      systemPrompt,
      textProcessing,
      format,
      feedback,
      distribution,
      questionTypes,
      difficultyLevels
    } = data;

    // Crear nueva configuración
    const config = await PrismaService.createAIConfig({
      provider,
      model,
      apiKey,
      temperature,
      maxTokens,
      systemPrompt,
      textProcessing,
      format,
      feedback,
      distribution,
      questionTypes,
      difficultyLevels
    });

    console.log('✅ POST /api/ai-config: Configuración creada correctamente');
    return NextResponse.json(config);
  } catch (error) {
    console.error('❌ POST /api/ai-config Error:', error);
    let errorMessage = 'Error al crear la configuración';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📤 PUT /api/ai-config: Actualizando configuración de IA');
    const data = await request.json();
    console.log('📤 PUT /api/ai-config: Datos recibidos:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Añadir log específico para telegramSchedulerQuantity
    if ('telegramSchedulerQuantity' in data) {
      console.log('🔍 PUT /api/ai-config: Valor de telegramSchedulerQuantity recibido:', {
        original: data.telegramSchedulerQuantity,
        type: typeof data.telegramSchedulerQuantity,
        parsedAsInt: parseInt(data.telegramSchedulerQuantity)
      });
    }
    
    // Obtener la configuración actual para usarla como base
    console.log('🔍 PUT /api/ai-config: Obteniendo configuración actual');
    const currentConfig = await PrismaService.getAIConfig();
    
    if (!currentConfig) {
      return NextResponse.json(
        { error: 'No se encontró configuración para actualizar' },
        { status: 404 }
      );
    }
    
    console.log('🔍 PUT /api/ai-config: Configuración actual:', currentConfig ? 'Datos encontrados' : 'No hay datos');
    
    // Asegurar que los campos numéricos se mantengan como números
    const parsedData = {
      ...data,
      // Convertir explícitamente a número si se proporciona
      maxTokens: data.maxTokens !== undefined ? Number(data.maxTokens) : undefined,
      temperature: data.temperature !== undefined ? Number(data.temperature) : undefined,
      questionsPerChunk: data.questionsPerChunk !== undefined ? Number(data.questionsPerChunk) : undefined,
      telegramSchedulerQuantity: data.telegramSchedulerQuantity !== undefined ? Number(data.telegramSchedulerQuantity) : undefined,
      telegramSchedulerStartHour: data.telegramSchedulerStartHour !== undefined ? Number(data.telegramSchedulerStartHour) : undefined,
      telegramSchedulerEndHour: data.telegramSchedulerEndHour !== undefined ? Number(data.telegramSchedulerEndHour) : undefined,
      telegramSchedulerStartMinute: data.telegramSchedulerStartMinute !== undefined ? Number(data.telegramSchedulerStartMinute) : undefined,
      telegramSchedulerEndMinute: data.telegramSchedulerEndMinute !== undefined ? Number(data.telegramSchedulerEndMinute) : undefined,
    };

    console.log('📝 PUT /api/ai-config: Datos procesados:', {
      provider: parsedData.provider,
      model: parsedData.model,
      maxTokens: parsedData.maxTokens,
      temperature: parsedData.temperature,
      telegramSchedulerQuantity: parsedData.telegramSchedulerQuantity,
      telegramSchedulerQuantityType: typeof parsedData.telegramSchedulerQuantity
    });
    
    // Preparar los datos para la actualización, usando los valores actuales como fallback
    const dataToSave = {
      provider: parsedData.provider !== undefined ? parsedData.provider : currentConfig.provider,
      model: parsedData.model !== undefined ? parsedData.model : currentConfig.model,
      temperature: parsedData.temperature !== undefined ? parsedData.temperature : currentConfig.temperature,
      maxTokens: parsedData.maxTokens !== undefined ? parsedData.maxTokens : currentConfig.maxTokens,
      telegramChatId: parsedData.telegramChatId !== undefined ? parsedData.telegramChatId : currentConfig.telegramChatId,
      questionsPerChunk: parsedData.questionsPerChunk !== undefined ? parsedData.questionsPerChunk : currentConfig.questionsPerChunk,
      telegramSchedulerQuantity: parsedData.telegramSchedulerQuantity !== undefined ? Number(parsedData.telegramSchedulerQuantity) : currentConfig.telegramSchedulerQuantity,
      telegramSchedulerEnabled: parsedData.telegramSchedulerEnabled !== undefined ? parsedData.telegramSchedulerEnabled : currentConfig.telegramSchedulerEnabled,
      telegramSchedulerFrequency: parsedData.telegramSchedulerFrequency !== undefined ? parsedData.telegramSchedulerFrequency : currentConfig.telegramSchedulerFrequency,
      // Asegurar que solo se serialice una vez
      questionTypes: parsedData.questionTypes !== undefined 
        ? (typeof parsedData.questionTypes === 'string' 
            ? parsedData.questionTypes 
            : JSON.stringify(parsedData.questionTypes))
        : currentConfig.questionTypes,
      difficultyLevels: parsedData.difficultyLevels !== undefined 
        ? (typeof parsedData.difficultyLevels === 'string'
            ? parsedData.difficultyLevels
            : JSON.stringify(parsedData.difficultyLevels))
        : currentConfig.difficultyLevels,
    };
    
    console.log('📝 PUT /api/ai-config: Configuración a guardar preparada:', {
      telegramSchedulerQuantity: dataToSave.telegramSchedulerQuantity,
      telegramSchedulerQuantityType: typeof dataToSave.telegramSchedulerQuantity
    });
    
    // Si hay cambio de proveedor, registrar explícitamente
    if (parsedData.provider && parsedData.provider !== currentConfig.provider) {
      console.log(`🔄 PUT /api/ai-config: Cambiando proveedor de ${currentConfig.provider} a ${parsedData.provider}`);
    }

    // Actualizar la configuración en la base de datos
    console.log('💾 PUT /api/ai-config: Guardando configuración en la base de datos');
    const updatedConfig = await PrismaService.saveAIConfig(dataToSave as any);
    
    console.log('✅ PUT /api/ai-config: Configuración guardada correctamente');
    
    // Transformar la configuración antes de devolverla
    const safelyParseJson = (value) => {
      if (!value) return {};
      if (typeof value !== 'string') return value;
      
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error(`Error al parsear JSON: ${e.message}`);
        return {};
      }
    };
    
    const response = {
      ...updatedConfig,
      // Garantizar que maxTokens y temperature se devuelvan como números
      maxTokens: typeof updatedConfig.maxTokens === 'string' 
        ? parseInt(updatedConfig.maxTokens) 
        : updatedConfig.maxTokens,
      temperature: typeof updatedConfig.temperature === 'string' 
        ? parseFloat(updatedConfig.temperature) 
        : updatedConfig.temperature,
      // Parsear JSON de manera segura
      questionTypes: safelyParseJson(updatedConfig.questionTypes),
      difficultyLevels: safelyParseJson(updatedConfig.difficultyLevels),
    };
    
    console.log('📊 PUT /api/ai-config: Respuesta enviada:', {
      id: response.id,
      provider: response.provider,
      model: response.model,
      maxTokens: response.maxTokens,
      temperature: response.temperature
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error en PUT /api/ai-config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la configuración' },
      { status: 500 }
    );
  }
} 