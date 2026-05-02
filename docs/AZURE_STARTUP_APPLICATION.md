# Microsoft for Startups Founders Hub — Application Narrative
## DAPS Analytics / UDC-WQIS Platform

**Applicant:** Oli T. Oli, Co-Founder & CTO
**Company:** DAPS Analytics (Data Analytics for Practical Solutions)
**Website:** dapsanalytics.com
**Application Date:** April 17, 2026
**Credit Request:** $5,000 – $25,000 Azure credits (Year 1 scaling)

---

## 1. Company Overview

**DAPS Analytics** (Data Analytics for Practical Solutions) is an early-stage software company building production-grade environmental monitoring platforms for government agencies, universities, and watershed organizations. Co-founded by Oli T. Oli (CTO) in partnership with Dr. Tolessa Deksissa of UDC's Water Resources Research Institute, DAPS Analytics brings a global perspective to local environmental challenges — recognizing that water quality crises in the Anacostia watershed mirror broader environmental justice problems faced by communities worldwide.

DAPS Analytics is incorporated as a technology company operating at the intersection of environmental science, open government data, and cloud software infrastructure. The company's mission is to make real-time water quality data accessible, interpretable, and actionable for both technical researchers and community members who have historically lacked access to this information.

---

## 2. Product Description — UDC-WQIS

**UDC-WQIS** (University of the District of Columbia — Water Quality Information System) is a production-grade, AI-augmented water quality monitoring dashboard developed in partnership with UDC's Water Resources Research Institute (WRRI) and Center for Agriculture, Urban Sustainability and Environmental Solutions (CAUSES).

The platform monitors the Anacostia watershed in Washington, DC — one of the most studied yet historically neglected urban watersheds in the United States — and provides real-time environmental intelligence to researchers, faculty, students, government agencies, and DC community members.

### Platform Capabilities

| Capability | Details |
|------------|---------|
| **Monitoring Coverage** | 12 stations across the Anacostia watershed |
| **Parameter Tracking** | 25 water quality parameters (physical, nutrients, metals, biological, emerging contaminants) |
| **Data Volume** | 216,000+ database rows ingested from live government APIs |
| **Data Sources** | USGS NWIS real-time sensors, EPA Water Quality Portal, WQP lab results |
| **Automated Ingestion** | 3 cron jobs (USGS daily, EPA daily, WQP weekly) via Azure Functions Timer Triggers |
| **API Surface** | 14 REST endpoints, publicly accessible for researchers and citizen scientists |
| **AI Integration** | Claude-powered research assistant with domain-specific prompting and live tool calls |
| **Export** | CSV/JSON data export with scientific citations |
| **Admin Panel** | Faculty-facing CRUD interface with AI-assisted CSV column mapping |
| **Interactive Mapping** | Leaflet-based GIS dashboard with 5 toggleable watershed overlay layers |
| **Scientific Storytelling** | 4 interactive data narratives designed for non-technical community engagement |

### Current Production Deployment

The platform is live and serving real data:

- **Production URL:** https://udc-wqis.happycoast-d9b0bcde.centralus.azurecontainerapps.io/
- **Infrastructure:** Azure Container Apps (Central US), Azure Database for PostgreSQL (Flexible Server), Azure Container Registry
- **Codebase:** ~15,900 lines of TypeScript/React across 64 source files
- **Testing:** 52 automated tests across 11 suites; GitHub Actions CI/CD on every push

The system ingests real sensor readings from USGS gauging stations along the Anacostia river system every morning at 06:00 UTC and stores them in a normalized PostgreSQL database. The USGS alone contributes approximately 9,120 raw data points per day from 7 active gauge sites.

---

## 3. Market Opportunity

### The Addressable Market

The United States contains more than **2,100 designated watersheds** managed by a patchwork of state environmental agencies, federal offices, university research institutes, watershed councils, and tribal nations. Every single one of these entities shares the same need: accessible, real-time water quality data presented in a format that both technical staff and community stakeholders can understand and act upon.

