import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/aiService';

export async function GET() {
  try {
    // Obtener la configuración actual
    const config = AIService.getConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener la nueva configuración del cuerpo de la petición
    const newConfig = await request.json();
    
    // Actualizar la configuración
    AIService.setConfig(newConfig);
    
    // Responder con éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
} 