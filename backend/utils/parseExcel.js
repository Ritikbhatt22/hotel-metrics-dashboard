import path from 'path';
import fs from 'fs/promises';
import xlsx from 'xlsx';
import dayjs from 'dayjs';

function parseDateCell(raw) {
  if (!raw) return null;
  // If already a Date instance (xlsx with cellDates: true), normalize to midnight UTC
  if (raw instanceof Date && !isNaN(raw)) {
    const d = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()));
    return d;
  }
  // Excel serial date number
  if (typeof raw === 'number' && isFinite(raw)) {
    const excelEpoch = Date.UTC(1899, 11, 30); // Excel epoch (accounts for 1900 leap bug)
    const ms = Math.round(raw * 24 * 60 * 60 * 1000);
    return new Date(excelEpoch + ms);
  }
  // Fallback: parse string
  const parsed = dayjs(raw);
  if (parsed.isValid()) {
    // Normalize to midnight UTC to avoid tz shifts when rendering ISO date-only
    const d = parsed.toDate();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  return null;
}

function normalizeMetricsRow(row) {
  const rawDate = row.date || row.Date || row.DATE || row["Date"];
  const date = parseDateCell(rawDate) || new Date();
  const revenue = Number(row.revenue || row.Revenue || row.Sales || 0);
  const ADR = Number(row.ADR || row.adr || row['Avg Daily Rate'] || 0);
  const RevPAR = Number(row.RevPAR || row.revpar || 0);
  const occupancy = Number(row.occupancy || row.Occupancy || row['Occ %'] || 0);

  return { date, metrics: { revenue, ADR, RevPAR, occupancy } };
}

export async function parseExcelToJson({ excelPath, processedDir, hotelName: hotelNameOverride, sourceFile: sourceFileOverride }) {
  const workbook = xlsx.readFile(excelPath, { cellDates: true, raw: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });

  const hotelName = (hotelNameOverride && hotelNameOverride.trim())
    ? hotelNameOverride.trim()
    : path.basename(excelPath).replace(/\.(xlsx|xls)$/i, '');

  const data = rows.map(normalizeMetricsRow).map((entry) => ({
    hotelName,
    date: entry.date,
    metrics: entry.metrics,
    sourceFile: sourceFileOverride || path.basename(excelPath),
    createdAt: new Date(),
  }));

  const json = { hotelName, data };
  const jsonFilename = `${hotelName}.json`;
  const jsonPath = path.join(processedDir, jsonFilename);
  await fs.writeFile(jsonPath, JSON.stringify(json, null, 2));
  return { json, jsonPath };
}
