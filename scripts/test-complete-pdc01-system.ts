#!/usr/bin/env tsx

/**
 * SCRIPT DE PRUEBA COMPLETA DEL SISTEMA PDC-01
 * 
 * Este script prueba el sistema completo incluyendo smartProcessDocument
 * para verificar que funciona correctamente de extremo a extremo.
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

// Función para mostrar contenido expandible/contraíble
async function showExpandableContent(
  title: string, 
  content: string, 
  previewLength: number = 200
): Promise<void> {
  const isLong = content.length > previewLength;
  const preview = isLong ? content.substring(0, previewLength) + '...' : content;
  
  console.log(`         📄 Contenido (${content.length} chars):`);
  console.log(`         "${preview}"`);
  
  if (isLong) {
    console.log(`         🔽 [PRESIONA ENTER para ver contenido completo, 's' para saltear]`);
    const answer = await askQuestion('');
    
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'skip') {
      console.log(`\n         📖 CONTENIDO COMPLETO DE "${title}":`);
      console.log('         ' + '='.repeat(60));
      // Mostrar el contenido con indentación
      const lines = content.split('\n');
      lines.forEach(line => {
        console.log(`         ${line}`);
      });
      console.log('         ' + '='.repeat(60));
      
      console.log(`\n         🔼 [PRESIONA ENTER para continuar]`);
      await askQuestion('');
    }
  }
}

// Función para obtener contenido PDC-01 más completo
function getPDC01Content(): string {
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

EL CONFLICTO

7 El conflicto es una realidad presente en todas las dimensiones de la vida humana y característica esencial de las relaciones internacionales.

8 En el ámbito militar, el conflicto se manifiesta como la aplicación del poder militar para resolver disputas entre actores estatales o no estatales.

INSTRUMENTOS DE PODER

9 Los Estados disponen de diferentes instrumentos de poder nacional para perseguir sus objetivos e intereses. Tradicionalmente se han clasificado en cuatro categorías principales.

10 El poder diplomático, económico, informativo y militar constituyen los pilares fundamentales sobre los que se sustenta la acción exterior de cualquier Estado.

INTERESES NACIONALES

11 Los intereses nacionales constituyen los objetivos fundamentales que guían la acción del Estado en el ámbito internacional.

12 España, como Estado miembro de la Unión Europea y de la Alianza Atlántica, debe articular sus intereses nacionales con los compromisos adquiridos en estos marcos de cooperación.

LA SEGURIDAD NACIONAL

13 La Seguridad Nacional, junto a los demás instrumentos de poder del Estado; expresa la forma por la que se adquieren y adaptan las capacidades militares para la consecución de la eficacia operativa necesaria para el cumplimiento de las misiones encomendadas.

14 Seguidamente, establece y detalla los fundamentos de las operaciones; cómo se ejecuta la acción conjunta, la combinada con otros instrumentos de poder del Estado.

EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS

15 Las Fuerzas Armadas tienen como misión fundamental la defensa de España, de su Constitución, de sus valores e intereses y de la integridad territorial del Estado.

16 Además de la misión principal de defensa, las Fuerzas Armadas contribuyen a la seguridad y defensa del espacio euroatlántico.

CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS

17 Las capacidades militares son las aptitudes requeridas para llevar a cabo las operaciones militares necesarias para cumplir las misiones asignadas.

18 Estas capacidades se desarrollan a través de la combinación equilibrada de personal, material, infraestructura, doctrina, adiestramiento, liderazgo y organización.

OPERACIONES

19 Las operaciones militares son el empleo coordinado y sincronizado de fuerzas militares para alcanzar objetivos estratégicos, operacionales o tácticos.

20 El planeamiento de las operaciones debe considerar todos los factores que pueden influir en su desarrollo y resultado final.
`;
}

// Función para probar el sistema completo con contenido expandible
async function testCompletePDC01System(): Promise<void> {
  console.log('🧪 PRUEBA COMPLETA DEL SISTEMA PDC-01');
  console.log('=' .repeat(60));

  try {
    // 1. Crear documento de prueba
    const content = getPDC01Content();
    const document: StoredDocument = {
      id: 'test-pdc01-complete',
      title: 'PDC-01 B Doctrina Completa Test',
      content: content,
      date: new Date(),
      type: 'text/plain',
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingTime: null,
      tokens: null
    };

    console.log(`📄 Documento creado: "${document.title}"`);
    console.log(`   Caracteres: ${content.length}`);
    console.log(`   ID: ${document.id}`);

    // 2. Probar detección individual
    console.log('\n1️⃣ DETECCIÓN INDIVIDUAL:');
    const isPDC01 = DocumentSectionService.detectPDC01Document(content);
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    console.log(`   PDC-01: ${isPDC01 ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
    console.log(`   Militar: ${isMilitary ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);

    // 3. Usar smartProcessDocument (como lo hace la aplicación real)
    console.log('\n2️⃣ PROCESAMIENTO INTELIGENTE:');
    console.log('   Ejecutando smartProcessDocument...');
    const processedDocument = DocumentSectionService.smartProcessDocument(document);
    
    console.log(`   ✅ Documento procesado: ${processedDocument.id}`);
    console.log(`   Título: "${processedDocument.title}"`);

    // 4. Extraer secciones usando el documento procesado
    console.log('\n3️⃣ EXTRACCIÓN DE SECCIONES:');
    console.log('   Extrayendo secciones...');
    const sections = DocumentSectionService.extractSections(processedDocument);
    
    console.log(`   📊 Secciones extraídas: ${sections.length}`);

    // 5. Verificar si encontró apartados específicos de PDC-01
    const pdc01Sections = sections.filter(s => 
      s.title.includes('ENTORNO GLOBAL') || 
      s.title.includes('CONTEXTO DE COMPETICIÓN') ||
      s.title.includes('EL CONFLICTO') ||
      s.title.includes('INSTRUMENTOS DE PODER') ||
      s.title.includes('EMPLEO Y MISIONES') ||
      s.title.includes('CAPACIDADES MILITARES') ||
      s.title.includes('OPERACIONES MULTIDOMINIO') ||
      s.title.includes('INTERESES NACIONALES') ||
      s.title.includes('LA SEGURIDAD NACIONAL') ||
      s.title.includes('OPERACIONES')
    );

    if (sections.length > 0) {
      console.log('\n   📑 SECCIONES ENCONTRADAS:');
      
      for (let idx = 0; idx < sections.length; idx++) {
        const section = sections[idx];
        console.log(`\n      ${idx + 1}. "${section.title}"`);
        console.log(`         ID: ${section.id}`);
        console.log(`         Tipo: ${section.type}`);
        
        // Mostrar contenido expandible
        await showExpandableContent(section.title, section.content, 150);
      }

      console.log(`\n4️⃣ APARTADOS PDC-01 ESPECÍFICOS:`);
      console.log(`   Apartados PDC-01 encontrados: ${pdc01Sections.length}`);
      
      if (pdc01Sections.length > 0) {
        console.log('   ✅ APARTADOS ESPECÍFICOS DETECTADOS:');
        pdc01Sections.forEach((section, idx) => {
          console.log(`      ${idx + 1}. "${section.title}" (${section.content.length} chars)`);
        });
      } else {
        console.log('   ❌ No se encontraron apartados específicos de PDC-01');
      }
    } else {
      console.log('   ❌ No se extrajeron secciones');
    }

    // 6. Verificar configuración guardada
    console.log('\n5️⃣ CONFIGURACIÓN GUARDADA:');
    const config = DocumentSectionService.getProcessingConfig(document.id);
    console.log(`   Modo de procesamiento: ${config.mode}`);
    console.log(`   Configuración:`, JSON.stringify(config.options, null, 2));

    // 7. Resultado final
    console.log('\n🎯 RESULTADO DE LA PRUEBA:');
    const success = 
      isPDC01 && 
      sections.length > 0 && 
      config.mode === 'PDC_01_DOCTRINE' &&
      pdc01Sections.length > 0;

    if (success) {
      console.log('   ✅ PRUEBA EXITOSA: El sistema PDC-01 funciona correctamente');
      console.log(`   📊 Resumen:`);
      console.log(`      - Detección PDC-01: ✅`);
      console.log(`      - Configuración PDC-01: ✅`);
      console.log(`      - Secciones extraídas: ${sections.length}`);
      console.log(`      - Apartados PDC-01: ${pdc01Sections.length}`);
    } else {
      console.log('   ❌ PRUEBA FALLIDA: El sistema PDC-01 necesita ajustes');
      console.log(`   🔍 Diagnóstico:`);
      console.log(`      - Detección PDC-01: ${isPDC01 ? '✅' : '❌'}`);
      console.log(`      - Configuración: ${config.mode}`);
      console.log(`      - Secciones: ${sections.length}`);
      console.log(`      - Apartados PDC-01: ${pdc01Sections.length}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA PRUEBA:', error);
    throw error;
  } finally {
    rl.close();
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testCompletePDC01System()
    .then(() => {
      console.log('\n✅ Prueba completa del sistema PDC-01 terminada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Prueba completa del sistema PDC-01 falló:', error);
      process.exit(1);
    });
}

export { testCompletePDC01System }; 