# Azure Cost Analysis — UDC-WQIS
## Water Quality Information System — Infrastructure Economics

**Prepared by:** Oli T. Oli (Co-Founder & CTO, DAPS Analytics)
**Date:** April 17, 2026
**Production URL:** https://udc-wqis.happycoast-d9b0bcde.centralus.azurecontainerapps.io/
**Azure Region:** Central US

---

## 1. Current Azure Resource Inventory

| Resource | Type | SKU / Tier | Region | Purpose |
|----------|------|-----------|--------|---------|
| `udc-wqis-db` | Azure Database for PostgreSQL Flexible Server | Burstable B1ms (1 vCore, 2GB RAM, 32GB storage) | Central US | Primary production database |
| `udc-wqis-app` | Azure Container Apps | Consumption plan (scale-to-zero) | Central US | Next.js 16 application host |
| `udcwqisregistry` | Azure Container Registry | Basic tier | Central US | Docker image storage and versioning |
| `udc-wqis-jobs` | Azure Container Apps Jobs | Consumption plan | Central US | Cron jobs: USGS, EPA, WQP ingestion |
| `udc-wqis-storage` | Azure Blob Storage | Hot tier | Central US | Data exports, CSV uploads |

---

## 2. Monthly Cost Breakdown

### Current State (April 2026)

| Service | Component | Unit Cost | Monthly Cost |
|---------|-----------|-----------|-------------|
| **Azure PostgreSQL Flexible Server** | Compute: Burstable B1ms, 730 hrs/mo | $0.01352/vCore/hr | $9.87 |
| | Storage: 32GB included, 0GB overage | Included | $0.00 |
| | Backup storage (auto 7-day) | $0.095/GB | $2.93 |
| | **PostgreSQL subtotal** | | **$12.80** |
| **Azure Container Apps** | vCPU: 0.5 vCPU × active hours | $0.000024/vCPU/sec | $8.20 |
| | Memory: 1Gi × active hours | $0.000003/GiB/sec | $3.10 |
| | Requests: ~50K/mo | $0.40/million | $0.02 |
| | Egress: ~2GB/mo | $0.087/GB | $0.17 |
| | HTTP scale rule overhead | Minimal | $1.11 |
| | **Container Apps subtotal** | | **$14.60** |
| **Azure Container Registry** | Basic tier (10GB storage included) | $5.00/mo flat | $5.00 |
| | **ACR subtotal** | | **$5.00** |
| **Azure Container Apps Jobs** | 3 cron jobs × ~30 executions/mo | $0.000025/vCPU/sec | $0.08 |
| | Job memory consumption | $0.000003/GiB/sec | $0.02 |
| | **Jobs subtotal** | | **$0.10** |
| **Azure Blob Storage** | Stored data: ~100MB | $0.018/GB | $0.002 |
| | Operations: ~5K read/write | $0.004/10K | $0.002 |
| | Egress: ~500MB/mo | $0.087/GB | $0.016 |
| | **Storage subtotal** | | **$0.02** |
| | | | |
| **TOTAL** | | | **$32.52** |

### Cost Summary by Time Period

| Period | Cost | Notes |
|--------|------|-------|
| Daily | $1.08 | $32.52 ÷ 30.25 days/mo |
| Weekly | $7.56 | $1.08 × 7 |
| Monthly | $32.52 | Base production cost |
| Annual | $390.24 | $32.52 × 12 |
| 3-Year | $1,170.72 | Without scaling |
| 5-Year | $1,951.20 | Without scaling |

> **Context:** At $32.52/month, UDC-WQIS costs less than most individual SaaS subscriptions while running a production-grade environmental monitoring platform ingesting 200,000+ real government data points.

---

## 3. Database Growth Projections

### Current State

| Metric | Value |
|--------|-------|
| Current database size | ~46 MB |
| Total rows | 216,000+ |
| Primary tables | `readings`, `measurements`, `stations`, `parameters`, `ingestion_log` |
| Storage tier | 32 GB included in B1ms |
| Storage used (%) | 0.14% |

### Daily Ingestion Volume

| Source | Frequency | Estimated Records/Day | Notes |
|--------|-----------|----------------------|-------|
| USGS NWIS | Daily at 06:00 UTC | 9,120 | 7 sites × 6 parameters × 8 readings (last 24h at 3h intervals) |
| EPA Water Quality Portal | Daily at 07:00 UTC | ~200 | Lab results; varies with sampling activity |
| WQP Extended Parameters | Weekly Monday 08:00 UTC | ~500/week (~71/day avg) | Nutrients, metals, emerging contaminants |
| Manual uploads | On demand | Variable | Faculty and researcher CSV imports |
| **Total estimated** | | **~9,400/day** | ~282,000/month at current activity level |

