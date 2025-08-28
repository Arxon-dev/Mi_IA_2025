import { DocumentSectionService, ProcessingMode } from '../src/services/documentSectionService';
import fs from 'fs';
import path from 'path';

async function testArticulosConstitucion() {
  console.log('🧪 PRUEBA DE PROCESAMIENTO POR ARTÍCULOS - CONSTITUCIÓN ESPAÑOLA');
  console.log('=' .repeat(80));
  
  try {
    // 1. CARGAR EL DOCUMENTO DE LA CONSTITUCIÓN
    const documentPath = path.join(process.cwd(), 'f:/Permanencia/Perma2024/OPOMELILLA/TEMARIO TXT/B1/ORG_TEMA1_LA CONTITUCIÓN ESPAÑOLA 1978 (Títulos III, IV, V, VI Y VIII)_Copy.txt');
    
    if (!fs.existsSync(documentPath)) {
      console.log('❌ No se encontró el archivo del documento');
      console.log(`   Ruta buscada: ${documentPath}`);
      return;
    }
    
    const content = fs.readFileSync(documentPath, 'utf-8');
    console.log(`✅ Documento cargado: ${content.length} caracteres`);
    
    // 2. CREAR DOCUMENTO DE PRUEBA
    const document = {
      id: 'test-constitucion-' + Date.now(),
      title: 'Constitución Española 1978 - Test',
      content: content,
      date: new Date(),
      type: 'text/plain',
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingTime: null,
      tokens: null
    };
    
    console.log(`📄 Documento de prueba creado: ${document.id}`);
    
    // 3. CONFIGURAR MODO JERÁRQUICO CON ARTÍCULOS
    const config = {
      mode: ProcessingMode.HIERARCHICAL,
      options: {
        minSectionLength: 100,
        maxSectionLength: 10000,
        hierarchical: {
          levels: ['Artículo', 'ARTÍCULO'],
          maxDepth: 1
        }
      }
    };
    
    console.log('\n🔧 Configuración aplicada:');
    console.log(`   Modo: ${config.mode}`);
    console.log(`   Niveles jerárquicos: ${config.options.hierarchical?.levels.join(', ')}`);
    
    // 4. GUARDAR CONFIGURACIÓN
    DocumentSectionService.saveProcessingConfig(document.id, config);
    
    // 5. EXTRAER SECCIONES
    console.log('\n🔍 Extrayendo secciones...');
    const sections = DocumentSectionService.extractSections(document);
    
    console.log(`\n✅ Secciones extraídas: ${sections.length}`);
    
    // 6. ANÁLISIS DETALLADO
    if (sections.length > 0) {
      console.log('\n📊 ANÁLISIS DE SECCIONES:');
      console.log('-' .repeat(50));
      
      const articuloSections = sections.filter(s => s.title.toLowerCase().includes('artículo'));
      const otherSections = sections.filter(s => !s.title.toLowerCase().includes('artículo'));
      
      console.log(`   📜 Artículos detectados: ${articuloSections.length}`);
      console.log(`   📝 Otras secciones: ${otherSections.length}`);
      
      // Mostrar primeros 10 artículos
      console.log('\n🔢 PRIMEROS 10 ARTÍCULOS DETECTADOS:');
      articuloSections.slice(0, 10).forEach((section, idx) => {
        console.log(`   ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
      });
      
      // Mostrar otras secciones si las hay
      if (otherSections.length > 0) {
        console.log('\n📋 OTRAS SECCIONES DETECTADAS:');
        otherSections.slice(0, 5).forEach((section, idx) => {
          console.log(`   ${idx + 1}. [${section.type}] "${section.title}" (${section.content.length} chars)`);
        });
      }
      
      // Verificar contenido de una muestra
      if (articuloSections.length > 0) {
        const sampleArticle = articuloSections[0];
        console.log('\n📄 MUESTRA DEL PRIMER ARTÍCULO:');
        console.log(`   Título: ${sampleArticle.title}`);
        console.log(`   Tipo: ${sampleArticle.type}`);
        console.log(`   Contenido (primeros 300 chars):`);
        console.log(`   ${sampleArticle.content.substring(0, 300)}...`);
      }
      
      // Verificar si se están procesando correctamente
      const expectedArticles = content.match(/Artículo\s*\d+/gi);
      console.log('\n🎯 VERIFICACIÓN:');
      console.log(`   Artículos esperados (regex): ${expectedArticles?.length || 0}`);
      console.log(`   Artículos procesados: ${articuloSections.length}`);
      console.log(`   Coincidencia: ${articuloSections.length === (expectedArticles?.length || 0) ? '✅ SÍ' : '❌ NO'}`);
      
      if (expectedArticles && expectedArticles.length > 0) {
        console.log('\n📝 PRIMEROS ARTÍCULOS ESPERADOS:');
        expectedArticles.slice(0, 10).forEach((article, idx) => {
          console.log(`   ${idx + 1}. ${article}`);
        });
      }
      
    } else {
      console.log('\n❌ NO SE EXTRAJERON SECCIONES');
      console.log('   Posibles causas:');
      console.log('   - El patrón regex no coincide con el formato del documento');
      console.log('   - El contenido no tiene la estructura esperada');
      console.log('   - Error en la configuración jerárquica');
      
      // Debug: mostrar muestra del contenido
      console.log('\n🔍 MUESTRA DEL CONTENIDO (primeros 1000 chars):');
      console.log(content.substring(0, 1000));
    }
    
    // 7. LIMPIAR
    DocumentSectionService.deleteProcessingConfig(document.id);
    console.log('\n🧹 Configuración de prueba eliminada');
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA PRUEBA:', error);
  }
}

// Ejecutar la prueba
testArticulosConstitucion().catch(console.error); 