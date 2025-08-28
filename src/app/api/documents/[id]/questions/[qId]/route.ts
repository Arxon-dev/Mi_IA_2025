import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Question as PrismaQuestion } from '@prisma/client';

// PUT /api/documents/[id]/questions/[qId]
export async function PUT(
  request: Request,
  { params }: { params: { id: string; qId: string } } // Usa qId
) {
  const documentId = params.id;
  const questionid = params.qId; // Usa qId

  if (!questionid) {
    return NextResponse.json({ error: 'Question ID (qId) is required' }, { status: 400 });
  }

  try {
    const dataToUpdate: Partial<PrismaQuestion> = await request.json();
    delete (dataToUpdate as any).documentId;
    delete (dataToUpdate as any).id;

    const updatedQuestion = await prisma.question.update({
      where: { id: questionid }, // El ID en la BD sigue siendo 'id'
      data: dataToUpdate,
    });

    console.log(`[API] Question ${questionid} for doc ${documentId} updated successfully.`);
    return NextResponse.json(updatedQuestion, { status: 200 });
  } catch (error: any) {
    console.error(`[API] Error updating question ${questionid} for doc ${documentId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/questions/[qId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; qId: string } } // Usa qId
) {
  const documentId = params.id;
  const questionid = params.qId; // Usa qId

  if (!questionid) {
    return NextResponse.json({ error: 'Question ID (qId) is required' }, { status: 400 });
  }

  try {
    await prisma.question.delete({
      where: { id: questionid }, // El ID en la BD sigue siendo 'id'
    });
    console.log(`[API] Question ${questionid} for doc ${documentId} deleted successfully.`);
    return NextResponse.json({ message: 'Question deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`[API] Error deleting question ${questionid} for doc ${documentId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
} 