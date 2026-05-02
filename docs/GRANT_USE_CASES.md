# UDC-WQIS Grant Use Cases
## Water Quality Information System — Funding Opportunity Narratives

**Prepared by:** Oli T. Oli (Co-Founder & CTO, DAPS Analytics) in partnership with Dr. Tolessa Deksissa (UDC WRRI)
**Platform:** UDC-WQIS (University of the District of Columbia — Water Quality Information System)
**Production URL:** https://udc-wqis.happycoast-d9b0bcde.centralus.azurecontainerapps.io/
**Date:** April 17, 2026

---

## Overview

UDC-WQIS is a production-grade, AI-augmented water quality monitoring platform currently deployed at the University of the District of Columbia's Water Resources Research Institute (WRRI). The system monitors 12 stations across the Anacostia watershed, tracks 25 water quality parameters against EPA standards, ingests real sensor data from USGS and EPA public APIs daily, and serves this information through an accessible, bilingual (English/Spanish) web interface designed for researchers, students, faculty, and DC community members alike.

This document presents tailored use-case narratives for four funding opportunities aligned with UDC-WQIS capabilities. Each narrative is written to satisfy grant reviewer criteria and can be adapted for the formal application.

---

## Grant 1: EPA Environmental Justice Collaborative Problem-Solving (EJCPS) Grant

| Field | Details |
|-------|---------|
| **Program** | EPA Environmental Justice Collaborative Problem-Solving (EJCPS) |
| **Funding Amount** | Up to $500,000 |
| **Eligibility** | Nonprofits, universities, tribal governments serving EJ communities |
| **UDC Role** | Primary applicant (HBCU serving EJ-impacted DC wards) |
| **DAPS Analytics Role** | Technology partner / platform provider |

### Alignment with UDC-WQIS Capabilities

The EJCPS program funds projects that use collaborative, community-centered approaches to address disproportionate environmental burdens. UDC-WQIS directly embodies this mission: it is the only water quality monitoring platform in DC specifically designed to present Anacostia watershed data in a format accessible to the Ward 7 and Ward 8 residents who bear the greatest exposure to contaminated runoff, combined sewer overflow events, and failing stormwater infrastructure.

Existing government data portals (USGS NWIS, EPA WQP) contain the same sensor readings, but present them in raw tabular formats requiring scientific training to interpret. UDC-WQIS transforms this data into actionable community intelligence: color-coded station status indicators, plain-English parameter explanations, interactive watershed maps showing flood risk zones overlaid on ward boundaries, and an AI research assistant that can answer questions in plain language.

### Proposed Use Case: "Anacostia Watershed Community Water Watch"

**Project Narrative**

The Anacostia River runs through the heart of Washington DC's most environmentally overburdened communities. Wards 7 and 8 — which are more than 90% Black — have among the highest rates of asthma, childhood lead exposure, and proximity to hazardous waste sites in the city. Combined sewer overflows (CSOs) release untreated sewage into the Anacostia during rain events, yet residents have historically had no real-time mechanism to know when their waterways are contaminated or when it is safe to use riverfront parks, fish, or allow children to play near waterways.

This project, "Anacostia Watershed Community Water Watch," would deploy UDC-WQIS as a community-facing alert and education platform in partnership with Anacostia Riverkeeper, the Ward 7 and Ward 8 Environment Network, DC DOEE, and UDC WRRI. The platform would be enhanced with real-time E. coli and CSO event notifications delivered via SMS to community subscribers, a bilingual (English/Spanish) mobile-first interface, and a community dashboard embedded in recreation centers and libraries in Wards 7 and 8. UDC students from CAUSES would be trained as "Community Water Quality Ambassadors" to assist residents in interpreting data and reporting concerns to DC DOEE.

The project would expand monitoring coverage from the current 12 stations to 20, adding stations in Pope Branch, Oxon Run, and Fort Stanton Park — areas with documented water quality concerns and no current real-time sensors. All data would remain publicly accessible through the platform's open API, enabling downstream use by community researchers, journalists, and advocacy organizations.

**Key Deliverables**

