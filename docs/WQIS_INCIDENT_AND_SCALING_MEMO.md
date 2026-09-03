# WQIS — Service Degradation, Root Cause, and Scaling Decision

**Date:** 3 September 2026
**System:** UDC Water Quality Intelligence System (udc.wqis-app.com)
**Prepared by:** Oli T. Oli, DAPS Analytics
**Status:** Root cause confirmed. **All code fixes are deployed to production.** One infrastructure decision remains, and it is now the only outstanding blocker.

---

## Summary for the founders

For the past 36 hours the UDC dashboard has been intermittently failing: the Monitoring Stations table renders empty, the hourly data ingestion has failed on every run, and pages take 13–25 seconds to load.

The cause is not a bug in the application. **Our production database ran out of its allotted CPU capacity and has been throttled by Azure since 2 September at 03:00 UTC.** Everything else is a downstream symptom.

We have fixed the software problems that were making the situation worse, at no cost. Restoring the service to full health requires one paid decision: moving the database to a larger tier. The options and prices are below.

---

## What actually happened

The database runs on Azure's **Burstable** tier (`Standard_B1ms`, 1 vCPU, 2 GB RAM). Burstable tiers do not give you a full processor. They give you a small baseline allowance plus a balance of "CPU credits" you spend when you exceed it. When the credit balance reaches zero, Azure throttles the server to the baseline and it stays there until credits rebuild.

Our credit balance:

| Time (UTC) | Credits remaining |
|---|---|
| 1 Sep, 04:41 | **288** — the maximum for this tier |
| 2 Sep, 00:00 | 75, falling |
| 2 Sep, 02:00 | 5 |
| **2 Sep, 03:00** | **1 — exhausted** |
| 2 Sep → now | flat at 0–1 for 36+ hours |

CPU has since been pinned at **93.5% average, 99.8% peak**. The server is saturated and cannot rebuild credits while under load.

The hourly data ingestion job began failing at **exactly 02:00–03:00 UTC on 2 September** — the same hour the credits hit zero. That correlation is the clearest evidence we have.

### Why the user-visible symptoms look unrelated

- **Empty Monitoring Stations table.** The `/api/stations` endpoint now fails 4 out of every 5 requests, hitting a 60-second gateway timeout. The dashboard component treated that failure as "there are zero stations" and drew a table header over an empty body, with no error message. It looked like missing data; it was a timeout.
- **No new sensor readings.** The ingestion job calls an endpoint that has to finish inside 60 seconds. On a throttled database it could not.
- **Slow pages.** Every database query is competing for a throttled processor.

### What consumed the credits

The ingestion job was writing to the database **one row at a time** — roughly **11,400 separate database round-trips every hour**, around the clock. On a 1 vCPU Burstable instance that is a continuous drain. It worked for months because the tables were small; as they grew past ~237,000 readings the cost per run crossed the line, drained the balance, and never recovered.

---

## What we have already fixed — no cost

Six changes are complete, tested, and ready to deploy:

| Fix | Effect |
|---|---|
| **Batched database writes** | Ingestion goes from **~11,400 round-trips to ~41** per run — a ~280× reduction in database load. This is the single largest lever we have. |
| **Multi-block sensor parser** | A parsing bug was silently discarding *all* readings from stations whose sensors had been replaced. Two stations that appeared dead are live again, and a third regains a missing measurement. |
| **Corrected a dead gauge mapping** | One station was pointed at a USGS gauge retired in 2022. Repointed to a live gauge 1.9 km away. |
| **Removed stale 2025 values** | Stations with no working gauge were displaying December 2025 demonstration values as if they were current readings — including to the AI assistant, which reported them as live findings. They are now labelled "No current data". |
| **Fixed the watermarked map** | The map provider began requiring a paid API key and stamped "API KEY REQUIRED" across every tile without raising an error. Switched to an equivalent provider that needs no key. **This avoided a recurring licence cost.** |
| **Visible failure state** | The station table can no longer render blank. It falls back to the known station list and states plainly that live readings are unavailable. |

Verified locally: a full ingestion run now completes in **9.5 seconds with zero errors**, versus timing out at 60 seconds before.

---

## The decision we need: database tier

The load reduction above helps substantially, but it cannot restore a balance that is already at zero on a saturated server. We need more capacity.

