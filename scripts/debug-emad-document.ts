import { DocumentSectionService, ProcessingMode, ProcessingConfig, StoredDocument } from '../src/services/documentSectionService';
import * as fs from 'fs';
import * as path from 'path';

// Función para analizar el documento específico del EMAD
async function analyzeEMADDocument() {
  console.log('🔍 ANÁLISIS DEL DOCUMENTO EMAD - Estado Mayor de la Defensa\n');
  console.log('=' .repeat(80));

  try {
    // Ruta al documento proporcionado por el usuario
    const documentPath = path.join(process.cwd(), 'docs', 'organización básica del Estado Mayor de la Defensa_Copy.txt');
    
    if (!fs.existsSync(documentPath)) {
      console.error('❌ No se encontró el archivo:', documentPath);
      console.log('💡 Coloca el archivo en la carpeta docs/ con el nombre: organización básica del Estado Mayor de la Defensa_Copy.txt');
      return;
    }

    const content = fs.readFileSync(documentPath, 'utf8');
    
    console.log('📊 INFORMACIÓN BÁSICA:');
    console.log(`   📏 Longitud total: ${content.length} caracteres`);
    console.log(`   📄 Líneas: ${content.split('\n').length}`);
    console.log(`   📝 Palabras: ~${content.split(/\s+/).length}`);
    
    // Crear documento de prueba
    const document: StoredDocument = {
      id: 'emad-organizacion-document',
      title: 'Organización básica del Estado Mayor de la Defensa',
      content: content,
      date: new Date(),
      type: 'text/plain',
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingTime: null,
      tokens: null
    };

    // 1. PROBAR DETECCIÓN AUTOMÁTICA
    console.log('\n🤖 DETECCIÓN AUTOMÁTICA:');
    console.log('-' .repeat(50));
    
    const isPDC01 = DocumentSectionService.detectPDC01Document(content);
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    
    console.log(`   PDC-01 detectado: ${isPDC01 ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Militar detectado: ${isMilitary ? '✅ SÍ' : '❌ NO'}`);

    // 2. ANALIZAR ESTRUCTURA ESPECÍFICA DEL DOCUMENTO
    console.log('\n📋 ANÁLISIS DE ESTRUCTURA ESPECÍFICA:');
    console.log('-' .repeat(50));
    
    // Patrones específicos para documentos administrativos/legales
    const patterns = {
      'Artículos': /^Artículo\s+\d+\./gm,
      'Disposiciones adicionales': /^Disposición\s+adicional/gm,
      'Disposiciones transitorias': /^Disposición\s+transitoria/gm,
      'Disposiciones finales': /^Disposición\s+final/gm,
      'Disposiciones derogatorias': /^Disposición\s+derogatoria/gm,
      'Apartados numerados': /^\d+\.\s+[A-ZÁÑÜ]/gm,
      'Apartados con letras': /^[a-z]\)\s+[A-ZÁÑÜ]/gm,
      'Subdivisiones': /^\d+\.\d+\.\s+/gm
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern) || [];
      console.log(`   ${name}: ${matches.length} encontrados`);
      if (matches.length > 0 && matches.length <= 15) {
        matches.forEach((match, idx) => {
          console.log(`      ${idx + 1}. "${match.trim()}"`);
        });
      } else if (matches.length > 15) {
        console.log(`      Primeros 10: ${matches.slice(0, 10).map(m => `"${m.trim()}"`).join(', ')}`);
        console.log(`      ... y ${matches.length - 10} más`);
      }
    }

    // 3. CONFIGURACIÓN ESPECÍFICA PARA DOCUMENTOS ADMINISTRATIVOS
    console.log('\n🔧 CONFIGURACIÓN ESPECÍFICA PARA DOCUMENTOS ADMINISTRATIVOS:');
    console.log('-' .repeat(50));

    const adminConfig: ProcessingConfig = {
      mode: ProcessingMode.HIERARCHICAL,
      options: {
        minSectionLength: 200,
        maxSectionLength: 8000,
        hierarchical: {
          levels: ['Artículo', 'ARTÍCULO', 'Disposición'], // Específico para documentos legales/administrativos
          maxDepth: 3
        }
      }
    };

    console.log('📝 Aplicando configuración jerárquica específica...');
    console.log(`   Modo: ${adminConfig.mode}`);
    console.log(`   Niveles jerárquicos: ${adminConfig.options.hierarchical?.levels?.join(', ')}`);
    
    // Guardar configuración
    DocumentSectionService.saveProcessingConfig(document.id, adminConfig);
    
    // Verificar configuración guardada
    const retrievedConfig = DocumentSectionService.getProcessingConfig(document.id);
    console.log(`   ✅ Configuración guardada correctamente: ${retrievedConfig.mode}`);
    
    // 4. EXTRAER SECCIONES CON LA NUEVA CONFIGURACIÓN
    console.log('\n⚙️ EXTRAYENDO SECCIONES:');
    console.log('-' .repeat(50));
    
    try {
      const sections = DocumentSectionService.extractSections(document);
      console.log(`   ✅ Secciones extraídas: ${sections.length}`);
      
      if (sections.length > 0) {
        console.log('\n📋 SECCIONES EXTRAÍDAS:');
        sections.forEach((section, idx) => {
          console.log(`   ${idx + 1}. "${section.title}"`);
          console.log(`      📏 Longitud: ${section.content.length} caracteres`);
          console.log(`      🏷️ Tipo: ${section.type}`);
          console.log(`      📄 Preview: ${section.content.substring(0, 100)}...`);
          console.log('');
        });
      } else {
        console.log('   ❌ No se extrajeron secciones');
      }
    } catch (error) {
      console.log(`   ❌ Error en extracción: ${error}`);
    }

    // 5. PROBAR CONFIGURACIÓN PERSONALIZADA ADICIONAL
    console.log('\n🎛️ PROBANDO CONFIGURACIÓN PERSONALIZADA:');
    console.log('-' .repeat(50));

    const customConfig: ProcessingConfig = {
      mode: ProcessingMode.CUSTOM,
      options: {
        minSectionLength: 300,
        maxSectionLength: 10000,
        custom: {
          patterns: [
            '^Artículo\\s+\\d+\\.',
            '^Disposición\\s+(adicional|transitoria|final|derogatoria)',
            '^\\d+\\.\\s+[A-ZÁÑÜ]',
            '^[a-z]\\)\\s+[A-ZÁÑÜ]'
          ],
          caseSensitive: false
        }
      }
    };

    DocumentSectionService.saveProcessingConfig(document.id, customConfig);
    
    try {
      const customSections = DocumentSectionService.extractSections(document);
      console.log(`   ✅ Secciones con config personalizada: ${customSections.length}`);
      
      if (customSections.length > 0) {
        console.log('\n📋 PRIMERAS 5 SECCIONES (CONFIG PERSONALIZADA):');
        customSections.slice(0, 5).forEach((section, idx) => {
          console.log(`   ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error en config personalizada: ${error}`);
    }

    // 6. RECOMENDACIONES
    console.log('\n💡 RECOMENDACIONES:');
    console.log('-' .repeat(50));
    console.log('   1. ✅ Usar modo HIERARCHICAL con niveles: ["Artículo", "Disposición"]');
    console.log('   2. ✅ Configurar longitud mínima: 200-300 caracteres');
    console.log('   3. ✅ Configurar longitud máxima: 8000-10000 caracteres');
    console.log('   4. ✅ Para documentos similares, usar patrones personalizados');
    console.log('   5. 🔧 Si las secciones son muy largas, ajustar maxSectionLength');

    // 7. GENERAR CONFIGURACIÓN ÓPTIMA PARA EL USUARIO
    const optimalConfig: ProcessingConfig = {
      mode: ProcessingMode.HIERARCHICAL,
      options: {
        minSectionLength: 250,
        maxSectionLength: 8000,
        hierarchical: {
          levels: ['Artículo', 'ARTÍCULO', 'Disposición'],
          maxDepth: 2
        }
      }
    };

    const configPath = path.join(process.cwd(), 'emad-document-config.json');
    fs.writeFileSync(configPath, JSON.stringify(optimalConfig, null, 2), 'utf8');
    console.log(`\n💾 Configuración óptima guardada en: ${configPath}`);

    // 8. GENERAR ANÁLISIS COMPLETO
    const analysisPath = path.join(process.cwd(), 'emad-document-analysis.txt');
    const analysisContent = `
ANÁLISIS DEL DOCUMENTO EMAD - Estado Mayor de la Defensa
=======================================================

INFORMACIÓN BÁSICA:
- Archivo: organización básica del Estado Mayor de la Defensa_Copy.txt
- Longitud: ${content.length} caracteres
- Líneas: ${content.split('\n').length}
- Palabras: ~${content.split(/\s+/).length}

DETECCIÓN AUTOMÁTICA:
- PDC-01: ${isPDC01 ? 'SÍ' : 'NO'}
- Militar: ${isMilitary ? 'SÍ' : 'NO'}

ESTRUCTURA ENCONTRADA:
${Object.entries(patterns).map(([name, pattern]) => {
  const matches = content.match(pattern) || [];
  return `- ${name}: ${matches.length} encontrados`;
}).join('\n')}

CONFIGURACIÓN RECOMENDADA:
${JSON.stringify(optimalConfig, null, 2)}

MUESTRA DEL CONTENIDO:
${content.substring(0, 2000)}...

CONTENIDO COMPLETO:
${content}
    `;
    
    fs.writeFileSync(analysisPath, analysisContent, 'utf8');
    console.log(`💾 Análisis completo guardado en: ${analysisPath}`);

    console.log('\n✅ ANÁLISIS COMPLETADO');
    console.log('\n🎯 PRÓXIMOS PASOS PARA EL USUARIO:');
    console.log('   1. Aplicar la configuración jerárquica recomendada');
    console.log('   2. Especificar niveles: ["Artículo", "Disposición"]');
    console.log('   3. Ajustar longitudes de sección según necesidades');
    console.log('   4. Revisar las secciones extraídas en la interfaz web');

  } catch (error) {
    console.error('❌ ERROR DURANTE EL ANÁLISIS:', error);
    throw error;
  }
}

// Ejecutar análisis
if (require.main === module) {
  analyzeEMADDocument().catch(console.error);
}

export { analyzeEMADDocument }; 