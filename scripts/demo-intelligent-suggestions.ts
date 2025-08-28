#!/usr/bin/env node

import { 
  getSuggestedQuestions,
  getSuggestedQuestionsIntelligent,
  getSuggestedQuestionsHybrid
} from '../src/utils/questionUtils';

console.log('🚀 DEMO: Sugerencias Inteligentes de Preguntas\n');

// Ejemplos de contenido educativo
const examples = [
  {
    title: '📚 Texto Educativo - Fotosíntesis',
    content: `La fotosíntesis es el proceso fundamental mediante el cual las plantas verdes convierten la energía lumínica en energía química. Este proceso esencial consiste en dos fases principales: la fase lumínica, que ocurre en los tilacoides, y el ciclo de Calvin, que tiene lugar en el estroma del cloroplasto. La clorofila es el pigmento crucial que captura la energía solar. La ecuación química global es: 6CO2 + 6H2O + energía lumínica → C6H12O6 + 6O2.`
  },
  {
    title: '⚖️ Texto Legal - Procedimiento',
    content: `Para solicitar la revisión de una resolución administrativa, el interesado deberá presentar recurso de alzada en el plazo de un mes desde la notificación. El recurso se dirigirá al órgano superior jerárquico del que dictó la resolución impugnada. La documentación requerida incluye: instancia de recurso, copia de la resolución recurrida, y justificación de los motivos de impugnación.`
  },
  {
    title: '💻 Texto Técnico - Programación',
    content: `React Hooks son funciones que permiten usar estado y otras características de React sin escribir una clase. Los hooks más comunes incluyen useState para gestionar el estado local, useEffect para efectos secundarios, y useContext para acceder al contexto. Importante: los hooks deben llamarse siempre en el mismo orden y nunca dentro de loops, condiciones o funciones anidadas.`
  },
  {
    title: '📰 Texto de Relleno',
    content: `Este es un ejemplo de texto que no contiene mucha información relevante. Es simplemente texto utilizado para llenar espacio sin aportar conceptos importantes o técnicos. Puede ser útil como ejemplo pero no requiere muchas preguntas para evaluar comprensión.`
  }
];

async function runDemo() {
  for (const example of examples) {
    console.log(`${example.title}`);
    console.log('─'.repeat(60));
    console.log(`📝 Contenido: "${example.content.substring(0, 80)}..."`);
    console.log();

    // Método tradicional
    const traditional = getSuggestedQuestions(example.content);
    console.log(`🔢 Tradicional: ${traditional} preguntas (1 cada 100 palabras)`);

    // Método inteligente
    try {
      console.log(`🧠 Analizando contenido...`);
      const intelligent = await getSuggestedQuestionsIntelligent(example.content);
      
      console.log(`🧠 Inteligente: ${intelligent.suggestedQuestions} preguntas`);
      console.log(`   📊 Tipo: ${intelligent.contentType}`);
      console.log(`   🎯 Densidad: ${intelligent.conceptDensity}`);
      console.log(`   ⭐ Importancia: ${intelligent.importance}`);
      
      // Diferencia
      const diff = intelligent.suggestedQuestions - traditional;
      const diffIcon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      const diffText = diff > 0 ? `+${diff}` : diff.toString();
      
      console.log(`   ${diffIcon} Diferencia: ${diffText} (${Math.round((diff/traditional)*100)}%)`);
      
      // Razón detallada
      console.log(`   💭 Razón: ${intelligent.reasoning}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }

    console.log();
    console.log('═'.repeat(60));
    console.log();
  }

  // Demostración comparativa
  console.log('🔍 COMPARACIÓN RÁPIDA:\n');
  
  const comparisonText = `La inteligencia artificial (IA) define sistemas capaces de realizar tareas que tradicionalmente requieren inteligencia humana. Los conceptos fundamentales incluyen machine learning, que significa aprendizaje automático mediante algoritmos; deep learning, que consiste en redes neuronales profundas; y procesamiento de lenguaje natural (NLP), crucial para la comprensión de texto.`;
  
  console.log('📄 Texto de prueba: Definición de IA');
  console.log();
  
  const tradResult = getSuggestedQuestions(comparisonText);
  const intResult = await getSuggestedQuestionsIntelligent(comparisonText);
  
  console.log(`🔢 Método tradicional: ${tradResult} preguntas`);
  console.log(`🧠 Método inteligente: ${intResult.suggestedQuestions} preguntas`);
  console.log(`📊 Tipo detectado: ${intResult.contentType}`);
  console.log(`🎯 Densidad conceptual: ${intResult.conceptDensity}`);
  console.log();
  
  console.log('✅ DEMO COMPLETADA');
  console.log('🎯 La funcionalidad está lista para usar en la interfaz!');
}

console.log('Iniciando demostración...\n');
runDemo().catch(console.error); 