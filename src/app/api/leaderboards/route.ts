import { NextRequest, NextResponse } from 'next/server';
import { createRankingSystem } from '../../../../scripts/advanced-ranking-system';

/**
 * 🏆 LEADERBOARDS API - STEP 5
 * 
 * Endpoint dinámico para obtener rankings por categorías:
 * - /api/leaderboards?category=OVERALL&timeframe=WEEKLY&limit=50
 * - /api/leaderboards?category=SPEED&timeframe=MONTHLY
 * - /api/leaderboards?category=ACCURACY&timeframe=ALL_TIME
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parámetros de consulta
    const category = searchParams.get('category') || 'OVERALL';
    const timeframe = searchParams.get('timeframe') || 'ALL_TIME';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Validar parámetros
    const validCategories = ['OVERALL', 'SPEED', 'ACCURACY', 'WEEKLY', 'MONTHLY'];
    const validTimeframes = ['ALL_TIME', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: 'Categoría inválida',
        validCategories 
      }, { status: 400 });
    }
    
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json({ 
        error: 'Timeframe inválido',
        validTimeframes 
      }, { status: 400 });
    }
    
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ 
        error: 'Límite debe estar entre 1 y 100' 
      }, { status: 400 });
    }

    // Crear sistema de rankings
    const rankingSystem = createRankingSystem();
    
    let leaderboard;
    
    // Obtener leaderboard según categoría
    switch (category) {
      case 'OVERALL':
        leaderboard = await rankingSystem.getOverallLeaderboard(timeframe, limit);
        break;
      case 'SPEED':
        leaderboard = await rankingSystem.getSpeedLeaderboard(timeframe, limit);
        break;
      case 'ACCURACY':
        leaderboard = await rankingSystem.getAccuracyLeaderboard(timeframe, limit);
        break;
      case 'WEEKLY':
        leaderboard = await rankingSystem.getOverallLeaderboard('WEEKLY', limit);
        break;
      case 'MONTHLY':
        leaderboard = await rankingSystem.getOverallLeaderboard('MONTHLY', limit);
        break;
      default:
        leaderboard = await rankingSystem.getOverallLeaderboard(timeframe, limit);
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        category,
        timeframe,
        limit,
        total: leaderboard.length,
        leaderboard,
        metadata: {
          generated_at: new Date().toISOString(),
          api_version: '1.0',
          step: 5
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en API de leaderboards:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// También soportar POST para queries más complejas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      category = 'OVERALL', 
      timeframe = 'ALL_TIME', 
      limit = 50,
      filters = {}
    } = body;

    const rankingSystem = createRankingSystem();
    
    // Usar el método dinámico que maneja filtros adicionales
    const leaderboard = await rankingSystem.getDynamicLeaderboard(
      category, 
      timeframe, 
      limit, 
      filters
    );

    return NextResponse.json({
      success: true,
      data: {
        category,
        timeframe,
        limit,
        filters,
        total: leaderboard.length,
        leaderboard,
        metadata: {
          generated_at: new Date().toISOString(),
          api_version: '1.0',
          step: 5
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en POST de leaderboards:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error procesando solicitud POST',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 