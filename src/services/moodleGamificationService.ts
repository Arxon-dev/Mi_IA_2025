import { prisma } from '@/lib/prisma';
import { GamificationService } from './gamificationService';
import crypto from 'crypto'; // ✅ AGREGAR ESTA LÍNEA

// ==========================================
// 🎓 SERVICIO DE GAMIFICACIÓN MOODLE
// ==========================================

export interface MoodleVerificationCode {
  code: string;
  telegramuserid: string;
  expiresAt: Date;
  used: boolean;
}

export interface MoodleLinkingResult {
  success: boolean;
  message: string;
  telegramUser?: {
    name: string;
    level: number;
    points: number;
    rank: number;
  };
}

export interface MoodleGamificationUpdate {
  moodleUserId: string;
  questionCorrect: boolean;
  responsetime?: number;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export class MoodleGamificationService {

  // ==========================================
  // 🔗 SISTEMA DE VINCULACIÓN
  // ==========================================

  /**
   * Generar código de verificación para vincular cuentas
   */
  static async generateVerificationCode(telegramuserid: string): Promise<{ code: string; expiresAt: Date }> {
    try {
      console.log(`🔗 Generando código de verificación para usuario: ${telegramuserid}`);
  
      // Verificar que el usuario existe en Telegram
      const telegramUser = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
  
      if (!telegramUser) {
        throw new Error('Usuario de Telegram no encontrado');
      }
  
      // ✅ CORREGIDO: Invalidar códigos anteriores del usuario (MySQL syntax)
      await prisma.$executeRaw`
        UPDATE moodleverificationcode 
        SET used = true 
        WHERE telegramuserid = ${telegramuserid} AND used = false
      `;
  
      // ✅ NUEVO: También invalidar en la tabla que Moodle espera
      await prisma.$executeRaw`
        UPDATE mdl_local_telegram_verification 
        SET is_verified = 0 
        WHERE telegram_userid = ${telegramuserid} AND is_verified = 0
      `;
  
      // Generar código único de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000); // Unix timestamp para Moodle
      const id = crypto.randomUUID(); // Generar ID único
  
      // ✅ CORREGIDO: Guardar código en tabla nueva (MySQL syntax)
      await prisma.$executeRaw`
        INSERT INTO moodleverificationcode (id, code, telegramuserid, expiresat, used)
        VALUES (${id}, ${code}, ${telegramuserid}, ${expiresAt}, false)
      `;
  
      // ✅ NUEVO: También guardar en la tabla que Moodle espera
      await prisma.$executeRaw`
        INSERT INTO mdl_local_telegram_verification (
          verification_code, telegram_userid, expires_at, is_verified, created_at
        ) VALUES (
          ${code}, ${telegramuserid}, ${expiresAtUnix}, 0, ${expiresAtUnix}
        )
      `;
  
      console.log(`✅ Código generado en AMBAS tablas: ${code} (expira: ${expiresAt.toISOString()})`);
  
      return { code, expiresAt };
  
    } catch (error) {
      console.error('❌ Error generando código de verificación:', error);
      throw error;
    }
  }

  /**
   * Verificar código y vincular cuenta Moodle
   */
  static async verifyCodeAndLink(
    verificationCode: string, 
    moodleUserId: string, 
    moodleUserData: {
      username: string;
      email: string;
      fullname: string;
    }
  ): Promise<MoodleLinkingResult> {
    try {
      console.log(`🔍 Verificando código: ${verificationCode} para Moodle user: ${moodleUserId}`);
  
      // ✅ CORREGIDO: Buscar código válido (MySQL syntax)
      const codeRecord = await prisma.$queryRaw<any[]>`
        SELECT * FROM moodleverificationcode 
        WHERE code = ${verificationCode} 
        AND used = false 
        AND expiresat > NOW()
        LIMIT 1
      `;
  
      if (!codeRecord || codeRecord.length === 0) {
        return {
          success: false,
          message: '❌ Código inválido o expirado'
        };
      }
  
      const record = codeRecord[0];
      const telegramuserid = record.telegramuserid;
  
      // Obtener datos del usuario de Telegram
      const telegramUser = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
  
      if (!telegramUser) {
        return {
          success: false,
          message: '❌ Usuario de Telegram no encontrado'
        };
      }
  
      // Obtener estadísticas actuales de gamificación
      const currentStats = await GamificationService.getUserStats(telegramuserid);
  
      // ✅ CORREGIDO: Verificar si ya existe vinculación (MySQL syntax)
      const existingLink = await prisma.$queryRaw<any[]>`
        SELECT * FROM moodleuserlink 
        WHERE telegramuserid = ${telegramuserid} OR moodleuserid = ${moodleUserId}
        LIMIT 1
      `;
  
      if (existingLink && existingLink.length > 0) {
        return {
          success: false,
          message: '❌ Ya existe una vinculación para esta cuenta'
        };
      }
  
      // ✅ CORREGIDO: Crear vinculación con ID único (MySQL syntax)
      const linkId = crypto.randomUUID(); // ✅ GENERAR ID ÚNICO
      
      await prisma.$executeRaw`
        INSERT INTO moodleuserlink (
          id, telegramuserid, moodleuserid, moodleusername, 
          moodleemail, moodlefullname, linkedat, isactive
        )
        VALUES (
          ${linkId}, ${telegramuserid}, ${moodleUserId}, ${moodleUserData.username},
          ${moodleUserData.email}, ${moodleUserData.fullname}, NOW(), true
        )
      `;
  
      // ✅ CORREGIDO: Marcar código como usado (MySQL syntax)
      await prisma.$executeRaw`
        UPDATE moodleverificationcode 
        SET used = true, usedat = NOW() 
        WHERE code = ${verificationCode}
      `;
  
      console.log(`✅ Vinculación exitosa: Telegram ${telegramuserid} ↔ Moodle ${moodleUserId}`);
  
      return {
        success: true,
        message: `✅ ¡Cuentas vinculadas exitosamente!`,
        telegramUser: {
          name: telegramUser.firstname || 'Usuario',
          level: currentStats?.level || 1,
          points: currentStats?.totalpoints || 0,
          rank: currentStats?.rank || 999
        }
      };
  
    } catch (error) {
      console.error('❌ Error en verificación de código:', error);
      return {
        success: false,
        message: '❌ Error interno al verificar código'
      };
    }
  }

  // ==========================================
  // 🎮 ACTUALIZACIÓN DE GAMIFICACIÓN
  // ==========================================

  /**
   * Procesar respuesta de quiz desde Moodle y actualizar gamificación
   */
  static async processMoodleQuizResponse(updateData: MoodleGamificationUpdate): Promise<{
    success: boolean;
    message: string;
    gamificationUpdate?: any;
  }> {
    try {
      console.log(`🎓 Procesando respuesta de Moodle para usuario: ${updateData.moodleUserId}`);

      // Preparar ambos formatos de búsqueda
      const moodleUserIdRaw = updateData.moodleUserId;
      const moodleUserIdPrefixed = moodleUserIdRaw.startsWith('moodle_user_') 
        ? moodleUserIdRaw 
        : `moodle_user_${moodleUserIdRaw}`;

      console.log(`🔍 Buscando vinculación para: "${moodleUserIdRaw}" o "${moodleUserIdPrefixed}"`);

      // Buscar vinculación activa con ambos formatos usando query raw
      const linkRecords = await prisma.$queryRaw<any[]>`
        SELECT * FROM moodleuserlink 
        WHERE (moodleuserid = ${moodleUserIdRaw} OR moodleuserid = ${moodleUserIdPrefixed})
        AND isactive = true
        LIMIT 1
      `;
      
      const linkRecord = linkRecords.length > 0 ? linkRecords[0] : null;

      if (!linkRecord) {
        console.log(`⚠️ No hay vinculación activa para Moodle user: ${updateData.moodleUserId}`);
        console.log(`⚠️ Intenté buscar: "${moodleUserIdRaw}" y "${moodleUserIdPrefixed}"`);
        return {
          success: false,
          message: 'Usuario no vinculado con Telegram'
        };
      }

      console.log(`✅ Vinculación encontrada:`, linkRecord);
      const telegramuserid = linkRecord.telegramuserid;

      // Procesar respuesta en el sistema de gamificación existente
      const gamificationResult = await GamificationService.processUserResponse({
        telegramuserid,
        username: undefined, // No necesario para Moodle
        firstName: linkRecord.moodleFullname || 'Usuario Moodle',
        lastName: '',
        questionid: `moodle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único
        telegramMsgId: `moodle_${updateData.moodleUserId}_${Date.now()}`,
        iscorrect: updateData.questionCorrect,
        responsetime: updateData.responsetime || 30 // Default 30 segundos
      });

      // Registrar actividad de Moodle usando query raw
      const activityId = crypto.randomUUID();
      const processedAt = new Date();
      
      await prisma.$executeRaw`
        INSERT INTO moodleactivity (
          id, moodleuserid, telegramuserid, questioncorrect, 
          responsetime, subject, difficulty, processedat
        ) VALUES (
          ${activityId}, ${updateData.moodleUserId}, ${telegramuserid}, 
          ${updateData.questionCorrect}, ${updateData.responsetime || 30}, 
          ${updateData.subject || 'general'}, ${updateData.difficulty || 'medium'}, 
          ${processedAt}
        )
      `;

      console.log(`✅ Gamificación actualizada desde Moodle para usuario: ${telegramuserid}`);
      console.log(`✅ Actividad registrada en MoodleActivity`);

      return {
        success: true,
        message: 'Gamificación actualizada desde Moodle',
        gamificationUpdate: gamificationResult
      };

    } catch (error) {
      console.error('❌ Error procesando respuesta de Moodle:', error);
      return {
        success: false,
        message: 'Error procesando respuesta de Moodle'
      };
    }
  }

  // ==========================================
  // 📊 ESTADÍSTICAS UNIFICADAS
  // ==========================================

  /**
   * Obtener estadísticas unificadas de Telegram + Moodle
   */
  static async getUnifiedStats(telegramuserid: string): Promise<{
    telegram: any;
    moodle: any;
    unified: any;
  }> {
    try {
      // Estadísticas de Telegram
      const telegramStats = await GamificationService.getUserStats(telegramuserid);

      // Estadísticas de Moodle
      const moodleStats = await prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as totalQuestions,
          SUM(CASE WHEN questioncorrect = true THEN 1 ELSE 0 END) as correctAnswers,
          AVG(responsetime) as avgResponseTime,
          COUNT(DISTINCT subject) as subjectsStudied
        FROM moodleactivity 
        WHERE telegramuserid = ${telegramuserid}
      `;

      const moodleData = moodleStats[0] || {
        totalquestions: 0,
        correctAnswers: 0,
        avgResponseTime: 0,
        subjectsStudied: 0
      };

      // Estadísticas unificadas
      const unifiedStats = {
        totalquestions: (telegramStats?.totalResponses || 0) + Number(moodleData.totalquestions),
        totalCorrect: (telegramStats?.correctResponses || 0) + Number(moodleData.correctAnswers),
        telegramPoints: telegramStats?.totalpoints || 0,
        level: telegramStats?.level || 1,
        rank: telegramStats?.rank || 999,
        platforms: {
          telegram: {
            questions: telegramStats?.totalResponses || 0,
            correct: telegramStats?.correctResponses || 0,
            accuracy: telegramStats?.accuracy || 0
          },
          moodle: {
            questions: Number(moodleData.totalquestions),
            correct: Number(moodleData.correctAnswers),
            accuracy: Number(moodleData.totalquestions) > 0 ? 
              (Number(moodleData.correctAnswers) / Number(moodleData.totalquestions)) * 100 : 0
          }
        }
      };

      return {
        telegram: telegramStats,
        moodle: moodleData,
        unified: unifiedStats
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas unificadas:', error);
      throw error;
    }
  }

  /**
   * Verificar código generado en Moodle (flujo inverso)
   */
  static async verifyMoodleCode(
    moodleCode: string, 
    telegramuserid: string, 
    telegramUserData: any
  ): Promise<MoodleLinkingResult> {
    try {
      console.log(`🔍 Verificando código REAL de Moodle: ${moodleCode} para Telegram user: ${telegramuserid}`);

      // Verificar que el usuario de Telegram existe
      const telegramUser = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });

      if (!telegramUser) {
        return {
          success: false,
          message: '❌ Usuario de Telegram no encontrado'
        };
      }

      if (moodleCode.length !== 6) {
        return {
          success: false,
          message: '❌ Código debe tener exactamente 6 caracteres'
        };
      }

      // Llamar al endpoint de sincronización REAL con Moodle MySQL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const syncResponse = await fetch(`${baseUrl}/api/moodle/sync-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramuserid: telegramuserid,
          code: moodleCode
        })
      });

