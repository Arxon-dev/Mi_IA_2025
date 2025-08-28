import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const CONFIG_FILE = join(process.cwd(), 'scheduler-config.json');

interface SchedulerConfig {
  notifications: {
    enabled: boolean;
    intervalHours: number;
    enabledRules: string[];
  };
  dailyPolls: {
    enabled: boolean;
    time: string;
    frequency?: string;
    customMinutes?: number;
    startHour?: number;
    startMinute?: number;
    endHour?: number;
    endMinute?: number;
    questionsPerSend?: number;
  };
  monitoring: {
    enabled: boolean;
    intervalMinutes: number;
  };
  rankings: {
    general: {
      enabled: boolean;
      frequency: string;
      cronExpression: string;
      topUsersCount: number;
      showFailStats: boolean;
      includeWeeklyStats: boolean;
      showAccuracy: boolean;
      showAverageTime: boolean;
      includeMemes: boolean;
    };
    weekly: {
      enabled: boolean;
      frequency: string;
      cronExpression: string;
      topUsersCount: number;
      showAccuracy: boolean;
      showAverageTime: boolean;
      includeMemes: boolean;
      showComparison: boolean;
    };
  };
}

const DEFAULT_CONFIG: SchedulerConfig = {
  notifications: {
    enabled: true,
    intervalHours: 4,
    enabledRules: ['streak_encouragement', 'level_celebration']
  },
  dailyPolls: {
    enabled: true,
    time: '*/30 * * * *',
    frequency: 'custom',
    customMinutes: 30,
    startHour: 7,
    startMinute: 0,
    endHour: 23,
    endMinute: 0,
    questionsPerSend: 1
  },
  monitoring: {
    enabled: true,
    intervalMinutes: 30
  },
  rankings: {
    general: {
      enabled: true,
      frequency: 'every4h',
      cronExpression: '0 */4 * * *',
      topUsersCount: 8,
      showFailStats: true,
      includeWeeklyStats: true,
      showAccuracy: true,
      showAverageTime: true,
      includeMemes: true
    },
    weekly: {
      enabled: true,
      frequency: 'every4h',
      cronExpression: '0 */4 * * *',
      topUsersCount: 8,
      showAccuracy: true,
      showAverageTime: true,
      includeMemes: true,
      showComparison: true
    }
  }
};

export async function GET() {
  try {
    const configData = await readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    
    return NextResponse.json(config);
  } catch (error) {
    console.log('⚠️ Archivo de configuración no encontrado, usando default');
    
    // Crear archivo con configuración por defecto
    try {
      await writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return NextResponse.json(DEFAULT_CONFIG);
    } catch (writeError) {
      console.error('Error creando archivo de configuración:', writeError);
      return NextResponse.json(DEFAULT_CONFIG);
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const newConfig: SchedulerConfig = await request.json();
    
    // Validar estructura básica
    if (!newConfig.notifications || !newConfig.dailyPolls || !newConfig.monitoring) {
      return NextResponse.json(
        { error: 'Estructura de configuración inválida' },
        { status: 400 }
      );
    }
    
    // Validaciones específicas
    if (newConfig.notifications.intervalHours < 1 || newConfig.notifications.intervalHours > 24) {
      return NextResponse.json(
        { error: 'Intervalo de notificaciones debe estar entre 1 y 24 horas' },
        { status: 400 }
      );
    }
    
    if (newConfig.monitoring.intervalMinutes < 5 || newConfig.monitoring.intervalMinutes > 120) {
      return NextResponse.json(
        { error: 'Intervalo de monitoreo debe estar entre 5 y 120 minutos' },
        { status: 400 }
      );
    }
    
    if ((newConfig.dailyPolls.startHour !== undefined && (newConfig.dailyPolls.startHour < 0 || newConfig.dailyPolls.startHour > 23)) ||
        (newConfig.dailyPolls.endHour !== undefined && (newConfig.dailyPolls.endHour < 0 || newConfig.dailyPolls.endHour > 23))) {
      return NextResponse.json(
        { error: 'Horas deben estar entre 0 y 23' },
        { status: 400 }
      );
    }
    
    if (newConfig.dailyPolls.questionsPerSend !== undefined && 
        (newConfig.dailyPolls.questionsPerSend < 1 || newConfig.dailyPolls.questionsPerSend > 10)) {
      return NextResponse.json(
        { error: 'Cantidad de preguntas por envío debe estar entre 1 y 10' },
        { status: 400 }
      );
    }
    
    // Guardar configuración
    await writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    
    console.log('✅ Configuración del scheduler guardada');
    console.log('🔄 notification-scheduler.ts detectará el cambio automáticamente');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuración guardada exitosamente. Los cambios se aplicarán automáticamente.',
      config: newConfig 
    });
    
  } catch (error) {
    console.error('Error guardando configuración del scheduler:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 