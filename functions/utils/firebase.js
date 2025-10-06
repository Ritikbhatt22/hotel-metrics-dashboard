import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let initialized = false;

export function initFirebase() {
  if (initialized) return true;

  try {
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    initialized = true;
    console.log('✅ Firestore initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    return false;
  }
}

export function isFirebaseInitialized() {
  return initialized && admin.apps && admin.apps.length > 0;
}

export { admin };
