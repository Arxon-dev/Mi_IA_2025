import { NextRequest, NextResponse } from 'next/server';

// ==========================================
// 🧪 ENDPOINT DE PRUEBA: SIMULAR QUIZ COMPLETADO
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 ======== SIMULANDO QUIZ COMPLETADO ========');

    const body = await request.json();
    const { 
      moodleUserId = 2, // Por defecto usuario administrador opomelilla
      totalQuestions = 20,
      correctAnswers = 15,
      subject = 'constitucion'
    } = body;

    // Preparar datos del quiz simulado (formato completo)
    const quizData = {
      moodleUserId: moodleUserId,
      totalquestions: totalQuestions,
      correctAnswers: correctAnswers,
      scorePercentage: Math.round((correctAnswers / totalQuestions) * 100),
      timeSpent: totalQuestions * 45, // 45 segundos por pregunta
      subject: subject,
      quizName: `Quiz de Prueba ${subject}`,
      attemptId: Date.now(),
      questions: Array.from({ length: totalQuestions }, (_, i) => ({
        slot: i + 1,
        correct: i < correctAnswers,
        response_time: 30 + Math.floor(Math.random() * 30), // Entre 30-60s
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        question_name: `Pregunta ${i + 1}`
      })),
      timestamp: Math.floor(Date.now() / 1000)
    };

    console.log('📊 Datos del quiz simulado:', JSON.stringify(quizData, null, 2));

    // Enviar al webhook
    const response = await fetch('http://localhost:3000/api/moodle/quiz-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizData)
    });

    const result = await response.json();

    console.log('📈 Respuesta del webhook:', JSON.stringify(result, null, 2));

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Quiz simulado procesado exitosamente',
        simulatedQuiz: {
          moodleUserId,
          totalQuestions,
          correctAnswers,
          scorePercentage: quizData.scorePercentage,
          subject
        },
        webhookResponse: result
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error en el webhook',
        error: result
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error simulando quiz:', error);
    return NextResponse.json({
      success: false,
      message: 'Error simulando quiz',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simulador de Quiz Moodle',
    description: 'Endpoint para probar la integración Moodle-Telegram',
    usage: {
      method: 'POST',
      body: {
        moodleUserId: 'ID del usuario en Moodle (default: 2)',
        totalquestions: 'Número total de preguntas (default: 20)',
        correctAnswers: 'Número de respuestas correctas (default: 15)',
        subject: 'Materia del quiz (default: constitucion)'
      }
    },
    examples: [
      {
        description: 'Quiz básico de 20 preguntas',
        body: {
          moodleUserId: 2,
          totalquestions: 20,
          correctAnswers: 15,
          subject: 'constitucion'
        }
      },
      {
        description: 'Quiz perfecto de defensa nacional',
        body: {
          moodleUserId: 2,
          totalquestions: 10,
          correctAnswers: 10,
          subject: 'defensanacional'
        }
      }
    ]
  });
} 