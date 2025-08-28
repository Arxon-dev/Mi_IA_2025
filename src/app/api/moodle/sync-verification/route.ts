import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// ==========================================
// 🔄 API PARA SINCRONIZACIÓN MOODLE ↔ TELEGRAM
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 ======== SINCRONIZACIÓN MOODLE ↔ TELEGRAM ========');
    
    const body = await request.json();
    const { telegramuserid, code } = body;

    if (!telegramuserid || !code) {
      return NextResponse.json({
        success: false,
        message: 'telegramuserid y code son requeridos'
      }, { status: 400 });
    }

    console.log(`🔄 Sincronizando código ${code} para usuario Telegram: ${telegramuserid}`);

    // Conectar a MySQL de Moodle
    const connection = await mysql.createConnection({
      host: process.env.MOODLE_DB_HOST || '145.223.38.91',
      user: process.env.MOODLE_DB_USER || 'u449034524_opomelilla_25',
      password: process.env.MOODLE_DB_PASSWORD || 'Sirius//03072503//',
      database: process.env.MOODLE_DB_NAME || 'u449034524_moodel_telegra',
      port: parseInt(process.env.MOODLE_DB_PORT || '3306')
    });

    try {
      // 1. Verificar si ya tiene vinculación en MySQL
      // ✅ VERIFICAR: Que use la tabla correcta en MySQL
      const [existingRows] = await connection.execute(
        `SELECT * FROM moodleuserlink 
         WHERE telegramuserid = ? 
         LIMIT 1`,
        [telegramuserid]
      );

      const existingLinks = existingRows as any[];
      
      if (existingLinks.length > 0) {
        console.log('❌ Usuario ya tiene vinculación existente en MySQL');
        return NextResponse.json({
          success: false,
          message: 'YA TIENES CUENTA VINCULADA',
          data: existingLinks[0]
        });
      }

      // 2. Buscar el código en Moodle MySQL
      const [moodleRows] = await connection.execute(
        `SELECT * FROM mdl_local_telegram_verification 
         WHERE verification_code = ? 
         AND expires_at > UNIX_TIMESTAMP() 
         LIMIT 1`,
        [code]
      );

      const moodleRecords = moodleRows as any[];
      
      if (moodleRecords.length === 0) {
        console.log('❌ Código no encontrado o expirado en Moodle');
        return NextResponse.json({
          success: false,
          message: 'CÓDIGO NO VÁLIDO O EXPIRADO'
        }, { status: 400 });
      }

      const moodleRecord = moodleRecords[0];
      console.log(`✅ Código encontrado en Moodle para usuario: ${moodleRecord.moodle_userid}`);

      // 3. Obtener datos del usuario de Moodle
      const [userRows] = await connection.execute(
        `SELECT id, username, email, firstname, lastname 
         FROM mdl_user 
         WHERE id = ? 
         LIMIT 1`,
        [moodleRecord.moodle_userid]
      );

      const userRecords = userRows as any[];
      
      if (userRecords.length === 0) {
        console.log('❌ Usuario no encontrado en Moodle');
        return NextResponse.json({
          success: false,
          message: 'Usuario no encontrado en Moodle'
        }, { status: 400 });
      }

      const moodleUser = userRecords[0];
      const fullname = `${moodleUser.firstname} ${moodleUser.lastname}`.trim();

      // 4. Crear vinculación en MySQL
      const linkId = crypto.randomUUID(); // ✅ GENERAR ID ÚNICO
      
      await connection.execute(
        `INSERT INTO moodleuserlink (
          id, telegramuserid, moodleuserid, moodleusername, 
          moodleemail, moodlefullname, linkedat, isactive
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)`,
        [
          linkId,              // ✅ AGREGAR ID ÚNICO
          telegramuserid, 
          moodleUser.id.toString(), 
          moodleUser.username, 
          moodleUser.email, 
          fullname
        ]
      );

      // 5. Marcar como verificado en Moodle MySQL
      await connection.execute(
        `UPDATE mdl_local_telegram_verification 
         SET is_verified = 1, verified_at = UNIX_TIMESTAMP(), 
             telegram_userid = ?, telegram_username = ?
         WHERE verification_code = ?`,
        [telegramuserid, 'Carlos_esp', code] // TODO: Obtener username real
      );

      console.log('🎉 Sincronización y vinculación completada exitosamente en MySQL');

      return NextResponse.json({
        success: true,
        message: '¡VINCULACIÓN EXITOSA!',
        data: {
          moodleUserId: moodleUser.id.toString(),
          moodleUsername: moodleUser.username,
          moodleEmail: moodleUser.email,
          moodleFullname: fullname,
          linkedAt: new Date(),
          synchronized: true
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en sincronización con Moodle',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET endpoint para testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Moodle sync-verification endpoint is working!',
    description: 'Este endpoint acepta peticiones POST para sincronizar códigos de verificación',
    usage: 'POST con { "telegramuserid": "tu_id", "code": "codigo_moodle" }',
    timestamp: new Date().toISOString()
  });
}