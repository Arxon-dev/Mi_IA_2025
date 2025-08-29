import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CORS headers for cross-origin requests from hosting
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const telegramuserid = searchParams.get('telegramuserid');

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    let result;
    
    switch (action) {
      case 'test_connection':
        result = await testConnection();
        break;
        
      case 'get_user_analytics':
        if (!telegramuserid) {
          return NextResponse.json(
            { error: 'Missing telegramuserid parameter' },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getUserAnalytics(parseInt(telegramuserid));
        break;
        
      case 'get_predictive_data':
        if (!telegramuserid) {
          return NextResponse.json(
            { error: 'Missing telegramuserid parameter' },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getPredictiveData(parseInt(telegramuserid));
        break;
        
      case 'get_learning_metrics':
        if (!telegramuserid) {
          return NextResponse.json(
            { error: 'Missing telegramuserid parameter' },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getLearningMetrics(parseInt(telegramuserid));
        break;
        
      case 'get_optimization_data':
        if (!telegramuserid) {
          return NextResponse.json(
            { error: 'Missing telegramuserid parameter' },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getOptimizationData(parseInt(telegramuserid));
        break;
        
      case 'get_social_data':
        if (!telegramuserid) {
          return NextResponse.json(
            { error: 'Missing telegramuserid parameter' },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getSocialData(parseInt(telegramuserid));
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: corsHeaders }
        );
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('ML Analytics Bridge Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();

    let result;
    
    switch (action) {
      case 'test_connection':
        result = await testConnection();
        break;
        
      case 'get_user_analytics':
        result = await getUserAnalytics(params.telegramuserid);
        break;
        
      case 'get_predictive_data':
        result = await getPredictiveData(params.telegramuserid);
        break;
        
      case 'get_learning_metrics':
        result = await getLearningMetrics(params.telegramuserid);
        break;
        
      case 'get_optimization_data':
        result = await getOptimizationData(params.telegramuserid);
        break;
        
      case 'get_social_data':
        result = await getSocialData(params.telegramuserid);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: corsHeaders }
        );
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('ML Analytics Bridge Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'success', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

async function getUserAnalytics(telegramuserid: number) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get user's Telegram responses
  const telegramResponses = await prisma.telegramresponse.findMany({
    where: {
      userid: telegramuserid.toString(),
      answeredat: { gte: thirtyDaysAgo }
    },
    select: {
      iscorrect: true,
      responsetime: true,
      questionid: true,
      answeredat: true
    }
  });

  // Get user's study responses
  const studyResponses = await prisma.studyresponse.findMany({
    where: {
      userid: telegramuserid.toString(),
      answeredat: { 
        gte: thirtyDaysAgo,
        not: null
      }
    },
    select: {
      iscorrect: true,
      responsetime: true,
      subject: true,
      answeredat: true,
      timedOut: true
    }
  });

  return {
    telegram_responses: telegramResponses,
    study_responses: studyResponses,
    total_responses: telegramResponses.length + studyResponses.length
  };
}

async function getPredictiveData(telegramuserid: number) {
  const userData = await getUserAnalytics(telegramuserid);
  const allResponses = [
    ...userData.telegram_responses.map(r => ({ ...r, source: 'telegram' })),
    ...userData.study_responses.map(r => ({ ...r, source: 'study' }))
  ];

  if (allResponses.length === 0) {
    return { success_probability: 0, weak_areas: [], confidence: 'low' };
  }

  // Calculate overall accuracy
  const correctAnswers = allResponses.filter(r => r.iscorrect).length;
  const accuracy = (correctAnswers / allResponses.length) * 100;

  // Calculate consistency (standard deviation of daily performance)
  const dailyPerformance = calculateDailyPerformance(allResponses);
  const consistency = calculateConsistency(dailyPerformance);

  // Calculate volume score
  const volumeScore = Math.min(allResponses.length / 100, 1) * 100;

  // Calculate improvement trend
  const improvementTrend = calculateImprovementTrend(allResponses);

  // Calculate success probability
  const successProbability = (
    accuracy * 0.4 +
    consistency * 0.3 +
    volumeScore * 0.2 +
    improvementTrend * 0.1
  );

  // Identify weak areas
  const weakAreas = identifyWeakAreas(allResponses);

  return {
    success_probability: Math.round(successProbability),
    weak_areas: weakAreas,
    confidence: allResponses.length > 50 ? 'high' : allResponses.length > 20 ? 'medium' : 'low',
    metrics: {
      accuracy: Math.round(accuracy),
      consistency: Math.round(consistency),
      volume_score: Math.round(volumeScore),
      improvement_trend: Math.round(improvementTrend)
    }
  };
}

async function getLearningMetrics(telegramuserid: number) {
  const userData = await getUserAnalytics(telegramuserid);
  const allResponses = [
    ...userData.telegram_responses.map(r => ({ ...r, source: 'telegram', timedOut: false })),
    ...userData.study_responses.map(r => ({ ...r, source: 'study' }))
  ];

  if (allResponses.length === 0) {
    return { retention_curve: [], efficiency_score: 0, learning_velocity: 0 };
  }

  // Calculate retention curve
  const retentionCurve = calculateRetentionCurve(allResponses);

  // Calculate efficiency score
  const avgResponseTime = allResponses
    .filter(r => r.responsetime && r.responsetime > 0)
    .reduce((sum, r) => sum + (r.responsetime || 0), 0) / allResponses.length;
  
  const timeoutRate = allResponses.filter(r => r.timedOut).length / allResponses.length;
  const efficiencyScore = Math.max(0, 100 - (avgResponseTime / 1000) - (timeoutRate * 50));

  // Calculate learning velocity
  const learningVelocity = calculateLearningVelocity(allResponses);

  return {
    retention_curve: retentionCurve,
    efficiency_score: Math.round(efficiencyScore),
    learning_velocity: Math.round(learningVelocity),
    avg_response_time: Math.round(avgResponseTime / 1000),
    timeout_rate: Math.round(timeoutRate * 100)
  };
}

async function getOptimizationData(telegramuserid: number) {
  const userData = await getUserAnalytics(telegramuserid);
  const allResponses = [
    ...userData.telegram_responses.map(r => ({ ...r, source: 'telegram' })),
    ...userData.study_responses.map(r => ({ ...r, source: 'study' }))
  ];

  // Calculate hourly performance
  const hourlyPerformance = calculateHourlyPerformance(allResponses);
  
  // Find optimal study hours
  const optimalHours = findOptimalStudyHours(hourlyPerformance);

  // Calculate session recommendations
  const sessionRecommendations = calculateSessionRecommendations(allResponses);

  return {
    optimal_hours: optimalHours,
    hourly_performance: hourlyPerformance,
    session_recommendations: sessionRecommendations
  };
}

async function getSocialData(telegramuserid: number) {
  // Get all users' performance for comparison
  const allUsersData = await prisma.telegramresponse.groupBy({
    by: ['userid'],
    _count: { id: true },
    _avg: { responsetime: true },
    where: {
      answeredat: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  });

  const currentUserData = await getUserAnalytics(telegramuserid);
  const currentUserAccuracy = currentUserData.telegram_responses.length > 0 ?
    (currentUserData.telegram_responses.filter(r => r.iscorrect).length / currentUserData.telegram_responses.length) * 100 : 0;

  // Calculate percentile ranking
  const userAccuracies = await Promise.all(
    allUsersData.map(async (user) => {
      const responses = await prisma.telegramresponse.findMany({
        where: { userid: user.userid },
        select: { iscorrect: true }
      });
      return responses.length > 0 ? 
        (responses.filter(r => r.iscorrect).length / responses.length) * 100 : 0;
    })
  );

  const betterThanCount = userAccuracies.filter(acc => currentUserAccuracy > acc).length;
  const percentile = Math.round((betterThanCount / userAccuracies.length) * 100);

  // Find study group matches
  const studyGroupMatches = findStudyGroupMatches(currentUserAccuracy, userAccuracies);

  return {
    percentile_ranking: percentile,
    total_users: allUsersData.length,
    study_group_matches: studyGroupMatches,
    performance_comparison: {
      current_user: Math.round(currentUserAccuracy),
      average: Math.round(userAccuracies.reduce((a, b) => a + b, 0) / userAccuracies.length),
      top_10_percent: Math.round(userAccuracies.sort((a, b) => b - a).slice(0, Math.ceil(userAccuracies.length * 0.1)).reduce((a, b) => a + b, 0) / Math.ceil(userAccuracies.length * 0.1))
    }
  };
}

// Helper functions
function calculateDailyPerformance(responses: any[]) {
  const dailyStats = {};
  
  responses.forEach(response => {
    const date = response.answeredAt.toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { correct: 0, total: 0 };
    }
    dailyStats[date].total++;
    if (response.iscorrect) {
      dailyStats[date].correct++;
    }
  });

  return Object.values(dailyStats).map((day: any) => 
    day.total > 0 ? (day.correct / day.total) * 100 : 0
  );
}

function calculateConsistency(dailyPerformance: number[]) {
  if (dailyPerformance.length < 2) return 50;
  
  const mean = dailyPerformance.reduce((a, b) => a + b, 0) / dailyPerformance.length;
  const variance = dailyPerformance.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyPerformance.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.max(0, 100 - standardDeviation);
}

function calculateImprovementTrend(responses: any[]) {
  if (responses.length < 10) return 50;
  
  const sortedResponses = responses.sort((a, b) => new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime());
  const firstHalf = sortedResponses.slice(0, Math.floor(sortedResponses.length / 2));
  const secondHalf = sortedResponses.slice(Math.floor(sortedResponses.length / 2));
  
  const firstHalfAccuracy = (firstHalf.filter(r => r.iscorrect).length / firstHalf.length) * 100;
  const secondHalfAccuracy = (secondHalf.filter(r => r.iscorrect).length / secondHalf.length) * 100;
  
  const improvement = secondHalfAccuracy - firstHalfAccuracy;
  return Math.max(0, Math.min(100, 50 + improvement));
}

function identifyWeakAreas(responses: any[]) {
  const categoryStats = {};
  
  responses.forEach(response => {
    const category = response.questionid || response.subject || 'general';
    if (!categoryStats[category]) {
      categoryStats[category] = { correct: 0, total: 0 };
    }
    categoryStats[category].total++;
    if (response.iscorrect) {
      categoryStats[category].correct++;
    }
  });

  return Object.entries(categoryStats)
    .map(([category, stats]: [string, any]) => ({
      subject: category,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      risk_level: stats.total > 0 && (stats.correct / stats.total) < 0.6 ? 'high' : 'medium',
      total_questions: stats.total
    }))
    .filter(area => area.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy);
}

function calculateRetentionCurve(responses: any[]) {
  const days = [1, 3, 7, 14, 30];
  const now = new Date();
  
  return days.map(day => {
    const dayAgo = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    const responsesFromDay = responses.filter(r => 
      new Date(r.answeredAt).getTime() >= dayAgo.getTime() - 24 * 60 * 60 * 1000 &&
      new Date(r.answeredAt).getTime() <= dayAgo.getTime()
    );
    
    const retention = responsesFromDay.length > 0 ?
      (responsesFromDay.filter(r => r.iscorrect).length / responsesFromDay.length) * 100 : 0;
    
    return { day, retention: Math.round(retention) };
  });
}

function calculateLearningVelocity(responses: any[]) {
  if (responses.length < 20) return 50;
  
  const sortedResponses = responses.sort((a, b) => new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime());
  const chunks: number[] = [];
  const chunkSize = Math.floor(sortedResponses.length / 4);
  
  for (let i = 0; i < 4; i++) {
    const chunk = sortedResponses.slice(i * chunkSize, (i + 1) * chunkSize);
    const accuracy = (chunk.filter(r => r.iscorrect).length / chunk.length) * 100;
    chunks.push(accuracy);
  }
  
  const velocity = chunks[3] - chunks[0]; // Improvement from first to last quarter
  return Math.max(0, Math.min(100, 50 + velocity));
}

function calculateHourlyPerformance(responses: any[]) {
  const hourlyStats = {};
  
  for (let hour = 0; hour < 24; hour++) {
    hourlyStats[hour] = { correct: 0, total: 0 };
  }
  
  responses.forEach(response => {
    const hour = new Date(response.answeredAt).getHours();
    hourlyStats[hour].total++;
    if (response.iscorrect) {
      hourlyStats[hour].correct++;
    }
  });
  
  return Object.entries(hourlyStats).map(([hour, stats]: [string, any]) => ({
    hour: parseInt(hour),
    performance: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    total_questions: stats.total
  }));
}

function findOptimalStudyHours(hourlyPerformance: any[]) {
  return hourlyPerformance
    .filter(h => h.total_questions >= 3) // Only consider hours with sufficient data
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 3)
    .map(h => h.hour);
}

function calculateSessionRecommendations(responses: any[]) {
  const avgResponseTime = responses
    .filter(r => r.responsetime && r.responsetime > 0)
    .reduce((sum, r) => sum + (r.responsetime || 0), 0) / responses.length;
  
  const timeoutRate = responses.filter(r => r.timedOut).length / responses.length;
  
  let recommendedDuration = 30; // Default 30 minutes
  if (timeoutRate > 0.3) recommendedDuration = 20; // Shorter sessions if many timeouts
  if (avgResponseTime > 30000) recommendedDuration = 25; // Shorter if slow responses
  
  return {
    duration_minutes: recommendedDuration,
    questions_per_session: Math.round(recommendedDuration * 1.5),
    break_frequency: Math.round(recommendedDuration / 3)
  };
}

function findStudyGroupMatches(userAccuracy: number, allAccuracies: number[]) {
  const tolerance = 10; // ±10% accuracy range
  const matches = allAccuracies.filter(acc => 
    Math.abs(acc - userAccuracy) <= tolerance && acc !== userAccuracy
  );
  
  return {
    compatible_users: matches.length,
    accuracy_range: `${Math.round(userAccuracy - tolerance)}% - ${Math.round(userAccuracy + tolerance)}%`
  };
}