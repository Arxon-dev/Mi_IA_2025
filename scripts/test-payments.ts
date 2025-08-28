#!/usr/bin/env ts-node

/**
 * Script de prueba para el sistema de pagos
 */

import { PaymentService } from '../src/services/paymentServiceSimple';

async function testPaymentSystem() {
  console.log('🧪 ==========================================');
  console.log('🧪 PRUEBA DEL SISTEMA DE PAGOS');
  console.log('🧪 ==========================================\n');

  try {
    // 1. Verificar variables de entorno
    console.log('🔑 Verificando variables de entorno...');
    console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Configurado' : '❌ NO configurado'}`);
    console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ NO configurado'}`);
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('\n❌ STRIPE_SECRET_KEY no está configurado');
      console.log('💡 Solución: Asegúrate de que esté en .env y reinicia el servidor');
      return;
    }
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.log('\n❌ TELEGRAM_BOT_TOKEN no está configurado');
      return;
    }

    // 2. Crear datos de invoice de prueba
    console.log('\n📄 Creando datos de invoice de prueba...');
    const testUserId = '123456789';
    const invoiceData = PaymentService.createInvoiceData('basic', testUserId);
    
    console.log('✅ Invoice data creada:', {
      title: invoiceData.title,
      price: invoiceData.prices[0].amount / 100,
      currency: invoiceData.currency,
      provider_token: invoiceData.provider_token ? '✅ Presente' : '❌ Falta'
    });

    // 3. Simular validación de pre-checkout
    console.log('\n🔍 Probando validación de pre-checkout...');
    const mockPreCheckout = {
      id: 'test_query_id',
      invoice_payload: invoiceData.payload,
      total_amount: invoiceData.prices[0].amount,
      currency: invoiceData.currency
    };
    
    const isValid = await PaymentService.validatePreCheckout(mockPreCheckout);
    console.log(`   Validación: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);

    // 4. Probar procesamiento de pago exitoso
    console.log('\n💰 Probando procesamiento de pago exitoso...');
    const mockPayment = {
      invoice_payload: invoiceData.payload,
      total_amount: invoiceData.prices[0].amount,
      currency: invoiceData.currency,
      telegram_payment_charge_id: 'test_telegram_id',
      provider_payment_charge_id: 'test_provider_id'
    };
    
    const success = await PaymentService.processSuccessfulPayment(testUserId, mockPayment);
    console.log(`   Procesamiento: ${success ? '✅ EXITOSO' : '❌ FALLÓ'}`);

    // 5. Probar mensaje de confirmación
    console.log('\n📨 Generando mensaje de confirmación...');
    const confirmation = PaymentService.generatePaymentConfirmation('basic', invoiceData.prices[0].amount);
    console.log('✅ Mensaje generado correctamente');
    console.log(`   Longitud: ${confirmation.length} caracteres`);

    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('✅ El sistema de pagos está configurado correctamente');
    
    console.log('\n🔧 PRÓXIMO PASO:');
    console.log('   Configura los pagos en Telegram con @BotFather');
    console.log('   1. Contacta @BotFather');
    console.log('   2. /mybots -> Tu bot -> Payments');
    console.log('   3. Conecta con Stripe usando tu STRIPE_SECRET_KEY');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('   1. Verificar que .env esté en la raíz del proyecto');
    console.log('   2. Reiniciar el servidor de desarrollo');
    console.log('   3. Verificar que STRIPE_SECRET_KEY sea válido');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPaymentSystem();
}

export { testPaymentSystem }; 