- SMS/email alert system for E. coli exceedances and CSO events at 20 monitoring stations
- Bilingual community dashboard deployed in 10 Ward 7/8 recreation centers and libraries
- 8 station expansions in currently unmonitored EJ-priority areas
- Training of 20 UDC student Community Water Quality Ambassadors
- Annual public Water Quality Report for Ward 7 and Ward 8 residents
- Open API with documented endpoints for use by advocacy organizations and journalists
- Partnership MOUs with Anacostia Riverkeeper, DC DOEE, and Ward 7/8 councils

**Budget Justification**

| Category | Amount | Notes |
|----------|--------|-------|
| Platform development (alert system, mobile UI) | $120,000 | DAPS Analytics engineering |
| Azure infrastructure (3 years) | $1,200 | ~$400/year at current scale; expands to ~$3,600/yr with 20 stations |
| Community engagement and Ambassador program | $150,000 | UDC CAUSES staff + stipends |
| New sensor hardware (8 stations) | $80,000 | YSI multiprobes, enclosures, data loggers |
| Community outreach and translation | $60,000 | Bilingual materials, events, communications |
| Evaluation and reporting | $40,000 | Third-party impact assessment |
| Indirect costs (UDC) | $48,800 | F&A rate |
| **Total** | **$500,000** | |

Azure infrastructure costs (~$400/year currently, scaling to ~$1,200/year with expanded monitoring) represent less than 0.3% of the total project budget — a uniquely cost-efficient foundation compared to proprietary monitoring platforms that charge $50,000+ per year for equivalent capabilities.

---

## Grant 2: NSF Smart and Connected Communities (S&CC)

| Field | Details |
|-------|---------|
| **Program** | NSF Smart and Connected Communities (S&CC) — Large-scale Integration |
| **Funding Amount** | Up to $1,500,000 |
| **Eligibility** | Universities, in partnership with community stakeholders |
| **UDC Role** | Lead PI institution (HBCU, land-grant, DC-embedded) |
| **DAPS Analytics Role** | Technology platform and AI infrastructure partner |
| **Target Track** | Large-scale Integration (multi-stakeholder, multi-city) |

### Alignment with UDC-WQIS Capabilities

The S&CC program funds research that integrates smart and connected technologies with civic infrastructure to improve quality of life in communities. UDC-WQIS is already an operational smart community platform: it ingests sensor data from government infrastructure, applies AI analysis, and delivers actionable intelligence through a connected web interface. The platform's open API, modular white-label architecture, and cloud-native deployment make it purpose-built for the kind of multi-city, multi-stakeholder deployment S&CC funds envision.

### Proposed Use Case: "OpenWatershed — A Multi-City Smart Water Quality Network for HBCUs and Urban Communities"

**Project Narrative**

Urban watersheds in historically underinvested American cities face compounding threats: aging infrastructure, increasing frequency of extreme precipitation events driven by climate change, legacy contamination from industrial land use, and persistent inequities in environmental monitoring coverage. While federal agencies (USGS, EPA) operate sensor networks, their data is presented in formats inaccessible to the community members most affected and is often geographically sparse in low-income urban areas.

"OpenWatershed" proposes to deploy the UDC-WQIS platform at five HBCU-anchored urban campuses — UDC (Washington DC), Morgan State University (Baltimore MD), Howard University (Washington DC), Hampton University (Hampton VA), and Bowie State University (Bowie MD) — each monitoring a distinct urban watershed segment within the Chesapeake Bay drainage basin. UDC-WQIS's white-label architecture allows each institution to deploy a fully branded, independently configured instance while contributing data to a shared research consortium. Each deployment would monitor 10–15 stations, track 25+ water quality parameters, and feed into a unified research data lake hosted on Azure for cross-watershed analysis.

The research agenda would address three core S&CC themes. First, the project would advance the science of AI-assisted environmental monitoring by developing machine learning models trained on multi-watershed sensor fusion data — correlating water quality outcomes with weather events, land use changes, and infrastructure failures across five cities simultaneously. Second, the project would design and evaluate community engagement protocols for smart environmental monitoring, testing which data visualizations, alert formats, and AI interaction modalities are most effective at motivating behavior change and civic participation in EJ communities. Third, the project would build and evaluate a replicable technical and governance framework for HBCU-led environmental data consortia, creating a transferable model that can be adopted by land-grant institutions nationwide.

The OpenWatershed platform would generate the largest open dataset of urban water quality observations from EJ-focused monitoring networks in the United States — an enduring scientific contribution beyond the grant period.

