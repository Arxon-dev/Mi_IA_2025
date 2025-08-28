#!/usr/bin/env tsx

/**
 * SCRIPT DE DEBUGGING PARA CONTENIDO TEXTO PDC-01
 * 
 * Este script usa el contenido de texto ya extraído para
 * entender por qué no se encuentran los apartados esperados.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

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
import type { StoredDocument } from '../src/services/storageService';

// Interfaz para readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para hacer preguntas al usuario
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Función para mostrar contenido expandible
async function showExpandableContent(
  title: string, 
  content: string, 
  previewLength: number = 100
): Promise<void> {
  const isLong = content.length > previewLength;
  const preview = isLong ? content.substring(0, previewLength) + '...' : content;
  
  console.log(`   📄 "${preview}"`);
  
  if (isLong) {
    console.log(`   🔽 [ENTER para ver completo, 's' para saltear]`);
    const answer = await askQuestion('');
    
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'skip') {
      console.log(`\n   📖 CONTENIDO COMPLETO (${title}):`);
      console.log('   ' + '='.repeat(50));
      const lines = content.split('\n');
      lines.forEach(line => {
        console.log(`   ${line}`);
      });
      console.log('   ' + '='.repeat(50));
      
      console.log(`\n   🔼 [ENTER para continuar]`);
      await askQuestion('');
    }
  }
}

// Función para obtener el contenido del archivo de texto que compartiste
function getTextContent(): string {
  const textFile = path.join(process.cwd(), 'PDC-01 B Doctrina para el empleo de las FAS_Copy.txt');
  
  if (fs.existsSync(textFile)) {
    console.log(`📂 Usando archivo de texto: ${textFile}`);
    return fs.readFileSync(textFile, 'utf8');
  }
  
  // Si no existe el archivo, usar el texto de ejemplo del script anterior
  console.log(`📝 Usando contenido de ejemplo simulado`);
  return `
PDC-01 B DOCTRINA PARA EL EMPLEO DE LAS FUERZAS ARMADAS

ENTORNO GLOBAL DE SEGURIDAD

1 En las últimas décadas asistimos a un cambio exponencial y generalizado de paradigma, que se manifiesta en transformaciones, unas veces coyunturales, otras estructurales, en los más variados ámbitos, desde el político, al económico, social, cultural, tecnológico o medioambiental. Esta circunstancia influye a su vez en la situación de seguridad global, configurando un entorno incierto, pues desbanca certezas pasadas, y peligroso, pues potencia riesgos tradicionales, al tiempo que genera otros nuevos.

2 Ese entorno global de seguridad es complejo y está caracterizado también por el cambio acelerado de las condiciones, la permeabilidad de las barreras, la ambigüedad de actores, actuaciones e interconexiones, así como por la extensión del enfrentamiento a los nuevos espacios de las operaciones.

3 En efecto, la multipolaridad y la fragmentación parecen ser tendencia en una escena internacional en la que la disputa va más allá del marco de la seguridad y la defensa, convirtiendo la competición en permanente. El orden internacional basado en reglas del derecho internacional es puesto en tela de juicio por potencias revisionistas; nuevos actores, también no estatales, demandan protagonismo; y las dinámicas de disuasión-distensión se ven superadas muchas veces por la recurrencia a la intervención violenta.

4 Todo ello nos sumerge en un continuo estado de competición en planos tan diversos como el económico, el comercial, el energético, el social, el tecnológico o el informativo, el cual coexiste con el resurgir periódico de la guerra.

CONTEXTO DE COMPETICIÓN

5 Las relaciones internacionales, siempre complejas y dinámicas, son modeladas por los intereses nacionales de los distintos Estados, conformándose un contexto de competición permanente y progresiva ("continuum of competition"), entre ellos o con otros actores, incluyendo los de naturaleza no estatal, violentos o no.

6 Este contexto describe cuatro diferentes niveles de relación entre Estados/actores. Sus límites no son fácilmente definibles y la progresión de uno a otro no es lineal.
`;
}

// Función para buscar apartados con diferentes métodos
function testApartadoPatterns(content: string): void {
  console.log('\n🔍 TESTING DE PATRONES PARA APARTADOS');
  console.log('=' .repeat(60));
  
  const apartados = [
    'ENTORNO GLOBAL DE SEGURIDAD',
    'CONTEXTO DE COMPETICIÓN',
    'EL CONFLICTO',
    'INSTRUMENTOS DE PODER',
    'EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS',
    'CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS'
  ];
  
  for (const apartado of apartados) {
    console.log(`\n📋 Analizando: "${apartado}"`);
    console.log('-'.repeat(40));
    
    // Método 1: Búsqueda exacta
    const exact = content.includes(apartado);
    console.log(`1️⃣ Búsqueda exacta: ${exact ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    
    // Método 2: Búsqueda case-insensitive
    const caseInsensitive = content.toLowerCase().includes(apartado.toLowerCase());
    console.log(`2️⃣ Case-insensitive: ${caseInsensitive ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    
    // Método 3: Búsqueda con regex simple
    const regexSimple = new RegExp(apartado, 'gi');
    const matchSimple = regexSimple.test(content);
    console.log(`3️⃣ Regex simple: ${matchSimple ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    
    // Método 4: Búsqueda con regex de línea completa
    const regexLine = new RegExp(`^\\s*${apartado}\\s*$`, 'gmi');
    const matchLine = regexLine.test(content);
    console.log(`4️⃣ Línea completa: ${matchLine ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    
    // Método 5: Búsqueda con espacios flexibles
    const apartadoFlexible = apartado.replace(/\s+/g, '\\s+');
    const regexFlexible = new RegExp(apartadoFlexible, 'gi');
    const matchFlexible = regexFlexible.test(content);
    console.log(`5️⃣ Espacios flexibles: ${matchFlexible ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    
    // Si se encuentra, mostrar el contexto
    if (exact || caseInsensitive || matchSimple) {
      const position = content.toLowerCase().indexOf(apartado.toLowerCase());
      if (position !== -1) {
        const context = content.substring(Math.max(0, position - 100), position + apartado.length + 200);
        console.log(`📍 Contexto encontrado:`);
        console.log(`   ...${context}...`);
      }
    }
  }
}

// Función para probar el sistema PDC-01 actual
async function testCurrentPDC01System(content: string): Promise<void> {
  console.log('\n🤖 TESTING DEL SISTEMA PDC-01 ACTUAL');
  console.log('=' .repeat(60));
  
  // Crear documento de prueba
  const document: StoredDocument = {
    id: 'test-document-id',
    title: 'PDC-01 B Test',
    content: content,
    date: new Date(),
    type: 'text/plain',
    questionCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    processingTime: null,
    tokens: null
  };
  
  // Probar detección
  console.log('1️⃣ Detección automática:');
  const isPDC01 = DocumentSectionService.detectPDC01Document(content);
  const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
  console.log(`   PDC-01 detectado: ${isPDC01 ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   Militar detectado: ${isMilitary ? '✅ SÍ' : '❌ NO'}`);
  
  // Probar extracción usando el sistema actual
  console.log('\n2️⃣ Extracción de secciones:');
  try {
    const sections = DocumentSectionService.extractSections(document);
    console.log(`   Secciones extraídas: ${sections.length}`);
    
    if (sections.length > 0) {
      console.log('\n   📄 Secciones encontradas:');
      for (let idx = 0; idx < sections.length; idx++) {
        const section = sections[idx];
        console.log(`\n      ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
        
        // Mostrar contenido expandible
        await showExpandableContent(section.title, section.content, 200);
      }
    } else {
      console.log('   ❌ No se extrajeron secciones');
    }
  } catch (error) {
    console.log(`   ❌ Error en extracción: ${error}`);
  }
}

// Función para analizar la estructura del contenido
function analyzeContentStructure(content: string): void {
  console.log('\n📊 ANÁLISIS DE ESTRUCTURA DEL CONTENIDO');
  console.log('=' .repeat(60));
  
  console.log(`📏 Estadísticas básicas:`);
  console.log(`   Caracteres totales: ${content.length}`);
  console.log(`   Líneas: ${content.split('\n').length}`);
  console.log(`   Párrafos: ${content.split('\n\n').length}`);
  console.log(`   Palabras: ${content.split(/\s+/).length}`);
  
  console.log(`\n🔍 Primeros 500 caracteres:`);
  console.log(`"${content.substring(0, 500)}"`);
  
  console.log(`\n🔍 Líneas que contienen apartados (primeras 10):`);
  const lines = content.split('\n');
  const apartadoLines = lines.filter(line => 
    /ENTORNO|CONTEXTO|CONFLICTO|INSTRUMENTOS|EMPLEO|CAPACIDADES/i.test(line)
  );
  
  apartadoLines.slice(0, 10).forEach((line, idx) => {
    console.log(`   ${idx + 1}. "${line.trim()}"`);
  });
  
  if (apartadoLines.length > 10) {
    console.log(`   ... y ${apartadoLines.length - 10} líneas más`);
  }
}

async function debugTextContent() {
  console.log('🔍 DEBUGGING DEL CONTENIDO TEXTO PDC-01\n');

  try {
    // Obtener contenido
    const content = getTextContent();
    
    // Análisis básico
    analyzeContentStructure(content);
    
    // Testing de patrones
    testApartadoPatterns(content);
    
    // Testing del sistema actual
    await testCurrentPDC01System(content);
    
    console.log('\n🎯 DEBUGGING COMPLETADO');
    console.log('\nPara resolver el problema:');
    console.log('1. Verifica que los apartados estén en el formato exacto esperado');
    console.log('2. Ajusta los patrones regex si es necesario');
    console.log('3. Considera usar búsqueda más flexible');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL DEBUGGING:', error);
    throw error;
  } finally {
    rl.close();
  }
}

// Ejecutar el debugging
if (require.main === module) {
  debugTextContent()
    .then(() => {
      console.log('\n✅ Debugging del contenido completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Debugging del contenido falló:', error);
      process.exit(1);
    });
}

export { debugTextContent }; 