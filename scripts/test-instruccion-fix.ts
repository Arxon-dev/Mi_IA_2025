import { DocumentSectionService, ProcessingMode } from '../src/services/documentSectionService';
import { StoredDocument } from '../src/services/storageService';
import * as fs from 'fs';

async function testInstruccionFix() {
  console.log('🧪 PROBANDO CORRECCIÓN PARA DOCUMENTO INSTRUCCIÓN 6-2025\n');

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
      id: 'instruccion-6-2025-test-fix',
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
    
    // 1. PROBAR DETECCIÓN AUTOMÁTICA MEJORADA
    console.log('\n🤖 DETECCIÓN AUTOMÁTICA MEJORADA:');
    console.log('-' .repeat(50));
    
    const isPDC01 = DocumentSectionService.detectPDC01Document(content);
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    
    console.log(`   PDC-01 detectado: ${isPDC01 ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Militar detectado: ${isMilitary ? '✅ SÍ' : '❌ NO'}`);

    // 2. PROBAR EXTRACCIÓN CON CONFIGURACIÓN MILITAR
    console.log('\n🔧 PRUEBA DE EXTRACCIÓN CON CONFIGURACIÓN MILITAR:');
    console.log('-' .repeat(50));

    if (isMilitary) {
      // Configurar automáticamente como militar
      DocumentSectionService.setupMilitaryDoctrineProcessing(document.id);
      
      // Extraer secciones
      const sections = DocumentSectionService.extractSections(document);
      
      console.log(`   ✅ Secciones extraídas: ${sections.length}`);
      
      if (sections.length > 0) {
        console.log('\n   📋 Secciones encontradas:');
        sections.forEach((section, idx) => {
          console.log(`      ${idx + 1}. [${section.type}] "${section.title}" (${section.content.length} chars)`);
        });
        
        // Mostrar muestra de la primera sección
        console.log('\n   📄 MUESTRA DE LA PRIMERA SECCIÓN:');
        console.log(`      Título: ${sections[0].title}`);
        console.log(`      Tipo: ${sections[0].type}`);
        console.log(`      Contenido (primeros 300 chars):`);
        console.log(`      ${sections[0].content.substring(0, 300)}...`);
      }
    } else {
      console.log('   ❌ No se detectó como militar, no se puede probar extracción');
    }

    // 3. PROBAR PROCESAMIENTO INTELIGENTE COMPLETO
    console.log('\n🧠 PRUEBA DE PROCESAMIENTO INTELIGENTE:');
    console.log('-' .repeat(50));
    
    const processedDocument = await DocumentSectionService.smartProcessDocument(document);
    
    console.log(`   ✅ Documento procesado: ${processedDocument.id}`);
    
    // Obtener secciones después del procesamiento inteligente
    const finalSections = await DocumentSectionService.getSections(document.id);
    
    console.log(`   📋 Secciones finales: ${finalSections.length}`);
    
    if (finalSections.length > 0) {
      console.log('\n   🎯 RESULTADO FINAL:');
      finalSections.slice(0, 5).forEach((section, idx) => {
        console.log(`      ${idx + 1}. [${section.type}] "${section.title}"`);
      });
      
      if (finalSections.length > 5) {
        console.log(`      ... y ${finalSections.length - 5} secciones más`);
      }
    }

    console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE');
    
    // Limpiar configuración de prueba
    DocumentSectionService.deleteProcessingConfig(document.id);
    DocumentSectionService.deleteSections(document.id);
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA PRUEBA:', error);
    throw error;
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testInstruccionFix()
    .then(() => {
      console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS');
    })
    .catch((error) => {
      console.error('\n💥 ERROR EN LAS PRUEBAS:', error);
      process.exit(1);
    });
}

export { testInstruccionFix }; 