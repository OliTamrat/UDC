import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'nodejs';
export const maxDuration = 30;

type Period = '7d' | '30d' | '90d';
const LABELS: Record<Period, string> = { '7d': 'weekly', '30d': 'monthly', '90d': 'quarterly' };
const DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured.' }, { status: 503 });

  let period: Period = '7d';
  try { const b = await req.json(); if (['7d', '30d', '90d'].includes(b.period)) period = b.period; } catch { /* default */ }

  const days = DAYS[period];
  const label = LABELS[period];

  try {
    const db = await getDbClient();
    const now = new Date().toISOString();

    // 1. Station overview
    const { rows: stations } = await db.query(
      `SELECT id, name, type, status FROM stations WHERE status = 'active' ORDER BY id`
    );

    // 2. Period averages per station
    const { rows: stationAvgs } = await db.query(
      `SELECT station_id,
         COUNT(*) AS readings,
         ROUND(AVG(temperature)::numeric, 1) AS avg_temp,
         ROUND(AVG(dissolved_oxygen)::numeric, 1) AS avg_do,
         ROUND(AVG(ph)::numeric, 2) AS avg_ph,
         ROUND(AVG(turbidity)::numeric, 1) AS avg_turb,
         ROUND(AVG(conductivity)::numeric, 0) AS avg_cond,
         MIN(timestamp) AS earliest,
         MAX(timestamp) AS latest
       FROM readings
       WHERE source != 'seed' AND timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY station_id
       ORDER BY station_id`
    );

    // 3. EPA violations in period
    const { rows: violations } = await db.query(
      `SELECT station_id,
         COUNT(*) FILTER (WHERE dissolved_oxygen < 5.0) AS do_violations,
         COUNT(*) FILTER (WHERE ph < 6.5 OR ph > 9.0) AS ph_violations,
         COUNT(*) FILTER (WHERE temperature > 32) AS temp_violations,
         COUNT(*) FILTER (WHERE conductivity > 1000) AS cond_violations,
         COUNT(*) AS total
       FROM readings
       WHERE source != 'seed' AND timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY station_id`
    );

    // 4. Latest reading per station
    const { rows: latestReadings } = await db.query(
      `SELECT DISTINCT ON (station_id) station_id, timestamp, temperature, dissolved_oxygen, ph, conductivity, source
       FROM readings
       WHERE source != 'seed'
       ORDER BY station_id, timestamp DESC`
    );

    // Build data context
    const stationData = stationAvgs.map(s => {
      const v = violations.find(v => v.station_id === s.station_id);
      const latest = latestReadings.find(l => l.station_id === s.station_id);
      const info = stations.find(st => st.id === s.station_id);
      return `${s.station_id} (${info?.name || 'Unknown'}):
  ${s.readings} readings from ${s.earliest} to ${s.latest}
  Averages: Temp ${s.avg_temp}C, DO ${s.avg_do} mg/L, pH ${s.avg_ph}, Conductivity ${s.avg_cond} uS/cm${s.avg_turb ? `, Turbidity ${s.avg_turb} NTU` : ''}
  Latest reading (${latest?.timestamp}): Temp ${latest?.temperature}C, DO ${latest?.dissolved_oxygen} mg/L, pH ${latest?.ph}
  EPA violations: DO<5.0: ${v?.do_violations || 0}, pH outside 6.5-9.0: ${v?.ph_violations || 0}, Temp>32: ${v?.temp_violations || 0}, Cond>1000: ${v?.cond_violations || 0} (out of ${v?.total || 0} readings)`;
    }).join('\n\n');

    const totalReadings = stationAvgs.reduce((sum, s) => sum + Number(s.readings), 0);
    const totalViolations = violations.reduce((sum, v) => sum + Number(v.do_violations || 0) + Number(v.ph_violations || 0) + Number(v.temp_violations || 0) + Number(v.cond_violations || 0), 0);

    const dataContext = `
Report Type: ${label} (last ${days} days)
Report Date: ${now}
Active Stations: ${stations.length}
Total Readings in Period: ${totalReadings}
Total EPA Violations in Period: ${totalViolations}

IMPORTANT: E. coli is NOT measured by real-time USGS sensors. Lab analysis (EPA/WQP) is required for E. coli data. Do not report E. coli values unless they appear in the data below.

STATION DATA:
${stationData || 'No readings available for this period.'}

EPA THRESHOLDS:
  Dissolved Oxygen: min 5.0 mg/L
  pH: 6.5 - 9.0
  Temperature: max 32 C
  Conductivity: max 1000 uS/cm
  E. coli: max 410 CFU/100mL (lab test only)
`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `You are the UDC Water Resources Research Assistant generating a ${label} water quality report for the Anacostia River watershed.

FORMATTING RULES:
- Do NOT use markdown (no #, ##, *, **, bullets)
- Write in clear flowing paragraphs
- Use numbered sections: 1) Executive Summary, 2) Station-by-Station Analysis, 3) EPA Compliance Assessment, 4) Trends and Observations, 5) Recommendations
- Include specific numbers, units, and EPA threshold comparisons
- Flag any violations or concerning trends
- Note that E. coli requires lab testing and is not available from real-time sensors
- Write like a water quality researcher preparing a formal briefing

DATA:
${dataContext}`,
    });

    return NextResponse.json({ period, report: text, generatedAt: now });
  } catch (err) {
    console.error('[wqis/report] Error:', err);
    return NextResponse.json({ error: 'Report generation failed. Please try again.' }, { status: 500 });
  }
}
