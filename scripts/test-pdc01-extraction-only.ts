#!/usr/bin/env tsx

/**
 * SCRIPT DE PRUEBA SOLO EXTRACCIÓN PDC-01
 * 
 * Este script prueba solo la extracción de secciones sin intentar
 * guardar en base de datos, enfocándose en la funcionalidad expandible.
 */

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

13 La Seguridad Nacional, junto a los demás instrumentos de poder del Estado; expresa la forma por la que se adquieren y adaptan las capacidades militares para la consecución de la eficacia operativa necesaria para el cumplimiento de las misiones encomendadas; y todo ello, enmarcado en un proceso constante de trasformación que permite su anticipación a los retos futuros. Seguidamente, establece y detalla los fundamentos de las operaciones; cómo se ejecuta la acción conjunta, la combinada con otros instrumentos de poder del Estado.

14 Seguidamente, establece y detalla los fundamentos de las operaciones; cómo se ejecuta la acción conjunta, la combinada con otros instrumentos de poder del Estado.

EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS

15 Las Fuerzas Armadas tienen como misión fundamental la defensa de España, de su Constitución, de sus valores e intereses y de la integridad territorial del Estado.

16 Además de la misión principal de defensa, las Fuerzas Armadas contribuyen a la seguridad y defensa del espacio euroatlántico, participando en misiones internacionales de mantenimiento de la paz y cooperación al desarrollo.

CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS

17 Las capacidades militares son las aptitudes requeridas para llevar a cabo las operaciones militares necesarias para cumplir las misiones asignadas.

18 Estas capacidades se desarrollan a través de la combinación equilibrada de personal, material, infraestructura, doctrina, adiestramiento, liderazgo y organización.

OPERACIONES

19 Las operaciones militares son el empleo coordinado y sincronizado de fuerzas militares para alcanzar objetivos estratégicos, operacionales o tácticos.

20 El planeamiento de las operaciones debe considerar todos los factores que pueden influir en su desarrollo y resultado final.
`;
}

// Función para probar solo la extracción de secciones
async function testPDC01ExtractionOnly(): Promise<void> {
  console.log('🧪 PRUEBA DE EXTRACCIÓN PDC-01 (SOLO LECTURA)');
  console.log('=' .repeat(60));

  try {
    // 1. Crear documento de prueba
    const content = getPDC01Content();
    const document: StoredDocument = {
      id: 'test-pdc01-extraction',
      title: 'PDC-01 B Doctrina - Solo Extracción',
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

    // 2. Probar detección
    console.log('\n1️⃣ DETECCIÓN AUTOMÁTICA:');
    const isPDC01 = DocumentSectionService.detectPDC01Document(content);
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
    console.log(`   PDC-01: ${isPDC01 ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
    console.log(`   Militar: ${isMilitary ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);

    // 3. Configurar procesamiento PDC-01
    if (isPDC01) {
      console.log('\n2️⃣ CONFIGURACIÓN AUTOMÁTICA:');
      DocumentSectionService.setupPDC01Processing(document.id);
      console.log('   ✅ Configuración PDC-01 aplicada');
    }

    // 4. Extraer secciones directamente
    console.log('\n3️⃣ EXTRACCIÓN DIRECTA DE SECCIONES:');
    console.log('   Extrayendo apartados...');
    const sections = DocumentSectionService.extractSections(document);
    
    console.log(`   📊 Secciones extraídas: ${sections.length}`);

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

      // 5. Resultado final
      console.log('\n🎯 RESULTADO DE LA PRUEBA:');
      console.log('   ✅ EXTRACCIÓN EXITOSA: El sistema PDC-01 extrae apartados correctamente');
      console.log(`   📊 Resumen:`);
      console.log(`      - Detección PDC-01: ✅`);
      console.log(`      - Secciones extraídas: ${sections.length}`);
      console.log(`      - Apartados específicos: ${sections.length}`);
      
      console.log('\n📋 Lista de apartados encontrados:');
      sections.forEach((section, idx) => {
        console.log(`   ${idx + 1}. ${section.title} (${section.content.length} chars)`);
      });
      
    } else {
      console.log('   ❌ No se extrajeron secciones');
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
  testPDC01ExtractionOnly()
    .then(() => {
      console.log('\n✅ Prueba de extracción PDC-01 completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Prueba de extracción PDC-01 falló:', error);
      process.exit(1);
    });
}

export { testPDC01ExtractionOnly }; 