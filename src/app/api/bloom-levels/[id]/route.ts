import { NextRequest, NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    console.log('Datos recibidos:', data);

    // Buscar el nivel existente
    const existingLevel = await prisma.bloomLevel.findUnique({
      where: { id: params.id }
    });

    if (!existingLevel) {
      return NextResponse.json(
        { error: 'Nivel de Bloom no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el nivel
    const updatedLevel = await prisma.bloomLevel.update({
      where: { id: params.id },
      data: {
        enabled: data.enabled,
        updatedAt: new Date()
      }
    });

    console.log('Nivel actualizado en BD:', updatedLevel);
    return NextResponse.json(updatedLevel);
  } catch (error) {
    console.error('Error en PUT /api/bloom-levels/[id]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar nivel de Bloom' },
      { status: 500 }
    );
  }
} 