### Storage Growth Model

| Timeframe | Estimated Row Count | Estimated DB Size | % of 32GB Limit |
|-----------|--------------------|--------------------|-----------------|
| Now (April 2026) | 216,000 | 46 MB | 0.14% |
| 6 months (Oct 2026) | 1,900,000 | 400 MB | 1.25% |
| 1 year (Apr 2027) | 3,600,000 | 760 MB | 2.38% |
| 2 years (Apr 2028) | 7,000,000 | 1.5 GB | 4.69% |
| 3 years (Apr 2029) | 10,400,000 | 2.2 GB | 6.88% |
| 6 years (Apr 2032) | 20,700,000 | 4.4 GB | 13.75% |
| ~28 years | ~150,000,000 | 32 GB | 100% — upgrade needed |

**Key finding:** The current 32GB storage allocation is sufficient for **approximately 28 years of ingestion at current rates** for a single watershed deployment. Storage is not a near-term concern. CPU and memory during peak ingestion windows are the more relevant scaling considerations.

### Storage Overage Costs (if triggered)

| Scenario | Additional Storage | Additional Cost |
|----------|--------------------|----------------|
| Upgrade to 64GB | +32GB | +$3.84/mo |
| Upgrade to 128GB | +96GB | +$11.52/mo |
| Upgrade to 512GB | +480GB | +$57.60/mo |

---

## 4. Ingestion Volume Analysis

### USGS NWIS — Primary Data Source

| USGS Station | Site ID | Status | Parameters | Readings/Day |
|-------------|---------|--------|-----------|-------------|
| NW Branch Anacostia at Riverdale | 01651000 | Active | 5 (temp, DO, pH, turbidity, conductivity) | 40 |
| NE Branch near Riverdale | 01649500 | Active | 5 | 40 |
| Hickey Run at National Arboretum | 01651827 | Active | 5 | 40 |
| NW Branch above Anacostia R | 01651750 | Active | 5 | 40 |
| Anacostia R at US Hwy 50 | 01651800 | Active | 5 | 40 |
| Watts Branch at Washington | 01651770 | Active | 5 | 40 |
| Unnamed tributary near Hyattsville | 01651730 | Active | 5 | 40 |
| **Total USGS** | 7 sites | | 35 streams/day | **280 readings/day** |

> Note: USGS 15-minute interval data covers the prior 24 hours, yielding 96 timestamps × 5 parameters × 7 sites = up to 3,360 potential raw readings per ingestion run. After deduplication (UNIQUE index + ON CONFLICT upsert), net new rows per day approximate 280–500 depending on station uptime.

### EPA and WQP

| Source | Trigger | Approx Records | Type |
|--------|---------|---------------|------|
| EPA WQP (DC FIPS US:11) | Daily | 50–500 | Lab-analyzed: nutrients, metals, biological |
| WQP Extended (HUC 02070010) | Weekly | 200–1,000 | Emerging contaminants, extended parameter set |

EPA and WQP ingestion volumes are highly variable — they depend on when agencies upload lab results to the federal portal. Ingestion runs that return zero records are normal and expected.

### Total Ingestion Cost (Azure Functions / Container Apps Jobs)

Azure charges for Container Apps Jobs execution at approximately $0.000025/vCPU-second. Each ingestion job runs for roughly 30–60 seconds at 0.5 vCPU:

| Job | Frequency | Duration | vCPU-seconds/mo | Monthly Cost |
|-----|-----------|----------|-----------------|-------------|
| USGS ingest | Daily | 45 sec | 675 | $0.017 |
| EPA ingest | Daily | 30 sec | 450 | $0.011 |
| WQP ingest | Weekly | 60 sec | 120 | $0.003 |
| **Total** | | | **1,245** | **$0.031** |

Ingestion infrastructure is effectively free at current scale.

---

## 5. Cost Optimization Options

### Option A: Scale-to-Zero Container App (Already Enabled)

The Container App is currently configured with `min-replicas: 0`, meaning it scales to zero when no requests arrive. This saves approximately $8–12/month compared to maintaining a permanently running minimum replica.

| Configuration | Monthly Cost | Savings |
|---------------|-------------|---------|
| min-replicas: 0 (current) | ~$14.60 | Baseline |
| min-replicas: 1 (always-on) | ~$24.80 | -$10.20/mo |
| min-replicas: 1 (business hours only, ~10 hrs/day) | ~$18.40 | -$3.80/mo |

**Recommendation:** Keep scale-to-zero for current single-tenant deployment. Add `min-replicas: 1` only when signed paying clients require uptime SLA guarantees.

### Option B: Downgrade Container Registry

