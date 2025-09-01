import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Documentos con preguntas integradas
const documentosConPreguntas = [
  {
    title: "Matemáticas Básicas",
    content: "Preguntas básicas de matemáticas para oposiciones",
    type: "quiz",
    date: new Date(),
    preguntas: [
      {
        content: '{"question": "¿Cuál es el resultado de 2+2?", "options": ["3", "4", "5", "6"], "correct": 1, "explanation": "2+2 = 4. Es una suma básica."}',
        type: "multiple_choice",
        difficulty: "easy"
      },
      {
        content: '{"question": "¿Cuál es la raíz cuadrada de 64?", "options": ["6", "7", "8", "9"], "correct": 2, "explanation": "La raíz cuadrada de 64 es 8, porque 8 × 8 = 64."}',
        type: "multiple_choice", 
        difficulty: "medium"
      }
    ]
  },
  {
    title: "Historia Universal",
    content: "Preguntas de historia para oposiciones",
    type: "quiz",
    date: new Date(),
    preguntas: [
      {
        content: '{"question": "¿En qué año comenzó la Segunda Guerra Mundial?", "options": ["1938", "1939", "1940", "1941"], "correct": 1, "explanation": "La Segunda Guerra Mundial comenzó el 1 de septiembre de 1939 con la invasión de Polonia."}',
        type: "multiple_choice",
        difficulty: "medium"
      }
    ]
  },
  {
    title: "Ciencias Naturales",
    content: "Preguntas de ciencias para oposiciones",
    type: "quiz", 
    date: new Date(),
    preguntas: [
      {
        content: '{"question": "¿Cuál es el planeta más cercano al Sol?", "options": ["Venus", "Mercurio", "Tierra", "Marte"], "correct": 1, "explanation": "Mercurio es el planeta más cercano al Sol en nuestro sistema solar."}',
        type: "multiple_choice",
        difficulty: "easy"
      }
    ]
  },
  {
    title: "Literatura Española",
    content: "Preguntas de literatura española",
    type: "quiz",
    date: new Date(),
    preguntas: [
      {
        content: '{"question": "¿Quién escribió Don Quijote de la Mancha?", "options": ["Lope de Vega", "Miguel de Cervantes", "Francisco de Quevedo", "Calderón de la Barca"], "correct": 1, "explanation": "Miguel de Cervantes Saavedra escribió esta obra maestra de la literatura española."}',
        type: "multiple_choice",
        difficulty: "medium"
      }
    ]
  },
  {
    title: "Geografía Mundial",
    content: "Preguntas de geografía mundial",
    type: "quiz",
    date: new Date(),
    preguntas: [
      {
        content: '{"question": "¿Cuál es la capital de Francia?", "options": ["Lyon", "Marsella", "París", "Toulouse"], "correct": 2, "explanation": "París es la capital y ciudad más poblada de Francia."}',
        type: "multiple_choice",
        difficulty: "easy"
      },
      {
        content: '{"question": "¿En qué continente está ubicado Egipto?", "options": ["Asia", "África", "Europa", "América"], "correct": 1, "explanation": "Egipto está ubicado en el continente africano, en el noreste de África."}',
        type: "multiple_choice",
        difficulty: "easy"
      }
    ]
  }
];

const usuariosTelegram = [
  {
    telegramuserid: "123456789",
    firstname: "Carlos",
    username: "carlos_opomelilla"
  },
  {
    telegramuserid: "987654321", 
    firstname: "Ana",
    username: "ana_estudiosa"
  },
  {
    telegramuserid: "456789123",
    firstname: "Miguel", 
    username: "miguel_smart"
  },
  {
    telegramuserid: "789123456",
    firstname: "Laura",
    username: "laura_quiz"
  },
  {
    telegramuserid: "321654987",
    firstname: "Pedro",
    username: "pedro_genio"
  }
];

