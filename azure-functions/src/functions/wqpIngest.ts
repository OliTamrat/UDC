import { app, InvocationContext, Timer } from "@azure/functions";

/**
 * Water Quality Portal (WQP) broad parameter ingestion.
 * Runs weekly on Monday at 08:00 UTC.
 */
async function wqpIngest(myTimer: Timer, context: InvocationContext): Promise<void> {
  const appUrl = process.env.APP_URL;
  const apiKey = process.env.INGEST_API_KEY;

  if (!appUrl || !apiKey) {
    context.error("Missing APP_URL or INGEST_API_KEY environment variables");
    return;
  }

  context.log(`[WQP Ingest] Starting — ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${appUrl}/api/ingest?source=wqp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await res.json();

    if (res.ok) {
      context.log(`[WQP Ingest] Success — status: ${data.status}, records: ${data.count ?? data.records ?? "N/A"}`);
    } else {
      context.error(`[WQP Ingest] Failed — HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    context.error(`[WQP Ingest] Error — ${err instanceof Error ? err.message : String(err)}`);
  }
}

app.timer("wqpIngest", {
  schedule: "0 0 8 * * 1", // Weekly Monday at 08:00 UTC
  handler: wqpIngest,
});
