#!/usr/bin/env tsx

/**
 * SCRIPT DE PRUEBA PARA PROCESAMIENTO DE PDC-01 B DOCTRINA PARA EL EMPLEO DE LAS FAS
 * 
 * Este script prueba el nuevo sistema de procesamiento específico para
 * el documento PDC-01 B con apartados predefinidos.
 */

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

import { DocumentSectionService, ProcessingMode, ProcessingConfig } from '../src/services/documentSectionService';
import type { StoredDocument } from '../src/services/storageService';

// Muestra de contenido de PDC-01 para pruebas
const SAMPLE_PDC01_CONTENT = `
PDC-01 B DOCTRINA PARA EL EMPLEO DE LAS FUERZAS ARMADAS

ENTORNO GLOBAL DE SEGURIDAD

1 En las últimas décadas asistimos a un cambio exponencial y generalizado de paradigma, que se manifiesta en transformaciones, unas veces coyunturales, otras estructurales, en los más variados ámbitos, desde el político, al económico, social, cultural, tecnológico o medioambiental. Esta circunstancia influye a su vez en la situación de seguridad global, configurando un entorno incierto, pues desbanca certezas pasadas, y peligroso, pues potencia riesgos tradicionales, al tiempo que genera otros nuevos.

2 Ese entorno global de seguridad es complejo y está caracterizado también por el cambio acelerado de las condiciones, la permeabilidad de las barreras, la ambigüedad de actores, actuaciones e interconexiones, así como por la extensión del enfrentamiento a los nuevos espacios de las operaciones.

3 En efecto, la multipolaridad y la fragmentación parecen ser tendencia en una escena internacional en la que la disputa va más allá del marco de la seguridad y la defensa, convirtiendo la competición en permanente. El orden internacional basado en reglas del derecho internacional es puesto en tela de juicio por potencias revisionistas; nuevos actores, también no estatales, demandan protagonismo; y las dinámicas de disuasión-distensión se ven superadas muchas veces por la recurrencia a la intervención violenta.

4 Todo ello nos sumerge en un continuo estado de competición en planos tan diversos como el económico, el comercial, el energético, el social, el tecnológico o el informativo, el cual coexiste con el resurgir periódico de la guerra.

CONTEXTO DE COMPETICIÓN

5 Las relaciones internacionales, siempre complejas y dinámicas, son modeladas por los intereses nacionales de los distintos Estados, conformándose un contexto de competición permanente y progresiva ("continuum of competition"), entre ellos o con otros actores, incluyendo los de naturaleza no estatal, violentos o no.

6 Este contexto describe cuatro diferentes niveles de relación entre Estados/actores. Sus límites no son fácilmente definibles y la progresión de uno a otro no es lineal.

EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS

86 Cada capacidad militar se compone de los siguientes elementos: material (M), infraestructura (I), recursos humanos (R), adiestramiento (A), doctrina (D), organización (O) e interoperabilidad (I), lo que permitirá su análisis atendiendo al modelo «MIRADO-I».

87 El material (M) es el conjunto de equipos que contribuyen decisivamente a la consecución de la capacidad, desde su obtención, su mantenimiento/sostenimiento, hasta su baja en servicio.

CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS

147 Respecto a los principios legales, el derecho internacional humanitario (DIH), anteriormente denominado derecho de los conflictos armados (DICA), formado por los tratados y convenios internacionales ratificados por España, las leyes y usos de la guerra destinados a minimizar los efectos que se derivan de los conflictos armados, junto a la Constitución Española y el resto de nuestro ordenamiento jurídico, conforman el marco legal vinculante de las operaciones, tanto para que rijan las acciones como para que las ejecute.

148 Estos principios no siempre son los mismos para todas las partes enfrentadas en un conflicto, por lo que sus conductas y reacciones ante estímulos similares pueden ser diferentes. Por ello es relevante conocerlos y evaluar su impacto en el desarrollo del conflicto.

OPERACIONES MULTIDOMINIO

149 Por otra parte, y en línea con la doctrina aliada, se identifican los siguientes temas transversales (cross-cutting topics, CCT) a tener en cuenta en el planeamiento y ejecución de las operaciones, con el objeto de minimizar las consecuencias de los conflictos en la población.

150 Por último, la doctrina militar, o doctrina para las operaciones, establece los principios y directrices que rigen la actuación operativa de las FAS españolas, proporcionando además un marco de referencia común para la actuación específica de los Ejércitos y la Armada, una guía para la conducción de las operaciones militares y un marco de pensamiento para dar soluciones a los problemas operativos.
`;

