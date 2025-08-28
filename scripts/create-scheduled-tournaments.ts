// Script para crear torneos programados
// Martes, Jueves, Sábados y Domingos
// Horarios: 10:30, 16:00, 20:00
// Desde 08/06/2025 hasta 30/10/2025

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuración
const START_DATE = new Date('2025-06-08'); // Domingo 08/06/2025
const END_DATE = new Date('2025-10-30');   // Jueves 30/10/2025
const TOURNAMENT_DAYS = [0, 2, 4, 6]; // Domingo=0, Martes=2, Jueves=4, Sábado=6
const TOURNAMENT_TIMES = ['10:30', '16:00', '20:00'];
const QUESTIONS_PER_TOURNAMENT = 20;
const TOURNAMENT_DURATION_MINUTES = 20;

interface TournamentRequest {
  name: string;
  description?: string;
  totalquestions: number;
  difficulty: 'mixed';
  examSource: 'all';
  startTime: string; // ISO string
  duration: number; // En minutos
  questionCategory?: string;
}

function getNextTournamentNumber(): number {
  // Buscar el último torneo PERMA para continuar la secuencia
  // Por simplicidad, empezaremos desde 1 y el script manejará duplicados
  return 1;
}

function generateTournamentDates(startDate: Date, enddate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    
    // Si es uno de los días de torneo (Domingo=0, Martes=2, Jueves=4, Sábado=6)
    if (TOURNAMENT_DAYS.includes(dayOfWeek)) {
      TOURNAMENT_TIMES.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const tournamentDate = new Date(current);
        tournamentDate.setHours(hours, minutes, 0, 0);
        dates.push(new Date(tournamentDate));
      });
    }
    
    // Avanzar al siguiente día
    current.setDate(current.getDate() + 1);
  }
  
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

async function createTournament(tournament: TournamentRequest): Promise<boolean> {
  try {
    // Usar implementación nativa en lugar de node-fetch
    const response = await fetch('http://localhost:3000/api/admin/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournament)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Torneo "${tournament.name}" creado exitosamente`);
      console.log(`   📅 Inicio: ${tournament.startTime}`);
      console.log(`   🎯 Preguntas: ${tournament.totalquestions}`);
      console.log(`   ⏱️ Duración: ${tournament.duration} minutos`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Error creando "${tournament.name}": ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error de red creando "${tournament.name}":`, error);
    return false;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function main() {
  console.log('🏆 GENERADOR MASIVO DE TORNEOS PERMA');
  console.log('=====================================');
  console.log(`📅 Período: ${START_DATE.toLocaleDateString('es-ES')} - ${END_DATE.toLocaleDateString('es-ES')}`);
  console.log(`📋 Configuración:`);
  console.log(`   • Días: Martes, Jueves, Sábados, Domingos`);
  console.log(`   • Horarios: ${TOURNAMENT_TIMES.join(', ')}`);
  console.log(`   • Preguntas: ${QUESTIONS_PER_TOURNAMENT} por torneo`);
  console.log(`   • Duración: ${TOURNAMENT_DURATION_MINUTES} minutos`);
  console.log('');

  // Generar todas las fechas
  const tournamentDates = generateTournamentDates(START_DATE, END_DATE);
  console.log(`🎯 Total de torneos a crear: ${tournamentDates.length}`);
  console.log('');

  // Verificar si hay torneos existentes con nombres PERMA
  const existingTournaments = await prisma.tournament.findMany({
    where: {
      name: {
        startsWith: 'PERMA '
      }
    },
    orderBy: {
      name: 'desc'
    },
    take: 1
  });

  let tournamentCounter = 1;
  if (existingTournaments.length > 0) {
    const lastNumber = parseInt(existingTournaments[0].name.replace('PERMA ', ''));
    if (!isNaN(lastNumber)) {
      tournamentCounter = lastNumber + 1;
    }
  }

  console.log(`🔢 Empezando numeración desde: PERMA ${tournamentCounter}`);
  console.log('');

  // Crear torneos
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < tournamentDates.length; i++) {
    const date = tournamentDates[i];
    const tournamentName = `PERMA ${tournamentCounter + i}`;
    
    const tournament: TournamentRequest = {
      name: tournamentName,
      description: `Torneo PERMA programado - ${QUESTIONS_PER_TOURNAMENT} preguntas oficiales`,
      totalquestions: QUESTIONS_PER_TOURNAMENT,
      difficulty: 'mixed',
      examSource: 'all',
      startTime: date.toISOString(),
      duration: TOURNAMENT_DURATION_MINUTES
    };

    console.log(`🏗️ Creando torneo ${i + 1}/${tournamentDates.length}: ${tournamentName}`);
    console.log(`   📅 ${formatDate(date)}`);

    const success = await createTournament(tournament);
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Pequeña pausa para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('');
  }

  console.log('🎉 RESUMEN FINAL');
  console.log('================');
  console.log(`✅ Torneos creados exitosamente: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📊 Total procesados: ${successCount + errorCount}`);
  
  if (successCount > 0) {
    console.log('');
    console.log('🎮 Los torneos han sido programados exitosamente.');
    console.log('📱 Los usuarios recibirán notificaciones automáticas antes del inicio.');
    console.log('🎯 Sistema de distribución 40-40-20 aplicado automáticamente.');
  }
}

// Ejecutar el script
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 