| Tier | Cost | Storage | Included Features |
|------|------|---------|------------------|
| Basic (current) | $5.00/mo | 10 GB | Pull from Container Apps |
| Standard | $20.00/mo | 100 GB | Geo-replication, enhanced throughput |
| Premium | $50.00/mo | 500 GB | Private endpoints, content trust |

**Recommendation:** Basic tier is appropriate for current single-image, single-region deployment. No change needed.

### Option C: Managed Identity / Key Vault (Security Upgrade, Minimal Cost)

Adding Azure Key Vault for secrets management costs approximately $0.03/secret/month. For 5 secrets (DATABASE_URL, ANTHROPIC_API_KEY, ADMIN_API_KEY, INGEST_API_KEY, APP_URL):

| Addition | Monthly Cost |
|----------|-------------|
| Azure Key Vault (5 secrets) | $0.15 |
| Managed Identity (free) | $0.00 |
| **Total addition** | **$0.15/mo** |

This is the highest-priority security upgrade before any government partnership discussions.

### Option D: Azure for Startups Credits

Applying for Microsoft for Startups Founders Hub credits can eliminate Azure costs entirely for 12 months:

| Credit Level | Coverage at $32.52/mo | Duration |
|-------------|----------------------|---------|
| $5,000 | 153 months (12+ years at current scale) | N/A — use for growth |
| $10,000 | Full Year 1 scaling to 10 watersheds | 12 months |
| $25,000 | Full Year 1 + Azure OpenAI + Azure AI Search | 12 months |

**Recommendation:** Apply immediately. The application narrative is documented in `AZURE_STARTUP_APPLICATION.md`.

### Option E: Reserved Instances (Future)

Once the deployment is stable and client-committed for 12+ months, reserved instance pricing for PostgreSQL provides significant savings:

| Commitment | PostgreSQL Compute Cost | Savings vs. Pay-as-you-go |
|------------|------------------------|--------------------------|
| No reservation (current) | $9.87/mo | Baseline |
| 1-year reserved | $6.37/mo | -35% |
| 3-year reserved | $4.50/mo | -54% |

**Recommendation:** Pursue once first paying client is signed.

---

## 6. Platform Comparison: Vercel vs. Azure

| Factor | Vercel Hobby (Previous) | Azure (Current) |
|--------|------------------------|-----------------|
| **Monthly cost** | $0 | $32.52 |
| **Annual cost** | $0 | $390.24 |
| **Cron jobs** | 1 maximum (Hobby plan hard limit) | Unlimited (Container Apps Jobs) |
| **Function timeout** | 60 seconds | 10 minutes (Container Apps Jobs) |
| **Database** | Neon PostgreSQL serverless | Azure PostgreSQL Flexible Server |
| **SLA** | None (Hobby) | 99.9% (Container Apps + PostgreSQL) |
| **Custom SSL** | Vercel-managed only | Azure-managed + BYO certificate |
| **FedRAMP authorization** | No | Yes (Azure Government pathway) |
| **Secrets management** | Environment variables | Azure Key Vault (available) |
| **Monitoring** | Vercel dashboard only | Azure Monitor + App Insights |
| **Multi-region** | Vercel Edge Network | Azure multi-region (available) |
| **Government procurement** | Not viable | Direct pathway via Azure Government |
| **Startup credits** | Vercel credits (limited) | Microsoft Founders Hub ($5K–$150K) |
| **White-label isolation** | Project-per-deployment | Container App per client (clean) |
| **Log retention** | 1 day (Hobby) | 90 days (Log Analytics) |

**Summary:** Vercel Hobby was appropriate for development and proof-of-concept. Azure is required for production-grade deployment, government partnerships, multi-tenant white-label scaling, and grant compliance. The $32.52/month cost differential is justified at the first paying client contract.

---

## 7. White-Label Scaling Cost Projections

### Per-Watershed Marginal Cost

Each additional white-label watershed deployment adds the following Azure resources:

| Resource | Per-Watershed Addition | Monthly Cost |
|----------|----------------------|-------------|
| Container App (new instance) | Consumption plan | ~$10–15 |
| PostgreSQL database | Shared server, new database | ~$2 (storage) |
| Container Apps Jobs (3 cron jobs) | Timer triggers | ~$0.03 |
| Custom domain SSL | Azure-managed | $0 |
| **Per-watershed marginal cost** | | **~$12–17/mo** |

> Note: PostgreSQL Flexible Server supports multiple databases within a single server. Additional watersheds share compute costs until the server is CPU-constrained (~10+ active concurrent clients), at which point a second server is warranted.

### Revenue vs. Cost at Scale

