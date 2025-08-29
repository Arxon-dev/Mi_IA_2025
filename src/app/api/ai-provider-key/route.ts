import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai-provider-key?provider=PROVIDER_NAME
 * Obtiene la API key para un proveedor específico
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    
    if (!provider) {
      return NextResponse.json({ error: 'Proveedor no especificado' }, { status: 400 });
    }
    
    console.log(`🔍 GET /api/ai-provider-key: Buscando API key para ${provider}`);

    // Obtener la configuración de IA
    const aiConfig = await prisma.aIConfig.findFirst();
    
    if (!aiConfig) {
      return NextResponse.json({ error: 'No hay configuración de IA' }, { status: 404 });
    }
    
    // Buscar la API key para el proveedor
    const providerKey = await prisma.aIProviderKey.findFirst({
      where: {
        aiConfigId: aiConfig.id,
        provider: provider
      }
    });
    
    if (!providerKey) {
      console.log(`❌ No hay API key para ${provider}`);
      return NextResponse.json({ 
        hasKey: false,
        provider: provider,
        message: `No hay API key configurada para ${provider}` 
      });
    }
    
    console.log(`✅ API key encontrada para ${provider}`);
    return NextResponse.json({ 
      hasKey: true,
      provider: providerKey.provider,
      // No devolvemos la API key completa por seguridad
      keyPreview: providerKey.apiKey ? `${providerKey.apiKey.substring(0, 8)}...` : null
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo API key:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-provider-key
 * Guarda o actualiza una API key para un proveedor específico
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body;
    
    if (!provider || !apiKey) {
      return NextResponse.json({ 
        error: 'Proveedor y API key son requeridos' 
      }, { status: 400 });
    }
    
    console.log(`💾 POST /api/ai-provider-key: Guardando API key para ${provider}`);

    // Obtener la configuración de IA
    const aiConfig = await prisma.aIConfig.findFirst();
    
    if (!aiConfig) {
      return NextResponse.json({ error: 'No hay configuración de IA' }, { status: 404 });
    }
    
    // Buscar si ya existe una API key para este proveedor
    const existingKey = await prisma.aIProviderKey.findFirst({
      where: {
        aiConfigId: aiConfig.id,
        provider: provider
      }
    });
    
    let result;
    if (existingKey) {
      // Actualizar la API key existente
      result = await prisma.aIProviderKey.update({
        where: { id: existingKey.id },
        data: { apiKey: apiKey }
      });
      console.log(`✅ API key actualizada para ${provider}`);
    } else {
      // Crear nueva API key
      result = await prisma.aIProviderKey.create({
        data: {
          provider: provider,
          apiKey: apiKey,
          aiConfigId: aiConfig.id
        }
      });
      console.log(`✅ Nueva API key creada para ${provider}`);
    }
    
    return NextResponse.json({ 
      success: true,
      provider: result.provider,
      message: `API key ${existingKey ? 'actualizada' : 'creada'} para ${provider}`
    });
    
  } catch (error) {
    console.error('❌ Error guardando API key:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}