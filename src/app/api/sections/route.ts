import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_SECTION_TYPES = [
  'SECTION', 'PARAGRAPH', 'GENERIC', 'CHAPTER', 'ARTICLE', 'MAIN_SECTION'
];

function normalizeSectionType(type: any) {
  if (typeof type !== 'string') return 'GENERIC';
  const upper = type.toUpperCase();
  return VALID_SECTION_TYPES.includes(upper) ? upper : 'GENERIC';
}

export async function GET(request: Request) {
  try {
    console.log('🔍 [API /sections] Iniciando petición GET');
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    
    console.log('📋 [API /sections] DocumentId recibido:', documentId);

    if (!documentId) {
      console.log('❌ [API /sections] DocumentId no proporcionado');
      return NextResponse.json(
        { error: 'documentId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 [API /sections] Buscando secciones en la base de datos...');
    // Obtener las secciones del documento usando documentid (en minúsculas)
    const sections = await prisma.section.findMany({
      where: {
        documentid: documentId
      },
      orderBy: {
        createdat: 'asc'
      }
    });
    
    console.log('✅ [API /sections] Secciones obtenidas:', sections.length, 'secciones');
    console.log('📄 [API /sections] Primeras secciones:', sections.slice(0, 2));
    
    return NextResponse.json(sections);
  } catch (error) {
    console.error('❌ [API /sections] Error al obtener secciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener secciones', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 [API /sections] Iniciando petición POST');
    
    const { data, documentId } = await request.json();
    
    if (!data) {
      return NextResponse.json(
        { error: 'No section data provided' },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    if (Array.isArray(data)) {
      // Normalizar type en cada sección y generar IDs únicos
      const normalized = data.map((sec, index) => ({
        id: sec.id || `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentid: documentId,
        title: sec.title || `Section ${index + 1}`,
        content: sec.content || '',
        order: sec.order || index + 1,
        type: normalizeSectionType(sec.type),
        processed: sec.processed || false,
        createdat: sec.createdAt ? new Date(sec.createdAt) : new Date(),
        updatedat: sec.updatedAt ? new Date(sec.updatedAt) : new Date()
      }));
      
      const created = await prisma.section.createMany({ 
        data: normalized, 
        skipDuplicates: true 
      });
      
      console.log('✅ [API /sections] Secciones creadas:', created.count);
      return NextResponse.json({ message: `${created.count} secciones creadas` }, { status: 201 });
        } else {
      // Normalizar type en una sola sección y generar ID único
      const normalized = { 
        id: data.id || `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentid: documentId,
        title: data.title || 'Section',
        content: data.content || '',
        order: data.order || 1,
        type: normalizeSectionType(data.type),
        processed: data.processed || false,
        createdat: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedat: data.updatedAt ? new Date(data.updatedAt) : new Date()
      };
      
      const created = await prisma.section.create({ data: normalized });
      console.log('✅ [API /sections] Sección creada:', created.id);
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    console.error('❌ [API /sections] Error al crear sección(es):', error);
    return NextResponse.json(
      { error: 'Error interno al crear sección(es)', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 