import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Simular localStorage con datos de ejemplo
const mockData = {
  documents: [
    {
      id: '1',
      title: 'Documento de prueba',
      content: 'Contenido de ejemplo',
      date: new Date().toISOString(),
      type: 'TEST',
      questionCount: 5
    }
  ],
  config: {
    theme: 'light',
    language: 'es'
  },
  statistics: {
    processedDocs: 10,
    generatedQuestions: 50,
    bloomAverage: 3.5,
    savedTime: 120
  },
  bloomLevels: [
    {
      name: 'Conocimiento',
      description: 'Recordar información',
      keywords: ['define', 'lista', 'menciona'],
      percentage: 20,
      enabled: true
    },
    {
      name: 'Comprensión',
      description: 'Entender significados',
      keywords: ['explica', 'describe', 'identifica'],
      percentage: 30,
      enabled: true
    }
  ],
  modelConfig: {
    openaiApiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt: 'Eres un asistente experto en generar preguntas tipo test.'
  }
};

// Funciones de ayuda para simular StorageService
const StorageService = {
  getDocuments: () => mockData.documents,
  getConfig: () => mockData.config,
  getStats: () => mockData.statistics,
  getBloomLevelConfig: () => mockData.bloomLevels,
  getModelConfig: () => mockData.modelConfig
};

async function migrateData() {
  try {
    console.log('🚀 Iniciando migración de datos...');

    // 1. Migrar documentos y sus relaciones
    console.log('\n📄 Migrando documentos...');
    const documents = StorageService.getDocuments();
    for (const doc of documents) {
      console.log(`  - Migrando documento: ${doc.title}`);
      
      const createdDoc = await prisma.document.create({
        data: {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          date: new Date(doc.date),
          type: doc.type,
          questionCount: doc.questionCount || 0,
        },
      });
      console.log(`    ✅ Documento migrado: ${createdDoc.id}`);
    }

    // 2. Migrar configuración
    console.log('\n⚙️ Migrando configuración...');
    const config = StorageService.getConfig();
    for (const [key, value] of Object.entries(config)) {
      await prisma.config.create({
        data: {
          key,
          value: JSON.stringify(value),
        },
      });
    }
    console.log('  ✅ Configuración migrada');

    // 3. Migrar estadísticas
    console.log('\n📊 Migrando estadísticas...');
    const stats = StorageService.getStats();
    await prisma.statistics.create({
      data: {
        processedDocs: stats.processedDocs,
        generatedQuestions: stats.generatedQuestions,
        bloomAverage: stats.bloomAverage,
        savedTime: stats.savedTime,
      },
    });
    console.log('  ✅ Estadísticas migradas');

    // 4. Migrar configuración de niveles Bloom
    console.log('\n🧠 Migrando niveles Bloom...');
    const bloomConfig = StorageService.getBloomLevelConfig();
    if (bloomConfig) {
      for (const level of bloomConfig) {
        await prisma.bloomLevel.create({
          data: {
            name: level.name,
            description: level.description,
            keywords: level.keywords || [],
            percentage: level.percentage,
            enabled: level.enabled,
          },
        });
      }
    }
    console.log('  ✅ Niveles Bloom migrados');

    // 5. Migrar configuración de IA
    console.log('\n🤖 Migrando configuración de IA...');
    const aiConfig = StorageService.getModelConfig();
    await prisma.aIConfig.create({
      data: {
        provider: 'default',
        apiKey: aiConfig.openaiApiKey,
        model: aiConfig.model,
        temperature: aiConfig.temperature || 0.3,
        maxTokens: aiConfig.maxTokens || 2048,
        systemPrompt: aiConfig.systemPrompt,
      },
    });
    console.log('  ✅ Configuración de IA migrada');

    console.log('\n✨ Migración completada con éxito!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
migrateData()
  .catch((error) => {
    console.error('Error fatal durante la migración:', error);
    process.exit(1);
  }); 