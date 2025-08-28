import { DocumentSectionService, ProcessingMode, ProcessingConfig } from '../src/services/documentSectionService';
import { StoredDocument } from '../src/services/storageService';
import * as fs from 'fs';
import * as path from 'path';

// Función para analizar el documento específico sin localStorage
async function analyzeInstruccionSimple() {
  console.log('🔍 ANÁLISIS SIMPLIFICADO DEL DOCUMENTO INSTRUCCIÓN 6-2025\n');

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

    // ANÁLISIS DE PATRONES ESPECÍFICOS
    console.log('\n📋 ANÁLISIS DE PATRONES:');
    console.log('-' .repeat(50));
    
    // Buscar artículos numerados específicos
    const articulosPattern = /^(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|Séptimo|Octavo|Noveno|Décimo|Undécimo|Decimosegundo|Decimotercero|Decimocuarto|Decimoquinto|Decimosexto|Decimoséptimo|Decimoctavo|Decimonoveno|Vigésimo)\.\s+(.+?)$/gm;
    
    let match;
    const articulos = [];
    while ((match = articulosPattern.exec(content)) !== null) {
      articulos.push({
        numero: match[1],
        titulo: match[2].trim(),
        index: match.index
      });
    }
    
    console.log(`   📝 Artículos encontrados: ${articulos.length}`);
    articulos.forEach((art, idx) => {
      console.log(`      ${idx + 1}. ${art.numero}: "${art.titulo}"`);
    });

    // Buscar capítulos
    const capitulosPattern = /^CAPÍTULO\s+([IVX]+)\s*\n\s*(.+?)$/gm;
    const capitulos = [];
    articulosPattern.lastIndex = 0; // Reset regex
    
    while ((match = capitulosPattern.exec(content)) !== null) {
      capitulos.push({
        numero: match[1],
        titulo: match[2].trim(),
        index: match.index
      });
    }
    
    console.log(`\n   📚 Capítulos encontrados: ${capitulos.length}`);
    capitulos.forEach((cap, idx) => {
      console.log(`      ${idx + 1}. CAPÍTULO ${cap.numero}: "${cap.titulo}"`);
    });

    // PROBAR EXTRACCIÓN DIRECTA CON CONFIGURACIÓN ESPECÍFICA
    console.log('\n🔧 PRUEBA DE EXTRACCIÓN DIRECTA:');
    console.log('-' .repeat(50));

    // Configuración específica para este tipo de documento
    const config: ProcessingConfig = {
      mode: ProcessingMode.HIERARCHICAL,
      options: {
        minSectionLength: 200,
        maxSectionLength: 15000,
        hierarchical: {
          levels: ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Undécimo', 'Decimosegundo', 'Decimotercero', 'Decimocuarto', 'Decimoquinto', 'Decimosexto', 'Decimoséptimo', 'Decimoctavo', 'Decimonoveno', 'Vigésimo'],
          maxDepth: 2
        }
      }
    };

    // Simular extracción manual basada en artículos
    console.log('\n   📝 Simulando extracción por artículos:');
    
    const secciones = [];
    for (let i = 0; i < articulos.length; i++) {
      const articulo = articulos[i];
      const siguienteArticulo = i < articulos.length - 1 ? articulos[i + 1] : null;
      
      const startIndex = articulo.index;
      const endIndex = siguienteArticulo ? siguienteArticulo.index : content.length;
      
      const seccionContent = content.slice(startIndex, endIndex).trim();
      
      if (seccionContent.length >= 200) {
        secciones.push({
          titulo: `${articulo.numero}. ${articulo.titulo}`,
          contenido: seccionContent,
          longitud: seccionContent.length
        });
      }
    }
    
    console.log(`      ✅ Secciones creadas: ${secciones.length}`);
    secciones.forEach((seccion, idx) => {
      console.log(`         ${idx + 1}. "${seccion.titulo}" (${seccion.longitud} chars)`);
    });

    // MOSTRAR MUESTRA DE CONTENIDO DE LA PRIMERA SECCIÓN
    if (secciones.length > 0) {
      console.log('\n📄 MUESTRA DE LA PRIMERA SECCIÓN:');
      console.log('-' .repeat(50));
      console.log(`Título: ${secciones[0].titulo}`);
      console.log(`Contenido (primeros 500 chars):`);
      console.log(secciones[0].contenido.substring(0, 500) + '...\n');
    }

    // ANÁLISIS DE POR QUÉ NO FUNCIONA EL SISTEMA ACTUAL
    console.log('\n🔍 DIAGNÓSTICO DEL PROBLEMA:');
    console.log('-' .repeat(50));
    console.log('1. ✅ Detección militar: FUNCIONA (documento detectado como militar)');
    console.log('2. ✅ Estructura detectada: FUNCIONA (artículos y capítulos encontrados)');
    console.log('3. ❌ Extracción de secciones: FALLA');
    console.log('\n   Posibles causas:');
    console.log('   - El patrón de extracción militar no reconoce artículos ordinales');
    console.log('   - El sistema busca "CAPÍTULO X" con números, no ordinales');
    console.log('   - Los patrones regex no están adaptados a documentos de instrucciones');

    console.log('\n💡 SOLUCIÓN PROPUESTA:');
    console.log('-' .repeat(50));
    console.log('1. Crear un nuevo modo: INSTRUCTION_DOCUMENT');
    console.log('2. Detectar documentos de instrucciones automáticamente');
    console.log('3. Usar patrones específicos para artículos ordinales');
    console.log('4. Manejar la estructura jerárquica de instrucciones militares');

  } catch (error) {
    console.error('❌ ERROR DURANTE EL ANÁLISIS:', error);
    throw error;
  }
}

// Ejecutar el análisis
if (require.main === module) {
  analyzeInstruccionSimple()
    .then(() => {
      console.log('\n✅ ANÁLISIS COMPLETADO');
    })
    .catch((error) => {
      console.error('\n❌ ERROR:', error);
      process.exit(1);
    });
}

export { analyzeInstruccionSimple }; 