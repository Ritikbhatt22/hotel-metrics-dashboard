import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseExcelToJson } from '../utils/parseExcel.js';
import { extractPdfToJson } from '../utils/extractPDF.js';
import { importJsonToFirestore } from '../utils/firestoreImport.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
const processedDir = path.join(__dirname, '..', 'processed-data');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

router.post('/', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const originalName = file.originalname;

      let outputJsonPath = '';
      let jsonPayload = null;

      if (ext === '.pdf') {
        const hotelName = originalName.replace(/\.pdf$/i, '');
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
        });
        outputJsonPath = jsonPath;
        jsonPayload = json;
      } else {
        results.push({ file: originalName, status: 'skipped', reason: 'Unsupported file type' });
        continue;
      }

      await importJsonToFirestore(jsonPayload, { sourceFile: originalName });

      results.push({ file: originalName, status: 'processed', jsonPath: outputJsonPath });
    }

    res.json({ status: 'ok', results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Processing failed', details: err.message });
  }
});

export default router;
