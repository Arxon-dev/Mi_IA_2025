import { DocumentSectionService, ProcessingMode, ProcessingConfig } from '../src/services/documentSectionService';
import { StoredDocument } from '../src/services/storageService';
import * as fs from 'fs';
import * as path from 'path';

// Mock localStorage para Node.js
const mockLocalStorage = {
  storage: new Map<string, string>(),
  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  },
  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  },
  removeItem(key: string): void {
    this.storage.delete(key);
  },
  clear(): void {
    this.storage.clear();
  },
  get length(): number {
    return this.storage.size;
  },
  key(index: number): string | null {
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  }
};

// Asignar mock a global
(global as any).localStorage = mockLocalStorage;

// Función de prueba directa
async function testEMADExtractionDirect() {
  console.log('🧪 PRUEBA DIRECTA DE EXTRACCIÓN EMAD\n');
  console.log('=' .repeat(80));

  try {
    // Leer el documento
    const documentPath = path.join(process.cwd(), 'docs', 'organización básica del Estado Mayor de la Defensa_Copy.txt');
    
    if (!fs.existsSync(documentPath)) {
      console.error('❌ No se encontró el archivo:', documentPath);
      return;
    }

    const content = fs.readFileSync(documentPath, 'utf8');
    
    // Crear documento de prueba
    const document: StoredDocument = {
      id: 'emad-test-direct',
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

    console.log('📊 INFORMACIÓN DEL DOCUMENTO:');
    console.log(`   📏 Longitud: ${content.length} caracteres`);
    console.log(`   📄 Líneas: ${content.split('\n').length}`);

    // 1. PROBAR DETECCIÓN
    console.log('\n🤖 DETECCIÓN AUTOMÁTICA:');
    console.log('-' .repeat(50));
    
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    console.log(`   Militar detectado: ${isMilitary ? '✅ SÍ' : '❌ NO'}`);

    // 2. ANALIZAR PATRONES ESPECÍFICOS
    console.log('\n🔍 ANÁLISIS DE PATRONES:');
    console.log('-' .repeat(50));
    
    const patterns = {
      'Artículos exactos': /^Artículo\s+\d+\./gm,
      'Artículos flexibles': /Artículo\s+\d+\./gi,
      'Disposiciones': /^Disposición\s+(adicional|transitoria|final|derogatoria)/gm
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern) || [];
      console.log(`   ${name}: ${matches.length} encontrados`);
      if (matches.length > 0) {
        console.log(`   Primeros 5: ${matches.slice(0, 5).map(m => `"${m.trim()}"`).join(', ')}`);
      }
    }

    // 3. CONFIGURACIÓN JERÁRQUICA ESPECÍFICA
    console.log('\n🔧 CONFIGURACIÓN JERÁRQUICA:');
    console.log('-' .repeat(50));

    const hierarchicalConfig: ProcessingConfig = {
      mode: ProcessingMode.HIERARCHICAL,
      options: {
        minSectionLength: 200,
        maxSectionLength: 8000,
        hierarchical: {
          levels: ['Artículo', 'ARTÍCULO', 'Disposición'],
          maxDepth: 3
        }
      }
    };

    console.log('📝 Aplicando configuración jerárquica...');
    console.log(`   Modo: ${hierarchicalConfig.mode}`);
    console.log(`   Niveles: ${hierarchicalConfig.options.hierarchical?.levels?.join(', ')}`);

    // Guardar configuración usando el mock
    DocumentSectionService.saveProcessingConfig(document.id, hierarchicalConfig);
    console.log('   ✅ Configuración guardada en mock localStorage');

    // 4. EXTRAER SECCIONES
    console.log('\n⚙️ EXTRAYENDO SECCIONES CON MODO JERÁRQUICO:');
    console.log('-' .repeat(50));
    
    try {
      const sections = DocumentSectionService.extractSections(document);
      console.log(`   ✅ Secciones extraídas: ${sections.length}`);
      
      if (sections.length > 0) {
        console.log('\n📋 TODAS LAS SECCIONES EXTRAÍDAS:');
        sections.forEach((section, idx) => {
          console.log(`   ${idx + 1}. "${section.title}"`);
          console.log(`      📏 Longitud: ${section.content.length} chars`);
          console.log(`      🏷️ Tipo: ${section.type}`);
          console.log(`      📄 Preview: ${section.content.substring(0, 80).replace(/\n/g, ' ')}...`);
          console.log('');
        });
      } else {
        console.log('   ❌ NO se extrajeron secciones');
        console.log('   🔍 Investigando causa...');
        
        // Debug adicional
        console.log('\n🕵️ DEBUG ADICIONAL:');
        console.log('-' .repeat(30));
        
        // Verificar si la función detecta artículos
        const articlePattern = /(?:Artículo|ART[IÍ]CULO)\s*\d+[.:]?/gmi;
        const articleMatches = content.match(articlePattern) || [];
        console.log(`   Artículos con patrón flexible: ${articleMatches.length}`);
        
        if (articleMatches.length > 0) {
          console.log(`   Primeros artículos encontrados:`);
          articleMatches.slice(0, 5).forEach((match, i) => {
            console.log(`      ${i + 1}. "${match}"`);
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Error en extracción: ${error}`);
      console.log(`   Stack trace: ${(error as Error).stack}`);
    }

    // 5. PROBAR CON CONFIGURACIÓN PERSONALIZADA
    console.log('\n🎛️ PRUEBA CON CONFIGURACIÓN PERSONALIZADA:');
    console.log('-' .repeat(50));

    const customConfig: ProcessingConfig = {
      mode: ProcessingMode.CUSTOM,
      options: {
        minSectionLength: 200,
        maxSectionLength: 10000,
        custom: {
          patterns: [
            'Artículo\\s+\\d+\\.',
            'Disposición\\s+(adicional|transitoria|final|derogatoria)'
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
        console.log('\n📋 SECCIONES CON CONFIG PERSONALIZADA:');
        customSections.forEach((section, idx) => {
          console.log(`   ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error en config personalizada: ${error}`);
    }

    // 6. PROBAR MODO NUMERADO
    console.log('\n🔢 PRUEBA CON MODO NUMERADO:');
    console.log('-' .repeat(50));

    const numberedConfig: ProcessingConfig = {
      mode: ProcessingMode.NUMBERED,
      options: {
        minSectionLength: 200,
        maxSectionLength: 10000,
        numbered: {
          pattern: '^(Artículo\\s+\\d+\\.|Disposición\\s+(adicional|transitoria|final|derogatoria))',
          includeSubsections: true
        }
      }
    };

    DocumentSectionService.saveProcessingConfig(document.id, numberedConfig);
    
    try {
      const numberedSections = DocumentSectionService.extractSections(document);
      console.log(`   ✅ Secciones con modo numerado: ${numberedSections.length}`);
      
      if (numberedSections.length > 0) {
        console.log('\n📋 SECCIONES CON MODO NUMERADO:');
        numberedSections.slice(0, 10).forEach((section, idx) => {
          console.log(`   ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error en modo numerado: ${error}`);
    }

    // 7. ANÁLISIS DE CONTENIDO ESPECÍFICO
    console.log('\n🔍 ANÁLISIS DETALLADO DEL CONTENIDO:');
    console.log('-' .repeat(50));
    
    // Buscar las primeras líneas de artículos
    const lines = content.split('\n');
    console.log('   🔍 Primeras 50 líneas que contienen "Artículo":');
    
    let articleCount = 0;
    for (let i = 0; i < lines.length && articleCount < 10; i++) {
      if (lines[i].includes('Artículo')) {
        console.log(`      Línea ${i + 1}: "${lines[i].trim()}"`);
        articleCount++;
      }
    }

    // 8. GENERAR REPORTE COMPLETO
    const reportPath = path.join(process.cwd(), 'emad-extraction-report.txt');
    const reportContent = `
REPORTE DE EXTRACCIÓN EMAD
=========================

DOCUMENTO: organización básica del Estado Mayor de la Defensa_Copy.txt
FECHA: ${new Date().toISOString()}

DETECCIÓN:
- Militar: ${isMilitary ? 'SÍ' : 'NO'}

PATRONES ENCONTRADOS:
${Object.entries(patterns).map(([name, pattern]) => {
  const matches = content.match(pattern) || [];
  return `- ${name}: ${matches.length}`;
}).join('\n')}

CONTENIDO COMPLETO:
${content}
    `;
    
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(`\n💾 Reporte completo guardado en: ${reportPath}`);

    console.log('\n✅ PRUEBA COMPLETADA');

  } catch (error) {
    console.error('❌ ERROR EN PRUEBA DIRECTA:', error);
    throw error;
  }
}

// Ejecutar prueba
if (require.main === module) {
  testEMADExtractionDirect().catch(console.error);
}

export { testEMADExtractionDirect }; 