Current solutions are fragmented and inadequate:

- **USGS/EPA raw data portals** — accurate but inaccessible to non-specialists; no visualization, no AI assistance, no institutional branding
- **Commercial SCADA/LIMS systems** — enterprise-grade but priced at $50,000–$500,000+ per deployment, excluding smaller universities and watershed nonprofits
- **Custom in-house dashboards** — exist at a handful of well-funded institutions; most organizations lack the engineering capacity to build or maintain them

DAPS Analytics targets the vast underserved middle: **state EPAs, land-grant universities, watershed councils, and environmental justice organizations** that need production-grade monitoring infrastructure but cannot afford enterprise pricing.

### Market Segments

| Segment | Estimated Organizations | Est. Value/Org |
|---------|------------------------|----------------|
| State EPA regional offices | 300+ | $5K setup + $500/mo |
| Land-grant universities (1890 + 1862) | 100+ | $5K setup + $500/mo |
| Watershed protection organizations | 500+ | $5K setup + $250/mo |
| Tribal water quality programs | 200+ | Subsidized / grant-funded |
| International development (UN, World Bank) | Pipeline | Custom pricing |

**Conservative Year 3 scenario:** 50 watershed deployments at $500/mo average = **$300,000 ARR** with infrastructure costs below $5,000/mo at scale due to shared Azure PostgreSQL and Container Apps consumption pricing.

### Environmental Justice Imperative

The Anacostia watershed is an environmental justice corridor — the communities most affected by water quality degradation (Wards 7 and 8 in DC) are predominantly Black and Brown, with median household incomes well below the DC average. DAPS Analytics was built with this reality in mind: every data point, chart, and AI-generated insight is designed to empower community members, not just scientists. This positions UDC-WQIS favorably for **EPA Environmental Justice grants** (EJCPS program, $500K) and **NSF Smart and Connected Communities** funding ($1.5M), both of which explicitly weight community benefit and data democratization.

---

## 4. White-Label SaaS Model

DAPS Analytics operates on a **white-label SaaS model** where each client organization receives a fully branded, independently configured deployment of the UDC-WQIS platform pointed at their watershed's USGS gauging stations and EPA monitoring sites.

### Pricing Structure

| Component | Price | Description |
|-----------|-------|-------------|
| **Setup fee** | $5,000 | Configuration, USGS site mapping, branding, data migration, onboarding |
| **Monthly subscription** | $500/watershed | Hosting, ingestion, monitoring, updates, support |
| **Enterprise tier** | Custom | Multi-watershed deployments, SLA, dedicated support, custom integrations |

### Technical White-Label Architecture

Each deployment is a separate Azure Container Apps instance sharing the same container image but with independent:
- PostgreSQL databases (data isolation by design)
- Environment configuration (USGS site IDs, watershed name, branding colors/logo)
- Domain/subdomain (e.g., `water.StateEPA.gov` or `wrri.university.edu`)
- Ingestion schedules aligned to client data sources

The configuration-driven approach means onboarding a new watershed client takes **4–8 hours of engineering time**, not weeks — making the $5,000 setup fee a high-margin revenue event.

---

## 5. Azure Services Used and Planned

### Currently in Production

| Azure Service | Usage | Monthly Cost |
|---------------|-------|-------------|
| **Azure Container Apps** | Next.js application hosting (Consumption plan, scale-to-zero) | ~$14.60 |
| **Azure Database for PostgreSQL Flexible Server** | Primary production database (Burstable B1ms, 1 vCore, 2GB RAM) | ~$12.80 |
| **Azure Container Registry** (Basic) | Docker image storage and versioning | ~$5.00 |
| **Azure Container Apps Jobs** | Timer-triggered cron jobs (USGS, EPA, WQP ingestion) | ~$0.10 |
| **Azure Blob Storage** | Data exports, CSV uploads | ~$0.02 |
| **Total** | | **~$32.52/mo** |