async function populateAllTables() {
  try {
    console.log('🚀 POBLANDO TODAS LAS TABLAS');
    console.log('============================');
    
    // 1. Limpiar tablas (en orden correcto por dependencias)
    console.log('🧹 Limpiando tablas...');
    await prisma.userReward.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.userGoal.deleteMany();
    await prisma.telegramResponse.deleteMany();
    await prisma.telegrampoll.deleteMany();
    await prisma.telegramSendLog.deleteMany();
    await prisma.telegramuser.deleteMany();
    await prisma.reward.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.question.deleteMany();
    await prisma.document.deleteMany();
    
    // 2. Crear documentos con preguntas
    console.log('📚 Creando documentos con preguntas...');
    const documentRecords = [];
    const questionRecords = [];
    
    for (const doc of documentosConPreguntas) {
      const document = await prisma.document.create({
        data: {
          title: doc.title,
          content: doc.content,
          type: doc.type,
          date: doc.date,
          questionCount: doc.preguntas.length
        }
      });
      documentRecords.push(document);
      console.log(`  ✅ Documento: ${doc.title}`);
      
      // Crear preguntas para este documento
      for (const pregunta of doc.preguntas) {
        const question = await prisma.question.create({
          data: {
            documentId: document.id,
            content: pregunta.content,
            type: pregunta.type,
            difficulty: pregunta.difficulty,
            bloomLevel: "comprension"
          }
        });
        questionRecords.push(question);
      }
    }
    
    // 3. Crear achievements
    console.log('🏆 Creando achievements...');
    const achievements = [
      {
        id: 'first_response',
        name: 'Primera Respuesta',
        description: 'Responde tu primera pregunta',
        icon: '🎯',
        points: 50,
        category: 'milestone',
        condition: JSON.stringify({ type: 'first_response' }),
        rarity: 'common'
      },
      {
        id: 'streak_3',
        name: 'Racha de 3',
        description: 'Mantén una racha de 3 días respondiendo',
        icon: '🔥',
        points: 100,
        category: 'streak',
        condition: JSON.stringify({ type: 'streak', days: 3 }),
        rarity: 'common'
      },
      {
        id: 'streak_7',
        name: 'Racha de 7',
        description: 'Mantén una racha de 7 días respondiendo',
        icon: '🔥',
        points: 250,
        category: 'streak',
        condition: JSON.stringify({ type: 'streak', days: 7 }),
        rarity: 'rare'
      },
      {
        id: 'speedster',
        name: 'Velocista',
        description: 'Responde en menos de 10 segundos',
        icon: '⚡',
        points: 200,
        category: 'speed',
        condition: JSON.stringify({ type: 'speed', maxTime: 10 }),
        rarity: 'rare'
      },
      {
        id: 'sniper',
        name: 'Francotirador',
        description: 'Obtén 90% de precisión con 10+ respuestas',
        icon: '🎯',
        points: 300,
        category: 'accuracy',
        condition: JSON.stringify({ type: 'accuracy', percentage: 90, minResponses: 10 }),
        rarity: 'epic'
      },
      {
        id: 'centurion',
        name: 'Centurión',
        description: 'Responde 100 preguntas',
        icon: '💯',
        points: 500,
        category: 'volume',
        condition: JSON.stringify({ type: 'volume', count: 100 }),
        rarity: 'legendary'
      }
    ];
    
    for (const ach of achievements) {
      await prisma.achievement.create({ data: ach });
      console.log(`  ✅ ${ach.name}`);
    }
    
    // 4. Crear usuarios de Telegram
    console.log('👥 Creando usuarios de Telegram...');
    const telegramUserRecords = [];
    for (let i = 0; i < usuariosTelegram.length; i++) {
      const userData = usuariosTelegram[i];
      const points = Math.floor(Math.random() * 1000) + 100;
      const user = await prisma.telegramuser.create({
        data: {
          telegramuserid: userData.telegramuserid,
          firstname: userData.firstname,
          username: userData.username,
          totalpoints: points,
          level: Math.floor(points / 100) + 1,
          streak: Math.floor(Math.random() * 5),
          bestStreak: Math.floor(Math.random() * 10) + 5
        }
      });
      telegramUserRecords.push(user);
      console.log(`  ✅ ${userData.firstname} (@${userData.username})`);
    }
    
    // 5. Crear polls de Telegram (historial)
    console.log('📊 Creando polls históricos...');
    const pollRecords = [];
    for (let i = 0; i < 5; i++) {
      const question = questionRecords[Math.floor(Math.random() * questionRecords.length)];
      const questionData = JSON.parse(question.content);
      
      const poll = await prisma.telegrampoll.create({
        data: {
          pollid: `poll_${randomUUID()}`,
          questionid: question.id,
          sourcemodel: 'document',
          options: questionData.options,
          correctanswerindex: questionData.correct,
          chatid: '-1002352049779', // Tu chat ID
          sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
        }
      });
      pollRecords.push(poll);
      console.log(`  ✅ Poll para: ${questionData.question.substring(0, 30)}...`);
    }
    
    // 6. Crear respuestas históricas
    console.log('💬 Creando respuestas históricas...');
    for (const poll of pollRecords) {
      // Cada poll tiene 2-4 respuestas aleatorias
      const numResponses = Math.floor(Math.random() * 3) + 2;
      const usedUsers = new Set();
      
      for (let i = 0; i < numResponses; i++) {
        let randomUser;
        do {
          randomUser = telegramUserRecords[Math.floor(Math.random() * telegramUserRecords.length)];
        } while (usedUsers.has(randomUser.id) && usedUsers.size < telegramUserRecords.length);
        
        usedUsers.add(randomUser.id);
        
        const iscorrect = Math.random() > 0.3; // 70% correctas
        const responsetime = Math.floor(Math.random() * 120) + 5; // 5-125 segundos
        const points = iscorrect ? (responsetime < 10 ? 25 : 10) : 5;
        
        await prisma.telegramResponse.create({
          data: {
            userid: randomUser.id,
            questionid: poll.questionid,
            telegramMsgId: `msg_${randomUUID()}`,
            iscorrect,
            responsetime,
            points
          }
        });
      }
    }
    console.log(`  ✅ Respuestas creadas para todos los polls`);
    
    // 7. Asignar achievements aleatorios
    console.log('🏅 Asignando achievements...');
    const allAchievements = await prisma.achievement.findMany();
    for (const user of telegramUserRecords) {
      // Cada usuario tiene 1-3 achievements aleatorios
      const numAchievements = Math.floor(Math.random() * 3) + 1;
      const userAchievements = allAchievements
        .sort(() => 0.5 - Math.random())
        .slice(0, numAchievements);
      
      for (const achievement of userAchievements) {
        await prisma.userAchievement.create({
          data: {
            userid: user.id,
            achievementId: achievement.id,
            unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        });
      }
      console.log(`  ✅ ${user.firstname}: ${userAchievements.length} achievements`);
    }
    
    // 8. Crear logs de envío
    console.log('📤 Creando logs de envío...');
    for (let i = 0; i < 10; i++) {
      const question = questionRecords[Math.floor(Math.random() * questionRecords.length)];
      await prisma.telegramSendLog.create({
        data: {
          questionid: question.id,
          sourcemodel: 'document',
          sendTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
          success: Math.random() > 0.1, // 90% exitosos
          telegramMsgId: `msg_${randomUUID()}`
        }
      });
    }
    console.log(`  ✅ 10 logs de envío creados`);
    
    // 9. Crear algunas recompensas
    console.log('🎁 Creando recompensas...');
    const rewards = [
      { name: 'Badge Principiante', description: 'Badge para usuarios nuevos', cost: 100, type: 'badge', icon: '🔰' },
      { name: 'Título Experto', description: 'Título para usuarios expertos', cost: 500, type: 'title', icon: '🎓' },
      { name: 'Badge Maestro', description: 'Badge para maestros del quiz', cost: 1000, type: 'badge', icon: '👑' }
    ];
    
    for (const reward of rewards) {
      await prisma.reward.create({ data: reward });
      console.log(`  ✅ ${reward.name}`);
    }
    
    // 10. Estadísticas finales
    console.log('');
    console.log('📊 ESTADÍSTICAS FINALES');
    console.log('=======================');
    
    const stats = {
      documentos: await prisma.document.count(),
      preguntas: await prisma.question.count(),
      usuarios: await prisma.telegramuser.count(),
      polls: await prisma.telegrampoll.count(),
      respuestas: await prisma.telegramResponse.count(),
      achievements: await prisma.achievement.count(),
      userAchievements: await prisma.userAchievement.count(),
      sendLogs: await prisma.telegramSendLog.count(),
      rewards: await prisma.reward.count()
    };
    
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`✅ ${key}: ${value}`);
    });
    
    console.log('');
    console.log('🎉 ¡TODAS LAS TABLAS POBLADAS EXITOSAMENTE!');
    console.log('🌐 Ve al dashboard: http://localhost:3000/dashboard');
    console.log('🎮 Ve a gamificación: http://localhost:3000/dashboard/gamification');
    console.log('💡 Ahora puedes probar enviar una pregunta manual con:');
    console.log('   npx tsx scripts/final-simple-test.ts');
    
  } catch (error) {
    console.error('❌ Error poblando tablas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateAllTables(); 