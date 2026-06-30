import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

export const runtime = 'nodejs';

export interface WqisAlert {
  station: string; stationName: string; parameter: string;
  value: number; threshold: number; severity: 'WARNING' | 'CRITICAL';
}
export interface WqisInsightsResponse {
  overallStatus: 'GOOD' | 'WARNING' | 'POOR' | 'CRITICAL';
  alerts: WqisAlert[]; summary: string; checkedAt: string;
}

let cachedInsights: WqisInsightsResponse | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (cachedInsights && Date.now() < cacheExpiry) return NextResponse.json(cachedInsights);

  try {
    const db = await getDbClient();

    // Get latest non-seed reading per station
    const { rows } = await db.query(
      `SELECT DISTINCT ON (r.station_id)
         r.station_id, s.name AS station_name, r.timestamp,
         r.temperature, r.dissolved_oxygen, r.ph, r.turbidity,
         r.conductivity, r.ecoli_count
       FROM readings r
       JOIN stations s ON r.station_id = s.id
       WHERE r.source != 'seed' AND s.status = 'active'
       ORDER BY r.station_id, r.timestamp DESC`
    );

    const alerts: WqisAlert[] = [];

    for (const r of rows) {
      const station = String(r.station_id);
      const name = String(r.station_name);

      if (r.dissolved_oxygen != null && Number(r.dissolved_oxygen) < 5.0) {
        const val = Number(r.dissolved_oxygen);
        alerts.push({ station, stationName: name, parameter: 'Dissolved Oxygen', value: val, threshold: 5.0, severity: val < 2.0 ? 'CRITICAL' : 'WARNING' });
      }
      if (r.ph != null && (Number(r.ph) < 6.5 || Number(r.ph) > 9.0)) {
        const val = Number(r.ph);
        alerts.push({ station, stationName: name, parameter: 'pH', value: val, threshold: val < 6.5 ? 6.5 : 9.0, severity: val < 5.5 || val > 10.0 ? 'CRITICAL' : 'WARNING' });
      }
      if (r.temperature != null && Number(r.temperature) > 32) {
        alerts.push({ station, stationName: name, parameter: 'Temperature', value: Number(r.temperature), threshold: 32, severity: Number(r.temperature) > 35 ? 'CRITICAL' : 'WARNING' });
      }
      if (r.conductivity != null && Number(r.conductivity) > 1000) {
        alerts.push({ station, stationName: name, parameter: 'Conductivity', value: Number(r.conductivity), threshold: 1000, severity: Number(r.conductivity) > 1500 ? 'CRITICAL' : 'WARNING' });
      }
      if (r.ecoli_count != null && Number(r.ecoli_count) > 410) {
        const val = Number(r.ecoli_count);
        alerts.push({ station, stationName: name, parameter: 'E. coli', value: val, threshold: 410, severity: val > 1000 ? 'CRITICAL' : 'WARNING' });
      }
    }

    const hasCritical = alerts.some(a => a.severity === 'CRITICAL');
    const hasWarning = alerts.some(a => a.severity === 'WARNING');
    const overallStatus: WqisInsightsResponse['overallStatus'] = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'GOOD';

    const stationCount = rows.length;
    const summary = alerts.length === 0
      ? `All ${stationCount} active stations are within EPA thresholds. Water quality conditions are normal across the Anacostia watershed.`
      : `${alerts.length} EPA threshold violation${alerts.length > 1 ? 's' : ''} detected across ${new Set(alerts.map(a => a.station)).size} station${new Set(alerts.map(a => a.station)).size > 1 ? 's' : ''}. ${alerts.filter(a => a.severity === 'CRITICAL').length > 0 ? `${alerts.filter(a => a.severity === 'CRITICAL').length} critical alert${alerts.filter(a => a.severity === 'CRITICAL').length > 1 ? 's' : ''} require immediate attention.` : 'Conditions should be monitored closely.'}`;

    const insights: WqisInsightsResponse = { overallStatus, alerts, summary, checkedAt: new Date().toISOString() };
    cachedInsights = insights;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return NextResponse.json(insights);
  } catch (err) {
    console.error('[wqis/insights] Error:', err);
    return NextResponse.json({ error: 'Failed to check water quality status' }, { status: 500 });
  }
}
