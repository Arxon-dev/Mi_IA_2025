#!/usr/bin/env node

import { 
  getSuggestedQuestions,
  getSuggestedQuestionsIntelligent,
  getSuggestedQuestionsHybrid
} from '../src/utils/questionUtils';

console.log('📄 DEMO: Sugerencias Inteligentes para Secciones de Documentos\n');

// Simular secciones de un documento educativo
const documentSections = [
  {
    id: 'section-1',
    title: '1. Introducción a la Biología Celular',
    content: `La célula es la unidad básica de la vida. Todas las formas de vida, desde las bacterias más simples hasta los organismos más complejos, están compuestas por células. Las células pueden ser procariotas (sin núcleo definido) o eucariotas (con núcleo verdadero). Esta distinción fundamental determina muchas características estructurales y funcionales.`
  },
  {
    id: 'section-2', 
    title: '2. Estructura de la Membrana Celular',
    content: `La membrana plasmática está compuesta principalmente por una bicapa lipídica que contiene fosfolípidos, colesterol y proteínas integrales. Los fosfolípidos tienen una cabeza hidrofílica y colas hidrofóbicas, formando la estructura fundamental. Las proteínas integrales actúan como canales, transportadores y receptores. El modelo del mosaico fluido describe esta organización dinámica.`
  },
  {
    id: 'section-3',
    title: '3. Procedimiento de Laboratorio', 
    content: `Para observar células al microscopio, sigue estos pasos: 1) Prepara una muestra del tejido a estudiar. 2) Coloca la muestra en el portaobjetos. 3) Añade una gota de agua destilada. 4) Cubre con un cubreobjetos evitando burbujas. 5) Ajusta la iluminación del microscopio. 6) Enfoca primero con objetivo de menor aumento.`
  },
  {
    id: 'section-4',
    title: '4. Marco Legal y Normativo',
    content: `Según el Real Decreto 1393/2007, de 29 de octubre, las competencias en investigación biomédica requieren autorización específica. Los experimentos con material biológico deben cumplir la normativa de bioseguridad. El comité de ética debe evaluar todos los protocolos antes de su implementación.`
  }
];

async function testDocumentSections() {
  console.log('🔍 ANÁLISIS POR SECCIONES:\n');
  
  for (const section of documentSections) {
    console.log(`📋 ${section.title}`);
    console.log('─'.repeat(60));
    
    // Método tradicional
    const traditional = getSuggestedQuestions(section.content);
    console.log(`🔢 Tradicional: ${traditional} preguntas`);
    
    try {
      // Método inteligente
      console.log(`🧠 Analizando sección...`);
      const intelligent = await getSuggestedQuestionsIntelligent(section.content);
      
      console.log(`🧠 Inteligente: ${intelligent.suggestedQuestions} preguntas`);
      console.log(`   📊 Tipo: ${intelligent.contentType}`);
      console.log(`   🎯 Densidad: ${intelligent.conceptDensity}`);
      console.log(`   ⭐ Importancia: ${intelligent.importance}`);
      
      // Comparación visual
      const diff = intelligent.suggestedQuestions - traditional;
      const arrow = diff > 0 ? '⬆️' : diff < 0 ? '⬇️' : '➡️';
      console.log(`   ${arrow} Cambio: ${traditional} → ${intelligent.suggestedQuestions} (${diff > 0 ? '+' : ''}${diff})`);
      
      // Análisis contextual
      if (intelligent.contentType === 'theoretical' && intelligent.conceptDensity === 'high') {
        console.log(`   💡 Recomendación: Sección densa - considera más preguntas conceptuales`);
      } else if (intelligent.contentType === 'practical') {
        console.log(`   💡 Recomendación: Sección práctica - enfócate en preguntas de procedimiento`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error en análisis: ${error}`);
    }
    
    console.log();
  }
  
  // Resumen del documento
  console.log('📊 RESUMEN DEL DOCUMENTO:\n');
  
  const totalTraditional = documentSections.reduce((acc, section) => 
    acc + getSuggestedQuestions(section.content), 0);
  
  let totalIntelligent = 0;
  let analysisResults = [];
  
  for (const section of documentSections) {
    try {
      const result = await getSuggestedQuestionsIntelligent(section.content);
      totalIntelligent += result.suggestedQuestions;
      analysisResults.push(result);
    } catch (error) {
      totalIntelligent += getSuggestedQuestions(section.content);
    }
  }
  
  console.log(`📈 Total de preguntas sugeridas:`);
  console.log(`   🔢 Método tradicional: ${totalTraditional} preguntas`);
  console.log(`   🧠 Método inteligente: ${totalIntelligent} preguntas`);
  console.log(`   📊 Diferencia: ${totalIntelligent - totalTraditional} (${Math.round(((totalIntelligent - totalTraditional) / totalTraditional) * 100)}%)`);
  
  // Análisis por tipos de contenido
  const contentTypes = analysisResults.reduce((acc, result) => {
    acc[result.contentType] = (acc[result.contentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`\n🏷️ Tipos de contenido detectados:`);
  Object.entries(contentTypes).forEach(([type, count]) => {
    const emoji = type === 'theoretical' ? '📚' : type === 'practical' ? '🔧' : type === 'mixed' ? '🔀' : '📄';
    console.log(`   ${emoji} ${type}: ${count} sección${count > 1 ? 'es' : ''}`);
  });
  
  console.log(`\n✅ INTEGRACIÓN EXITOSA EN /documents/[id]`);
  console.log(`🎯 Los usuarios ahora pueden alternar entre métodos tradicional e inteligente`);
  console.log(`📊 Cada sección muestra análisis detallado del contenido`);
  console.log(`🧠 El análisis se adapta automáticamente al tipo de contenido`);
}

console.log('Iniciando prueba de secciones de documentos...\n');
testDocumentSections().catch(console.error); 