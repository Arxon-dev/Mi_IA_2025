import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('🔄 Iniciando restauración de datos...');

    // Restaurar AIConfig
    const aiConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/aiConfig.json'), 'utf8'));
    if (aiConfig.length > 0) {
      await prisma.aIConfig.createMany({ data: aiConfig, skipDuplicates: true });
      console.log('✅ AIConfig restaurado');
    }

    // Restaurar AIFeatures
    const aiFeatures = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/aiFeatures.json'), 'utf8'));
    if (aiFeatures.length > 0) {
      await prisma.aIFeatures.createMany({ data: aiFeatures, skipDuplicates: true });
      console.log('✅ AIFeatures restaurado');
    }

    // Restaurar AIProviderKey
    const aiProviderKey = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/aiProviderKey.json'), 'utf8'));
    if (aiProviderKey.length > 0) {
      await prisma.aIProviderKey.createMany({ data: aiProviderKey, skipDuplicates: true });
      console.log('✅ AIProviderKey restaurado');
    }

    // Restaurar BloomLevels
    const bloomLevels = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/bloomLevels.json'), 'utf8'));
    if (bloomLevels.length > 0) {
      await prisma.bloomLevel.createMany({ data: bloomLevels, skipDuplicates: true });
      console.log('✅ BloomLevels restaurado');
    }

    // Restaurar Config
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/config.json'), 'utf8'));
    if (config.length > 0) {
      await prisma.config.createMany({ data: config, skipDuplicates: true });
      console.log('✅ Config restaurado');
    }

    // Restaurar Documents
    const documents = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/documents.json'), 'utf8'));
    if (documents.length > 0) {
      await prisma.document.createMany({ data: documents, skipDuplicates: true });
      console.log('✅ Documents restaurado');
    }

    // Restaurar DocumentProgress
    const documentProgress = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/documentProgress.json'), 'utf8'));
    if (documentProgress.length > 0) {
      await prisma.documentProgress.createMany({ data: documentProgress, skipDuplicates: true });
      console.log('✅ DocumentProgress restaurado');
    }

    // Restaurar Prompt
    const prompt = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/prompt.json'), 'utf8'));
    if (prompt.length > 0) {
      await prisma.prompt.createMany({ data: prompt, skipDuplicates: true });
      console.log('✅ Prompt restaurado');
    }

    // Restaurar Questions
    const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/questions.json'), 'utf8'));
    if (questions.length > 0) {
      await prisma.question.createMany({ data: questions, skipDuplicates: true });
      console.log('✅ Questions restaurado');
    }

    // Restaurar QuestionConfig
    const questionConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/questionConfig.json'), 'utf8'));
    if (questionConfig.length > 0) {
      await prisma.questionConfig.createMany({ data: questionConfig, skipDuplicates: true });
      console.log('✅ QuestionConfig restaurado');
    }

    // Restaurar Sections
    const sections = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/sections.json'), 'utf8'));
    if (sections.length > 0) {
      await prisma.section.createMany({ data: sections, skipDuplicates: true });
      console.log('✅ Sections restaurado');
    }

    // Restaurar Statistics
    const statistics = JSON.parse(fs.readFileSync(path.join(__dirname, '../backups/statistics.json'), 'utf8'));
    if (statistics.length > 0) {
      await prisma.statistics.createMany({ data: statistics, skipDuplicates: true });
      console.log('✅ Statistics restaurado');
    }

    console.log('🎉 Restauración completada con éxito!');
  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  restoreData();
} 