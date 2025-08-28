import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = 3000;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    service: 'Telegram Webhook Server'
  });
});

// Telegram webhook endpoint
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    console.log('🔔 Webhook received:', JSON.stringify(req.body, null, 2));
    
    // For now, let's just acknowledge the webhook
    // The actual processing logic can be added later
    res.status(200).json({ 
      ok: true,
      message: 'Webhook received',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Webhook acknowledged');
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Telegram Webhook Server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/telegram/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('🔔 Waiting for Telegram webhook calls...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down webhook server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down webhook server...');
  await prisma.$disconnect();
  process.exit(0);
}); 