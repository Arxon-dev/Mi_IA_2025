import { DocumentSectionService, ProcessingMode } from '../src/services/documentSectionService';
import { StoredDocument } from '../src/services/storageService';
import * as fs from 'fs';

// Mock localStorage mejorado para Node.js
const mockStorage: { [key: string]: string } = {};
(global as any).localStorage = {
  getItem: (key: string) => {
    console.log(`🔍 [localStorage] getItem("${key}") = ${mockStorage[key] ? 'FOUND' : 'NOT FOUND'}`);
    return mockStorage[key] || null;
  },
  setItem: (key: string, value: string) => {
    console.log(`💾 [localStorage] setItem("${key}", ${value.length} chars)`);
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    console.log(`🗑️ [localStorage] removeItem("${key}")`);
    delete mockStorage[key];
  },
  clear: () => {
    console.log(`🧹 [localStorage] clear()`);
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  }
};

// Mock StorageService para simular la base de datos
const mockDocuments: { [id: string]: StoredDocument } = {};

// Mock del StorageService
const MockStorageService = {
  async getDocumentById(id: string): Promise<StoredDocument | null> {
    console.log(`🗄️ [StorageService] getDocumentById("${id}") = ${mockDocuments[id] ? 'FOUND' : 'NOT FOUND'}`);
    return mockDocuments[id] || null;
  },
  
  async saveDocument(document: StoredDocument): Promise<void> {
    console.log(`🗄️ [StorageService] saveDocument("${document.id}")`);
    mockDocuments[document.id] = { ...document };
  }
};

// Inyectar el mock en el módulo
const DocumentSectionServiceModule = require('../src/services/documentSectionService');
const StorageServiceModule = require('../src/services/storageService');
StorageServiceModule.StorageService = MockStorageService;

  // Mock fetch para simular la API
(global as any).fetch = async (url: string, options?: any) => {
  console.log(`🌐 [FETCH] ${options?.method || 'GET'} ${url}`);
  
  if (url === '/api/sections' && options?.method === 'POST') {
    const sections = JSON.parse(options.body);
    console.log(`   📝 [API /sections] Secciones creadas: ${sections.length}`);
    return {
      ok: true,
      json: async () => ({ success: true, count: sections.length })
    };
  }
  
  if (url === '/api/documents' && (options?.method === 'PUT' || options?.method === 'POST')) {
    const document = JSON.parse(options.body);
    console.log(`   💾 [API /documents] Guardando documento "${document.id}"`);
    // Guardar también en el mock del StorageService
    mockDocuments[document.id] = { ...document };
    return {
      ok: true,
      json: async () => ({ success: true, id: document.id })
    };
  }
  
  if (url.startsWith('/api/documents/')) {
    const documentId = url.split('/').pop();
    const document = mockDocuments[documentId!];
    console.log(`   📄 [API /documents] Documento "${documentId}" = ${document ? 'FOUND' : 'NOT FOUND'}`);
    return {
      ok: !!document,
      json: async () => document || { error: 'Document not found' }
    };
  }
  
  return {
    ok: true,
    json: async () => ({ success: true })
  };
};

