#!/usr/bin/env tsx

/**
 * SCRIPT DE DEBUGGING PARA CONTENIDO PDF PDC-01
 * 
 * Este script extrae y analiza el contenido real del PDF para
 * entender por qué no se encuentran los apartados esperados.
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock de localStorage para Node.js
if (typeof global !== 'undefined') {
  const mockStorage: { [key: string]: string } = {};
  
  (global as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
    length: Object.keys(mockStorage).length,
    key: (index: number) => Object.keys(mockStorage)[index] || null
  };
}

import { DocumentSectionService } from '../src/services/documentSectionService';

// Función para extraer texto real del PDF usando pdf-parse
async function extractRealPDFContent(pdfPath: string): Promise<string> {
  console.log(`📄 Extrayendo contenido real del PDF: ${pdfPath}`);
  
  // Verificar si el archivo existe
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`❌ Archivo PDF no encontrado: ${pdfPath}`);
  }
  
  try {
    // Usar pdf-parse para extraer texto real
    const pdfParse = await import('pdf-parse');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse.default(pdfBuffer);
    
    console.log(`✅ PDF procesado exitosamente:`);
    console.log(`   📊 Páginas: ${pdfData.numpages}`);
    console.log(`   📏 Caracteres: ${pdfData.text.length}`);
    
    return pdfData.text;
  } catch (error) {
    console.error(`❌ Error al procesar PDF:`, error);
    throw error;
  }
}

// Función para buscar apartados específicos en el texto
function searchApartados(content: string): void {
  console.log('\n🔍 BÚSQUEDA DE APARTADOS ESPECÍFICOS');
  console.log('=' .repeat(50));
  
  const apartados = [
    'ENTORNO GLOBAL DE SEGURIDAD',
    'CONTEXTO DE COMPETICIÓN',
    'EL CONFLICTO',
    'INSTRUMENTOS DE PODER',
    'INTERESES NACIONALES',
    'LA SEGURIDAD NACIONAL',
    'LA DEFENSA NACIONAL',
    'CONTRIBUCIONES DE LAS FAS A LA SEGURIDAD',
    'LA CULTURA DE DEFENSA',
    'EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS',
    'PLANEAMIENTO DE LA DEFENSA',
    'CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS',
    'TRANSFORMACIÓN MILITAR',
    'ORGANIZACIÓN DE LAS FAS',
    'FUERZA CONJUNTA'
  ];
  
  for (const apartado of apartados) {
    console.log(`\n📋 Buscando: "${apartado}"`);
    
    // Diferentes patrones de búsqueda
    const patterns = [
      new RegExp(`${apartado}`, 'gi'),
      new RegExp(`\\d+\\s*\\.\\s*${apartado}`, 'gi'),
      new RegExp(`^\\s*${apartado}\\s*$`, 'gmi'),
      new RegExp(apartado.replace(/\s+/g, '\\s+'), 'gi')
    ];
    
    let found = false;
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const matches = content.match(pattern);
      
      if (matches && matches.length > 0) {
        console.log(`   ✅ Patrón ${i + 1}: ${matches.length} coincidencia(s)`);
        matches.forEach((match, idx) => {
          const position = content.indexOf(match);
          const context = content.substring(Math.max(0, position - 50), position + match.length + 50);
          console.log(`      ${idx + 1}. "${match}" en posición ${position}`);
          console.log(`         Contexto: ...${context}...`);
        });
        found = true;
      }
    }
    
    if (!found) {
      console.log(`   ❌ NO encontrado`);
    }
  }
}

// Función para analizar la estructura del texto
function analyzeTextStructure(content: string): void {
  console.log('\n📊 ANÁLISIS DE ESTRUCTURA DEL TEXTO');
  console.log('=' .repeat(50));
  
  // Buscar patrones comunes
  const patterns = {
    'Capítulos': /^\\s*CAPÍTULO\\s+\\d+/gmi,
    'Secciones numeradas': /^\\s*\\d+\\s*\\.\\s+[A-ZÁÑÜ]/gmi,
    'Subsecciones': /^\\s*\\d+\\.\\d+\\s+/gmi,
    'Párrafos numerados': /^\\s*\\d+\\s+/gmi,
    'Líneas en mayúsculas': /^[A-ZÁÑÜ\\s]+$/gmi,
    'Líneas con números': /^\\d+/gmi
  };
  
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`📌 ${name}: ${matches.length} encontrados`);
      if (matches.length <= 10) {
        matches.forEach((match, idx) => {
          console.log(`   ${idx + 1}. "${match.trim()}"`);
        });
      } else {
        console.log(`   Primeros 5:`);
        matches.slice(0, 5).forEach((match, idx) => {
          console.log(`   ${idx + 1}. "${match.trim()}"`);
        });
        console.log(`   ... y ${matches.length - 5} más`);
      }
    } else {
      console.log(`❌ ${name}: No encontrados`);
    }
    console.log('');
  }
}

// Función para mostrar muestra del contenido
function showContentSample(content: string): void {
  console.log('\n📝 MUESTRA DEL CONTENIDO EXTRAÍDO');
  console.log('=' .repeat(50));
  
  console.log('🔸 Primeros 1000 caracteres:');
  console.log('-'.repeat(40));
  console.log(content.substring(0, 1000));
  console.log('-'.repeat(40));
  
  console.log('\n🔸 Caracteres del medio:');
  console.log('-'.repeat(40));
  const middleStart = Math.floor(content.length / 2) - 500;
  console.log(content.substring(middleStart, middleStart + 1000));
  console.log('-'.repeat(40));
  
  console.log('\n🔸 Últimos 1000 caracteres:');
  console.log('-'.repeat(40));
  console.log(content.substring(content.length - 1000));
  console.log('-'.repeat(40));
}

async function debugPDFContent() {
  console.log('🔍 DEBUGGING DEL CONTENIDO PDF PDC-01\n');

  try {
    // Ruta al PDF
    const pdfPath = path.join(process.cwd(), 'docs', 'PDC-01 B Doctrina para el empleo de las FAS.pdf');
    
    console.log(`📂 Buscando PDF en: ${pdfPath}`);
    
    // Extraer contenido real del PDF
    const content = await extractRealPDFContent(pdfPath);
    
    // Mostrar información básica
    console.log(`\n📊 INFORMACIÓN BÁSICA:`);
    console.log(`   📏 Longitud total: ${content.length} caracteres`);
    console.log(`   📄 Líneas: ${content.split('\n').length}`);
    console.log(`   📝 Palabras: ~${content.split(/\s+/).length}`);
    
    // Probar detección automática
    console.log(`\n🤖 DETECCIÓN AUTOMÁTICA:`);
    const isPDC01 = DocumentSectionService.detectPDC01Document(content);
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    console.log(`   PDC-01 detectado: ${isPDC01 ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Militar detectado: ${isMilitary ? '✅ SÍ' : '❌ NO'}`);
    
    // Mostrar muestra del contenido
    showContentSample(content);
    
    // Analizar estructura
    analyzeTextStructure(content);
    
    // Buscar apartados específicos
    searchApartados(content);
    
    // Guardar contenido completo en archivo para análisis manual
    const outputPath = path.join(process.cwd(), 'debug-pdf-content.txt');
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`\n💾 Contenido completo guardado en: ${outputPath}`);
    
    console.log('\n🎯 DEBUGGING COMPLETADO');
    console.log('Revisa el archivo debug-pdf-content.txt para análisis manual del contenido.');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL DEBUGGING:', error);
    throw error;
  }
}

// Ejecutar el debugging
if (require.main === module) {
  debugPDFContent()
    .then(() => {
      console.log('\n✅ Debugging del PDF completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Debugging del PDF falló:', error);
      process.exit(1);
    });
}

export { debugPDFContent }; 