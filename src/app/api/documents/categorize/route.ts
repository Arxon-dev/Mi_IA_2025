import { NextRequest, NextResponse } from 'next/server';
import { CategorizationService } from '@/services/categorizationService';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔄 Iniciando categorización para documento: ${documentId}`);
    
    // Llamar al método estático directamente
    await CategorizationService.categorizeDocumentSections(documentId);
    
    console.log(`✅ Categorización completada para documento: ${documentId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Categorización completada exitosamente',
      documentId
    });
    
  } catch (error) {
    console.error('❌ Error en categorización:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}