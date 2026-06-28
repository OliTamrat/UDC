import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'nodejs';
export const maxDuration = 30;

const EPA: Record<string, { min?: number; max?: number; unit: string; label: string }> = {
  dissolved_oxygen: { min: 5.0, unit: 'mg/L', label: 'Dissolved Oxygen' },
  ph: { min: 6.5, max: 9.0, unit: 'pH', label: 'pH' },
  temperature: { max: 32, unit: '°C', label: 'Temperature' },
  turbidity: { max: 25, unit: 'NTU', label: 'Turbidity' },
  conductivity: { max: 1000, unit: 'µS/cm', label: 'Conductivity' },
  ecoli_count: { max: 410, unit: 'CFU/100mL', label: 'E. coli' },
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured.' }, { status: 503 });

  let stationId: string;
  try { const b = await req.json(); stationId = b.stationId; } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
  if (!stationId?.trim()) return NextResponse.json({ error: 'stationId is required' }, { status: 400 });

  try {
    const db = await getDbClient();

    // 1. Station metadata
    const { rows: stationRows } = await db.query(
      'SELECT id, name, type, status, latitude, longitude FROM stations WHERE id = ?', [stationId]
    );
    if (stationRows.length === 0) return NextResponse.json({ error: `Station ${stationId} not found` }, { status: 404 });
    const station = stationRows[0];

    // 2. Latest reading (newest single row, non-seed)
    const { rows: latestRows } = await db.query(
      `SELECT timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, ecoli_count, nitrate_n, phosphorus, source
       FROM readings WHERE station_id = ? AND source != 'seed'
       ORDER BY timestamp DESC LIMIT 1`, [stationId]
    );

    // 3. 7-day trend averages (current half vs previous half)
    const { rows: trendRows } = await db.query(
      `SELECT
         ROUND(AVG(temperature)::numeric, 2) AS avg_temp,
         ROUND(AVG(dissolved_oxygen)::numeric, 2) AS avg_do,
         ROUND(AVG(ph)::numeric, 3) AS avg_ph,
         ROUND(AVG(turbidity)::numeric, 2) AS avg_turb,
         ROUND(AVG(conductivity)::numeric, 1) AS avg_cond,
         ROUND(AVG(ecoli_count)::numeric, 0) AS avg_ecoli,
         COUNT(*) AS reading_count,
         MIN(timestamp) AS earliest,
         MAX(timestamp) AS latest
       FROM readings
       WHERE station_id = ? AND source != 'seed'
         AND timestamp >= NOW() - INTERVAL '7 days'`, [stationId]
    );

    // 4. Previous 7-day averages for comparison
    const { rows: prevRows } = await db.query(
      `SELECT
         ROUND(AVG(temperature)::numeric, 2) AS avg_temp,
         ROUND(AVG(dissolved_oxygen)::numeric, 2) AS avg_do,
         ROUND(AVG(ph)::numeric, 3) AS avg_ph,
         ROUND(AVG(turbidity)::numeric, 2) AS avg_turb,
         ROUND(AVG(conductivity)::numeric, 1) AS avg_cond,
         COUNT(*) AS reading_count
       FROM readings
       WHERE station_id = ? AND source != 'seed'
         AND timestamp >= NOW() - INTERVAL '14 days'
         AND timestamp < NOW() - INTERVAL '7 days'`, [stationId]
    );

    // 5. EPA violation counts (last 7 days)
    const { rows: violationRows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE dissolved_oxygen < 5.0) AS do_violations,
         COUNT(*) FILTER (WHERE ph < 6.5 OR ph > 9.0) AS ph_violations,
         COUNT(*) FILTER (WHERE temperature > 32) AS temp_violations,
         COUNT(*) FILTER (WHERE turbidity > 25) AS turb_violations,
         COUNT(*) FILTER (WHERE conductivity > 1000) AS cond_violations,
         COUNT(*) FILTER (WHERE ecoli_count > 410) AS ecoli_violations,
         COUNT(*) AS total_readings
       FROM readings
       WHERE station_id = ? AND source != 'seed'
         AND timestamp >= NOW() - INTERVAL '7 days'`, [stationId]
    );

    const latest = latestRows[0] || null;
    const trend = trendRows[0] || null;
    const prev = prevRows[0] || null;
    const violations = violationRows[0] || null;
    const now = new Date().toISOString();

    // Build structured data summary for Gemini
    const dataContext = `
Station: ${station.name} (${station.id}), Type: ${station.type}, Status: ${station.status}
Location: ${station.latitude}°N, ${station.longitude}°W
Analysis Time: ${now}

LATEST READING${latest ? ` (${latest.timestamp}):
  Temperature: ${latest.temperature ?? 'N/A'} °C
  Dissolved Oxygen: ${latest.dissolved_oxygen ?? 'N/A'} mg/L
  pH: ${latest.ph ?? 'N/A'}
  Turbidity: ${latest.turbidity ?? 'N/A'} NTU
  Conductivity: ${latest.conductivity ?? 'N/A'} µS/cm
  E. coli: ${latest.ecoli_count ?? 'N/A'} CFU/100mL
  Nitrate-N: ${latest.nitrate_n ?? 'N/A'} mg/L
  Phosphorus: ${latest.phosphorus ?? 'N/A'} mg/L
  Source: ${latest.source}` : ': No recent non-seed readings available.'}

7-DAY TREND (${trend?.reading_count || 0} readings, ${trend?.earliest || 'N/A'} to ${trend?.latest || 'N/A'}):
  Avg Temperature: ${trend?.avg_temp ?? 'N/A'} °C
  Avg DO: ${trend?.avg_do ?? 'N/A'} mg/L
  Avg pH: ${trend?.avg_ph ?? 'N/A'}
  Avg Turbidity: ${trend?.avg_turb ?? 'N/A'} NTU
  Avg Conductivity: ${trend?.avg_cond ?? 'N/A'} µS/cm
  Avg E. coli: ${trend?.avg_ecoli ?? 'N/A'} CFU/100mL

PREVIOUS 7-DAY AVERAGES (for comparison, ${prev?.reading_count || 0} readings):
  Avg Temperature: ${prev?.avg_temp ?? 'N/A'} °C
  Avg DO: ${prev?.avg_do ?? 'N/A'} mg/L
  Avg pH: ${prev?.avg_ph ?? 'N/A'}
  Avg Turbidity: ${prev?.avg_turb ?? 'N/A'} NTU
  Avg Conductivity: ${prev?.avg_cond ?? 'N/A'} µS/cm

EPA VIOLATIONS (last 7 days out of ${violations?.total_readings || 0} readings):
  DO below 5.0 mg/L: ${violations?.do_violations ?? 0}
  pH outside 6.5-9.0: ${violations?.ph_violations ?? 0}
  Temperature above 32°C: ${violations?.temp_violations ?? 0}
  Turbidity above 25 NTU: ${violations?.turb_violations ?? 0}
  Conductivity above 1000 µS/cm: ${violations?.cond_violations ?? 0}
  E. coli above 410 CFU/100mL: ${violations?.ecoli_violations ?? 0}

EPA THRESHOLDS:
${Object.entries(EPA).map(([k, v]) => `  ${v.label}: ${v.min ? `min ${v.min}` : ''}${v.min && v.max ? ', ' : ''}${v.max ? `max ${v.max}` : ''} ${v.unit}`).join('\n')}
`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `You are the UDC Water Resources Research Assistant analyzing station data from the Anacostia River watershed. Using the data below, write a professional research-quality analysis.

IMPORTANT FORMATTING RULES:
- Do NOT use markdown (no #, ##, *, **, bullets)
- Write in clear flowing paragraphs
- Use numbered sections: 1) Latest Readings Summary, 2) Trend Analysis, 3) EPA Compliance Status, 4) Overall Health Assessment
- Include specific numbers, units, and EPA threshold comparisons
- Flag any violations or concerning trends
- Write like a water quality researcher preparing a briefing

DATA:
${dataContext}`,
    });

    return NextResponse.json({ stationId, analysis: text, analyzedAt: now });
  } catch (err) {
    console.error('[wqis/analyze] Error:', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
