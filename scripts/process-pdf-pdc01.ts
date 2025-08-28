#!/usr/bin/env tsx

/**
 * SCRIPT PARA PROCESAR EL PDF PDC-01 B DOCTRINA PARA EL EMPLEO DE LAS FAS
 * 
 * Este script extrae el texto del PDF y lo procesa usando el sistema
 * específico PDC-01 que hemos implementado.
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
import type { StoredDocument } from '../src/services/storageService';

// Función para simular extracción de PDF (en un proyecto real usarías pdf-parse o similar)
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  console.log(`📄 Intentando extraer texto de: ${pdfPath}`);
  
  // Verificar si existe el archivo
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Archivo PDF no encontrado: ${pdfPath}`);
  }
  
  console.log('⚠️  Para esta demostración, simularemos el contenido del PDF');
  console.log('   En producción, aquí usarías una librería como pdf-parse');
  
  // Simular contenido extraído del PDF real
  // En tu caso real, aquí cargarías el contenido desde el archivo de texto que compartiste
  const simulatedContent = `
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

7 Mientras el rostro del conflicto cambia constantemente, su naturaleza permanece intacta pues su carácter político y social, la violencia y el caos que puede generar, así como la incertidumbre sobre su evolución, producto de una información incompleta e imperfecta en sus comienzos, continúan estando presentes.

8 El conflicto se caracteriza por su complejidad, dinamismo e impredecibilidad, derivados tanto de los medios empleados como de los objetivos perseguidos, así como de la interacción entre las partes enfrentadas.

INSTRUMENTOS DE PODER

9 Los Estados disponen de diversos instrumentos de poder para perseguir sus intereses nacionales y proyectar su influencia en el ámbito internacional.

10 Estos instrumentos incluyen el poder diplomático, informativo, militar y económico, conocidos por sus siglas en inglés como DIME (Diplomatic, Informational, Military, Economic).

EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS

86 Cada capacidad militar se compone de los siguientes elementos: material (M), infraestructura (I), recursos humanos (R), adiestramiento (A), doctrina (D), organización (O) e interoperabilidad (I), lo que permitirá su análisis atendiendo al modelo «MIRADO-I».

87 El material (M) es el conjunto de equipos que contribuyen decisivamente a la consecución de la capacidad, desde su obtención, su mantenimiento/sostenimiento, hasta su baja en servicio.

88 La infraestructura (I) comprende las instalaciones, sistemas y redes que proporcionan el apoyo necesario para el desarrollo y empleo de las capacidades militares.

CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS

147 Respecto a los principios legales, el derecho internacional humanitario (DIH), anteriormente denominado derecho de los conflictos armados (DICA), formado por los tratados y convenios internacionales ratificados por España, las leyes y usos de la guerra destinados a minimizar los efectos que se derivan de los conflictos armados, junto a la Constitución Española y el resto de nuestro ordenamiento jurídico, conforman el marco legal vinculante de las operaciones, tanto para que rijan las acciones como para que las ejecute.

148 Estos principios no siempre son los mismos para todas las partes enfrentadas en un conflicto, por lo que sus conductas y reacciones ante estímulos similares pueden ser diferentes. Por ello es relevante conocerlos y evaluar su impacto en el desarrollo del conflicto.

OPERACIONES MULTIDOMINIO

149 Por otra parte, y en línea con la doctrina aliada, se identifican los siguientes temas transversales (cross-cutting topics, CCT) a tener en cuenta en el planeamiento y ejecución de las operaciones, con el objeto de minimizar las consecuencias de los conflictos en la población.

150 Por último, la doctrina militar, o doctrina para las operaciones, establece los principios y directrices que rigen la actuación operativa de las FAS españolas, proporcionando además un marco de referencia común para la actuación específica de los Ejércitos y la Armada, una guía para la conducción de las operaciones militares y un marco de pensamiento para dar soluciones a los problemas operativos.
`;

  return simulatedContent;
}

async function processPDC01PDF() {
  console.log('🪖 PROCESANDO PDF PDC-01 B DOCTRINA PARA EL EMPLEO DE LAS FAS\n');

  try {
    // Ruta al PDF
    const pdfPath = path.join(process.cwd(), 'docs', 'PDC-01 B Doctrina para el empleo de las FAS.pdf');
    
    // Paso 1: Extraer texto del PDF
    console.log('📋 PASO 1: Extracción de texto del PDF');
    const extractedText = await extractTextFromPDF(pdfPath);
    console.log(`✅ Texto extraído: ${extractedText.length} caracteres\n`);

    // Paso 2: Crear documento para procesamiento
    console.log('📋 PASO 2: Preparando documento para procesamiento');
    const document: StoredDocument = {
      id: 'pdc01-real-document',
      title: 'PDC-01 B Doctrina para el empleo de las FAS.pdf',
      content: extractedText,
      date: new Date(),
      type: 'application/pdf',
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingTime: null,
      tokens: null
    };
    console.log('✅ Documento preparado\n');

    // Paso 3: Detección automática
    console.log('📋 PASO 3: Detección automática del tipo de documento');
    const isPDC01 = DocumentSectionService.detectPDC01Document(document.content);
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(document.content);
    
    console.log(`   PDC-01 detectado: ${isPDC01 ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Militar general: ${isMilitary ? '✅ SÍ' : '❌ NO'}\n`);

    // Paso 4: Procesamiento inteligente
    console.log('📋 PASO 4: Procesamiento inteligente automático');
    const processedDocument = DocumentSectionService.smartProcessDocument(document);
    console.log('✅ Procesamiento automático completado\n');

    // Paso 5: Extracción de secciones
    console.log('📋 PASO 5: Extracción de apartados específicos');
    const sections = DocumentSectionService.extractSections(processedDocument);
    
    console.log(`✅ Total apartados extraídos: ${sections.length}\n`);

    // Paso 6: Mostrar resultados
    console.log('📋 PASO 6: Resultados del procesamiento\n');
    console.log('=' .repeat(60));
    console.log('📑 APARTADOS EXTRAÍDOS:');
    console.log('=' .repeat(60));
    
    sections.forEach((section, index) => {
      console.log(`\n${index + 1}. 📖 ${section.title}`);
      console.log(`   🏷️  Tipo: ${section.type}`);
      console.log(`   📏 Longitud: ${section.content.length} caracteres`);
      console.log(`   🆔 ID: ${section.id}`);
      
      // Mostrar primeros párrafos de cada apartado
      const lines = section.content.split('\n').filter(line => line.trim());
      const title = lines[0];
      const firstParagraphs = lines.slice(1, 4).join('\n   ');
      
      console.log(`   📄 Contenido:`);
      console.log(`      ${title}`);
      console.log(`   ${firstParagraphs}`);
      if (lines.length > 4) {
        console.log(`   ... (y ${lines.length - 4} líneas más)`);
      }
    });

    // Paso 7: Análisis de apartados encontrados
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 ANÁLISIS DE APARTADOS ENCONTRADOS:');
    console.log('=' .repeat(60));
    
    const apartadoTitles = sections.map(s => s.title);
    const expectedApartados = [
      'ENTORNO GLOBAL DE SEGURIDAD',
      'CONTEXTO DE COMPETICIÓN',
      'EL CONFLICTO', 
      'INSTRUMENTOS DE PODER',
      'EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS',
      'CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS',
      'OPERACIONES MULTIDOMINIO'
    ];
    
    expectedApartados.forEach(expected => {
      const found = apartadoTitles.some(title => title.includes(expected));
      console.log(`   ${expected}: ${found ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    });

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 PROCESAMIENTO COMPLETADO EXITOSAMENTE');
    console.log('=' .repeat(60));
    console.log(`📊 Estadísticas:`);
    console.log(`   - Apartados procesados: ${sections.length}`);
    console.log(`   - Caracteres totales: ${extractedText.length}`);
    console.log(`   - Modo utilizado: PDC_01_DOCTRINE`);
    console.log(`   - Detección automática: ${isPDC01 ? 'PDC-01 específico' : 'Militar general'}`);

    return { document: processedDocument, sections };

  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL PROCESAMIENTO:', error);
    throw error;
  }
}

// Ejecutar el procesamiento
if (require.main === module) {
  processPDC01PDF()
    .then(() => {
      console.log('\n🎯 Procesamiento del PDF PDC-01 finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Procesamiento del PDF PDC-01 falló:', error);
      process.exit(1);
    });
}

export { processPDC01PDF }; 