import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

async function checkBotPermissions() {
  try {
    console.log('🔐 VERIFICANDO PERMISOS DEL BOT EN EL GRUPO');
    console.log('===========================================');
    console.log(`📱 Grupo: ${CHAT_ID}`);
    console.log('');
    
    // Obtener información del chat
    const chatResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${CHAT_ID}`);
    const chatInfo = await chatResponse.json() as any;
    
    if (chatInfo.ok) {
      console.log('💬 INFORMACIÓN DEL GRUPO:');
      console.log('--------------------------');
      console.log(`📛 Título: ${chatInfo.result.title}`);
      console.log(`🆔 ID: ${chatInfo.result.id}`);
      console.log(`👥 Tipo: ${chatInfo.result.type}`);
      console.log(`📊 Miembros: ${chatInfo.result.member_count || 'Desconocido'}`);
      console.log('');
    }
    
    // Obtener permisos del bot
    const memberResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHAT_ID}&user_id=8039179482`);
    const memberInfo = await memberResponse.json() as any;
    
    if (memberInfo.ok) {
      const member = memberInfo.result;
      console.log('🤖 ESTADO DEL BOT EN EL GRUPO:');
      console.log('------------------------------');
      console.log(`📊 Estado: ${member.status}`);
      
      if (member.status === 'administrator') {
        console.log('✅ El bot es ADMINISTRADOR');
        
        const perms = member;
        console.log('\n🔐 PERMISOS ADMINISTRATIVOS:');
        console.log('----------------------------');
        console.log(`✅ Puede cambiar info: ${perms.can_change_info || false}`);
        console.log(`✅ Puede eliminar mensajes: ${perms.can_delete_messages || false}`);
        console.log(`✅ Puede invitar usuarios: ${perms.can_invite_users || false}`);
        console.log(`✅ Puede restringir miembros: ${perms.can_restrict_members || false}`);
        console.log(`✅ Puede fijar mensajes: ${perms.can_pin_messages || false}`);
        console.log(`✅ Puede gestionar video chats: ${perms.can_manage_video_chats || false}`);
        
      } else if (member.status === 'member') {
        console.log('👤 El bot es MIEMBRO REGULAR');
        console.log('');
        console.log('⚠️  PROBLEMA POTENCIAL:');
        console.log('   Para capturar respuestas a polls, el bot debería ser administrador');
        console.log('   o tener permisos especiales.');
        
      } else {
        console.log(`❌ Estado inesperado: ${member.status}`);
      }
      
    } else {
      console.error('❌ Error obteniendo permisos del bot:', memberInfo);
    }
    
    // Obtener configuración actual del bot
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botInfo = await botInfoResponse.json() as any;
    
    if (botInfo.ok) {
      const bot = botInfo.result;
      console.log('\n⚙️  CONFIGURACIÓN DEL BOT:');
      console.log('---------------------------');
      console.log(`🔗 Puede unirse a grupos: ${bot.can_join_groups}`);
      console.log(`👥 Puede leer todos los mensajes: ${bot.can_read_all_group_messages}`);
      
      if (!bot.can_read_all_group_messages) {
        console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
        console.log('===========================');
        console.log('❌ El bot NO puede leer todos los mensajes del grupo.');
        console.log('   Esto significa que no puede capturar las respuestas a polls');
        console.log('   a menos que el mensaje sea dirigido específicamente al bot.');
        console.log('');
        console.log('🔧 SOLUCIÓN:');
        console.log('   1. Hacer el bot administrador del grupo, O');
        console.log('   2. Contactar a @BotFather y usar /setprivacy');
        console.log('   3. Configurar "Disable" para permitir leer todos los mensajes');
      }
    }
    
    console.log('\n📋 RESUMEN DE CONFIGURACIÓN NECESARIA:');
    console.log('======================================');
    console.log('Para que el sistema funcione completamente necesitas:');
    console.log('');
    console.log('1. 🚀 NGROK ejecutándose (ngrok http 3000)');
    console.log('2. 🔗 Webhook configurado con URL de ngrok');
    console.log('3. 🔐 Bot con permisos para leer mensajes:');
    console.log('   • Hacer bot administrador, O');
    console.log('   • Deshabilitar privacy mode en @BotFather');
    console.log('4. ✅ Next.js ejecutándose (npm run dev)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function suggestPrivacyFix() {
  console.log('\n🔧 CÓMO ARREGLAR EL PRIVACY MODE:');
  console.log('==================================');
  console.log('1. 💬 Ve a Telegram y busca @BotFather');
  console.log('2. 📝 Envía el comando: /setprivacy');
  console.log('3. 🤖 Selecciona tu bot: @OpoMelillaBot');
  console.log('4. ❌ Selecciona "Disable" para deshabilitar privacy mode');
  console.log('5. ✅ Esto permitirá al bot leer todos los mensajes del grupo');
  console.log('');
  console.log('Alternativamente:');
  console.log('1. 👑 Hacer el bot administrador del grupo');
  console.log('2. ✅ Darle permiso para leer mensajes');
}

async function main() {
  await checkBotPermissions();
  await suggestPrivacyFix();
}

main(); 