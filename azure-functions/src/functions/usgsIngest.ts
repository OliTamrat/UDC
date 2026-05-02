import { app, InvocationContext, Timer } from "@azure/functions";

/**
 * USGS NWIS real-time sensor data ingestion.
 * Runs daily at 06:00 UTC — matches the original Vercel Cron schedule.
 */
async function usgsIngest(myTimer: Timer, context: InvocationContext): Promise<void> {
  const appUrl = process.env.APP_URL;
  const apiKey = process.env.INGEST_API_KEY;

  if (!appUrl || !apiKey) {
    context.error("Missing APP_URL or INGEST_API_KEY environment variables");
    return;
  }

  context.log(`[USGS Ingest] Starting — ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${appUrl}/api/ingest?source=usgs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await res.json();

    if (res.ok) {
      context.log(`[USGS Ingest] Success — status: ${data.status}, records: ${data.count ?? data.records ?? "N/A"}`);
    } else {
      context.error(`[USGS Ingest] Failed — HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    context.error(`[USGS Ingest] Error — ${err instanceof Error ? err.message : String(err)}`);
  }
}

app.timer("usgsIngest", {
  schedule: "0 0 6 * * *", // Daily at 06:00 UTC
  handler: usgsIngest,
});