**Key Deliverables**

- UDC-WQIS deployed at 5 HBCU institutions monitoring 60+ stations across 5 urban watersheds
- Unified Azure research data lake with cross-watershed API access
- 3 peer-reviewed publications on AI-assisted environmental monitoring and community engagement
- Multi-watershed ML model for predicting water quality exceedances 24–72 hours in advance
- Open-source "OpenWatershed" platform release with deployment documentation
- Community co-design workshops at each institution (5 cities, 500+ community participants)
- Graduate student training: 10 MS/PhD fellowships in environmental informatics across partner HBCUs
- Technology transfer: platform governance framework adopted by 3+ additional institutions post-grant

**Budget Justification**

| Category | Amount | Notes |
|----------|--------|-------|
| Platform development (multi-tenant, ML models) | $450,000 | DAPS Analytics + UDC CS faculty |
| Azure infrastructure (3 years, 5 deployments) | $6,000 | ~$400/yr/deployment × 5 × 3 years |
| Sensor hardware (5 institutions, ~12 stations each) | $300,000 | YSI multiprobes + telemetry |
| Graduate student fellowships (10 × 3 years) | $450,000 | $15,000/yr stipend + tuition |
| Community engagement (5 cities) | $120,000 | Co-design facilitation, translation |
| Dissemination and publications | $60,000 | Open-access fees, conference travel |
| Indirect costs | $114,000 | F&A at UDC |
| **Total** | **$1,500,000** | |

Azure infrastructure costs for the full five-institution network amount to approximately $6,000 over three years — roughly $2,000 per year to run what would be one of the most comprehensive urban watershed monitoring networks in the country. This cost efficiency is possible because UDC-WQIS runs on Azure Consumption pricing (scale-to-zero Container Apps, serverless job scheduling), a direct benefit of the platform's cloud-native architecture.

---

## Grant 3: USDA 1890 Institution Capacity Building Grant

| Field | Details |
|-------|---------|
| **Program** | USDA National Institute of Food and Agriculture (NIFA) — 1890 Institution Capacity Building Grants (CBG) |
| **Funding Amount** | Up to $500,000 |
| **Eligibility** | 1890 land-grant institutions (UDC qualifies as 1890 HBCU land-grant) |
| **UDC Role** | Primary applicant |
| **DAPS Analytics Role** | Technology development partner |
| **Priority Areas** | Water resources, urban agriculture, environmental sustainability |

### Alignment with UDC-WQIS Capabilities

USDA's 1890 Capacity Building Grants fund teaching, research, and extension projects at historically Black land-grant universities. UDC holds 1890 land-grant status — a distinction that makes it uniquely eligible for this program and positions UDC-WQIS directly within the grant's priority areas of water resources and environmental sustainability. The platform's current green infrastructure monitoring capabilities (UDC Van Ness Green Roof, UDC Food Hub Rain Gardens in Wards 7 and 8) directly support UDC's extension mission by connecting university research infrastructure to community food and water security outcomes.

### Proposed Use Case: "Building UDC's Water and Food Systems Research Capacity Through Real-Time Environmental Intelligence"

**Project Narrative**

The University of the District of Columbia's CAUSES program sits at the intersection of two of the most pressing urban sustainability challenges: food security and water quality. UDC operates urban agriculture sites across the city — green roofs, community gardens, and food hubs in Wards 7 and 8 — that produce food for DC's most food-insecure residents. The quality and safety of that food is directly linked to the quality of the water used to irrigate it, the quality of the stormwater that flows through urban soils, and the presence of contaminants (lead, PFAS, E. coli) that can persist in urban agricultural settings.

This project, "Building UDC's Water and Food Systems Research Capacity Through Real-Time Environmental Intelligence," would expand UDC-WQIS into a comprehensive environmental monitoring platform for UDC's land-grant extension mission. The project has three integrated components. First, UDC-WQIS would be enhanced with soil quality and irrigation water monitoring at UDC's urban agriculture sites, creating a unified dashboard linking water quality data from the Anacostia watershed to food production conditions at UDC Food Hubs. Farmers and extension staff would receive real-time alerts if irrigation water sources show elevated lead, E. coli, or nitrate levels. Second, the project would develop a graduate-level "Environmental Data Science for Sustainable Agriculture" curriculum at UDC, using UDC-WQIS as the primary teaching dataset and building students' capacity to conduct independent water quality research using real sensor data and modern cloud analytics tools. Third, through UDC's extension network, the project would train 100 urban farmers and community gardeners across DC in water quality monitoring and data interpretation, creating a community of practice that strengthens DC's local food system resilience.

