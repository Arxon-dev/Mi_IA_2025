import { DocumentSectionService, ProcessingMode, StoredDocument } from '../src/services/documentSectionService';
import * as fs from 'fs';
import * as path from 'path';

// Función para analizar el documento específico
async function analyzeInstruccionDocument() {
  console.log('🔍 ANÁLISIS DEL DOCUMENTO INSTRUCCIÓN 6-2025\n');
  console.log('=' .repeat(80));

  try {
    // Leer el documento
    const documentPath = 'f:\\Permanencia\\Perma2024\\OPOMELILLA\\TEMARIO TXT\\B1\\Instrucción 6-2025, de 11 de marzo, del Jefe de Estado Mayor del Ejército del Aire y del.txt';
    
    if (!fs.existsSync(documentPath)) {
      console.error('❌ No se encontró el archivo:', documentPath);
      return;
    }

    const content = fs.readFileSync(documentPath, 'utf8');
    
    console.log('📊 INFORMACIÓN BÁSICA:');
    console.log(`   📏 Longitud total: ${content.length} caracteres`);
    console.log(`   📄 Líneas: ${content.split('\n').length}`);
    console.log(`   📝 Palabras: ~${content.split(/\s+/).length}`);
    
    // Crear documento de prueba
    const document: StoredDocument = {
      id: 'instruccion-6-2025-test',
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

    // 1. PROBAR DETECCIÓN AUTOMÁTICA
    console.log('\n🤖 DETECCIÓN AUTOMÁTICA:');
    console.log('-' .repeat(50));
    
    const isPDC01 = DocumentSectionService.detectPDC01Document(content);
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    
    console.log(`   PDC-01 detectado: ${isPDC01 ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Militar detectado: ${isMilitary ? '✅ SÍ' : '❌ NO'}`);

    // 2. ANALIZAR ESTRUCTURA DEL DOCUMENTO
    console.log('\n📋 ANÁLISIS DE ESTRUCTURA:');
    console.log('-' .repeat(50));
    
    // Buscar patrones específicos
    const patterns = {
      'CAPÍTULO': /^CAPÍTULO\s+[IVX]+/gm,
      'Artículos numerados': /^(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|Séptimo|Octavo|Noveno|Décimo|Undécimo|Decimosegundo|Decimotercero|Decimocuarto|Decimoquinto|Decimosexto|Decimoséptimo|Decimoctavo|Decimonoveno|Vigésimo)\./gm,
      'Secciones numeradas': /^\d+\.\s+[A-ZÁÑÜ]/gm,
      'Subsecciones': /^\d+\.\d+\.\s+[A-Za-záñüÁÑÜ]/gm,
      'Apartados con letras': /^[a-z]\)\s+[A-ZÁÑÜ]/gm,
      'DISPONGO': /^DISPONGO:/gm
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern) || [];
      console.log(`   ${name}: ${matches.length} encontrados`);
      if (matches.length > 0 && matches.length <= 10) {
        matches.forEach((match, idx) => {
          console.log(`      ${idx + 1}. "${match.trim()}"`);
        });
      } else if (matches.length > 10) {
        console.log(`      Primeros 5: ${matches.slice(0, 5).map(m => `"${m.trim()}"`).join(', ')}`);
        console.log(`      ... y ${matches.length - 5} más`);
      }
    }

    // 3. PROBAR EXTRACCIÓN CON DIFERENTES MODOS
    console.log('\n🔧 PRUEBAS DE EXTRACCIÓN:');
    console.log('-' .repeat(50));

    const modes = [
      ProcessingMode.HIERARCHICAL,
      ProcessingMode.MILITARY_DOCTRINE,
      ProcessingMode.NUMBERED,
      ProcessingMode.CUSTOM
    ];

    for (const mode of modes) {
      console.log(`\n   📝 Probando modo: ${mode}`);
      
      // Configurar el modo
      const config = {
        mode: mode,
        options: {
          minSectionLength: 100,
          maxSectionLength: 10000,
          hierarchical: {
            levels: ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Undécimo', 'Decimosegundo', 'Decimotercero', 'Decimocuarto', 'Decimoquinto', 'Decimosexto'],
            maxDepth: 2
          },
          militaryDoctrine: {
            detectChapters: true,
            detectMainSections: true,
            detectSubSections: true,
            groupParagraphs: true,
            paragraphsPerGroup: 8
          },
          numbered: {
            pattern: '^(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|Séptimo|Octavo|Noveno|Décimo|Undécimo|Decimosegundo|Decimotercero|Decimocuarto|Decimoquinto|Decimosexto)\\.',
            includeSubsections: true
          },
          custom: {
            patterns: [
              '^(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|Séptimo|Octavo|Noveno|Décimo|Undécimo|Decimosegundo|Decimotercero|Decimocuarto|Decimoquinto|Decimosexto)\\.',
              '^CAPÍTULO\\s+[IVX]+',
              '^\\d+\\.\\s+[A-ZÁÑÜ]'
            ],
            caseSensitive: false
          }
        }
      };

      // Guardar configuración temporalmente
      DocumentSectionService.saveProcessingConfig(document.id, config);
      
      try {
        const sections = DocumentSectionService.extractSections(document);
        console.log(`      ✅ Secciones extraídas: ${sections.length}`);
        
        if (sections.length > 0) {
          console.log('      📋 Primeras 5 secciones:');
          sections.slice(0, 5).forEach((section, idx) => {
            console.log(`         ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
          });
        }
      } catch (error) {
        console.log(`      ❌ Error: ${error}`);
      }
    }

    // 4. ANÁLISIS ESPECÍFICO DE CONTENIDO
    console.log('\n🔍 ANÁLISIS ESPECÍFICO DE CONTENIDO:');
    console.log('-' .repeat(50));
    
    // Buscar indicadores militares específicos
    const militaryIndicators = [
      'Ejército del Aire y del Espacio',
      'JEMA',
      'Estado Mayor',
      'Fuerzas Armadas',
      'Mando',
      'Cuartel General',
      'Organización',
      'Ministerio de Defensa'
    ];

    console.log('   🪖 Indicadores militares encontrados:');
    militaryIndicators.forEach(indicator => {
      const regex = new RegExp(indicator, 'gi');
      const matches = content.match(regex) || [];
      console.log(`      "${indicator}": ${matches.length} veces`);
    });

    // Mostrar muestra del contenido inicial
    console.log('\n📄 MUESTRA DEL CONTENIDO INICIAL:');
    console.log('-' .repeat(50));
    console.log(content.substring(0, 1000) + '...\n');

    // Guardar análisis completo
    const analysisPath = path.join(process.cwd(), 'debug-instruccion-analysis.txt');
    const analysisContent = `
ANÁLISIS DEL DOCUMENTO INSTRUCCIÓN 6-2025
==========================================

Información básica:
- Longitud: ${content.length} caracteres
- Líneas: ${content.split('\n').length}
- Palabras: ~${content.split(/\s+/).length}

Detección automática:
- PDC-01: ${isPDC01 ? 'SÍ' : 'NO'}
- Militar: ${isMilitary ? 'SÍ' : 'NO'}

Patrones encontrados:
${Object.entries(patterns).map(([name, pattern]) => {
  const matches = content.match(pattern) || [];
  return `- ${name}: ${matches.length} encontrados`;
}).join('\n')}

Contenido completo:
${content}
    `;
    
    fs.writeFileSync(analysisPath, analysisContent, 'utf8');
    console.log(`💾 Análisis completo guardado en: ${analysisPath}`);

  } catch (error) {
    console.error('❌ ERROR DURANTE EL ANÁLISIS:', error);
    throw error;
  }
}

// Ejecutar el análisis
if (require.main === module) {
  analyzeInstruccionDocument()
    .then(() => {
      console.log('\n✅ ANÁLISIS COMPLETADO');
    })
    .catch((error) => {
      console.error('\n❌ ERROR:', error);
      process.exit(1);
    });
}

export { analyzeInstruccionDocument }; 