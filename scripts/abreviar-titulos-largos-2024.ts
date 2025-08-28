import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function abreviarTitulosLargos() {
  console.log('✂️ ABREVIANDO TÍTULOS LARGOS EN EXAMEN 2024...\n');
  
  try {
    const allQuestions = await (prisma as any).examenOficial2024.findMany({
      orderBy: { questionnumber: 'asc' }
    });
    
    console.log(`📋 Total de preguntas: ${allQuestions.length}\n`);
    
    let preguntasActualizadas = 0;
    
    for (const question of allQuestions) {
      let questionText = question.question;
      let needsUpdate = false;
      
      // Aplicar abreviaciones específicas
      const abreviaciones = [
        {
          original: 'Instrucción 14/2021, por la que se desarrolla la Organización del E.T.',
          abreviada: 'INST. 14/2021, ET'
        },
        {
          original: 'Instrucción 55/2021, por la que se desarrolla la Organización Básica del Estado Mayor de la Defensa',
          abreviada: 'INST. 55/2021, EMAD'
        },
        {
          original: 'Instrucción 55/2021, por la que se desarrolla la Organización Básica del EMAD',
          abreviada: 'INST. 55/2021, EMAD'
        },
        {
          original: 'Instrucción 15/2021, por la que se desarrolla la Organización de la Armada',
          abreviada: 'INST. 15/2021, Armada'
        },
        {
          original: 'Constitución Española. Del Gobierno y la Administración.',
          abreviada: 'C.E. Gobierno y Admin.'
        },
        {
          original: 'Constitución Española. De las relaciones entre el Gobierno y las Cortes Generales.',
          abreviada: 'C.E. Gobierno-Cortes.'
        },
        {
          original: 'R.D. 205/2024, por el que se desarrolla la estructura Orgánica Básica del MINISDEF.',
          abreviada: 'RD 205/2024, MINISDEF.'
        },
        {
          original: 'R.D. 521/2020, por el que se establece la Organización Básica de las Fuerzas Armadas.',
          abreviada: 'RD 521/2020, FFAA.'
        },
        {
          original: 'Orden Def/264/2023, por la que se desarrolla la Organización Básica del Ejército del Aire y del Espacio.',
          abreviada: 'O. DEF/264/2023, Ejército Aire.'
        },
        {
          original: 'La Ley Orgánica de derechos y deberes de los miembros de las Fuerzas Armadas.',
          abreviada: 'L.O. derechos/deberes FFAA.'
        },
        {
          original: 'La Ley Orgánica de régimen disciplinario',
          abreviada: 'L.O. régimen disciplinario'
        },
        {
          original: 'Reales Ordenanzas (RR.OO)para las Fuerzas Armadas (FA,s).',
          abreviada: 'RR.OO. FFAA.'
        },
        {
          original: 'Real Decreto 176/2014 por el que se regula el procedimiento para la tramitación de las iniciativas',
          abreviada: 'RD 176/2014, procedimiento iniciativas'
        },
        {
          original: 'Ley Orgánica 3/2007, de 22 de marzo, para la igualdad efectiva de mujeres y hombres',
          abreviada: 'L.O. 3/2007, igualdad'
        },
        {
          original: 'Real Decreto 1150/2021, por el que se aprueba la Estrategia de Seguridad Nacional 2021',
          abreviada: 'RD 1150/2021, ESN 2021'
        },
        {
          original: 'PDC-01(A) Tendencias del Conflicto',
          abreviada: 'PDC-01(A) Tendencias'
        },
        {
          original: 'PDC-01(A) Organización del Espacio de las Operaciones',
          abreviada: 'PDC-01(A) Esp. Operaciones'
        },
        {
          original: 'PDC-01(A) Empleo de la Fuerza en Operaciones',
          abreviada: 'PDC-01(A) Empleo Fuerza'
        }
      ];
      
      // Aplicar cada abreviación
      abreviaciones.forEach(({ original, abreviada }) => {
        if (questionText.includes(original)) {
          questionText = questionText.replace(original, abreviada);
          needsUpdate = true;
        }
      });
      
      // Si se realizaron cambios, actualizar en la BD
      if (needsUpdate) {
        // Calcular longitud antes y después
        const header = `🎯 SIMULACRO EXAMEN 2024 - Pregunta ${question.questionnumber}/100\n⏰ Tiempo restante: 2h 52m\n`;
        const lengthBefore = header.length + question.question.length;
        const lengthAfter = header.length + questionText.length;
        const saved = lengthBefore - lengthAfter;
        
        console.log(`📝 Pregunta ${question.questionnumber}:`);
        console.log(`   📏 Antes: ${lengthBefore} chars`);
        console.log(`   📏 Después: ${lengthAfter} chars`);
        console.log(`   ✂️ Reducido: ${saved} chars`);
        
        await (prisma as any).examenOficial2024.update({
          where: { questionnumber: question.questionnumber },
          data: { question: questionText }
        });
        
        preguntasActualizadas++;
      }
    }
    
    console.log(`\n🎉 ABREVIACIÓN COMPLETADA:`);
    console.log(`✅ Preguntas actualizadas: ${preguntasActualizadas}`);
    console.log(`📄 Preguntas sin cambios: ${allQuestions.length - preguntasActualizadas}`);
    
    console.log('\n🧪 SIGUIENTE PASO:');
    console.log('npx tsx scripts/identificar-titulos-largos-2024.ts');
    
  } catch (error) {
    console.error('❌ Error abreviando títulos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

abreviarTitulosLargos(); 