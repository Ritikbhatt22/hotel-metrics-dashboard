import express from 'express';
import admin from 'firebase-admin';
import dayjs from 'dayjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readLocalMetrics() {
  const processedDir = path.join(__dirname, '..', 'processed-data');
  let files = [];
  try {
    files = await fs.readdir(processedDir);
  } catch (e) {
    return [];
  }
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  const all = [];
  for (const f of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(processedDir, f), 'utf-8');
      const parsed = JSON.parse(content);
      const data = Array.isArray(parsed.data) ? parsed.data : [];
      for (const row of data) {
        all.push({
          id: `${parsed.hotelName}-${row.date}-${row.metrics?.revenue ?? ''}`,
          hotelName: row.hotelName || parsed.hotelName,
          date: row.date ? new Date(row.date) : new Date(),
          metrics: row.metrics,
          sourceFile: row.sourceFile || f,
          createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
        });
      }
    } catch (e) {
      // ignore malformed file
    }
  }
  return all;
}

function isFirebaseInitialized() {
  return admin.apps && admin.apps.length > 0;
}

router.get('/', async (req, res) => {
  try {
    if (isFirebaseInitialized()) {
      const db = admin.firestore();
      const snapshot = await db.collection('hotel_metrics').orderBy('date', 'desc').limit(500).get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ data });
    }
    const local = await readLocalMetrics();
    // sort desc by date
    local.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ data: local });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:hotelName', async (req, res) => {
  try {
    const { hotelName } = req.params;
    if (isFirebaseInitialized()) {
      const db = admin.firestore();
      const snapshot = await db.collection('hotel_metrics').where('hotelName', '==', hotelName).orderBy('date', 'desc').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ data });
    }
    const local = await readLocalMetrics();
    const filtered = local.filter((r) => r.hotelName === hotelName).sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ data: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/date-range', async (req, res) => {
  try {
    const { startDate, endDate, hotelName } = req.body || {};
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required (YYYY-MM-DD)' });
    }

    const start = dayjs(startDate).toDate();
    const end = dayjs(endDate).toDate();

    if (isFirebaseInitialized()) {
      const db = admin.firestore();
      let query = db.collection('hotel_metrics')
        .where('date', '>=', start)
        .where('date', '<=', end);
      if (hotelName) {
        query = query.where('hotelName', '==', hotelName);
      }
      const snapshot = await query.orderBy('date', 'asc').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ data });
    }

    const local = await readLocalMetrics();
    const filtered = local.filter((r) => {
      const t = new Date(r.date).getTime();
      const inRange = t >= start.getTime() && t <= end.getTime();
      return inRange && (!hotelName || r.hotelName === hotelName);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ data: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:hotelName', async (req, res) => {
  try {
    const { hotelName } = req.params;
    if (isFirebaseInitialized()) {
      const db = admin.firestore();
      const collectionRef = db.collection('hotel_metrics');

      let totalDeleted = 0;
      while (true) {
        const snapshot = await collectionRef.where('hotelName', '==', hotelName).limit(500).get();
        if (snapshot.empty) break;
        const batch = db.batch();
        snapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += snapshot.size;
        if (snapshot.size < 500) break;
      }

      return res.json({ message: 'Hotel metrics deleted successfully', deleted: totalDeleted });
    }
    return res.json({ message: 'Hotel metrics deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// backend/routes/metrics.js
router.delete('/', async (req, res) => {
  try {
    if (!isFirebaseInitialized()) return res.json({ message: 'No Firebase instance' });

    const db = admin.firestore();
    const collectionRef = db.collection('hotel_metrics');
    let totalDeleted = 0;
    while (true) {
      const snapshot = await collectionRef.limit(500).get();
      if (snapshot.empty) break;
      const batch = db.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += snapshot.size;
      if (snapshot.size < 500) break;
    }

    res.json({ message: 'Hotel metrics deleted successfully', deleted: totalDeleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
