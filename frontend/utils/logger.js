/**
 * Utilitário de Logger para o Next.js
 * Em ambiente serverless (Vercel), logar no console (stdout) é a melhor prática,
 * pois a própria Vercel coleta esses logs nativamente e podemos exportar via integrações.
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(process.cwd(), process.env.NODE_ENV === 'production' ? '/tmp/logs' : './logs');

// Garantir que a pasta exista
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const writeLog = (filename, logEntry) => {
  try {
    const filePath = path.join(LOGS_DIR, filename);
    fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error(`Erro ao escrever no arquivo de log ${filename}:`, err);
  }
};

const logger = {
  info: (message, data = {}) => {
    const entry = { timestamp: new Date().toISOString(), level: 'INFO', message, data };
    console.log(JSON.stringify(entry));
    writeLog('app.log', entry);
  },
  error: (message, error) => {
    const entry = { 
      timestamp: new Date().toISOString(), 
      level: 'ERROR', 
      message, 
      error: error?.message || error 
    };
    console.error(JSON.stringify(entry));
    writeLog('app.log', entry);
    writeLog('errors.log', entry);
  },
  webhook: (method, url, status, data) => {
    const entry = { timestamp: new Date().toISOString(), method, url, status, data };
    console.log(JSON.stringify({ level: 'WEBHOOK', ...entry }));
    writeLog('webhooks.json', entry);
  },
  event: (action, data) => {
    const entry = { timestamp: new Date().toISOString(), action, ...data };
    console.log(JSON.stringify({ level: 'EVENT', ...entry }));
    writeLog('events.json', entry);
  }
};

export default logger;