Monthly **compute** cost, list price, 730 hours. Storage and backup are separate and unchanged by this decision.

| Option | vCPU / RAM | Central US | East US | Credit ceiling? |
|---|---|---|---|---|
| `B1ms` — current | 1 / 2 GB | $14.02 | $12.41 | Yes — this is what failed |
| `B2s` | 2 / 4 GB | $56.09 | $49.64 | Yes |
| **`B2ms` — recommended** | **2 / 8 GB** | **$112.19** | **$99.28** | Yes, but 5× headroom |
| `D2ds_v5` — General Purpose | 2 / 8 GB | $146.73 | $129.94 | **No ceiling** |

### Recommendation

**Move to `B2ms`**, paired with the batching fix already completed.

The reasoning: the credit drain was driven by the ingestion write volume, which we have now reduced roughly 280-fold. Combined with double the processor and four times the memory, this should sit comfortably inside the credit allowance rather than fighting it. It costs about **$98/month more** than today.

**Choose `D2ds_v5` instead if we want certainty rather than a good estimate.** General Purpose has no credit system at all, so this class of failure becomes structurally impossible. It costs roughly **$35/month more than B2ms**. Given that this dashboard is now embedded on a University of the District of Columbia web page, that premium may be worth paying for reputational safety alone.

Either option can be reduced later with an Azure Reserved Instance (1-year commitment typically saves 35–40%) once we have a stable baseline.

### Storage — recommend no change

Storage is 32 GB at 120 IOPS. Measured today: **disk I/O is running at 0–1% of capacity and storage is 16% full.** Disk is not a constraint. Storage growth on Azure is also **irreversible** — it cannot be shrunk. We should not spend here.

### On the region

UDC is in Washington DC; the entire stack currently sits in **Central US** (Iowa) rather than **East US** (Virginia). This is worth flagging for two reasons: East US is consistently **~11% cheaper** across every tier above, and it is physically closer to the users. It is *not* related to the current outage and should not be rushed — moving regions means migrating the database, the container environment and DNS. The right time to reconsider it is alongside the planned sovereign-deployment work, not as an emergency change.

---

## Preventing a recurrence

1. **Alert on CPU credits.** No alarm existed. A simple Azure Monitor alert when `cpu_credits_remaining` drops below 50 would have given us roughly a day of warning. This is free and should be set up regardless of the tier chosen.
2. **Alert on ingestion failure.** The hourly job failed 36 times before anyone noticed, because failures were silent.
3. **Never let a component fail invisibly.** The empty station table is the real lesson: the dashboard hid a serious outage behind a normal-looking, empty panel. Fixed, and worth applying as a standard across our products.
4. **Watch write volume as data grows.** The ingestion job worked fine for months and then crossed a threshold. Row counts and per-run duration should be tracked, not assumed.

---

---

## Confirmation that the tier is the only thing left

All fixes were deployed to production on 3 September at 17:35 UTC. Automated
tests passed and the deployment succeeded. We then measured the live service:

| Endpoint | Result |
|---|---|
| Home page (no database) | **HTTP 200 in 1.4 seconds** |
| `/api/stations` | **times out at 60 seconds** |
| `/api/health` | **times out at 60 seconds** |
| Data ingestion (now batched) | **times out at 60 seconds** |

The application is healthy and fast wherever it does not touch the database.
Every request that does touch it fails. Even the batched ingestion — reduced
roughly 280-fold — cannot complete, because the database is throttled to a
fraction of one processor.

This is the clearest possible confirmation: **the software problems are solved,
and the database tier is the sole remaining cause of the outage.** No further
code change will improve this.

One immediate benefit is already live: the dashboard now displays all 12 stations
with a clear notice that live readings are unavailable, instead of an empty
panel that looked like a broken or abandoned product.

---

## What happens next

1. **Founders choose a tier** (`B2ms` recommended). This is the only blocker.
2. We scale the database — a few minutes of downtime.
3. We confirm the station list, live readings and hourly ingestion recover.
4. We add the CPU-credit and ingestion-failure alerts described above.
5. We resume the UDC website embed work, which is parked and safe on a branch.

Steps 2 to 4 are approximately half a day of work once the decision is made.