async function testWebSimulation() {
  console.log('🌐 SIMULACIÓN DEL FLUJO DE LA APLICACIÓN WEB\n');

  try {
    // Leer el documento
    const documentPath = 'f:\\Permanencia\\Perma2024\\OPOMELILLA\\TEMARIO TXT\\B1\\Instrucción 6-2025, de 11 de marzo, del Jefe de Estado Mayor del Ejército del Aire y del.txt';
    
    if (!fs.existsSync(documentPath)) {
      console.error('❌ No se encontró el archivo:', documentPath);
      return;
    }

    const content = fs.readFileSync(documentPath, 'utf8');
    
    // Crear documento como lo haría la aplicación web
    const document: StoredDocument = {
      id: 'instruccion-6-2025-web-test',
      title: 'Instrucción 6-2025, de 11 de marzo, del Jefe de Estado Mayor del Ejército del Aire y del Espacio',
      content: content,
      date: new Date(),
      type: 'text/plain',
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingTime: null,
      tokens: null
    };

    console.log('📊 INFORMACIÓN BÁSICA:');
    console.log(`   📄 Documento ID: ${document.id}`);
    console.log(`   📏 Longitud: ${content.length} caracteres`);
    
    // 1. SIMULAR CARGA INICIAL - Sin configuración previa
    console.log('\n🔄 PASO 1: CARGA INICIAL DEL DOCUMENTO');
    console.log('-' .repeat(60));
    
    // Verificar que no hay configuración previa
    const initialConfig = DocumentSectionService.getProcessingConfig(document.id);
    console.log(`   Configuración inicial: ${initialConfig.mode}`);
    
    // 2. SIMULAR updateDocument() - Como lo hace la aplicación web
    console.log('\n🔄 PASO 2: LLAMADA A updateDocument()');
    console.log('-' .repeat(60));
    
    const updatedDocument = await DocumentSectionService.updateDocument(document);
    
    console.log(`   ✅ Documento actualizado`);
    console.log(`   📊 Secciones en respuesta: ${(updatedDocument as any).sections?.length || 'No incluidas'}`);
    
    // 3. VERIFICAR CONFIGURACIÓN DESPUÉS DE updateDocument
    console.log('\n🔄 PASO 3: VERIFICAR CONFIGURACIÓN FINAL');
    console.log('-' .repeat(60));
    
    const finalConfig = DocumentSectionService.getProcessingConfig(document.id);
    console.log(`   Configuración final: ${finalConfig.mode}`);
    console.log(`   ¿Es MILITARY_DOCTRINE?: ${finalConfig.mode === ProcessingMode.MILITARY_DOCTRINE ? '✅ SÍ' : '❌ NO'}`);
    
    // 4. SIMULAR getSections() - Como lo hace el componente
    console.log('\n🔄 PASO 4: LLAMADA A getSections()');
    console.log('-' .repeat(60));
    
    const sections = await DocumentSectionService.getSections(document.id);
    console.log(`   ✅ Secciones obtenidas: ${sections.length}`);
    
    if (sections.length > 0) {
      console.log('\n   📋 PRIMERAS 5 SECCIONES:');
      sections.slice(0, 5).forEach((section, idx) => {
        console.log(`      ${idx + 1}. [${section.type}] "${section.title}"`);
      });
    } else {
      console.log('   ❌ No se obtuvieron secciones');
    }
    
    // 5. DIAGNÓSTICO FINAL
    console.log('\n🔍 DIAGNÓSTICO FINAL:');
    console.log('-' .repeat(60));
    
    const diagnostics = {
      documentoCreado: !!updatedDocument,
      configuracionCorrecta: finalConfig.mode === ProcessingMode.MILITARY_DOCTRINE,
      seccionesExtraidas: sections.length > 0,
      tipoSecciones: sections.length > 0 ? [...new Set(sections.map(s => s.type))] : [],
      totalSecciones: sections.length
    };
    
    console.log('   📊 Resultados:');
    Object.entries(diagnostics).forEach(([key, value]) => {
      const status = typeof value === 'boolean' ? (value ? '✅' : '❌') : '📝';
      console.log(`      ${status} ${key}: ${JSON.stringify(value)}`);
    });
    
    // 6. CONCLUSIÓN
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('-' .repeat(60));
    
    if (diagnostics.configuracionCorrecta && diagnostics.seccionesExtraidas) {
      console.log('   ✅ TODO FUNCIONA CORRECTAMENTE');
      console.log('   🎉 El problema debe estar en el frontend o en la comunicación con la API');
    } else {
      console.log('   ❌ HAY PROBLEMAS EN EL BACKEND');
      if (!diagnostics.configuracionCorrecta) {
        console.log('   🔧 La detección automática no está funcionando');
      }
      if (!diagnostics.seccionesExtraidas) {
        console.log('   🔧 La extracción de secciones no está funcionando');
      }
    }

    console.log('\n✅ SIMULACIÓN WEB COMPLETADA');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA SIMULACIÓN:', error);
    throw error;
  }
}

// Ejecutar la simulación
if (require.main === module) {
  testWebSimulation()
    .then(() => {
      console.log('\n🎉 SIMULACIÓN WEB EXITOSA');
    })
    .catch((error) => {
      console.error('\n💥 ERROR EN LA SIMULACIÓN WEB:', error);
      process.exit(1);
    });
}

export { testWebSimulation }; 