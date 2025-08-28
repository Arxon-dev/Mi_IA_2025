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
    console.log('🔍 Verificando estructura de tablas de Moodle');

    // Conectar a MySQL
    const connection = await mysql.createConnection(moodleDbConfig);

    // Buscar tablas relacionadas con eventos
    const tablesQuery = `
      SELECT TABLE_NAME, TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND (
        TABLE_NAME LIKE '%event%' 
        OR TABLE_NAME LIKE '%handler%'
        OR TABLE_NAME LIKE '%observer%'
        OR TABLE_NAME LIKE '%telegram%'
      )
      ORDER BY TABLE_NAME
    `;

    const [tables] = await connection.execute(tablesQuery);

    // Verificar estructura específica de tablas
    const structures = {};

    const tablesToCheck = [
      'mdl_events_handlers',
      'mdl_events_queue_handlers', 
      'mdl_local_telegram_verification',
      'mdl_config_plugins'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [tableName]);

        (structures as any)[tableName] = {
          exists: true,
          columns: columns
        };
      } catch (error) {
        (structures as any)[tableName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        };
      }
    }

    // Verificar configuración actual del plugin
    const [pluginConfig] = await connection.execute(`
      SELECT name, value 
      FROM mdl_config_plugins 
      WHERE plugin = 'local_telegram_integration'
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Análisis de estructura de base de datos completado',
      tables: tables,
      tableStructures: structures,
      pluginConfig: pluginConfig,
      analysis: {
        hasEventHandlersTable: (structures as any)['mdl_events_handlers']?.exists || false,
        hasQueueHandlersTable: (structures as any)['mdl_events_queue_handlers']?.exists || false,
        hasTelegramTable: (structures as any)['mdl_local_telegram_verification']?.exists || false,
        hasConfigTable: (structures as any)['mdl_config_plugins']?.exists || false,
        totalEventTables: Array.isArray(tables) ? tables.filter((t: any) => t.TABLE_NAME.includes('event')).length : 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error verificando tablas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error verificando estructura de base de datos',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para verificar estructura de tablas de Moodle',
    description: 'Analiza las tablas relacionadas con eventos y plugins',
    timestamp: new Date().toISOString()
  });
} 