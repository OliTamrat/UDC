/**
 * White-Label Site Configuration
 * ==============================
 * This is the SINGLE file to edit when deploying WQIS for a new watershed.
 * All institution names, watershed data, station mappings, branding,
 * contact info, and map settings are defined here.
 *
 * To deploy for a new organization:
 * 1. Copy this file
 * 2. Update all values below
 * 3. Replace data files (waterways, boundaries) if needed
 * 4. Set environment variables (DATABASE_URL, API keys)
 * 5. Deploy
 */

// ─── Institution ─────────────────────────────────────────────────────────────

export const institution = {
  name: "University of the District of Columbia",
  shortName: "UDC",
  acronym: "UDC",
  department: "College of Agriculture, Urban Sustainability & Environmental Sciences",
  departmentAcronym: "CAUSES",
  institute: "Water Resources Research Institute",
  instituteAcronym: "WRRI",
  lab: "Environmental Quality Testing Laboratory",
  labAcronym: "EQTL",
  website: "https://www.udc.edu/causes/water-resources-research-institute/",
  principalInvestigator: "Dr. Tolessa Deksissa",
  piTitle: "Director of Water Resources Research Institute and Environmental Testing Lab",
  contact: {
    email: "wrri@udc.edu",
    phone: "(202) 274-6406",
    address: "4200 Connecticut Ave NW",
    city: "Washington",
    state: "DC",
    zip: "20008",
  },
  headquarters: {
    lat: 38.9436,
    lng: -77.0631,
    label: "UDC Van Ness Campus",
  },
  partners: [
    { name: "Olink Technologies Inc", role: "Platform Engineering" },
    { name: "DAPS Analytics", role: "Data Analytics & Visualization" },
  ],
  funding: "Funded by DC Government. Data provided by DOEE, EPA WQP, USGS NWIS, and Anacostia Riverkeeper.",
};

// ─── Watershed ───────────────────────────────────────────────────────────────

export const watershed = {
  name: "Anacostia River",
  fullName: "Anacostia River Watershed",
  region: "Washington, DC",
  hucCode: "02070010",
  fipsCode: "US:11",
  description:
    "The Anacostia River is a tributary of the Potomac River flowing through Washington, DC. " +
    "It drains approximately 176 square miles across DC and Maryland, serving as a critical " +
    "waterway for environmental health, recreation, and community wellbeing.",
  mapCenter: [38.892, -76.970] as [number, number],
  mapZoom: 12,
  mapBounds: {
    north: 38.96,
    south: 38.82,
    east: -76.90,
    west: -77.10,
  },
};

// ─── Branding ────────────────────────────────────────────────────────────────

export const branding = {
  /** Primary brand color (used for logo gradient start, accents) */
  primaryColor: "#FDB927",
  /** Secondary brand color (used for logo gradient end) */
  secondaryColor: "#CE1141",
  /** PWA theme color */
  themeColor: "#FDB927",
  /** Logo text displayed in the badge (max 4 characters) */
  logoText: "UDC",
  /** Ward/district boundary color on map */
  wardBoundaryColor: "#FDB927",
  /** Dashboard title */
  dashboardTitle: "Water Resources",
  /** Dashboard subtitle */
  dashboardSubtitle: "CAUSES / WRRI Dashboard",
};

// ─── Deployment ──────────────────────────────────────────────────────────────

export const deployment = {
  /** Production site URL (used for SEO, sitemap, OG tags) */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://udc-one.vercel.app",
  /** CORS allowed origins */
  corsOrigins: [
    "https://udc.edu",
    "https://www.udc.edu",
  ],
};

// ─── USGS Ingestion ──────────────────────────────────────────────────────────

export interface USGSSiteMapping {
  /** USGS site number (e.g., "01649500") */
  usgs: string;
  /** Internal station ID (e.g., "ANA-002") */
  stationId: string;
  /** Whether this site is currently reporting data */
  active: boolean;
  /** Human-readable description */
  description: string;
}

export const usgsSites: USGSSiteMapping[] = [
  { usgs: "01651000", stationId: "ANA-001", active: false, description: "NW Branch Anacostia nr Hyattsville — sensors offline" },
  { usgs: "01649500", stationId: "ANA-002", active: true,  description: "NE Branch Anacostia at Riverdale — temp, cond, DO, pH" },
  { usgs: "01651827", stationId: "ANA-003", active: true,  description: "Anacostia River nr Buzzard Point — temp, cond, turbidity" },
  { usgs: "01651750", stationId: "ANA-004", active: false, description: "Anacostia River at Washington — no WQ sensors" },
  { usgs: "01651800", stationId: "WB-001",  active: true,  description: "Watts Branch at Minnesota Ave — temp, cond" },
  { usgs: "01651770", stationId: "HR-001",  active: true,  description: "Hickey Run at National Arboretum — temp, cond" },
];

