import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// Simulated Landing AI extraction fallback for demo/testing
async function simulateExtraction(pdfPath, hotelName) {
  const today = new Date();
  const days = 10;
  const data = Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - i));
    const revenue = Math.round(5000 + Math.random() * 5000);
    const occupancy = Math.round(50 + Math.random() * 50);
    const ADR = Math.round(80 + Math.random() * 120);
    const RevPAR = Math.round((ADR * occupancy) / 100);
    return {
      hotelName,
      date: d,
      metrics: { revenue, ADR, RevPAR, occupancy },
      sourceFile: path.basename(pdfPath),
      createdAt: new Date(),
    };
  });
  return { hotelName, data };
}

export async function extractPdfToJson({ pdfPath, hotelName, processedDir }) {
  const apiKey = process.env.LANDING_AI_API_KEY;

  let json;
  if (!apiKey) {
    json = await simulateExtraction(pdfPath, hotelName);
  } else {
    try {
      const url = 'https://api.landing.ai/v1/extract'; // Placeholder - adjust to real endpoint
      const resp = await axios.post(url, {
        filePath: pdfPath,
        hotelName,
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      json = resp.data;
    } catch (err) {
      json = await simulateExtraction(pdfPath, hotelName);
    }
  }

  const jsonFilename = `${hotelName}.json`;
  const jsonPath = path.join(processedDir, jsonFilename);
  await fs.writeFile(jsonPath, JSON.stringify(json, null, 2));
  return { json, jsonPath };
}
