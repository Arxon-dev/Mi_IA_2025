import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';

export async function GET() {
  try {
    const levels = await PrismaService.getBloomLevels();
    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error al obtener niveles de Bloom:', error);
    return NextResponse.json(
      { error: 'Error al obtener niveles de Bloom' },
      { status: 500 }
    );
  }
} 