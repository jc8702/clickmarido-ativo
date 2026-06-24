// ============================================================
// Serviço de Upload para Google Drive API v3 (Service Account)
// Requer: GOOGLE_SERVICE_ACCOUNT_KEY (JSON completo) e GOOGLE_DRIVE_FOLDER_ID
// ============================================================

import crypto from 'crypto';

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  error?: string;
}

export interface FileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

// Cache do token de acesso
let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

function getCredentials(): ServiceAccountCredentials | null {
  const jsonKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (jsonKey) {
    try {
      const parsed = JSON.parse(jsonKey);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
        };
      }
    } catch (err) {
      console.error('[DRIVE] Erro ao parsear GOOGLE_SERVICE_ACCOUNT_KEY JSON:', err);
    }
  }

  // Fallback para variáveis individuais se existirem
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

async function getAccessToken(creds: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && now < tokenExpiry - 60) {
    return cachedAccessToken;
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64url = (str: string) => Buffer.from(str).toString('base64url');
  const signatureInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(creds.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google OAuth falhou: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = now + data.expires_in;
  return data.access_token;
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<UploadResult> {
  const creds = getCredentials();
  if (!creds) {
    return { success: false, error: 'Credenciais da Service Account do Google não configuradas' };
  }

  const targetFolder = folderId || GOOGLE_DRIVE_FOLDER_ID;

  try {
    const token = await getAccessToken(creds);

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: targetFolder ? [targetFolder] : undefined,
    };

    const metadataPart = 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + '\r\n';
    const headerBuffer = Buffer.from(delimiter + metadataPart + `Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`);
    const fileContentBuffer = Buffer.from(fileBuffer.toString('base64'), 'base64');
    const footerBuffer = Buffer.from(closeDelimiter);

    const bodyBuffer = Buffer.concat([headerBuffer, fileContentBuffer, footerBuffer]);

    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: bodyBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      return { success: false, error: errorData.error?.message || 'Erro ao subir arquivo para o Google Drive' };
    }

    const result = await uploadResponse.json();

    // Tornar o arquivo público para qualquer um visualizar no CRM
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${result.id}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        }
      );
    } catch (permErr) {
      console.warn('[DRIVE] Falha ao definir permissão pública do arquivo:', permErr);
    }

    const viewUrl = `https://drive.google.com/uc?id=${result.id}`;

    return {
      success: true,
      fileId: result.id,
      fileName: result.name,
      url: viewUrl,
    };

  } catch (error: any) {
    console.error('[DRIVE] Erro de upload:', error);
    return { success: false, error: error.message || 'Erro de rede no Google Drive' };
  }
}

export async function deleteFile(fileId: string): Promise<boolean> {
  const creds = getCredentials();
  if (!creds) return false;

  try {
    const token = await getAccessToken(creds);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function listFiles(folderId?: string): Promise<FileInfo[]> {
  const creds = getCredentials();
  if (!creds) return [];

  const targetFolder = folderId || GOOGLE_DRIVE_FOLDER_ID;

  try {
    const token = await getAccessToken(creds);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${targetFolder}'+in+parents&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=createdTime+desc`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.files || [];
  } catch {
    return [];
  }
}

