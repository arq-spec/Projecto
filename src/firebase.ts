import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the named database from configure blueprint
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

let authInstance: any = null;
export function getAuthSafely() {
  if (authInstance) return authInstance;
  try {
    authInstance = getAuth(app);
    return authInstance;
  } catch (err) {
    console.warn('[Firebase] Auth component not registered yet.', err);
    return null;
  }
}

// Error Handling conformant to Firebase integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const safeAuth = getAuthSafely();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: safeAuth?.currentUser?.uid,
      email: safeAuth?.currentUser?.email,
      emailVerified: safeAuth?.currentUser?.emailVerified,
      isAnonymous: safeAuth?.currentUser?.isAnonymous,
      tenantId: safeAuth?.currentUser?.tenantId,
      providerInfo: safeAuth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error (Gracefully handled): ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Saves a document to Firebase Firestore.
 * Falls back gracefully on network failure or quota limits.
 */
export async function saveToFirebase(key: string, data: any) {
  const path = `frello_data/${key}`;
  try {
    const docRef = doc(db, 'frello_data', key);
    const cleanData = JSON.parse(JSON.stringify(data)); // Strips 'undefined' which crashes Firestore
    
    if (Array.isArray(cleanData)) {
      // Coleções conhecidas por conter imagens Base64 gigantescas em seus itens (Kanban, Tarefas, Freelancers)
      // Para estas, mantemos estritamente a estratégia conservadora antiga de CHUNK_SIZE = 2 para garantir
      // que nunca estouremos o limite rígido de 1MB por documento do Firestore e evitar corrupção de dados.
      const keysWithHugePayloads = ['tasks', 'freelancers', 'workstation_cards'];
      
      if (keysWithHugePayloads.includes(key)) {
        const CHUNK_SIZE = 2;
        const chunksCount = Math.ceil(cleanData.length / CHUNK_SIZE);
        const chunkPromises = [];
        
        for (let i = 0; i < chunksCount; i++) {
          const chunkData = cleanData.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE);
          const chunkRef = doc(db, 'frello_data', `${key}_chunk_${i}`);
          chunkPromises.push(setDoc(chunkRef, { data: chunkData }));
        }
        
        await Promise.all(chunkPromises);
        
        await setDoc(docRef, { 
          isChunked: true,
          chunks: chunksCount,
          updatedAt: new Date().toISOString() 
        });
        console.log(`[Firebase] Saved ${key} safely in ${chunksCount} chunks (Original Conservative Strategy).`);
      } else {
        // Para as demais coleções sem imagens pesadas (como notificações, configurações, documentação de equipamentos, etc.)
        // o salvamento é instantâneo em documento único para otimização extrema e redução drástica de requisições.
        const totalLength = JSON.stringify(cleanData).length;
        if (totalLength < 800000) {
          await setDoc(docRef, { 
            data: cleanData,
            isChunked: false,
            updatedAt: new Date().toISOString() 
          });
          console.log(`[Firebase] Saved ${key} instantly as single document (size: ${(totalLength / 1024).toFixed(1)} KB).`);
        } else {
          // Fallback dinâmico seguro caso qualquer outra coleção cresça acima do esperado
          const maxChunkSizeInChars = 400000;
          const estimatedChunks = Math.ceil(totalLength / maxChunkSizeInChars);
          const CHUNK_SIZE = Math.ceil(cleanData.length / estimatedChunks);
          const chunksCount = Math.ceil(cleanData.length / CHUNK_SIZE);
          
          const chunkPromises = [];
          for (let i = 0; i < chunksCount; i++) {
            const chunkData = cleanData.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE);
            const chunkRef = doc(db, 'frello_data', `${key}_chunk_${i}`);
            chunkPromises.push(setDoc(chunkRef, { data: chunkData }));
          }
          
          await Promise.all(chunkPromises);
          
          await setDoc(docRef, { 
            isChunked: true,
            chunks: chunksCount,
            updatedAt: new Date().toISOString() 
          });
          console.log(`[Firebase] Saved ${key} dynamically in ${chunksCount} chunks.`);
        }
      }
    } else {
      await setDoc(docRef, { 
         data: cleanData, 
         updatedAt: new Date().toISOString() 
      });
      console.log(`[Firebase] Saved ${key} successfully.`);
    }

    // Webhook Dispatch Interceptor
    if (key !== 'api_config') {
      dispatchWebhookForSave(key, cleanData).catch(err => 
        console.warn('[Webhook] Failed to dispatch save event:', err)
      );
    }
  } catch (err) {
    console.warn(`[Firebase] Failed to save document: ${key}`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const isPermissionError = errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient');
    if (isPermissionError) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } else {
      console.warn(`[Firebase] Graceful boundary caught non-auth error (e.g. Quota Exceeded/Network) for saveToFirebase(${key}). App will continue with updated local storage.`);
    }
  }
}

/**
 * Loads a document split state from Firebase Firestore.
 * Returns null if not exists or on error.
 */
