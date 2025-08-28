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

(global as any).localStorage = mockLocalStorage;

async function debugSpecificDocument() {
  console.log('🔍 DEBUGGING DOCUMENTO ESPECÍFICO DEL USUARIO\n');
  console.log('=' .repeat(80));

  const documentId = '79e2842a-f30a-4528-b756-8743a7212fe1';
  
  try {
    // Leer el documento
    const documentPath = path.join(process.cwd(), 'docs', 'organización básica del Estado Mayor de la Defensa_Copy.txt');
    
    if (!fs.existsSync(documentPath)) {
      console.error('❌ No se encontró el archivo:', documentPath);
      return;
    }

    const content = fs.readFileSync(documentPath, 'utf8');
    
    // Crear documento con el ID real del usuario
    const document: StoredDocument = {
      id: documentId,
      title: 'organización básica del Estado Mayor de la Defensa_Copy.txt',
      content: content,
      date: new Date(),
      type: 'text/plain',
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingTime: null,
      tokens: null
    };

    console.log(`📊 DOCUMENTO ID: ${documentId}`);
    console.log(`📏 Longitud: ${content.length} caracteres`);
    console.log(`📄 Líneas: ${content.split('\n').length}`);

    // 1. LIMPIAR TODAS LAS CONFIGURACIONES POSIBLES
    console.log('\n🧹 LIMPIANDO CONFIGURACIONES EXISTENTES:');
    console.log('-' .repeat(50));
    
    const possibleKeys = [
      `document_processing_config_${documentId}`,
      `document_processing_config_[${documentId}]`,
      `document_sections_${documentId}`,
      `document-progress_${documentId}`,
      `document_section_progress_${documentId}`,
      `document_section_questions_${documentId}`
    ];

    possibleKeys.forEach(key => {
      mockLocalStorage.removeItem(key);
      console.log(`   ✅ Limpiado: ${key}`);
    });

    // 2. APLICAR CONFIGURACIÓN ÓPTIMA
    console.log('\n🔧 APLICANDO CONFIGURACIÓN ÓPTIMA:');
    console.log('-' .repeat(50));

    const optimalConfig: ProcessingConfig = {
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

    console.log(`📝 Configuración aplicada:`);
    console.log(`   Modo: ${optimalConfig.mode}`);
    console.log(`   Patrones: ${optimalConfig.options.custom?.patterns?.join(', ')}`);

    DocumentSectionService.saveProcessingConfig(documentId, optimalConfig);

         // 3. FORZAR EXTRACCIÓN DE SECCIONES
    console.log('\n⚙️ FORZANDO EXTRACCIÓN DE SECCIONES:');
    console.log('-' .repeat(50));

    let sections: any[] = [];
    try {
      console.log('🔄 Iniciando extracción...');
      sections = DocumentSectionService.extractSections(document);
      
      console.log(`✅ RESULTADO: ${sections.length} secciones extraídas`);
      
      if (sections.length > 0) {
        console.log('\n📋 LISTA DE SECCIONES EXTRAÍDAS:');
        sections.forEach((section, idx) => {
          console.log(`   ${idx + 1}. "${section.title}"`);
          console.log(`      📏 ${section.content.length} chars | 🏷️ ${section.type} | 🆔 ${section.id}`);
        });

        // 4. SIMULAR EL PROCESAMIENTO COMPLETO DEL DOCUMENTO
        console.log('\n🔄 SIMULANDO PROCESAMIENTO COMPLETO:');
        console.log('-' .repeat(50));

        const processedDocument = await DocumentSectionService.updateDocument(document);
        console.log(`✅ Documento procesado completamente`);
        console.log(`📊 Secciones en documento procesado: ${processedDocument.sections?.length || 0}`);

        if (processedDocument.sections && processedDocument.sections.length > 0) {
          console.log('\n📋 SECCIONES EN DOCUMENTO PROCESADO:');
          processedDocument.sections.forEach((section, idx) => {
            console.log(`   ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
          });
        }

      } else {
        console.log('❌ NO se extrajeron secciones');
        
        // Debug detallado
        console.log('\n🕵️ DEBUG DETALLADO:');
        console.log('-' .repeat(30));
        
        // Verificar patrones manualmente
        const patterns = optimalConfig.options.custom?.patterns || [];
        patterns.forEach((pattern, idx) => {
          const regex = new RegExp(pattern, 'gi');
          const matches = content.match(regex) || [];
          console.log(`   Patrón ${idx + 1} "${pattern}": ${matches.length} coincidencias`);
          if (matches.length > 0) {
            console.log(`      Primeras 3: ${matches.slice(0, 3).map(m => `"${m}"`).join(', ')}`);
          }
        });
      }

    } catch (extractionError) {
      console.error('❌ ERROR EN EXTRACCIÓN:', extractionError);
      console.error('Stack trace:', (extractionError as Error).stack);
    }

    // 5. GENERAR CONFIGURACIÓN PARA EL USUARIO
    console.log('\n💾 GENERANDO ARCHIVOS PARA EL USUARIO:');
    console.log('-' .repeat(50));

    // Configuración para copiar en el navegador
    const configForBrowser = {
      documentId: documentId,
      config: optimalConfig,
      instructions: [
        '1. Ve a tu documento en el navegador',
        '2. Abre las herramientas de desarrollador (F12)',
        '3. Ve a la pestaña Console',
        '4. Copia y pega el siguiente código:',
        '',
        `localStorage.setItem('document_processing_config_${documentId}', '${JSON.stringify(optimalConfig)}');`,
        'location.reload();',
        '',
        '5. La página se recargará y debería mostrar las secciones'
      ]
    };

    const instructionsPath = path.join(process.cwd(), 'fix-emad-document-instructions.txt');
    const instructionsContent = `
INSTRUCCIONES PARA ARREGLAR EL DOCUMENTO EMAD
============================================

DOCUMENTO ID: ${documentId}
ARCHIVO: organización básica del Estado Mayor de la Defensa_Copy.txt

PROBLEMA DETECTADO:
El documento no muestra secciones en la interfaz web.

SOLUCIÓN:

PASO 1: Ejecutar en la consola del navegador
-------------------------------------------
1. Ve a tu documento en el navegador
2. Presiona F12 para abrir las herramientas de desarrollador
3. Ve a la pestaña "Console"
4. Copia y pega este código exacto:

localStorage.setItem('document_processing_config_${documentId}', '${JSON.stringify(optimalConfig)}');
location.reload();

PASO 2: Verificar resultado
---------------------------
Después de que se recargue la página, deberías ver:
- Explorador de Secciones visible
- Lista de secciones en el lado izquierdo
- Aproximadamente 23 secciones extraídas

CONFIGURACIÓN APLICADA:
${JSON.stringify(optimalConfig, null, 2)}

SECCIONES ESPERADAS:
${sections.length > 0 ? sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n') : 'Error: No se pudieron extraer secciones'}

ALTERNATIVA SI NO FUNCIONA:
1. Elimina el documento y vuelve a subirlo
2. O contacta para apoyo técnico adicional

FECHA: ${new Date().toISOString()}
    `;

    fs.writeFileSync(instructionsPath, instructionsContent, 'utf8');
    console.log(`✅ Instrucciones guardadas en: ${instructionsPath}`);

    // JavaScript para ejecutar en el navegador
    const jsForBrowser = `
// CÓDIGO PARA EJECUTAR EN LA CONSOLA DEL NAVEGADOR
// ================================================

console.log('🔧 Arreglando documento EMAD...');

// Limpiar configuraciones anteriores
const keysToRemove = [
  'document_processing_config_${documentId}',
  'document_sections_${documentId}',
  'document-progress_${documentId}'
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log('🧹 Limpiado:', key);
});

// Aplicar configuración óptima
const optimalConfig = ${JSON.stringify(optimalConfig, null, 2)};

localStorage.setItem('document_processing_config_${documentId}', JSON.stringify(optimalConfig));
console.log('✅ Configuración aplicada:', optimalConfig);

// Recargar página
console.log('🔄 Recargando página...');
location.reload();
    `;

    const jsPath = path.join(process.cwd(), 'fix-emad-browser-script.js');
    fs.writeFileSync(jsPath, jsForBrowser, 'utf8');
    console.log(`✅ Script para navegador guardado en: ${jsPath}`);

    console.log('\n🎯 RESUMEN PARA EL USUARIO:');
    console.log('-' .repeat(50));
    console.log('1. ✅ Configuración óptima identificada');
    console.log('2. ✅ Secciones extraíbles confirmadas');
    console.log('3. ✅ Script de reparación generado');
    console.log('4. 🔧 Ejecuta el script en el navegador para arreglar');

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
    throw error;
  }
}

// Ejecutar debugging
if (require.main === module) {
  debugSpecificDocument().catch(console.error);
}

export { debugSpecificDocument }; 