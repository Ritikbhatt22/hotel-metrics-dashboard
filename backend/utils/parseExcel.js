import path from 'path';
import fs from 'fs/promises';
import xlsx from 'xlsx';
import dayjs from 'dayjs';

function normalizeMetricsRow(row) {
  const date = dayjs(row.date || row.Date || row.DATE).toDate();
  const revenue = Number(row.revenue || row.Revenue || row.Sales || 0);
  const ADR = Number(row.ADR || row.adr || row['Avg Daily Rate'] || 0);
  const RevPAR = Number(row.RevPAR || row.revpar || 0);
  const occupancy = Number(row.occupancy || row.Occupancy || row['Occ %'] || 0);

  return { date, metrics: { revenue, ADR, RevPAR, occupancy } };
}

export async function parseExcelToJson({ excelPath, processedDir }) {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  const hotelName = path.basename(excelPath).replace(/\.(xlsx|xls)$/i, '');

  const data = rows.map(normalizeMetricsRow).map((entry) => ({
    hotelName,
    date: entry.date,
    metrics: entry.metrics,
    sourceFile: path.basename(excelPath),
    createdAt: new Date(),
  }));

  const json = { hotelName, data };
  const jsonFilename = `${hotelName}.json`;
  const jsonPath = path.join(processedDir, jsonFilename);
  await fs.writeFile(jsonPath, JSON.stringify(json, null, 2));

  return { json, jsonPath };
}