export async function loadFromFirebase(key: string): Promise<any | null> {
  const path = `frello_data/${key}`;
  try {
    if (key === 'ignore_just_trigger') return null;
    const docRef = doc(db, 'frello_data', key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const docData = snap.data();
      if (docData.isChunked) {
        let allData: any[] = [];
        const chunkPromises = [];
        for (let i = 0; i < docData.chunks; i++) {
          chunkPromises.push(getDoc(doc(db, 'frello_data', `${key}_chunk_${i}`)));
        }
        const chunkSnaps = await Promise.all(chunkPromises);
        for (const csnap of chunkSnaps) {
          if (csnap.exists() && Array.isArray(csnap.data().data)) {
            allData = allData.concat(csnap.data().data);
          }
        }
        return allData;
      }
      return docData ? docData.data : null;
    }
  } catch (err) {
    console.warn(`[Firebase] Failed to load document: ${key}`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const isPermissionError = errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient');
    if (isPermissionError) {
      handleFirestoreError(err, OperationType.GET, path);
    } else {
      console.warn(`[Firebase] Graceful boundary caught non-auth error (e.g. Quota Exceeded/Network) for loadFromFirebase(${key}). Falling back to local data.`);
    }
  }
  return null;
}

/**
 * Subscribes to a document split state from Firebase Firestore in real-time.
 * Returns an unsubscribe function.
 */
export function subscribeToFirebase(key: string, callback: (data: any) => void) {
  const docRef = doc(db, 'frello_data', key);
  return onSnapshot(docRef, async (snap) => {
    if (snap.exists()) {
      const docData = snap.data();
      if (docData && docData.isChunked) {
        let allData: any[] = [];
        const chunkPromises = [];
        for (let i = 0; i < docData.chunks; i++) {
          chunkPromises.push(getDoc(doc(db, 'frello_data', `${key}_chunk_${i}`)));
        }
        try {
          const chunkSnaps = await Promise.all(chunkPromises);
          for (const csnap of chunkSnaps) {
            if (csnap.exists() && Array.isArray(csnap.data().data)) {
              allData = allData.concat(csnap.data().data);
            }
          }
          callback(allData);
        } catch (e) {
          console.warn(`[Firebase] Error fetching chunks for ${key}:`, e);
        }
      } else if (docData && docData.data !== undefined) {
        callback(docData.data);
      }
    }
  }, (err) => {
    console.warn(`[Firebase] Error in real-time subscription for ${key}:`, err);
  });
}

/**
 * Dispatches webhooks based on Firestore save operations.
 */
async function dispatchWebhookForSave(key: string, data: any) {
  try {
    const apiConfigDoc = await getDoc(doc(db, 'frello_data', 'api_config'));
    if (!apiConfigDoc.exists()) return;
    
    const apiConfig = apiConfigDoc.data()?.data || apiConfigDoc.data();
    if (!apiConfig || !apiConfig.webhooksEnabled || !apiConfig.webhookUrl) return;

    // Map keys to event names
    let eventName = `db.${key}.updated`;
    let isEventEnabled = true;

    if (key === 'tasks') {
      eventName = 'transaction.updated';
      isEventEnabled = apiConfig.events?.transactions ?? true;
    } else if (key === 'freelancers') {
      eventName = 'freelancer.updated';
      isEventEnabled = apiConfig.events?.freelancers ?? true;
    } else if (key === 'users') {
      eventName = 'user.updated';
      isEventEnabled = apiConfig.events?.users ?? true;
    } else if (key === 'workstation_cards') {
      eventName = 'task.updated';
      isEventEnabled = apiConfig.events?.tasks ?? true;
    } else if (key === 'registrationRequests') {
      eventName = 'freelancer.approved_request_update';
      isEventEnabled = apiConfig.events?.freelancers ?? true;
    } else if (key === 'clients') {
      eventName = 'client.updated';
      isEventEnabled = apiConfig.events?.transactions ?? true;
    }

    if (!isEventEnabled) return;

    // Clean sensitive credentials
    const cleanData = JSON.parse(JSON.stringify(data));
    if (Array.isArray(cleanData)) {
      cleanData.forEach((item: any) => {
        if (item && item.password) item.password = '***';
      });
    } else if (cleanData && cleanData.password) {
      cleanData.password = '***';
    }

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      apiKey: apiConfig.apiKey,
      collection: key,
      data: cleanData
    };

    console.log(`[Webhook] Dispatching save event "${eventName}" to ${apiConfig.webhookUrl}...`);
    
    fetch(apiConfig.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiConfig.apiKey || '',
        'Authorization': `Basic ${btoa(`${apiConfig.apiUsername || 'frello_api_user'}:${apiConfig.apiPassword || ''}`)}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => console.log(`[Webhook] Sent successfully. Response status:`, res.status))
    .catch(err => console.warn(`[Webhook] Connection failed for event "${eventName}":`, err));
  } catch (err) {
    console.warn('[Webhook] Error executing dispatchWebhookForSave:', err);
  }
}


