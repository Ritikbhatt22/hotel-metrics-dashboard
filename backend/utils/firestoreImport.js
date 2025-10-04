import admin from 'firebase-admin';

let initialized = false;

function initFirebase() {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase credentials missing. Import will be skipped.');
    initialized = false;
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
  initialized = true;
}

export async function importJsonToFirestore(jsonPayload, { sourceFile }) {
  initFirebase();
  if (!initialized) {
    return { skipped: true, reason: 'Missing Firebase credentials' };
  }

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
  return { success: true, count: (jsonPayload.data || []).length };
}
