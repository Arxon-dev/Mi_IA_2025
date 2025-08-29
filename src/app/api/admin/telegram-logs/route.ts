import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // TODO: Añadir autenticación/autorización para este endpoint
  
  try {
    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    // Validar parámetros
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: 'Página inválida' }, { status: 400 });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Límite inválido (1-100)' }, { status: 400 });
    }
    
    // Obtener registros con paginación
    const logs = await prisma.telegramsendlog.findMany({
      skip,
      take: limit,
      orderBy: {
        sendtime: 'desc', // Más recientes primero
      },
    });
    
    // Obtener conteo total (opcional, para metadatos de paginación)
    const total = await prisma.telegramsendlog.count();
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error al obtener logs de Telegram:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}