### Planned Azure Expansion (Year 1 with Credits)

| Azure Service | Planned Use | Est. Monthly |
|---------------|-------------|-------------|
| **Azure AI Services / Azure OpenAI** | Replace Anthropic Claude with Azure-native AI (FedRAMP compliant) | $15–50 |
| **Azure Key Vault** | Secrets management (replace env var-based secrets) | ~$0.03/secret |
| **Azure Monitor + App Insights** | Uptime monitoring, performance tracking, ingestion failure alerts | Free tier |
| **Azure Static Web Apps** | Marketing/documentation site | Free tier |
| **Azure Entra ID (B2C)** | Multi-tenant user authentication for white-label deployments | Free tier (50K users) |
| **Azure Event Grid** | Real-time water quality alert notifications (email/SMS) | Pay-per-use |
| **Azure AI Search** | RAG-based research paper search across USGS/EPA reports | ~$25/mo |

### Why Azure Over Alternatives

| Factor | Azure | AWS | Google Cloud |
|--------|-------|-----|-------------|
| FedRAMP High authorization | Yes — required for EPA/USGS partnerships | Yes | Partial |
| DC OCTO existing contracts | Azure preferred vendor | No preference | No preference |
| PostgreSQL managed service | Azure PostgreSQL Flexible Server — excellent | RDS | Cloud SQL |
| Container orchestration | Container Apps (serverless, no k8s overhead) | ECS/Fargate | Cloud Run |
| Startup credits program | Founders Hub — up to $150K | Activate — up to $100K | Google for Startups |
| Government cloud pathway | Azure Government (seamless migration path) | GovCloud (separate region) | No Gov cloud |
| Startup ecosystem in DC | Strong federal/govtech presence | Limited | Limited |

Azure's FedRAMP authorization is not a nice-to-have — it is a prerequisite for any EPA or USGS formal data partnership that moves beyond the informal university collaboration stage. Building on Azure now positions DAPS Analytics to pursue federal procurement contracts without re-architecting.

---

## 6. Team

### Oli T. Oli — Co-Founder & CTO

Oli is an Ethiopian national based in Burtonsville, Maryland, with deep expertise in full-stack software engineering, cloud infrastructure, and data systems. He single-handedly designed and built the entire UDC-WQIS platform — every line of code, every API route, every deployment pipeline — bringing it from concept to a production system ingesting 200,000+ real government data points in under six months.

### Dr. Tolessa Deksissa — Partner / Domain Expert

Dr. Tolessa Deksissa is the Director of UDC's Water Resources Research Institute (WRRI) and a leading researcher in watershed science, environmental monitoring, and urban water systems. DAPS Analytics partners with Dr. Tolessa to ensure scientific rigor, institutional alignment, and academic credibility for the UDC-WQIS platform.

**Technical background:**
- Next.js 16 App Router, TypeScript strict mode, React 19
- PostgreSQL (Azure Flexible Server, Neon serverless), Prisma, SQLite
- Docker, Azure Container Apps, GitHub Actions CI/CD
- Python (ADK agents, data ingestion pipelines, scientific computing)
- Geospatial data (Leaflet, GeoJSON, USGS NWIS API, EPA WQP API)
- AI integration (Anthropic Claude, Vercel AI SDK, tool-augmented assistants)

**Why this matters:** Many environmental technology startups are founded by domain scientists who hire engineers. Oli is an engineer who deeply understands the domain — a combination that allows rapid, cost-efficient product iteration without bloated engineering overhead.

**Global perspective:** Oli's Ethiopian background brings firsthand understanding of water scarcity and quality challenges in the Global South. The platform architecture is deliberately designed to be deployable in resource-constrained environments — a strategic differentiator when DAPS Analytics pursues international development contracts through the World Bank, USAID, or African Development Bank.

---

## 7. Traction

### Proven Technical Execution