async function testPDC01Processing() {
  console.log('📋 INICIANDO PRUEBAS DE PROCESAMIENTO PDC-01 B\n');

  // Crear documento de prueba
  const testDocument: StoredDocument = {
    id: 'test-pdc01-doc',
    title: 'PDC-01 B Doctrina para el empleo de las FAS.pdf',
    content: SAMPLE_PDC01_CONTENT,
    date: new Date(),
    type: 'application/pdf',
    questionCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    processingTime: null,
    tokens: null
  };

  try {
    // Prueba 1: Detección automática de PDC-01
    console.log('📋 PRUEBA 1: Detección automática de PDC-01');
    const isPDC01 = DocumentSectionService.detectPDC01Document(testDocument.content);
    console.log(`   Resultado: ${isPDC01 ? '✅ PDC-01 DETECTADO' : '❌ NO DETECTADO'}`);

    // Prueba 2: Detección militar general (para comparar)
    const isMilitary = DocumentSectionService.detectMilitaryDoctrine(testDocument.content);
    console.log(`   Militar general: ${isMilitary ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);

    // Prueba 3: Configurar modo PDC-01 manualmente
    console.log('\n📋 PRUEBA 2: Configuración manual de modo PDC-01');
    const pdc01Config: ProcessingConfig = {
      mode: ProcessingMode.PDC_01_DOCTRINE,
      options: {
        minSectionLength: 500,
        maxSectionLength: 15000,
        pdc01Doctrine: {
          useSpecificSections: true,
          includeSubParagraphs: true,
          minSectionLength: 500
        }
      }
    };
    
    // Guardar configuración en localStorage mock
    DocumentSectionService.saveProcessingConfig(testDocument.id, pdc01Config);
    console.log('   ✅ Configuración PDC-01 guardada');

    // Prueba 4: Extracción de apartados específicos
    console.log('\n📋 PRUEBA 3: Extracción de apartados específicos PDC-01');
    const sections = DocumentSectionService.extractSections(testDocument);
    
    console.log(`   Total apartados extraídos: ${sections.length}`);
    
    sections.forEach((section, index) => {
      console.log(`   ${index + 1}. [${section.type}] ${section.title}`);
      console.log(`      📏 Longitud: ${section.content.length} caracteres`);
      console.log(`      🆔 ID: ${section.id}`);
      
      // Mostrar primeras líneas de contenido para verificar
      const firstLines = section.content.split('\n').slice(0, 3).join('\n');
      console.log(`      📄 Contenido: ${firstLines.substring(0, 100)}...`);
      console.log('');
    });

    // Prueba 5: Mostrar contenido completo de un apartado
    if (sections.length > 0) {
      console.log('📋 PRUEBA 4: Contenido completo del primer apartado');
      const firstSection = sections[0];
      console.log(`   Apartado: ${firstSection.title}`);
      console.log(`   Tipo: ${firstSection.type}`);
      console.log(`   Contenido completo:`);
      console.log(`   "${firstSection.content}"`);
    }

    // Prueba 6: Verificar apartados encontrados
    console.log('\n📋 PRUEBA 5: Análisis de apartados encontrados');
    const apartadoTitles = sections.map(s => s.title);
    const expectedApartados = [
      'ENTORNO GLOBAL DE SEGURIDAD',
      'CONTEXTO DE COMPETICIÓN',
      'EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS',
      'CAPACIDADES MILITARES DE LAS FUERZAS ARMADAS',
      'OPERACIONES MULTIDOMINIO'
    ];
    
    expectedApartados.forEach(expected => {
      const found = apartadoTitles.some(title => title.includes(expected));
      console.log(`   ${expected}: ${found ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    });

    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LAS PRUEBAS:', error);
    throw error;
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  testPDC01Processing()
    .then(() => {
      console.log('\n🎯 Script de pruebas PDC-01 finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script de pruebas PDC-01 falló:', error);
      process.exit(1);
    });
}

export { testPDC01Processing }; 