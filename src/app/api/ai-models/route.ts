import { NextRequest, NextResponse } from 'next/server';
import { getAvailableModelsArray } from '@/services/aiService';

export async function GET(request: NextRequest) {
  try {
    // Obtener todos los modelos disponibles
    const models = getAvailableModelsArray();
    
    // Devolver los modelos como respuesta JSON
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error al obtener modelos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los modelos disponibles' },
      { status: 500 }
    );
  }
} 