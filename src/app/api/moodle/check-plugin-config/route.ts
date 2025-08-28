import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Configuración de la base de datos MySQL
const moodleDbConfig = {
  host: process.env.MOODLE_DB_HOST || '145.223.38.91',
  user: process.env.MOODLE_DB_USER || 'u449034524_Roqxm',
  password: process.env.MOODLE_DB_PASSWORD || 'Sirius//03072503//',
  database: process.env.MOODLE_DB_NAME || 'u449034524_wNjTt',
  connectTimeout: 10000,
  acquireTimeout: 10000,
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando configuración del plugin Telegram Integration');

    // Conectar a MySQL
    const connection = await mysql.createConnection(moodleDbConfig);

    // Obtener configuración del plugin
    const configQuery = `
      SELECT name, value 
      FROM mdl_config_plugins 
      WHERE plugin = 'local_telegram_integration'
      ORDER BY name
    `;

    console.log('📋 Consultando configuración del plugin');

    const [configRows] = await connection.execute(configQuery);
    
    // Verificar si hay eventos configurados
    const eventsQuery = `
      SELECT * FROM mdl_events_handlers 
      WHERE component = 'local_telegram_integration'
    `;
    
    const [eventRows] = await connection.execute(eventsQuery);

    // Verificar si hay observers registrados (tabla de observadores)
    const observersQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME LIKE '%observer%'
    `;
    
    const [observerTables] = await connection.execute(observersQuery);

    // Verificar versión del plugin
    const versionQuery = `
      SELECT name, value 
      FROM mdl_config_plugins 
      WHERE plugin = 'local_telegram_integration' 
      AND name = 'version'
    `;
    
    const [versionRows] = await connection.execute(versionQuery);

    await connection.end();

    const config = Array.isArray(configRows) ? configRows : [];
    const events = Array.isArray(eventRows) ? eventRows : [];
    const observerTablesList = Array.isArray(observerTables) ? observerTables : [];
    const version = Array.isArray(versionRows) ? versionRows : [];

    console.log(`📊 Configuración encontrada: ${config.length} entradas`);
    console.log(`🎯 Eventos encontrados: ${events.length} handlers`);
    console.log(`📋 Tablas observer: ${observerTablesList.length} tablas`);

    // Analizar configuración
    const configObject: any = {};
    config.forEach((row: any) => {
      configObject[row.name] = row.value;
    });

    const analysis = {
      hasApiEndpoint: !!configObject.api_endpoint_url,
      hasBotEndpoint: !!configObject.bot_endpoint_url,
      hasQuizWebhook: !!configObject.quiz_webhook_url,
      apiEndpointUrl: configObject.api_endpoint_url || 'NO CONFIGURADO',
      botEndpointUrl: configObject.bot_endpoint_url || 'NO CONFIGURADO', 
      quizWebhookUrl: configObject.quiz_webhook_url || 'NO CONFIGURADO',
      pluginVersion: version.length > 0 ? (version[0] as any).value : 'DESCONOCIDA',
      hasEventHandlers: events.length > 0,
      observerTablesCount: observerTablesList.length
    };

    return NextResponse.json({
      success: true,
      message: 'Configuración del plugin verificada',
      config: configObject,
      events: events,
      observerTables: observerTablesList,
      analysis: analysis,
      recommendations: {
        configStatus: analysis.hasApiEndpoint && analysis.hasBotEndpoint && analysis.hasQuizWebhook ? 'COMPLETA' : 'INCOMPLETA',
        missingConfigs: [
          !analysis.hasApiEndpoint ? 'api_endpoint_url' : null,
          !analysis.hasBotEndpoint ? 'bot_endpoint_url' : null,
          !analysis.hasQuizWebhook ? 'quiz_webhook_url' : null
        ].filter(Boolean),
        eventHandlersStatus: analysis.hasEventHandlers ? 'CONFIGURADOS' : 'NO CONFIGURADOS'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error verificando configuración del plugin:', error);
    return NextResponse.json({
      success: false,
      error: 'Error verificando configuración del plugin',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para verificar configuración del plugin Telegram Integration',
    description: 'Revisa la configuración actual del plugin en Moodle',
    usage: {
      method: 'POST',
      body: 'vacío',
      response: 'configuración completa del plugin y análisis'
    },
    timestamp: new Date().toISOString()
  });
} 