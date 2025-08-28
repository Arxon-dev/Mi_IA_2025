import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';

export async function GET() {
  try {
    const stats = await PrismaService.getStats();
    return NextResponse.json(stats || {
      processedDocs: 0,
      generatedQuestions: 0,
      bloomAverage: 0,
      savedTime: 0,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const stats = await request.json();
    await PrismaService.updateStats(stats);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estadísticas' },
      { status: 500 }
    );
  }
} 