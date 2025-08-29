import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fetch from 'node-fetch';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function checkSystemHealth() {
  const health = {
    database: false,
    webhook: false,
    telegram: false
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Check webhook (localhost:3000)
  try {
    const webhookResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'health_check' })
    });
    health.webhook = webhookResponse.ok;
  } catch (error) {
    health.webhook = false;
  }

  // Check Telegram bot
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, {
      timeout: 3000
    } as any);
    const data = await response.json() as any;
    health.telegram = data.ok;
  } catch (error) {
    // Telegram bot not responding
  }

  return health;
}

export async function GET() {
  try {
    console.log('📊 Dashboard API: Fetching stats...');

    // System health check
    const systemHealth = await checkSystemHealth();

    // Basic statistics
    const totalUsers = await prisma.telegramuser.count();
    const totalPolls = await prisma.telegrampoll.count();
    const totalResponses = await prisma.telegramresponse.count();

    // Recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentPollsSent = await prisma.telegrampoll.count({
      where: { createdat: { gte: last24Hours } }
    });
    
    const recentResponses = await prisma.telegramresponse.count({
      where: { answeredat: { gte: last24Hours } }
    });

    // Top 5 users
    const topUsersRaw = await prisma.telegramuser.findMany({
      orderBy: { totalpoints: 'desc' },
      take: 5,
      select: {
        firstname: true,
        lastname: true,
        totalpoints: true,
        level: true
      }
    });

    // Process top users
    const topUsers = topUsersRaw.map(user => ({
      name: `${user.firstname} ${user.lastname || ''}`.trim() || 'Usuario',
      points: user.totalpoints,
      level: user.level
    }));

    const dashboardStats = {
      totalUsers,
      totalPolls,
      totalResponses,
      recentActivity: {
        pollsSent: recentPollsSent,
        responsesReceived: recentResponses
      },
      topUsers,
      systemHealth,
      lastUpdate: new Date().toISOString()
    };

    console.log('✅ Dashboard API: Stats fetched successfully');
    console.log('📈 Stats:', {
      users: totalUsers,
      polls: totalPolls,
      responses: totalResponses,
      health: systemHealth
    });

    return NextResponse.json(dashboardStats);

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    
    // Return error response but still provide what we can
    return NextResponse.json({
      error: 'Error fetching dashboard stats',
      totalUsers: 0,
      totalPolls: 0,
      totalResponses: 0,
      recentActivity: {
        pollsSent: 0,
        responsesReceived: 0
      },
      topUsers: [],
      systemHealth: {
        database: false,
        webhook: false,
        telegram: false
      },
      lastUpdate: new Date().toISOString()
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}