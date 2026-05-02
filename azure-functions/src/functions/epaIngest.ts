import { app, InvocationContext, Timer } from "@azure/functions";

/**
 * EPA Water Quality Portal data ingestion.
 * Runs daily at 07:00 UTC.
 */
async function epaIngest(myTimer: Timer, context: InvocationContext): Promise<void> {
  const appUrl = process.env.APP_URL;
  const apiKey = process.env.INGEST_API_KEY;

  if (!appUrl || !apiKey) {
    context.error("Missing APP_URL or INGEST_API_KEY environment variables");
    return;
  }

  context.log(`[EPA Ingest] Starting — ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${appUrl}/api/ingest?source=epa`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await res.json();

    if (res.ok) {
      context.log(`[EPA Ingest] Success — status: ${data.status}, records: ${data.count ?? data.records ?? "N/A"}`);
    } else {
      context.error(`[EPA Ingest] Failed — HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    context.error(`[EPA Ingest] Error — ${err instanceof Error ? err.message : String(err)}`);
  }
}

app.timer("epaIngest", {
  schedule: "0 0 7 * * *", // Daily at 07:00 UTC
  handler: epaIngest,
});
