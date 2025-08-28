#!/usr/bin/env node

import { 
  getSuggestedQuestions,
  getSuggestedQuestionsIntelligent,
  getSuggestedQuestionsHybrid
} from '../src/utils/questionUtils';

console.log('🧠 Comparando Análisis Tradicional vs Inteligente\n');

// Casos de prueba que demuestran la diferencia
const testCases = [
  {
    name: 'Texto de Relleno (Filler)',
    text: `Este es un ejemplo de texto que no contiene información muy relevante. Es simplemente texto que se utiliza para llenar espacio sin aportar conceptos importantes. Puede ser útil como ejemplo pero no requiere muchas preguntas para evaluar la comprensión del estudiante.`,
    expected: 'Debería sugerir pocas preguntas (1-2)'
  },
  {
    name: 'Contenido Teórico Denso',
    text: `La fotosíntesis es el proceso fundamental mediante el cual las plantas verdes y otros organismos autótrofos convierten la energía lumínica en energía química. Este proceso esencial consiste en dos fases principales: las reacciones dependientes de luz (fase lumínica) y el ciclo de Calvin (fase oscura). La clorofila es el pigmento crucial que captura la energía solar. La ecuación química básica es: 6CO2 + 6H2O + energía lumínica → C6H12O6 + 6O2.`,
    expected: 'Debería sugerir muchas preguntas (4-6)'
  },
  {
    name: 'Lista de Procedimientos',
    text: `Para instalar el software, sigue estos pasos importantes: 1) Descarga el archivo desde la página oficial. 2) Ejecuta el instalador como administrador. 3) Acepta los términos y condiciones. 4) Selecciona la carpeta de instalación. 5) Espera a que complete la instalación. 6) Reinicia el sistema si es necesario.`,
    expected: 'Debería sugerir preguntas moderadas (3-4)'
  },
  {
    name: 'Definiciones Técnicas Críticas',
    text: `La inteligencia artificial (IA) es una disciplina fundamental de la informática que se caracteriza por crear sistemas capaces de realizar tareas que tradicionalmente requieren inteligencia humana. Los conceptos esenciales incluyen: machine learning, que significa aprendizaje automático; deep learning, que consiste en redes neuronales profundas; y algoritmos, que definen las instrucciones precisas para resolver problemas.`,
    expected: 'Debería sugerir muchas preguntas (5-7)'
  }
];

async function runTests() {
  for (const testCase of testCases) {
    console.log(`📝 **${testCase.name}**`);
    console.log(`Texto: "${testCase.text.substring(0, 100)}..."`);
    console.log(`Expectativa: ${testCase.expected}\n`);
    
    // Análisis tradicional
    const traditionalCount = getSuggestedQuestions(testCase.text);
    console.log(`🔢 Tradicional (palabras): ${traditionalCount} preguntas`);
    
    // Análisis inteligente
    try {
      const intelligentAnalysis = await getSuggestedQuestionsIntelligent(testCase.text);
      console.log(`🧠 Inteligente: ${intelligentAnalysis.suggestedQuestions} preguntas`);
      console.log(`   📊 Tipo: ${intelligentAnalysis.contentType}`);
      console.log(`   🎯 Densidad: ${intelligentAnalysis.conceptDensity}`);
      console.log(`   ⭐ Importancia: ${intelligentAnalysis.importance}`);
      console.log(`   💭 Razón: ${intelligentAnalysis.reasoning}`);
      
      // Mostrar diferencia
      const difference = intelligentAnalysis.suggestedQuestions - traditionalCount;
      const diffIcon = difference > 0 ? '📈' : difference < 0 ? '📉' : '➡️';
      console.log(`   ${diffIcon} Diferencia: ${difference > 0 ? '+' : ''}${difference}`);
      
    } catch (error) {
      console.log(`❌ Error en análisis inteligente: ${error}`);
    }
    
    console.log('─'.repeat(60) + '\n');
  }
}

// Función para demostrar análisis híbrido
async function demonstrateHybrid() {
  console.log('🔄 **Demostración del Análisis Híbrido**\n');
  
  const sampleText = `La mecánica cuántica es la teoría fundamental que describe el comportamiento de la materia y energía a escalas microscópicas. Los principios básicos incluyen la dualidad onda-partícula, el principio de incertidumbre de Heisenberg, y la superposición cuántica. Estos conceptos revolucionaron nuestra comprensión de la física moderna.`;
  
  console.log('Texto de ejemplo: Mecánica cuántica...\n');
  
  // Con análisis inteligente
  const hybridWithAI = await getSuggestedQuestionsHybrid(sampleText, true);
  console.log('🧠 Con análisis inteligente:');
  console.log(`   Preguntas sugeridas: ${hybridWithAI.questions}`);
  if (hybridWithAI.analysis) {
    console.log(`   Razonamiento: ${hybridWithAI.analysis.reasoning}`);
  }
  console.log();
  
  // Sin análisis inteligente (tradicional)
  const hybridTraditional = await getSuggestedQuestionsHybrid(sampleText, false);
  console.log('🔢 Solo análisis tradicional:');
  console.log(`   Preguntas sugeridas: ${hybridTraditional.questions}`);
  console.log();
}

// Ejecutar pruebas
console.log('Iniciando pruebas...\n');
runTests().then(() => {
  return demonstrateHybrid();
}).then(() => {
  console.log('✅ Pruebas completadas');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
}); 