const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Verifica se a pasta backups existe, caso não, cria
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Limpar backups antigos (Manter últimos 7 dias)
function cleanOldBackups() {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    if (file.startsWith('crm-') && file.endsWith('.db')) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const daysOld = (now - stats.mtime.getTime()) / ONE_DAY_MS;
      
      if (daysOld > 7) {
        fs.unlinkSync(filePath);
        console.log(`Backup antigo removido: ${file}`);
      }
    }
  });
}

// Gera o nome do arquivo YYYY-MM-DD
const date = new Date().toISOString().split('T')[0];
const backupFile = path.join(backupDir, `crm-${date}.db`);

// Obter a CONNECTION_STRING
// No nosso caso usamos DATABASE_URL do .env (Se existir)
require('dotenv').config({ path: path.join(__dirname, 'frontend', '.env') });
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("ERRO: DATABASE_URL não encontrada no .env");
  process.exit(1);
}

console.log(`Iniciando backup para ${backupFile}...`);

// Executa pg_dump
const command = `pg_dump "${dbUrl}" -F c -f "${backupFile}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao executar pg_dump: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`pg_dump stderr: ${stderr}`);
  }
  console.log(`Backup concluído com sucesso: ${backupFile}`);
  
  // Limpar os antigos após concluir o atual
  cleanOldBackups();
});
