import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseExcelToJson } from '../utils/parseExcel.js';
import { extractPdfToJson } from '../utils/extractPDF.js';
import { importJsonToFirestore } from '../utils/firestoreImport.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Use absolute path & ensure folders exist
const uploadDir = path.resolve(__dirname, '../uploads');
const processedDir = path.resolve(__dirname, '../processed-data');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📂 Created uploads folder at', uploadDir);
}
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
  console.log('📂 Created processed-data folder at', processedDir);
}

// ✅ Configure multer with absolute paths
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

router.post('/', upload.array('files', 20), async (req, res) => {
  try {
    console.log('✅ Files received:', req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const originalName = file.originalname;
      const baseName = path.basename(originalName, ext);

      let outputJsonPath = '';
      let jsonPayload = null;

      if (ext === '.pdf') {
        const hotelName = baseName;
        const { json, jsonPath } = await extractPdfToJson({
          pdfPath: file.path,
          hotelName,
          processedDir,
        });
        outputJsonPath = jsonPath;
        jsonPayload = json;
      } else if (ext === '.xlsx' || ext === '.xls') {
        const { json, jsonPath } = await parseExcelToJson({
          excelPath: file.path,
          processedDir,
          hotelName: baseName,
          sourceFile: originalName,
        });
        outputJsonPath = jsonPath;
        jsonPayload = json;
      } else {
        results.push({ file: originalName, status: 'skipped', reason: 'Unsupported file type' });
        continue;
      }

      const importResult = await importJsonToFirestore(jsonPayload, { sourceFile: originalName });
      results.push({ file: originalName, status: importResult?.skipped ? 'skipped' : 'processed', jsonPath: outputJsonPath, details: importResult });
    }

    res.json({ status: 'ok', results });
  } catch (err) {
    console.error('🔥 Upload error:', err);
    res.status(500).json({ error: 'Processing failed', details: err.message });
  }
});

export default router;
