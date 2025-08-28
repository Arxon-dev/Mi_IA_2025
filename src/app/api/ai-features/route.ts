import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';

export async function GET() {
  try {
    const features = await PrismaService.getAIFeatures();
    return NextResponse.json(features);
  } catch (error) {
    console.error('Error al obtener las características de IA:', error);
    return NextResponse.json({ error: 'Error al obtener las características' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const features = await PrismaService.saveAIFeatures(data);
    return NextResponse.json(features);
  } catch (error) {
    console.error('Error al guardar las características de IA:', error);
    return NextResponse.json({ error: 'Error al guardar las características' }, { status: 500 });
  }
} 