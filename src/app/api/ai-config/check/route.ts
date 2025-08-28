import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/ai-config/check: Verificando configuración de IA...');
    
    const dbConfig = await prisma.aiconfig.findFirst();
    
    if (!dbConfig) {
      console.log('❌ No se encontró configuración de IA en la base de datos');
      return NextResponse.json({ 
        hasConfig: false,
        message: 'No hay configuración de IA en la base de datos' 
      });
    }
    
    console.log('✅ Configuración de IA encontrada');
    return NextResponse.json({ 
      hasConfig: true,
      config: {
        id: dbConfig.id,
        provider: dbConfig.provider,
        model: dbConfig.model,
        temperature: dbConfig.temperature,
        maxTokens: dbConfig.maxtokens,
        createdAt: dbConfig.createdat,
        updatedAt: dbConfig.updatedat
      }
    });
    
  } catch (error) {
    console.error('❌ Error verificando configuración de IA:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 