      const syncResult = await syncResponse.json();

      if (!syncResult.success) {
        console.log(`❌ Sincronización falló: ${syncResult.message}`);
        return {
          success: false,
          message: syncResult.message || '❌ Error verificando código'
        };
      }

      console.log(`✅ Sincronización REAL exitosa:`, syncResult.data);

      // Obtener estadísticas actuales de gamificación
      const currentStats = await GamificationService.getUserStats(telegramuserid);

      return {
        success: true,
        message: `✅ ¡Cuentas vinculadas exitosamente con datos REALES!`,
        telegramUser: {
          name: telegramUser.firstname || 'Usuario',
          level: currentStats?.level || 1,
          points: currentStats?.totalpoints || 0,
          rank: currentStats?.rank || 999
        }
      };

    } catch (error) {
      console.error('❌ Error verificando código REAL de Moodle:', error);
      return {
        success: false,
        message: '❌ Error interno al verificar código'
      };
    }
  }

  /**
   * Verificar si un usuario tiene cuenta Moodle vinculada
   */
  static async isUserLinked(telegramuserid: string): Promise<boolean> {
    try {
      const linkRecord = await prisma.$queryRaw<any[]>`
        SELECT 1 FROM moodleuserlink 
        WHERE telegramuserid = ${telegramuserid} AND isactive = true
        LIMIT 1
      `;
  
      return linkRecord && linkRecord.length > 0;
    } catch (error) {
      console.error('❌ Error verificando vinculación:', error);
      return false;
    }
  }

}