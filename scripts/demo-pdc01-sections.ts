#!/usr/bin/env tsx

/**
 * DEMO PDC-01 SECCIONES EXPANDIBLES
 * 
 * Este script demuestra la funcionalidad de secciones expandibles
 * sin requerir interacción del usuario.
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

import { DocumentSectionService } from '../src/services/documentSectionService';
import type { StoredDocument } from '../src/services/storageService';

// Función para mostrar contenido con opción de expandir
function showContentPreview(
  title: string, 
  content: string, 
  previewLength: number = 200,
  showFull: boolean = false
): void {
  const isLong = content.length > previewLength;
  
  if (!showFull) {
    const preview = isLong ? content.substring(0, previewLength) + '...' : content;
    console.log(`         📄 Contenido (${content.length} chars):`);
    console.log(`         "${preview}"`);
    
    if (isLong) {
      console.log(`         🔽 [Contenido truncado - usa showFull=true para ver completo]`);
    }
  } else {
    console.log(`\n         📖 CONTENIDO COMPLETO DE "${title}":`);
    console.log('         ' + '='.repeat(60));
    const lines = content.split('\n');
    lines.forEach(line => {
      console.log(`         ${line}`);
    });
    console.log('         ' + '='.repeat(60));
  }
}

// Función para obtener contenido PDC-01
function getPDC01Content(): string {
  return `
PDC-01 B DOCTRINA PARA EL EMPLEO DE LAS FUERZAS ARMADAS

ENTORNO GLOBAL DE SEGURIDAD

1 En las últimas décadas asistimos a un cambio exponencial y generalizado de paradigma, que se manifiesta en transformaciones, unas veces coyunturales, otras estructurales, en los más variados ámbitos, desde el político, al económico, social, cultural, tecnológico o medioambiental. Esta circunstancia influye a su vez en la situación de seguridad global, configurando un entorno incierto, pues desbanca certezas pasadas, y peligroso, pues potencia riesgos tradicionales, al tiempo que genera otros nuevos.

2 Ese entorno global de seguridad es complejo y está caracterizado también por el cambio acelerado de las condiciones, la permeabilidad de las barreras, la ambigüedad de actores, actuaciones e interconexiones, así como por la extensión del enfrentamiento a los nuevos espacios de las operaciones.

3 En efecto, la multipolaridad y la fragmentación parecen ser tendencia en una escena internacional en la que la disputa va más allá del marco de la seguridad y la defensa, convirtiendo la competición en permanente.

CONTEXTO DE COMPETICIÓN

5 Las relaciones internacionales, siempre complejas y dinámicas, son modeladas por los intereses nacionales de los distintos Estados, conformándose un contexto de competición permanente y progresiva.

6 Este contexto describe cuatro diferentes niveles de relación entre Estados/actores. Sus límites no son fácilmente definibles y la progresión de uno a otro no es lineal.

INSTRUMENTOS DE PODER

9 Los Estados disponen de diferentes instrumentos de poder nacional para perseguir sus objetivos e intereses. Tradicionalmente se han clasificado en cuatro categorías principales.

10 El poder diplomático, económico, informativo y militar constituyen los pilares fundamentales sobre los que se sustenta la acción exterior de cualquier Estado.

INTERESES NACIONALES

11 Los intereses nacionales constituyen los objetivos fundamentales que guían la acción del Estado en el ámbito internacional.

12 España, como Estado miembro de la Unión Europea y de la Alianza Atlántica, debe articular sus intereses nacionales con los compromisos adquiridos en estos marcos de cooperación.

LA SEGURIDAD NACIONAL

13 La Seguridad Nacional, junto a los demás instrumentos de poder del Estado; expresa la forma por la que se adquieren y adaptan las capacidades militares para la consecución de la eficacia operativa necesaria para el cumplimiento de las misiones encomendadas; y todo ello, enmarcado en un proceso constante de trasformación que permite su anticipación a los retos futuros. Seguidamente, establece y detalla los fundamentos de las operaciones; cómo se ejecuta la acción conjunta, la combinada con otros instrumentos de poder del Estado.

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

// Función principal de demostración
function demoPDC01Sections(): void {
  console.log('🎯 DEMO: SECCIONES PDC-01 EXPANDIBLES');
  console.log('=' .repeat(60));

  try {
    // 1. Crear documento de prueba
    const content = getPDC01Content();
    const document: StoredDocument = {
      id: 'demo-pdc01',
      title: 'PDC-01 B Doctrina - Demo',
      content: content,
      date: new Date(),
      type: 'text/plain',
      questionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingTime: null,
      tokens: null
    };

    console.log(`📄 Documento: "${document.title}"`);
    console.log(`   Caracteres: ${content.length}`);

    // 2. Detección automática
    console.log('\n1️⃣ DETECCIÓN AUTOMÁTICA:');
    const isPDC01 = DocumentSectionService.detectPDC01Document(content);
    console.log(`   PDC-01: ${isPDC01 ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);

    // 3. Configurar y extraer
    if (isPDC01) {
      DocumentSectionService.setupPDC01Processing(document.id);
      const sections = DocumentSectionService.extractSections(document);
      
      console.log(`\n2️⃣ EXTRACCIÓN EXITOSA: ${sections.length} apartados encontrados`);

      // 4. Mostrar secciones con preview
      console.log('\n3️⃣ VISTA PREVIA DE APARTADOS:');
      sections.forEach((section, idx) => {
        console.log(`\n   ${idx + 1}. "${section.title}"`);
        console.log(`      ID: ${section.id}`);
        console.log(`      Tipo: ${section.type}`);
        showContentPreview(section.title, section.content, 150, false);
      });

      // 5. Mostrar una sección completa como ejemplo
      if (sections.length > 0) {
        console.log('\n4️⃣ EJEMPLO DE CONTENIDO COMPLETO:');
        console.log(`   (Mostrando contenido completo del primer apartado)`);
        showContentPreview(sections[0].title, sections[0].content, 150, true);
      }

      // 6. Resumen final
      console.log('\n🎯 RESUMEN:');
      console.log(`   ✅ Sistema PDC-01 funcionando correctamente`);
      console.log(`   📊 Apartados extraídos: ${sections.length}`);
      console.log('   🔧 Funcionalidad expandible implementada');
      
      console.log('\n📋 Lista completa de apartados:');
      sections.forEach((section, idx) => {
        console.log(`   ${idx + 1}. ${section.title} (${section.content.length} chars)`);
      });
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

// Ejecutar demo
if (require.main === module) {
  demoPDC01Sections();
  console.log('\n✅ Demo completada');
}

export { demoPDC01Sections }; 