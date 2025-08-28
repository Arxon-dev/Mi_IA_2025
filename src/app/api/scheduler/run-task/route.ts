import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TaskRequest {
  task: string;
}

const VALID_TASKS = ['notifications', 'poll', 'monitor', 'ranking-general', 'ranking-weekly'];

export async function POST(request: NextRequest) {
  try {
    const { task }: TaskRequest = await request.json();
    
    // Validar que la tarea sea válida
    if (!VALID_TASKS.includes(task)) {
      return NextResponse.json(
        { error: `Tarea inválida. Tareas válidas: ${VALID_TASKS.join(', ')}` },
        { status: 400 }
      );
    }
    
    console.log(`🔧 Ejecutando tarea manual: ${task}`);
    
    let command = '';
    
    switch (task) {
      case 'notifications':
        command = 'npx tsx scripts/smart-notifications.ts';
        break;
      case 'poll':
        command = 'npx tsx scripts/auto-send-daily-poll.ts';
        break;
      case 'monitor':
        command = 'npx tsx scripts/monitor-system.ts --quiet';
        break;
      case 'ranking-general':
        command = 'npx tsx scripts/auto-ranking-scheduler.ts --test';
        break;
      case 'ranking-weekly':
        command = 'npx tsx scripts/weekly-ranking-scheduler.ts --test';
        break;
      default:
        return NextResponse.json(
          { error: 'Tarea no reconocida' },
          { status: 400 }
        );
    }
    
    // Ejecutar el comando
    const { stdout, stderr } = await execAsync(command);
    
    const success = !stderr || stderr.length === 0;
    
    console.log(`${success ? '✅' : '❌'} Tarea ${task} ${success ? 'completada' : 'falló'}`);
    
    return NextResponse.json({
      success,
      task,
      output: stdout,
      error: stderr || null,
      message: `Tarea ${task} ${success ? 'ejecutada exitosamente' : 'falló'}`
    });
    
  } catch (error: any) {
    console.error('Error ejecutando tarea:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido',
      message: 'Error ejecutando la tarea'
    }, { status: 500 });
  }
} 