- **Live production deployment** on Azure (migrated from Vercel, April 2026)
- **216,000+ real database rows** ingested from USGS, EPA, and WQP APIs — not synthetic demo data
- **3 automated cron jobs** running reliably on Azure Container Apps Jobs (Timer Triggers)
- **52 automated tests** with CI/CD on every commit via GitHub Actions
- **Docker image under 200MB** with multi-stage build and standalone Next.js output
- **14 REST API endpoints** publicly accessible for researchers and citizen scientists

### Institutional Partnership

- **University of the District of Columbia** — collaboration with WRRI (Water Resources Research Institute) and CAUSES (Center for Agriculture, Urban Sustainability and Environmental Solutions)
- **UDC is an 1890 land-grant HBCU** — this institutional relationship opens direct access to USDA capacity-building grants, NSF partnerships, and EPA environmental justice funding
- **Stakeholder presentation** delivered to Dr. Tolessa and UDC research staff

### Data Credibility

All data in UDC-WQIS comes from public US government APIs (no proprietary sensors required):
- USGS NWIS Instantaneous Values — real-time sensor data from 7 active gauging stations
- EPA Water Quality Portal — lab-analyzed results for Anacostia watershed (HUC 02070010)
- DC DOEE — geospatial boundaries, ward environmental burden data

This "sensor-free" architecture means DAPS Analytics can onboard any new watershed client without hardware procurement — the USGS and EPA have already deployed the sensors. The platform aggregates and presents existing public data more effectively than any existing tool.

---

## 8. Credit Request and Usage Plan

### Ask: $5,000 – $25,000 Azure Credits (12 months)

| Credit Tier | What It Funds |
|-------------|--------------|
| **$5,000** | 12 months of current production costs ($32.52/mo) + buffer for 2–3 pilot white-label deployments + Azure Key Vault + Azure Monitor |
| **$10,000** | Above + Azure OpenAI integration for FedRAMP-compliant AI assistant + Azure AI Search for research RAG + load testing infrastructure |
| **$25,000** | Full Year 1 scaling: 10 white-label watershed deployments, Azure Event Grid for real-time alerts, Azure Entra ID B2C for multi-tenant auth, Azure Government cloud pilot |

### Month-by-Month Credit Allocation (at $10K level)

| Month | Activity | Est. Azure Spend |
|-------|----------|-----------------|
| 1–2 | Current production + Azure Key Vault + App Insights | $50/mo |
| 3–4 | Azure OpenAI integration + AI Search deployment | $150/mo |
| 5–6 | First white-label pilot (State watershed partner) | $300/mo |
| 7–9 | Grant deliverable infrastructure (NSF/EPA reporting) | $400/mo |
| 10–12 | 5–10 watershed deployments scaling | $600/mo |

At the $10K credit level, DAPS Analytics exits the program with **10+ paying watershed clients**, a repeatable onboarding process, and revenue sufficient to sustain Azure costs without further subsidy.

---

## 9. Why Founders Hub, Why Now

DAPS Analytics is at the precise inflection point Founders Hub is designed to support: the product is built and proven in production, the market is validated by real institutional interest, and the primary constraint is infrastructure runway to execute the first commercial pilots.

The current Azure bill of $32.52/month is sustainable, but scaling to 10 watersheds increases costs to approximately $325/month before revenue arrives from those clients. Azure credits bridge that gap and allow DAPS Analytics to sign its first paying contracts from a position of infrastructure strength rather than financial pressure.

Azure is not a tactical choice for DAPS Analytics — it is a strategic one. Building on Azure from the beginning means that when a state EPA or federal agency requires FedRAMP-authorized hosting as a procurement condition, DAPS Analytics can say "yes" without re-architecting anything. That answer is worth more than any single contract.

---

*Prepared by Oli T. Oli, Co-Founder & CTO — DAPS Analytics*
*Contact: dapsanalytics.com*
*Production system: https://udc-wqis.happycoast-d9b0bcde.centralus.azurecontainerapps.io/*