The project directly addresses USDA's 1890 capacity-building priorities by combining research infrastructure development (expanded monitoring network), teaching capacity (new curriculum), and extension impact (community farmer training) within UDC's unique urban land-grant mission.

**Key Deliverables**

- Integration of soil and irrigation water monitoring at 6 UDC urban agriculture sites
- Expanded UDC-WQIS dashboard with food-water nexus monitoring module
- Graduate curriculum: "Environmental Data Science for Sustainable Agriculture" (3-credit course)
- 3 trained graduate research assistants in environmental informatics
- 100 urban farmers trained in water quality monitoring and data literacy
- Annual "UDC Water and Food Safety Report" distributed to DC urban agriculture community
- 2 peer-reviewed publications on urban agriculture water quality monitoring
- Open dataset: DC urban agriculture water quality observations (5-year longitudinal record)

**Budget Justification**

| Category | Amount | Notes |
|----------|--------|-------|
| Platform development (soil/irrigation module) | $100,000 | DAPS Analytics engineering |
| Azure infrastructure (3 years) | $1,200 | ~$400/year for production platform |
| Sensor hardware (irrigation + soil sensors) | $60,000 | Water quality sensors at 6 urban ag sites |
| Faculty time (curriculum development) | $120,000 | 2 faculty members × 3 years |
| Graduate research assistants | $90,000 | 3 GRAs × $30,000/yr |
| Extension activities (farmer training) | $60,000 | Workshops, materials, outreach |
| Data management and publication | $30,000 | Open-access fees, data curation |
| Indirect costs | $38,800 | UDC F&A rate |
| **Total** | **$500,000** | |

Azure infrastructure at $400/year represents a recurring cost of $1,200 over the three-year grant period — less than 0.25% of the total budget — while providing production-grade hosting, automated daily data ingestion, and a secure, accessible research platform for faculty and students throughout the project and beyond.

---

## Grant 4: DC Government / DOEE Partnership

| Field | Details |
|-------|---------|
| **Program** | DC Department of Energy and Environment (DOEE) — Anacostia River Clean Up and Protection Fund / Anacostia Waterfront Initiative |
| **Funding Amount** | $100,000 – $500,000 (varies by program cycle) |
| **Eligibility** | DC-based nonprofits, universities, and research institutions |
| **UDC Role** | Lead partner (HBCU with DC land-grant designation) |
| **DAPS Analytics Role** | Technology platform and data integration partner |

### Alignment with UDC-WQIS Capabilities

DOEE manages the Anacostia River Clean Up and Protection Fund and coordinates the DC Clean Rivers Project — a $2.7 billion infrastructure investment in combined sewer separation and green infrastructure. UDC-WQIS directly supports DOEE's monitoring and reporting obligations by providing an accessible, real-time view of water quality conditions across the Anacostia watershed, including stations monitoring stormwater BMP performance (SW-001 at Benning Road, SW-002 at South Capitol) and green infrastructure effectiveness (GI-001 UDC Van Ness Green Roof, GI-002/GI-003 Ward 7/8 Food Hub Rain Gardens).

DOEE currently reports water quality data to EPA through the 305(b) and 303(d) assessment processes, which require comprehensive monitoring data across the watershed. UDC-WQIS's automated ingestion pipeline, audit-ready ingestion logs, and exportable datasets in CSV/JSON format are directly compatible with these reporting workflows.

### Proposed Use Case: "Real-Time Anacostia Watershed Intelligence for DC Clean Rivers Monitoring and Community Reporting"

**Project Narrative**

The DC Clean Rivers Project is the largest infrastructure investment in Washington DC's history, designed to eliminate the combined sewer overflows that have degraded the Anacostia River for more than a century. As this infrastructure comes online — deep tunnel storage, green roofs, bioretention areas, and permeable pavement across the city — DC government, DC Water, and DOEE face a critical monitoring challenge: how to assess whether these investments are actually improving water quality, where, and at what rate.

