import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de las 100 preguntas del examen oficial
const questionsData = [
  {
    questionnumber: 1,
    question: "¿Cuál es la capital de España?",
    options: ["Madrid", "Barcelona", "Valencia", "Sevilla"],
    correctanswerindex: 0,
    category: "Geografía",
    difficulty: "easy"
  },
  {
    questionnumber: 2,
    question: "¿En qué año se aprobó la Constitución Española actual?",
    options: ["1976", "1977", "1978", "1979"],
    correctanswerindex: 2,
    category: "Historia",
    difficulty: "medium"
  },
  // Agregar las 98 preguntas restantes...
  // Por ahora insertamos solo 10 preguntas para probar el sistema
  {
    questionnumber: 3,
    question: "¿Cuántas comunidades autónomas tiene España?",
    options: ["15", "16", "17", "18"],
    correctanswerindex: 2,
    category: "Geografía",
    difficulty: "medium"
  },
  {
    questionnumber: 4,
    question: "¿Quién es el Jefe del Estado en España?",
    options: ["El Presidente", "El Rey", "El Primer Ministro", "El Ministro de Defensa"],
    correctanswerindex: 1,
    category: "Política",
    difficulty: "easy"
  },
  {
    questionnumber: 5,
    question: "¿Cuál es el río más largo de España?",
    options: ["Ebro", "Duero", "Tajo", "Guadalquivir"],
    correctanswerindex: 2,
    category: "Geografía",
    difficulty: "medium"
  }
];

// Generar más preguntas genéricas para completar las 100
for (let i = 6; i <= 100; i++) {
  questionsData.push({
    questionnumber: i,
    question: `Pregunta de prueba número ${i} del Examen Oficial de Permanencia 2018`,
    options: [
      `Opción A para pregunta ${i}`,
      `Opción B para pregunta ${i}`,
      `Opción C para pregunta ${i}`,
      `Opción D para pregunta ${i}`
    ],
    correctanswerindex: Math.floor(Math.random() * 4),
    category: ["General", "Militar", "Administrativa", "Legal"][Math.floor(Math.random() * 4)],
    difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)]
  });
}

async function populateExamen2018() {
  try {
    console.log('🚀 Iniciando población de ExamenOficial2018...');
    
    // Limpiar tabla existente
    console.log('🗑️ Limpiando tabla existente...');
    await prisma.examenOficial2018.deleteMany({});
    
    // Insertar preguntas
    console.log('📝 Insertando preguntas...');
    let insertedCount = 0;
    
    for (const questionData of questionsData) {
      try {
        await prisma.examenOficial2018.create({
          data: {
            questionnumber: questionData.questionnumber,
            question: questionData.question,
            options: questionData.options,
            correctanswerindex: questionData.correctanswerindex,
            category: questionData.category,
            difficulty: questionData.difficulty,
            isactive: true
          }
        });
        insertedCount++;
        
        if (insertedCount % 10 === 0) {
          console.log(`✅ Insertadas ${insertedCount} preguntas...`);
        }
      } catch (error) {
        console.error(`❌ Error insertando pregunta ${questionData.questionnumber}:`, error);
      }
    }
    
    // Verificar inserción
    const totalQuestions = await prisma.examenOficial2018.count();
    console.log(`🎯 Total de preguntas insertadas: ${totalQuestions}`);
    
    // Mostrar algunas preguntas de muestra
    const sampleQuestions = await prisma.examenOficial2018.findMany({
      take: 3,
      orderBy: { questionnumber: 'asc' }
    });
    
    console.log('📋 Muestra de preguntas:');
    sampleQuestions.forEach(q => {
      console.log(`  ${q.questionnumber}. ${q.question.substring(0, 50)}...`);
    });
    
    console.log('✅ Población completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en población:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateExamen2018(); 