/** EPA/WQP station ID mapping (external monitoring location ID → internal station ID) */
export const epaStationMap: Record<string, string> = {
  "USGS-01651000": "ANA-001",
  "USGS-01649500": "ANA-002",
  "USGS-01651827": "ANA-003",
  "USGS-01651750": "ANA-004",
  "USGS-01651770": "HR-001",
  "USGS-01651800": "WB-001",
  "USGS-01651760": "PB-001",
  "USGS-01651730": "SW-001",
  "USGS-01651830": "SW-002",
  // DC DOEE monitoring locations
  "21DCDOEE-ANA01": "ANA-001",
  "21DCDOEE-ANA02": "ANA-002",
  "21DCDOEE-ANA03": "ANA-003",
  "21DCDOEE-ANA04": "ANA-004",
  "21DCDOEE-WB01":  "WB-001",
  "21DCDOEE-POPE01": "PB-001",
  "21DCDOEE-HR01":  "HR-001",
};

// ─── USGS Parameters ────────────────────────────────────────────────────────

/** USGS parameter codes → database column names */
export const usgsParams: Record<string, string> = {
  "00010": "temperature",
  "00300": "dissolved_oxygen",
  "00400": "ph",
  "63680": "turbidity",
  "00095": "conductivity",
  "31648": "ecoli_count",
  "00631": "nitrate_n",
  "00665": "phosphorus",
};

/** USGS pcode → EAV parameter ID */
export const usgsPcodeToParam: Record<string, string> = {
  "00010": "temperature",
  "00300": "dissolved_oxygen",
  "00400": "ph",
  "63680": "turbidity",
  "00095": "conductivity",
  "31648": "ecoli",
  "00631": "nitrate_n",
  "00665": "phosphorus_total",
};

// ─── EPA Characteristics ─────────────────────────────────────────────────────

/** EPA/WQP characteristic names → legacy readings column names */
export const epaCharacteristics: Record<string, string> = {
  "Temperature, water":            "temperature",
  "Dissolved oxygen (DO)":         "dissolved_oxygen",
  "pH":                            "ph",
  "Turbidity":                     "turbidity",
  "Specific conductance":          "conductivity",
  "Escherichia coli":              "ecoli_count",
  "Nitrate":                       "nitrate_n",
  "Phosphorus":                    "phosphorus",
};

/** WQP characteristic names → EAV parameter IDs (broader set) */
export const wqpCharacteristics: Record<string, string> = {
  "Temperature, water":                        "temperature",
  "Dissolved oxygen (DO)":                     "dissolved_oxygen",
  "pH":                                        "ph",
  "Turbidity":                                 "turbidity",
  "Specific conductance":                      "conductivity",
  "Escherichia coli":                          "ecoli",
  "Nitrate":                                   "nitrate_n",
  "Phosphorus":                                "phosphorus_total",
  "Nitrate + Nitrite":                         "nitrate_nitrite",
  "Nitrogen":                                  "nitrogen_total",
  "Kjeldahl nitrogen":                         "kjeldahl_nitrogen",
  "Orthophosphate":                            "orthophosphate",
  "Coliform, total":                           "total_coliform",
  "Lead":                                      "lead_total",
  "Hardness, Ca, Mg":                          "hardness",
  "Suspended Sediment Concentration (SSC)":    "ssc",
  "Total dissolved solids":                    "tds",
  "Temperature, air":                          "temperature_air",
  "Suspended sediment discharge":              "ssd",
};

// ─── Station IDs for sitemap ─────────────────────────────────────────────────

export const allStationIds = [
  "ANA-001", "ANA-002", "ANA-003", "ANA-004",
  "WB-001", "PB-001", "HR-001",
  "GI-001", "GI-002", "GI-003",
  "SW-001", "SW-002",
];

// ─── Helper: Full institution label ──────────────────────────────────────────

export function getInstitutionLabel(): string {
  return `${institution.shortName} ${institution.instituteAcronym}`;
}

export function getFullTitle(): string {
  return `${institution.shortName} Water Resources Dashboard | Data Integration, Analysis & Visualization`;
}

export function getDescription(): string {
  return `Real-time water quality monitoring, analysis, and visualization for the ${watershed.fullName}. ${institution.name} ${institution.departmentAcronym}/${institution.instituteAcronym} research dashboard with USGS sensor data, EPA standards tracking, and environmental education.`;
}
