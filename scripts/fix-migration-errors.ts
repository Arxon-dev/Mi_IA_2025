#!/usr/bin/env ts-node

/**
 * Script para corregir errores de migración de PostgreSQL a MySQL
 * 
 * Este script automatiza las correcciones más comunes encontradas
 * después de migrar de PostgreSQL a MySQL.
 */

import * as fs from 'fs';
import * as path from 'path';

const WEBHOOK_FILE = 'src/app/api/telegram/webhook/route.ts';

interface ErrorFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const FIXES: ErrorFix[] = [
  // Variables de scope
  {
    pattern: /\bpollId\b/g,
    replacement: 'pollid',
    description: 'Corregir variable pollid → pollid'
  },
  {
    pattern: /\buserId\b/g,
    replacement: 'userid',
    description: 'Corregir variable userid → userid'
  },
  {
    pattern: /\bfromUser\b/g,
    replacement: 'fromtelegramuser',
    description: 'Corregir variable fromtelegramuser → fromtelegramuser'
  },
  
  // Propiedades de DuelStats
  {
    pattern: /\.questionscount\b/g,
    replacement: '.questionscount',
    description: 'Corregir propiedad questionscount → questionsCount'
  },
  
  // Propiedades de base de datos
  {
    pattern: /lastsuccessfulsendat:/g,
    replacement: 'lastsuccessfulsendat:',
    description: 'Corregir campo lastSuccessfulSendAt → lastsuccessfulsendat'
  },
  {
    pattern: /timelimit:/g,
    replacement: 'timelimit:',
    description: 'Corregir campo timeLimit → timelimit'
  },
  
  // Propiedades de usuario
  {
    pattern: /\.firstname\b/g,
    replacement: '.firstname',
    description: 'Corregir propiedad firstname → firstName'
  },
  {
    pattern: /telegramuserid:/g,
    replacement: 'telegramuserid:',
    description: 'Corregir campo telegramuserid → telegramuserid'
  },
  
  // Campos de respuesta
  {
    pattern: /"questionid"/g,
    replacement: '"questionid"',
    description: 'Corregir campo questionid → questionid en consultas'
  },
  {
    pattern: /"iscorrect"/g,
    replacement: '"iscorrect"',
    description: 'Corregir campo iscorrect → iscorrect en consultas'
  },
];

function applyFixes(content: string): { content: string; appliedFixes: string[] } {
  let modifiedContent = content;
  const appliedFixes: string[] = [];
  
  FIXES.forEach(fix => {
    if (fix.pattern.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
      appliedFixes.push(fix.description);
    }
  });
  
  return { content: modifiedContent, appliedFixes };
}

function main() {
  console.log('🔧 Iniciando corrección de errores de migración...\n');
  
  if (!fs.existsSync(WEBHOOK_FILE)) {
    console.error(`❌ Archivo no encontrado: ${WEBHOOK_FILE}`);
    process.exit(1);
  }
  
  // Leer archivo
  const originalContent = fs.readFileSync(WEBHOOK_FILE, 'utf8');
  
  // Aplicar correcciones
  const { content: fixedContent, appliedFixes } = applyFixes(originalContent);
  
  if (appliedFixes.length === 0) {
    console.log('✅ No se encontraron errores para corregir.');
    return;
  }
  
  // Crear backup
  const backupFile = `${WEBHOOK_FILE}.backup.${Date.now()}`;
  fs.writeFileSync(backupFile, originalContent);
  console.log(`📦 Backup creado: ${backupFile}`);
  
  // Escribir archivo corregido
  fs.writeFileSync(WEBHOOK_FILE, fixedContent);
  
  console.log('\n✅ Correcciones aplicadas:');
  appliedFixes.forEach(fix => console.log(`  - ${fix}`));
  
  console.log(`\n🎉 Archivo corregido: ${WEBHOOK_FILE}`);
  console.log('\n📋 Siguientes pasos:');
  console.log('1. Ejecutar: npx prisma generate');
  console.log('2. Verificar que la aplicación compile sin errores');
  console.log('3. Probar funcionalidad crítica');
  console.log('4. Si hay problemas, restaurar desde backup');
}

if (require.main === module) {
  main();
} 