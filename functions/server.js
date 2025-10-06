import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import uploadRouter from './routes/upload.js';
import metricsRouter from './routes/metrics.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    "https://your-frontend.vercel.app",
    "https://your-frontend.netlify.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "DELETE", "PUT"]
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/processed-data', express.static(path.join(__dirname, 'processed-data')));

app.use('/upload', uploadRouter);
app.use('/api/metrics', metricsRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Hotel Metrics Backend' });
});

export default app;

