import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAuthSafely } from '../firebase';

export interface GoogleDriveUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UploadProgress {
  fileName: string;
  percent: number;
  status: 'pending' | 'uploading' | 'metadata' | 'permissions' | 'success' | 'error';
  error?: string;
  url?: string;
}

// In-memory token cache
let cachedAccessToken: string | null = null;
let cachedGoogleUser: GoogleDriveUser | null = null;

export function getCachedGoogleDriveToken(): string | null {
  return cachedAccessToken;
}

export function getCachedGoogleDriveUser(): GoogleDriveUser | null {
  return cachedGoogleUser;
}

export function clearGoogleDriveSession() {
  cachedAccessToken = null;
  cachedGoogleUser = null;
}

/**
 * Initiates the Google Sign-in flow with Google Drive scopes.
 */
export async function connectGoogleDrive(): Promise<{ accessToken: string; user: GoogleDriveUser }> {
  const auth = getAuthSafely();
  if (!auth) {
    throw new Error('Serviço de autenticação do Firebase não disponível.');
  }

  const provider = new GoogleAuthProvider();
  // Request scope to manage files created by this app
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter o token de acesso do Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };

    return { accessToken: cachedAccessToken, user: cachedGoogleUser };
  } catch (err: any) {
    console.error('[Google Drive] Auth error:', err);
    throw new Error(err?.message || 'Erro ao conectar ao Google Drive.');
  }
}

/**
 * Uploads a file to Google Drive using simple upload + PATCH metadata + POST permissions.
 * This pattern ensures perfect binary integrity and tracks progress precisely.
 */
export function uploadFileToGoogleDrive(
  file: File,
  accessToken: string,
  onProgress: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media';

    // 1. PHASE: Uploading binary data
    onProgress({
      fileName: file.name,
      percent: 0,
      status: 'uploading',
    });

    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', file.type || 'image/png');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress({
          fileName: file.name,
          percent: Math.min(percent, 95), // Reserve remaining 5% for metadata + permission stages
          status: 'uploading',
        });
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const fileId = response.id;
          if (!fileId) {
            throw new Error('ID do arquivo não retornado pelo Google Drive.');
          }

          // 2. PHASE: Updating file metadata (setting real filename)
          onProgress({
            fileName: file.name,
            percent: 96,
            status: 'metadata',
          });

          const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: file.name,
            }),
          });

          if (!metadataResponse.ok) {
            throw new Error('Falha ao atualizar o nome do arquivo no Google Drive.');
          }

          // 3. PHASE: Changing permission to "anyone with link"
          onProgress({
            fileName: file.name,
            percent: 98,
            status: 'permissions',
          });

          const permissionsResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: 'reader',
              type: 'anyone',
            }),
          });

          if (!permissionsResponse.ok) {
            throw new Error('Falha ao configurar permissões de leitura pública no Google Drive.');
          }

          // Generate direct download URL
          // drive.google.com/uc?export=view&id={id} is perfect for <img> tags
          const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

          onProgress({
            fileName: file.name,
            percent: 100,
            status: 'success',
            url: publicUrl,
          });

          resolve(publicUrl);
        } catch (err: any) {
          console.error('[Google Drive] Metadata/Permission error:', err);
          onProgress({
            fileName: file.name,
            percent: xhr.status ? 95 : 0,
            status: 'error',
            error: err?.message || 'Erro ao processar arquivo no Google Drive.',
          });
          reject(err);
        }
      } else {
        const errorMsg = `Upload falhou com código ${xhr.status}`;
        onProgress({
          fileName: file.name,
          percent: 0,
          status: 'error',
          error: errorMsg,
        });
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      const errorMsg = 'Erro de rede ao enviar arquivo para o Google Drive.';
      onProgress({
        fileName: file.name,
        percent: 0,
        status: 'error',
        error: errorMsg,
      });
      reject(new Error(errorMsg));
    };

    // Send the raw file Blob
    xhr.send(file);
  });
}