UDC-WQIS offers a ready-made solution. The platform already monitors green infrastructure performance at UDC sites in Wards 7 and 8, ingests real-time USGS sensor data from active gauging stations along the Anacostia main stem and its tributaries, and presents this data in a format accessible to both technical staff and community stakeholders. A DOEE partnership would formalize and expand this capability.

Under this partnership, UDC-WQIS would be deployed as DC's official community-facing Anacostia water quality dashboard, linked from DOEE's website and embedded in DC's Open Data Portal. The platform would be expanded with 8 additional monitoring stations at Clean Rivers Project infrastructure sites — measuring water quality upstream and downstream of major green infrastructure installations to quantify their impact. Monitoring data would feed directly into DOEE's 305(b)/303(d) reporting database through an automated API integration. A public-facing "Clean Rivers Progress Dashboard" component would allow DC residents to see in real time how infrastructure investments are improving water quality in their neighborhoods — a transparency mechanism that builds public trust in the Clean Rivers investment and satisfies DOEE's community engagement obligations under its EPA agreements.

**Key Deliverables**

- UDC-WQIS designated as official DC Anacostia community water quality dashboard
- 8 new monitoring stations at Clean Rivers Project infrastructure sites
- Automated 305(b)/303(d) data reporting integration with DOEE database
- "Clean Rivers Progress Dashboard" public component showing before/after water quality trends
- Monthly automated water quality summary report distributed to DC Council and community
- Integration with DC Open Data Portal API
- Quarterly stakeholder briefings for DC Council Environment Committee
- Annual public report on Anacostia water quality progress

**Budget Justification**

| Category | Amount | Notes |
|----------|--------|-------|
| Platform development (DOEE integration, dashboard) | $80,000 | DAPS Analytics engineering |
| Azure infrastructure (2 years) | $800 | ~$400/year; stable at current scale |
| New monitoring station deployment (8 stations) | $120,000 | Hardware, installation, telemetry |
| Data management and DOEE reporting integration | $40,000 | API development, validation, testing |
| Community outreach and public reporting | $30,000 | Annual reports, briefings, translations |
| UDC staff and overhead | $29,200 | WRRI staff time + indirect |
| **Total** | **$300,000** | (scalable to $500K with 15 stations and 3-year term) |

Azure infrastructure costs for this partnership represent approximately $400/year — a marginal line item that sustains a production-grade, publicly accessible monitoring platform serving DC residents, researchers, and regulators simultaneously. This compares favorably to proprietary monitoring dashboard solutions that typically charge $30,000–$80,000 per year for equivalent capabilities without the open API or white-label flexibility.

---

## Cross-Cutting Technical Qualifications

All four grant opportunities benefit from the following proven UDC-WQIS capabilities:

### Data Provenance and Scientific Credibility
All data in UDC-WQIS is sourced from US federal government APIs (USGS NWIS, EPA WQP) with full provenance tagging. Every ingestion run is logged with timestamp, source, record count, and status. Data exports include scientific citations. This audit trail satisfies federal grant reporting requirements without additional data management overhead.

### Accessibility and Equity by Design
The platform was built bilingual (English/Spanish) from inception, with WCAG 2.1 AA accessibility compliance, responsive design from 320px mobile to 4K desktop, and interactive narratives specifically designed to present scientific data to non-technical community audiences.

### Open Architecture
14 publicly accessible REST API endpoints allow downstream use by community researchers, journalists, advocacy organizations, and government partners without licensing fees or data access restrictions. This openness is explicitly valued by EPA, NSF, and USDA peer reviewers.

### Proven Operational Reliability
UDC-WQIS is not a prototype or proof-of-concept — it is a production system running on Azure with automated CI/CD, 52 automated tests, health monitoring, and a documented uptime record. Grant reviewers can visit the live system to verify claims.

### Cost Efficiency
The platform's Azure hosting cost of approximately $32.52/month ($390/year) is an order of magnitude below comparable commercial monitoring platforms. This efficiency is a competitive advantage in grant environments where reviewers scrutinize cost-effectiveness ratios.

---

*Prepared by Oli T. Oli, Co-Founder & CTO — DAPS Analytics, in partnership with Dr. Tolessa Deksissa (UDC WRRI)*
*For grant application inquiries: dapsanalytics.com*
