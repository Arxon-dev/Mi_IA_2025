import { NextResponse } from 'next/server';
import { MoodleGamificationService } from '@/services/moodleGamificationService';

/**
 * Endpoint para recibir los resultados completos de un cuestionario desde Moodle
 * y actualizar la gamificación del usuario en Telegram.
 * 
 * Ruta: /api/moodle/update-gamification
 * Método: POST
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { moodleUserId, quizData } = body;

    console.log(`--- API /moodle/update-gamification ---`);
    console.log(`Received data for Moodle User ID: ${moodleUserId}`);
    console.log(`Quiz Data:`, JSON.stringify(quizData, null, 2));

    if (!moodleUserId || !quizData) {
      return NextResponse.json({ success: false, message: 'Faltan parámetros: moodleUserId y quizData son requeridos.' }, { status: 400 });
    }

    // Iterar sobre cada pregunta y procesarla individualmente
    // Esto asegura que cada pregunta actualice la gamificación (puntos, etc.)
    let processedCount = 0;
    for (const question of quizData.questions) {
      const updatePayload = {
        moodleUserId: moodleUserId,
        questionCorrect: question.correct,
        responsetime: question.response_time,
        subject: quizData.subject,
        difficulty: question.difficulty
      };

      const result = await MoodleGamificationService.processMoodleQuizResponse(updatePayload);
      
      if (result.success) {
        processedCount++;
      } else {
        console.warn(`Could not process question for user ${moodleUserId}. Reason: ${result.message}`);
      }
    }

    if (processedCount === quizData.questions.length) {
      console.log(`Successfully processed all ${processedCount} questions for user ${moodleUserId}.`);
      return NextResponse.json({ success: true, message: 'Sincronización completada.' });
    } else {
      console.error(`Processed only ${processedCount} out of ${quizData.questions.length} questions for user ${moodleUserId}.`);
      return NextResponse.json({ success: false, message: `Error procesando algunas preguntas.` }, { status: 500 });
    }

  } catch (error) {
    console.error('Error en /api/moodle/update-gamification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
    return NextResponse.json({ success: false, message: 'Error interno del servidor.', error: errorMessage }, { status: 500 });
  }
} 