import { DocumentSectionService, ProcessingMode, ProcessingConfig } from '../src/services/documentSectionService';
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

async function testExtractionDirect() {
  console.log('🧪 PRUEBA DIRECTA DE EXTRACCIÓN DE SECCIONES\n');

  try {
    // Leer el documento
    const documentPath = 'f:\\Permanencia\\Perma2024\\OPOMELILLA\\TEMARIO TXT\\B1\\Instrucción 6-2025, de 11 de marzo, del Jefe de Estado Mayor del Ejército del Aire y del.txt';
    
    if (!fs.existsSync(documentPath)) {
      console.error('❌ No se encontró el archivo:', documentPath);
      return;
    }

    const content = fs.readFileSync(documentPath, 'utf8');
    
    // Crear documento de prueba
    const document: StoredDocument = {
      id: 'instruccion-6-2025-direct-test',
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
    console.log(`   📏 Longitud total: ${content.length} caracteres`);
    console.log(`   📄 Líneas: ${content.split('\n').length}`);
    
    // 1. PROBAR DETECCIÓN
    console.log('\n🤖 DETECCIÓN AUTOMÁTICA:');
    console.log('-' .repeat(50));
    
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    console.log(`   Militar detectado: ${isMilitary ? '✅ SÍ' : '❌ NO'}`);

    // 2. CONFIGURAR MANUALMENTE Y PROBAR EXTRACCIÓN
    console.log('\n🔧 EXTRACCIÓN DIRECTA CON CONFIGURACIÓN MILITAR:');
    console.log('-' .repeat(50));

    // Configuración militar manual
    const militaryConfig: ProcessingConfig = {
      mode: ProcessingMode.MILITARY_DOCTRINE,
      options: {
        minSectionLength: 200,
        maxSectionLength: 10000,
        militaryDoctrine: {
          detectChapters: true,
          detectMainSections: true,
          detectSubSections: true,
          groupParagraphs: true,
          paragraphsPerGroup: 8
        }
      }
    };

    console.log('\n📝 GUARDANDO CONFIGURACIÓN MILITAR:');
    console.log(`   Modo: ${militaryConfig.mode}`);
    console.log(`   Opciones:`, militaryConfig.options);

    // Guardar configuración manualmente
    DocumentSectionService.saveProcessingConfig(document.id, militaryConfig);
    
    // Verificar que se guardó correctamente
    console.log('\n🔍 VERIFICANDO CONFIGURACIÓN GUARDADA:');
    const retrievedConfig = DocumentSectionService.getProcessingConfig(document.id);
    console.log(`   Modo recuperado: ${retrievedConfig.mode}`);
    console.log(`   ¿Es MILITARY_DOCTRINE?: ${retrievedConfig.mode === ProcessingMode.MILITARY_DOCTRINE ? '✅ SÍ' : '❌ NO'}`);
    
    if (retrievedConfig.mode !== ProcessingMode.MILITARY_DOCTRINE) {
      console.log('❌ ERROR: La configuración no se guardó correctamente');
      console.log('   Configuración recuperada:', JSON.stringify(retrievedConfig, null, 2));
      return;
    }
    
    // Extraer secciones
    console.log('\n⚙️ EXTRAYENDO SECCIONES:');
    const sections = DocumentSectionService.extractSections(document);
    
    console.log(`   ✅ Secciones extraídas: ${sections.length}`);
    
    if (sections.length > 0) {
      console.log('\n   📋 SECCIONES ENCONTRADAS:');
      sections.forEach((section, idx) => {
        console.log(`      ${idx + 1}. [${section.type}] "${section.title}" (${section.content.length} chars)`);
      });
      
      // Mostrar muestra de las primeras 3 secciones
      console.log('\n   📄 MUESTRA DE LAS PRIMERAS 3 SECCIONES:');
      sections.slice(0, 3).forEach((section, idx) => {
        console.log(`\n      ${idx + 1}. ${section.title}`);
        console.log(`         Tipo: ${section.type}`);
        console.log(`         Contenido (primeros 200 chars):`);
        console.log(`         ${section.content.substring(0, 200)}...`);
      });
    } else {
      console.log('   ❌ No se extrajeron secciones');
    }

    // 3. VERIFICAR TIPOS DE SECCIONES ENCONTRADAS
    if (sections.length > 0) {
      console.log('\n   📊 ESTADÍSTICAS DE SECCIONES:');
      const stats = sections.reduce((acc, section) => {
        acc[section.type] = (acc[section.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(stats).forEach(([type, count]) => {
        console.log(`      ${type}: ${count} secciones`);
      });
    }

    console.log('\n✅ PRUEBA DIRECTA COMPLETADA');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA PRUEBA:', error);
    throw error;
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testExtractionDirect()
    .then(() => {
      console.log('\n🎉 PRUEBA DIRECTA EXITOSA');
    })
    .catch((error) => {
      console.error('\n💥 ERROR EN LA PRUEBA DIRECTA:', error);
      process.exit(1);
    });
}

export { testExtractionDirect }; 