| Deployments | Monthly Revenue ($500/watershed) | Monthly Azure Cost | Gross Margin | Margin % |
|------------|----------------------------------|-------------------|-------------|---------|
| 1 (current, UDC) | $0 (partnership) | $32.52 | -$32.52 | — |
| 5 paying clients | $2,500 | $32.52 + (5 × $15) = $107.52 | $2,392.48 | 95.7% |
| 10 paying clients | $5,000 | $32.52 + (10 × $15) = $182.52 | $4,817.48 | 96.4% |
| 25 paying clients | $12,500 | $32.52 + (25 × $15) = $407.52 | $12,092.48 | 96.7% |
| 50 paying clients | $25,000 | $32.52 + (50 × $15) = $782.52 | $24,217.48 | 96.9% |
| 100 paying clients | $50,000 | $32.52 + (100 × $15) = $1,532.52 | $48,467.48 | 96.9% |

**Key finding:** Infrastructure gross margins stabilize above 96% at scale due to Container Apps Consumption pricing — costs scale linearly with usage, not in step-function jumps. There is no over-provisioning tax.

### Infrastructure Cost at 10, 50, and 100 Watersheds

#### 10 Watersheds

| Service | Cost | Notes |
|---------|------|-------|
| PostgreSQL Flexible Server (B2s, 2 vCore) | $26.00 | Upgrade from B1ms at ~7 clients |
| Container Apps (10 apps) | $120.00 | ~$12/app/mo average |
| Container Registry (Standard) | $20.00 | Higher throughput for 10 deployments |
| Container Apps Jobs (30 cron jobs) | $0.30 | 3 per watershed |
| Storage + monitoring | $5.00 | Blob storage, basic monitoring |
| **Total** | **$171.30/mo** | $17.13/watershed/mo |

#### 50 Watersheds

| Service | Cost | Notes |
|---------|------|-------|
| PostgreSQL Flexible Server (GP D4s, 4 vCore) | $150.00 | General Purpose tier at this scale |
| Container Apps (50 apps) | $600.00 | ~$12/app/mo |
| Container Registry (Standard) | $20.00 | Unchanged |
| Container Apps Jobs (150 cron jobs) | $1.50 | 3 per watershed |
| Azure Monitor + App Insights | $25.00 | Per-deployment alerting |
| Storage + egress | $20.00 | |
| **Total** | **$816.50/mo** | $16.33/watershed/mo |

#### 100 Watersheds

| Service | Cost | Notes |
|---------|------|-------|
| PostgreSQL (2× GP D4s servers) | $300.00 | Sharded for isolation |
| Container Apps (100 apps) | $1,200.00 | |
| Container Registry (Premium) | $50.00 | Private endpoints, content trust |
| Container Apps Jobs (300 cron jobs) | $3.00 | |
| Azure Monitor | $50.00 | |
| Azure Key Vault (per-tenant secrets) | $15.00 | |
| Storage + egress | $40.00 | |
| **Total** | **$1,658.00/mo** | $16.58/watershed/mo |

**Conclusion:** Infrastructure cost per watershed **decreases with scale** and stabilizes at approximately $16–17/watershed/month — a 96.6% gross margin on the $500/month subscription price. This is a highly capital-efficient SaaS model.

---

## 8. Cost Sensitivity Analysis

| Variable | Change | Monthly Cost Impact |
|----------|--------|---------------------|
| Add Azure Key Vault | +5 secrets | +$0.15 |
| Add Azure Monitor + App Insights | Basic tier | +$0 (free tier) |
| Enable min-replicas: 1 (always-on) | Container App uptime SLA | +$10.20 |
| Add Azure OpenAI (GPT-4o, 1M tokens/mo) | AI assistant migration | +$15–30 |
| Add Azure AI Search (Basic, 1 index) | Research RAG | +$25 |
| Upgrade PostgreSQL to General Purpose | 2 vCore, 8GB (needed at ~7 clients) | +$66 |
| Enable geo-redundant backups | PostgreSQL option | +$6.50 |
| Add Azure CDN | Global edge caching | +$2–5 |

---

## 9. Recommended Immediate Actions

| Priority | Action | Monthly Impact | Effort |
|----------|--------|---------------|--------|
| 1 | Apply for Microsoft Founders Hub credits | -$32.52 (free) | 2 hours |
| 2 | Add Azure Key Vault for secrets | +$0.15 | 1 hour |
| 3 | Enable Azure Monitor health alert on `/api/health` | +$0 | 30 min |
| 4 | Set up Log Analytics workspace (90-day retention) | +$0 | 30 min |
| 5 | Enable 1-year Reserved Instance on PostgreSQL (post-client) | -$3.50 | 15 min |

---

*Prepared by Oli T. Oli, Co-Founder & CTO — DAPS Analytics*
*dapsanalytics.com*
*Cost figures as of April 2026; Azure pricing subject to change. All prices in USD.*
