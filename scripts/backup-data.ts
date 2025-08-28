import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupData() {
  try {
    // Backup AIConfig
    const aiConfig = await prisma.aIConfig.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/aiConfig.json'),
      JSON.stringify(aiConfig, null, 2)
    );
    console.log('✅ AIConfig backup completed');

    // Backup AIFeatures
    const aiFeatures = await prisma.aIFeatures.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/aiFeatures.json'),
      JSON.stringify(aiFeatures, null, 2)
    );
    console.log('✅ AIFeatures backup completed');

    // Backup AIProviderKey
    const aiProviderKey = await prisma.aIProviderKey.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/aiProviderKey.json'),
      JSON.stringify(aiProviderKey, null, 2)
    );
    console.log('✅ AIProviderKey backup completed');

    // Backup BloomLevels
    const bloomLevels = await prisma.bloomLevel.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/bloomLevels.json'),
      JSON.stringify(bloomLevels, null, 2)
    );
    console.log('✅ BloomLevels backup completed');

    // Backup Config
    const config = await prisma.config.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/config.json'),
      JSON.stringify(config, null, 2)
    );
    console.log('✅ Config backup completed');

    // Backup Documents
    const documents = await prisma.document.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/documents.json'),
      JSON.stringify(documents, null, 2)
    );
    console.log('✅ Documents backup completed');

    // Backup DocumentProgress
    const documentProgress = await prisma.documentProgress.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/documentProgress.json'),
      JSON.stringify(documentProgress, null, 2)
    );
    console.log('✅ DocumentProgress backup completed');

    // Backup Prompt
    const prompt = await prisma.prompt.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/prompt.json'),
      JSON.stringify(prompt, null, 2)
    );
    console.log('✅ Prompt backup completed');

    // Backup Questions
    const questions = await prisma.question.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/questions.json'),
      JSON.stringify(questions, null, 2)
    );
    console.log('✅ Questions backup completed');

    // Backup QuestionConfig
    const questionConfig = await prisma.questionConfig.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/questionConfig.json'),
      JSON.stringify(questionConfig, null, 2)
    );
    console.log('✅ QuestionConfig backup completed');

    // Backup Sections
    const sections = await prisma.section.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/sections.json'),
      JSON.stringify(sections, null, 2)
    );
    console.log('✅ Sections backup completed');

    // Backup Statistics
    const statistics = await prisma.statistics.findMany();
    fs.writeFileSync(
      path.join(__dirname, '../backups/statistics.json'),
      JSON.stringify(statistics, null, 2)
    );
    console.log('✅ Statistics backup completed');

    console.log('🎉 All backups completed successfully!');
  } catch (error) {
    console.error('Error during backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupData(); 