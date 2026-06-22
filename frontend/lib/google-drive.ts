// ============================================================
// Serviço de Upload para Google Drive API v3
// Requer: GOOGLE_DRIVE_API_KEY, GOOGLE_DRIVE_FOLDER_ID
// ============================================================

const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/upload/drive/v3';

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

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<UploadResult> {
  if (!GOOGLE_DRIVE_API_KEY) {
    return { success: false, error: 'GOOGLE_DRIVE_API_KEY não configurada' };
  }

  const targetFolder = folderId || GOOGLE_DRIVE_FOLDER_ID;

  try {
    // Upload do arquivo
    const metadata = {
      name: fileName,
      parents: targetFolder ? [targetFolder] : undefined,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), fileName);

    const uploadResponse = await fetch(
      `${GOOGLE_DRIVE_API_URL}/files?uploadType=multipart&key=${GOOGLE_DRIVE_API_KEY}`,
      {
        method: 'POST',
        body: form,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      return { success: false, error: errorData.error?.message || 'Erro ao fazer upload' };
    }

    const result = await uploadResponse.json();

    // Tornar o arquivo público para visualização
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${result.id}/permissions?key=${GOOGLE_DRIVE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      }
    );

    const viewUrl = `https://drive.google.com/uc?id=${result.id}`;

    return {
      success: true,
      fileId: result.id,
      fileName: result.name,
      url: viewUrl,
    };

  } catch (error: any) {
    console.error('Google Drive upload error:', error);
    return { success: false, error: error.message || 'Erro ao fazer upload' };
  }
}

export async function deleteFile(fileId: string): Promise<boolean> {
  if (!GOOGLE_DRIVE_API_KEY) return false;

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?key=${GOOGLE_DRIVE_API_KEY}`,
      { method: 'DELETE' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function listFiles(folderId?: string): Promise<FileInfo[]> {
  if (!GOOGLE_DRIVE_API_KEY) return [];

  const targetFolder = folderId || GOOGLE_DRIVE_FOLDER_ID;

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?key=${GOOGLE_DRIVE_API_KEY}&q='${targetFolder}'+in+parents&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=createdTime+desc`
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.files || [];
  } catch {
    return [];
  }
}
