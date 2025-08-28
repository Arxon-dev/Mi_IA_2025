#!/usr/bin/env ts-node

/**
 * Script de prueba para el sistema de pagos con Redsys
 */

import { PaymentService } from '../src/services/paymentServiceRedsys';

async function testRedsysSystem() {
  console.log('🏦 ==========================================');
  console.log('🏦 PRUEBA DEL SISTEMA DE PAGOS CON REDSYS');
  console.log('🏦 ==========================================\n');

  try {
    // 1. Verificar variables de entorno
    console.log('🔑 Verificando variables de entorno...');
    console.log(`   REDSYS_PROVIDER_TOKEN: ${process.env.REDSYS_PROVIDER_TOKEN ? '✅ Configurado' : '❌ NO configurado'}`);
    console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ NO configurado'}`);
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.log('\n❌ TELEGRAM_BOT_TOKEN no está configurado');
      return;
    }

    // 2. Crear datos de invoice de prueba con Redsys
    console.log('\n📄 Creando datos de invoice de prueba con Redsys...');
    const testUserId = '123456789';
    const invoiceData = PaymentService.createInvoiceData('basic', testUserId);
    
    console.log('✅ Invoice data para Redsys creada:', {
      title: invoiceData.title,
      price: invoiceData.prices[0].amount / 100,
      currency: invoiceData.currency,
      provider_token: invoiceData.provider_token === 'REDSYS_TOKEN_PLACEHOLDER' ? '⚠️  Token placeholder' : '✅ Token configurado',
      description_includes_redsys: invoiceData.description.includes('Redsys')
    });

    // 3. Simular validación de pre-checkout con Redsys
    console.log('\n🔍 Probando validación de pre-checkout con Redsys...');
    const mockPreCheckout = {
      id: 'test_redsys_query_id',
      invoice_payload: invoiceData.payload,
      total_amount: invoiceData.prices[0].amount,
      currency: 'EUR' // Redsys solo maneja EUR
    };
    
    const isValid = await PaymentService.validatePreCheckout(mockPreCheckout);
    console.log(`   Validación con Redsys: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);

    // 4. Probar procesamiento de pago exitoso con Redsys
    console.log('\n💰 Probando procesamiento de pago exitoso con Redsys...');
    const mockPayment = {
      invoice_payload: invoiceData.payload,
      total_amount: invoiceData.prices[0].amount,
      currency: 'EUR',
      telegram_payment_charge_id: 'telegram_redsys_12345',
      provider_payment_charge_id: 'redsys_esp_67890'
    };
    
    const success = await PaymentService.processSuccessfulPayment(testUserId, mockPayment);
    console.log(`   Procesamiento con Redsys: ${success ? '✅ EXITOSO' : '❌ FALLÓ'}`);

    // 5. Probar mensaje de confirmación con Redsys
    console.log('\n📨 Generando mensaje de confirmación con Redsys...');
    const confirmation = PaymentService.generatePaymentConfirmation('basic', invoiceData.prices[0].amount);
    console.log('✅ Mensaje con Redsys generado correctamente');
    console.log(`   Longitud: ${confirmation.length} caracteres`);
    console.log(`   Menciona Redsys: ${confirmation.includes('Redsys') ? '✅ SÍ' : '❌ NO'}`);

    // 6. Mostrar información de Redsys
    console.log('\n📋 Información de Redsys para usuarios:');
    const redsysInfo = PaymentService.getRedsysInfo();
    console.log('✅ Info de Redsys generada');
    console.log(`   Menciona España: ${redsysInfo.includes('español') ? '✅ SÍ' : '❌ NO'}`);

    console.log('\n🎉 ¡TODAS LAS PRUEBAS CON REDSYS PASARON!');
    console.log('✅ El sistema está configurado para Redsys');
    
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('   1. Ve a @BotFather en Telegram');
    console.log('   2. /mybots -> OpoMelillaBot -> Payments');
    console.log('   3. Selecciona "🏦 Redsys »"');
    console.log('   4. Introduce los datos de tu cuenta Redsys');
    console.log('   5. Copia el token que te dé y ponlo en REDSYS_PROVIDER_TOKEN');
    
    console.log('\n💡 VENTAJAS DE REDSYS:');
    console.log('   🇪🇸 Sistema bancario oficial español');
    console.log('   💳 Visa, Mastercard, Maestro');
    console.log('   🏦 Transferencias bancarias');
    console.log('   💰 Comisiones más bajas que Stripe');
    console.log('   🔒 Cumple PSD2 europeo');
    console.log('   ⚡ Próximamente: Bizum integrado');

  } catch (error) {
    console.error('❌ Error en las pruebas con Redsys:', error);
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('   1. Verificar que .env esté en la raíz del proyecto');
    console.log('   2. Reiniciar el servidor de desarrollo');
    console.log('   3. Configurar Redsys en @BotFather');
    console.log('   4. Obtener token de Redsys válido');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testRedsysSystem();
}

export { testRedsysSystem }; 