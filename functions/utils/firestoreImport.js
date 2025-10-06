import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let initialized = false;

function initFirebase() {
  if (initialized) return;

  try {
    // Try to use the firebase-key.json file first
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    initialized = true;
    console.log('✅ Firestore initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    
    // Fallback to environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ Firebase credentials missing. Import will be skipped.');
      initialized = false;
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      });
      
      initialized = true;
      console.log('✅ Firestore initialized successfully (using env vars)');
    } catch (envError) {
      console.error('❌ Firebase initialization with env vars failed:', envError.message);
      initialized = false;
    }
  }
}

export async function importJsonToFirestore(jsonPayload, { sourceFile }) {
  if (!initialized) {
    return { skipped: true, reason: 'Missing Firebase credentials' };
  }

  try {
    const db = admin.firestore();
    const batch = db.batch();
    const collectionRef = db.collection('hotel_metrics');
    for (const row of jsonPayload.data || []) {
      const docRef = collectionRef.doc();
      batch.set(docRef, {
        hotelName: row.hotelName || jsonPayload.hotelName,
        date: row.date ? new Date(row.date) : new Date(),
        metrics: row.metrics,
        sourceFile: row.sourceFile || sourceFile,
        createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      });
    }
    await batch.commit();
    console.log(`✅ Successfully imported ${(jsonPayload.data || []).length} records to Firestore`);
    return { success: true, count: (jsonPayload.data || []).length };
  } catch (error) {
    console.error('❌ Firestore import failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Initialize Firebase when this module is imported
initFirebase();
