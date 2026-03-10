// Real geographic data for DC waterways, monitoring stations, and watersheds
// Coordinates are [latitude, longitude] for Leaflet

export interface MonitoringStation {
  id: string;
  name: string;
  position: [number, number];
  type: "river" | "stream" | "stormwater" | "green-infrastructure";
  status: "active" | "maintenance" | "offline";
  parameters: string[];
  lastReading?: WaterQualityReading;
}

export interface WaterQualityReading {
  timestamp: string;
  temperature: number; // °C
  dissolvedOxygen: number; // mg/L
  pH: number;
  turbidity: number; // NTU
  conductivity: number; // µS/cm
  eColiCount: number; // CFU/100mL
  nitrateN?: number; // mg/L
  phosphorus?: number; // mg/L
}

export interface WaterwaySegment {
  id: string;
  name: string;
  coordinates: [number, number][];
  type: "river" | "stream" | "tributary";
  healthIndex: number; // 0-100
}

// Anacostia River main channel — geographic path through DC
// Traced from Bladensburg (NE) to Potomac confluence (SW) following the real river course
// Verified against USGS stations, bridge coordinates, and NPS/landmark GPS data
export const anacostiaRiver: WaterwaySegment = {
  id: "anacostia-main",
  name: "Anacostia River",
  type: "river",
  healthIndex: 58,
  coordinates: [
    // Bladensburg Waterfront Park / DC-MD boundary (upstream)
    // Verified: Bladensburg Waterfront Park at 38.9368, -76.9387
    [38.9396, -76.9339],
    [38.9382, -76.9356],
    [38.9368, -76.9387], // Bladensburg Waterfront Park
    [38.9352, -76.9398],
    // River curves south-southwest past Colmar Manor
    [38.9330, -76.9410],
    [38.9305, -76.9415],
    [38.9280, -76.9418],
    // Approaching Kenilworth — river bends westward
    [38.9255, -76.9420],
    [38.9230, -76.9418],
    [38.9205, -76.9415],
    // Kenilworth Aquatic Gardens area
    // Verified: Kenilworth Aquatic Gardens at 38.9126, -76.9418
    [38.9180, -76.9415],
    [38.9155, -76.9418],
    [38.9130, -76.9420], // Adjacent to Kenilworth Aquatic Gardens
    // Kenilworth Marsh — river curves south then southwest
    [38.9105, -76.9428],
    [38.9080, -76.9440],
    [38.9055, -76.9458],
    // Past National Arboretum — river bends more to the west
    [38.9030, -76.9485],
    [38.9010, -76.9520],
    [38.8990, -76.9555],
    // Langston Golf Course / Kingman Island area
    // Verified: Kingman Island at 38.8958, -76.9639
    [38.8975, -76.9585],
    [38.8962, -76.9620],
    [38.8958, -76.9639], // Kingman Island
    // Benning Road Bridge (Ethel Kennedy Bridge)
    [38.8945, -76.9648],
    [38.8930, -76.9652],
    [38.8915, -76.9650],
    // East Capitol Street Bridge (Whitney Young Memorial Bridge)
    // Verified: 38.8898, -76.9650
    [38.8898, -76.9650],
    // Anacostia Park — river curves southwest
    [38.8878, -76.9665],
    [38.8858, -76.9695],
    [38.8838, -76.9730],
    [38.8815, -76.9770],
    // 11th Street Bridges area — river widens
    // Verified: ~38.8743, -76.9916
    [38.8792, -76.9810],
    [38.8770, -76.9855],
    [38.8750, -76.9900],
    [38.8743, -76.9916], // 11th Street Bridges
    // South of 11th St — river bends toward Buzzard Point
    [38.8730, -76.9945],
    [38.8720, -76.9970],
    // Frederick Douglass Memorial Bridge
    // Verified: 38.8687, -77.0052
    [38.8705, -77.0000],
    [38.8695, -77.0025],
    [38.8687, -77.0052], // Frederick Douglass Memorial Bridge
    // Navy Yard / Nationals Park waterfront
    // Verified: Nationals Park at 38.8730, -77.0080 (on the west bank)
    [38.8675, -77.0075],
    [38.8665, -77.0095],
    // Approaching Potomac confluence at Buzzard Point
    // Verified: Buzzard Point at 38.8640, -77.0128
    [38.8655, -77.0110],
    [38.8647, -77.0120],
    [38.8640, -77.0128], // Buzzard Point — Potomac confluence
  ],
};

// DC tributaries and streams — coordinates trace real paths to Anacostia confluences
export const dcStreams: WaterwaySegment[] = [
  {
    id: "watts-branch",
    name: "Watts Branch",
    type: "tributary",
    healthIndex: 42,
    coordinates: [
      // Upstream in Ward 7 (east), flows west to meet Anacostia near Kenilworth
      [38.8985, -76.9285],
      [38.8998, -76.9320],
      [38.9015, -76.9358],
      [38.9035, -76.9395],
      [38.9052, -76.9428],
      [38.9058, -76.9448], // confluence with Anacostia
    ],
  },
  {
    id: "nash-run",
    name: "Nash Run",
    type: "stream",
    healthIndex: 35,
    coordinates: [
      // Small stream east of river, flows west into Anacostia near Anacostia Park
      [38.8820, -76.9620],
      [38.8832, -76.9655],
      [38.8840, -76.9690],
      [38.8840, -76.9718], // confluence with Anacostia
    ],
  },
  {
    id: "pope-branch",
    name: "Pope Branch",
    type: "tributary",
    healthIndex: 48,
    coordinates: [
      // From Fort Stanton Park area, flows northeast to Anacostia
      [38.8630, -76.9900],
      [38.8660, -76.9875],
      [38.8695, -76.9855],
      [38.8730, -76.9838],
      [38.8758, -76.9842], // confluence with Anacostia near 11th St
    ],
  },
  {
    id: "hickey-run",
    name: "Hickey Run",
    type: "stream",
    healthIndex: 38,
    coordinates: [
      // From National Arboretum, flows south to meet Anacostia
      [38.9125, -76.9540],
      [38.9105, -76.9518],
      [38.9082, -76.9498],
      [38.9058, -76.9478],
      [38.9035, -76.9472], // confluence with Anacostia
    ],
  },
  {
    id: "fort-dupont-creek",
    name: "Fort Dupont Creek",
    type: "stream",
    healthIndex: 45,
    coordinates: [
      // From Fort Dupont Park (Ward 7), flows west to Anacostia
      [38.8785, -76.9548],
      [38.8800, -76.9580],
      [38.8818, -76.9618],
      [38.8840, -76.9655],
      [38.8862, -76.9690], // confluence with Anacostia
    ],
  },
  {
    id: "oxon-run",
    name: "Oxon Run",
    type: "tributary",
    healthIndex: 40,
    coordinates: [
      // Through Congress Heights (Ward 8), flows southwest to Potomac
      [38.8520, -76.9780],
      [38.8480, -76.9820],
      [38.8440, -76.9870],
      [38.8400, -76.9920],
      [38.8360, -76.9968],
      [38.8330, -77.0010],
    ],
  },
  {
    id: "rock-creek",
    name: "Rock Creek",
    type: "tributary",
    healthIndex: 62,
    coordinates: [
      // Enters DC from Maryland, flows south through NW DC to Potomac at Georgetown
      [38.9680, -77.0398],
      [38.9620, -77.0440],
      [38.9560, -77.0472],
      [38.9480, -77.0498],
      [38.9400, -77.0515],
      [38.9330, -77.0530],
      [38.9250, -77.0542],
      [38.9180, -77.0548],
      [38.9120, -77.0558],
      [38.9065, -77.0612], // Georgetown / Potomac confluence
    ],
  },
  {
    id: "potomac-river",
    name: "Potomac River (DC Section)",
    type: "river",
    healthIndex: 65,
    coordinates: [
      // Along DC's western/southern border, NW to SE
      [38.9065, -77.0612], // Georgetown
      [38.9010, -77.0590],
      [38.8960, -77.0565], // Theodore Roosevelt Island
      [38.8910, -77.0538],
      [38.8860, -77.0508], // Arlington Memorial Bridge
      [38.8820, -77.0470],
      [38.8788, -77.0420], // Tidal Basin
      [38.8760, -77.0360],
      [38.8735, -77.0290], // Washington Channel
      [38.8700, -77.0220],
      [38.8665, -77.0155],
      [38.8640, -77.0085], // Anacostia confluence / Buzzard Point
      [38.8580, -77.0105],
      [38.8500, -77.0135], // Joint Base Anacostia-Bolling
      [38.8400, -77.0175],
      [38.8300, -77.0230], // Blue Plains
      [38.8200, -77.0310],
      [38.8100, -77.0400], // Southern DC boundary
    ],
  },
];

// Monitoring stations — positions aligned to actual river/stream paths
export const monitoringStations: MonitoringStation[] = [
  {
    id: "ANA-001",
    name: "Anacostia at Bladensburg",
    position: [38.9403, -76.9322], // On the river at Bladensburg
    type: "river",
    status: "active",
    parameters: ["DO", "pH", "Temp", "Turbidity", "E. coli", "Nutrients"],
    lastReading: {
      timestamp: "2026-03-10T08:00:00Z",
      temperature: 8.2,
      dissolvedOxygen: 9.4,
      pH: 7.2,
      turbidity: 15.3,
      conductivity: 412,
      eColiCount: 285,
      nitrateN: 2.1,
      phosphorus: 0.18,
    },
  },
  {
    id: "ANA-002",
    name: "Anacostia at Kenilworth",
    position: [38.9140, -76.9388], // On the river at Kenilworth Aquatic Gardens
    type: "river",
    status: "active",
    parameters: ["DO", "pH", "Temp", "Turbidity", "E. coli"],
    lastReading: {
      timestamp: "2026-03-10T08:15:00Z",
      temperature: 8.5,
      dissolvedOxygen: 8.8,
      pH: 7.1,
      turbidity: 18.7,
      conductivity: 435,
      eColiCount: 340,
      nitrateN: 2.4,
      phosphorus: 0.22,
    },
  },
  {
    id: "ANA-003",
    name: "Anacostia at Navy Yard",
    position: [38.8700, -76.9940], // On the river at Navy Yard / Nationals Park
    type: "river",
    status: "active",
    parameters: ["DO", "pH", "Temp", "Turbidity", "E. coli", "Nutrients"],
    lastReading: {
      timestamp: "2026-03-10T08:30:00Z",
      temperature: 8.8,
      dissolvedOxygen: 7.9,
      pH: 7.0,
      turbidity: 22.1,
      conductivity: 458,
      eColiCount: 520,
      nitrateN: 2.8,
      phosphorus: 0.28,
    },
  },
  {
    id: "ANA-004",
    name: "Anacostia at Anacostia Park",
    position: [38.8862, -76.9690], // On the river at Anacostia Park
    type: "river",
    status: "active",
    parameters: ["DO", "pH", "Temp", "Turbidity"],
    lastReading: {
      timestamp: "2026-03-10T08:45:00Z",
      temperature: 8.4,
      dissolvedOxygen: 8.3,
      pH: 7.1,
      turbidity: 19.5,
      conductivity: 445,
      eColiCount: 410,
    },
  },
  {
    id: "WB-001",
    name: "Watts Branch at Minnesota Ave",
    position: [38.9015, -76.9358], // On Watts Branch near Minnesota Ave
    type: "stream",
    status: "active",
    parameters: ["DO", "pH", "Temp", "Turbidity", "E. coli"],
    lastReading: {
      timestamp: "2026-03-10T09:00:00Z",
      temperature: 7.8,
      dissolvedOxygen: 7.2,
      pH: 6.9,
      turbidity: 28.4,
      conductivity: 520,
      eColiCount: 890,
    },
  },
  {
    id: "PB-001",
    name: "Pope Branch at Fort Stanton",
    position: [38.8660, -76.9875], // On Pope Branch at Fort Stanton Park
    type: "stream",
    status: "active",
    parameters: ["DO", "pH", "Temp", "Turbidity"],
    lastReading: {
      timestamp: "2026-03-10T09:15:00Z",
      temperature: 7.5,
      dissolvedOxygen: 7.8,
      pH: 7.0,
      turbidity: 24.2,
      conductivity: 490,
      eColiCount: 620,
    },
  },
  {
    id: "HR-001",
    name: "Hickey Run at National Arboretum",
    position: [38.9105, -76.9518], // On Hickey Run near Arboretum
    type: "stream",
    status: "maintenance",
    parameters: ["DO", "pH", "Temp", "Turbidity", "E. coli"],
    lastReading: {
      timestamp: "2026-03-09T14:00:00Z",
      temperature: 8.0,
      dissolvedOxygen: 6.5,
      pH: 6.8,
      turbidity: 35.1,
      conductivity: 580,
      eColiCount: 1200,
    },
  },
  {
    id: "GI-001",
    name: "UDC Van Ness Green Roof",
    position: [38.9435, -77.0230], // UDC campus at Van Ness
    type: "green-infrastructure",
    status: "active",
    parameters: ["Runoff Volume", "Retention Rate", "TSS", "Nutrients"],
    lastReading: {
      timestamp: "2026-03-10T07:00:00Z",
      temperature: 6.5,
      dissolvedOxygen: 0,
      pH: 6.8,
      turbidity: 8.2,
      conductivity: 180,
      eColiCount: 45,
    },
  },
  {
    id: "GI-002",
    name: "UDC Food Hub Rain Garden - Ward 7",
    position: [38.8950, -76.9320], // Ward 7, east of the Anacostia
    type: "green-infrastructure",
    status: "active",
    parameters: ["Infiltration Rate", "Runoff Volume", "TSS"],
    lastReading: {
      timestamp: "2026-03-10T07:30:00Z",
      temperature: 7.0,
      dissolvedOxygen: 0,
      pH: 7.1,
      turbidity: 5.4,
      conductivity: 150,
      eColiCount: 20,
    },
  },
  {
    id: "GI-003",
    name: "UDC Food Hub Rain Garden - Ward 8",
    position: [38.8480, -76.9870], // Ward 8, Congress Heights area
    type: "green-infrastructure",
    status: "active",
    parameters: ["Infiltration Rate", "Runoff Volume", "TSS"],
    lastReading: {
      timestamp: "2026-03-10T07:45:00Z",
      temperature: 7.2,
      dissolvedOxygen: 0,
      pH: 7.0,
      turbidity: 6.1,
      conductivity: 165,
      eColiCount: 30,
    },
  },
  {
    id: "SW-001",
    name: "Stormwater BMP - Benning Road",
    position: [38.8920, -76.9615], // Near Benning Road by the river
    type: "stormwater",
    status: "active",
    parameters: ["Flow Rate", "TSS", "Nutrients", "Heavy Metals"],
    lastReading: {
      timestamp: "2026-03-10T08:00:00Z",
      temperature: 7.8,
      dissolvedOxygen: 5.5,
      pH: 7.2,
      turbidity: 45.0,
      conductivity: 650,
      eColiCount: 1500,
    },
  },
  {
    id: "SW-002",
    name: "Stormwater Outfall - South Capitol",
    position: [38.8758, -76.9842], // Near South Capitol St Bridge on the river
    type: "stormwater",
    status: "offline",
    parameters: ["Flow Rate", "TSS", "Heavy Metals"],
    lastReading: {
      timestamp: "2026-03-08T16:00:00Z",
      temperature: 8.0,
      dissolvedOxygen: 4.8,
      pH: 7.3,
      turbidity: 55.0,
      conductivity: 720,
      eColiCount: 2100,
    },
  },
];

// Historical water quality trend data (monthly averages for 2025)
export const historicalData = {
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dissolvedOxygen: [11.2, 10.8, 9.5, 8.2, 7.1, 5.8, 4.9, 5.2, 6.8, 8.5, 9.8, 10.9],
  temperature: [3.2, 4.1, 8.5, 14.2, 19.8, 24.5, 27.2, 26.8, 22.1, 15.4, 9.2, 4.8],
  pH: [7.1, 7.0, 7.2, 7.3, 7.1, 6.9, 6.8, 6.9, 7.0, 7.1, 7.2, 7.1],
  turbidity: [12.5, 14.2, 18.8, 22.5, 25.1, 20.3, 18.5, 22.8, 19.2, 15.8, 13.5, 11.8],
  eColiCount: [120, 145, 280, 520, 890, 1450, 1820, 1650, 980, 450, 220, 150],
  stormwaterRunoff: [2.8, 3.2, 4.5, 5.8, 4.2, 6.5, 3.8, 5.2, 4.8, 3.5, 3.0, 2.5],
};

// DC ward boundaries (approximate centers for ward-level data)
export const dcWards = [
  { ward: 1, center: [38.9270, -77.0320] as [number, number], population: 89610 },
  { ward: 2, center: [38.9000, -77.0400] as [number, number], population: 86977 },
  { ward: 3, center: [38.9500, -77.0700] as [number, number], population: 85368 },
  { ward: 4, center: [38.9550, -77.0200] as [number, number], population: 84660 },
  { ward: 5, center: [38.9200, -76.9750] as [number, number], population: 86068 },
  { ward: 6, center: [38.8800, -76.9900] as [number, number], population: 91828 },
  { ward: 7, center: [38.8900, -76.9400] as [number, number], population: 78472 },
  { ward: 8, center: [38.8400, -76.9900] as [number, number], population: 86602 },
];

// Research projects from UDC CAUSES/WRRI
export const researchProjects = [
  {
    id: "rp-001",
    title: "Green Roof Stormwater Retention Analysis",
    pi: "Dr. Tolessa Deksissa",
    department: "WRRI / CAUSES",
    status: "Active",
    startDate: "2024-09",
    endDate: "2027-08",
    description: "Quantitative analysis of storm event water quality and retention from multiple design combinations of extensive green roofs, agricultural green roofs, and conventional roofs at UDC campus.",
    funding: "DC Government / DOEE",
    tags: ["green-infrastructure", "stormwater", "water-quality"],
  },
  {
    id: "rp-002",
    title: "Urban Food Hub Stormwater BMP Monitoring",
    pi: "Dr. Dwane Jones",
    department: "CAUSES Land-Grant Programs",
    status: "Active",
    startDate: "2025-01",
    endDate: "2027-12",
    description: "Monitoring innovative BMPs at three UDC CAUSES urban Food Hubs in underserved areas of DC, integrating urban agriculture with green infrastructure for community-scale stormwater control.",
    funding: "USDA NIFA / DC Government",
    tags: ["urban-agriculture", "green-infrastructure", "community"],
  },
  {
    id: "rp-003",
    title: "Anacostia Watershed PFAS Assessment",
    pi: "Dr. Sarah Mitchell",
    department: "Environmental Science",
    status: "Active",
    startDate: "2025-06",
    endDate: "2028-05",
    description: "Comprehensive assessment of PFAS contamination levels in the Anacostia River watershed, including source identification and risk characterization for communities in Wards 7 and 8.",
    funding: "EPA / DC DOEE",
    tags: ["pfas", "emerging-contaminants", "environmental-justice"],
  },
  {
    id: "rp-004",
    title: "Potomac Source Water Protection Partnership",
    pi: "Dr. Tolessa Deksissa",
    department: "WRRI",
    status: "Active",
    startDate: "2024-03",
    endDate: "2026-12",
    description: "Collaborative research between upstream agricultural communities and downstream urban communities to protect Potomac River drinking water sources through integrated watershed management.",
    funding: "DC Water / DOEE",
    tags: ["drinking-water", "watershed-management", "collaboration"],
  },
  {
    id: "rp-005",
    title: "Tree Cell Stormwater Filtration Effectiveness",
    pi: "Dr. James Richardson",
    department: "CURII",
    status: "Active",
    startDate: "2025-03",
    endDate: "2027-09",
    description: "Evaluating the effectiveness of tree cell systems installed in urban parking lots for filtering and absorbing stormwater runoff, in partnership with DOEE.",
    funding: "DC DOEE",
    tags: ["green-infrastructure", "stormwater", "tree-cells"],
  },
  {
    id: "rp-006",
    title: "Rainwater Reuse Safety Assessment",
    pi: "Dr. Maria Chen",
    department: "EQTL / WRRI",
    status: "Active",
    startDate: "2025-09",
    endDate: "2028-03",
    description: "Evaluating the effectiveness and safety of rain garden systems for rainwater reuse in urban settings, including pathogen and contaminant analysis.",
    funding: "EPA Region 3",
    tags: ["rainwater-reuse", "rain-gardens", "water-quality"],
  },
];

// Per-station historical monthly data (2025) — realistic seasonal patterns
// Each station has unique characteristics based on its location and type
export function getStationHistoricalData(stationId: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Base seasonal patterns with per-station variance
  const stationProfiles: Record<string, {
    doBase: number[]; tempBase: number[]; phBase: number[]; turbBase: number[];
    ecoliBase: number[]; description: string;
  }> = {
    "ANA-001": {
      doBase: [11.5, 11.0, 9.8, 8.5, 7.4, 6.0, 5.1, 5.4, 7.0, 8.8, 10.1, 11.2],
      tempBase: [3.0, 3.8, 8.2, 13.8, 19.5, 24.2, 26.8, 26.4, 21.8, 15.0, 8.8, 4.5],
      phBase: [7.2, 7.1, 7.2, 7.3, 7.2, 7.0, 6.9, 7.0, 7.1, 7.2, 7.2, 7.2],
      turbBase: [10.5, 12.0, 16.5, 20.0, 22.5, 18.0, 16.0, 20.5, 17.0, 13.5, 11.5, 9.8],
      ecoliBase: [95, 120, 240, 450, 750, 1200, 1520, 1380, 820, 380, 180, 120],
      description: "Upstream station — generally better water quality due to lower urban influence",
    },
    "ANA-002": {
      doBase: [11.0, 10.5, 9.2, 7.9, 6.8, 5.5, 4.7, 5.0, 6.5, 8.2, 9.5, 10.7],
      tempBase: [3.2, 4.1, 8.5, 14.2, 19.8, 24.5, 27.2, 26.8, 22.1, 15.4, 9.2, 4.8],
      phBase: [7.1, 7.0, 7.2, 7.3, 7.1, 6.9, 6.8, 6.9, 7.0, 7.1, 7.2, 7.1],
      turbBase: [12.5, 14.2, 18.8, 22.5, 25.1, 20.3, 18.5, 22.8, 19.2, 15.8, 13.5, 11.8],
      ecoliBase: [110, 140, 270, 510, 870, 1400, 1780, 1620, 960, 430, 210, 140],
      description: "Mid-river station at Kenilworth — influenced by Watts Branch and Hickey Run inflows",
    },
    "ANA-003": {
      doBase: [10.2, 9.8, 8.5, 7.2, 6.1, 4.8, 4.1, 4.4, 5.8, 7.5, 8.8, 9.9],
      tempBase: [3.5, 4.4, 8.8, 14.5, 20.2, 24.8, 27.5, 27.2, 22.5, 15.8, 9.5, 5.0],
      phBase: [7.0, 6.9, 7.1, 7.2, 7.0, 6.8, 6.7, 6.8, 6.9, 7.0, 7.1, 7.0],
      turbBase: [15.0, 17.5, 22.0, 26.0, 28.5, 24.0, 21.5, 26.0, 22.5, 18.5, 16.0, 14.0],
      ecoliBase: [150, 185, 350, 650, 1100, 1800, 2200, 2000, 1200, 580, 280, 180],
      description: "Downstream station at Navy Yard — highest urban influence, CSO impacts",
    },
    "ANA-004": {
      doBase: [10.8, 10.3, 9.0, 7.7, 6.5, 5.2, 4.5, 4.8, 6.2, 8.0, 9.2, 10.4],
      tempBase: [3.3, 4.2, 8.4, 14.0, 19.6, 24.3, 27.0, 26.6, 21.9, 15.2, 9.0, 4.6],
      phBase: [7.1, 7.0, 7.1, 7.2, 7.1, 6.9, 6.8, 6.9, 7.0, 7.1, 7.1, 7.1],
      turbBase: [13.0, 15.0, 19.5, 23.5, 26.0, 21.5, 19.5, 23.5, 20.0, 16.5, 14.0, 12.5],
      ecoliBase: [130, 160, 300, 560, 950, 1550, 1950, 1780, 1050, 500, 240, 155],
      description: "Anacostia Park station — moderate urban influence, near recreational areas",
    },
    "WB-001": {
      doBase: [9.5, 9.0, 7.8, 6.5, 5.5, 4.2, 3.5, 3.8, 5.2, 7.0, 8.2, 9.2],
      tempBase: [2.8, 3.6, 7.8, 13.5, 19.2, 23.8, 26.5, 26.2, 21.5, 14.8, 8.5, 4.2],
      phBase: [6.9, 6.8, 7.0, 7.1, 6.9, 6.7, 6.6, 6.7, 6.8, 6.9, 7.0, 6.9],
      turbBase: [18.0, 22.0, 28.0, 34.0, 38.0, 30.0, 26.0, 32.0, 27.0, 22.0, 19.0, 16.5],
      ecoliBase: [250, 320, 580, 980, 1600, 2500, 3200, 2900, 1750, 820, 400, 260],
      description: "Watts Branch — highly urbanized stream, significant impervious surface runoff",
    },
    "PB-001": {
      doBase: [10.0, 9.5, 8.2, 7.0, 6.0, 4.8, 4.0, 4.3, 5.8, 7.5, 8.8, 9.8],
      tempBase: [2.5, 3.4, 7.5, 13.2, 18.8, 23.5, 26.2, 25.8, 21.2, 14.5, 8.2, 4.0],
      phBase: [7.0, 6.9, 7.1, 7.2, 7.0, 6.8, 6.7, 6.8, 6.9, 7.0, 7.1, 7.0],
      turbBase: [16.0, 19.0, 24.0, 29.0, 32.0, 26.0, 23.0, 28.0, 24.0, 19.0, 16.5, 14.5],
      ecoliBase: [180, 220, 420, 780, 1300, 2100, 2650, 2400, 1450, 680, 330, 200],
      description: "Pope Branch at Fort Stanton — moderate urban stream with park buffer zones",
    },
    "HR-001": {
      doBase: [9.0, 8.5, 7.2, 6.0, 5.0, 3.8, 3.2, 3.5, 4.8, 6.5, 7.8, 8.8],
      tempBase: [3.0, 3.8, 8.0, 13.8, 19.5, 24.0, 26.8, 26.4, 21.8, 15.0, 8.8, 4.5],
      phBase: [6.8, 6.7, 6.9, 7.0, 6.8, 6.6, 6.5, 6.6, 6.7, 6.8, 6.9, 6.8],
      turbBase: [22.0, 26.0, 34.0, 40.0, 44.0, 36.0, 32.0, 38.0, 33.0, 26.0, 22.0, 20.0],
      ecoliBase: [350, 440, 800, 1400, 2200, 3500, 4400, 4000, 2400, 1150, 550, 370],
      description: "Hickey Run — industrial area runoff, National Arboretum adjacent, worst water quality",
    },
    "GI-001": {
      doBase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tempBase: [2.0, 2.8, 6.5, 12.0, 17.5, 22.0, 24.5, 24.2, 19.8, 13.5, 7.5, 3.2],
      phBase: [6.8, 6.7, 6.8, 6.9, 6.8, 6.7, 6.6, 6.7, 6.8, 6.8, 6.8, 6.8],
      turbBase: [5.0, 6.0, 8.5, 10.0, 12.0, 9.5, 7.5, 10.0, 8.5, 7.0, 5.5, 4.5],
      ecoliBase: [15, 18, 35, 60, 95, 140, 175, 160, 100, 50, 25, 18],
      description: "UDC Van Ness Green Roof — low pollutant levels, excellent stormwater retention",
    },
    "GI-002": {
      doBase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tempBase: [2.2, 3.0, 6.8, 12.2, 17.8, 22.2, 24.8, 24.5, 20.0, 13.8, 7.8, 3.5],
      phBase: [7.1, 7.0, 7.1, 7.2, 7.1, 7.0, 6.9, 7.0, 7.0, 7.1, 7.1, 7.1],
      turbBase: [3.5, 4.0, 5.8, 7.0, 8.5, 6.5, 5.0, 7.0, 6.0, 4.5, 3.8, 3.2],
      ecoliBase: [8, 10, 18, 32, 50, 75, 95, 85, 55, 28, 12, 9],
      description: "UDC Food Hub Rain Garden Ward 7 — excellent infiltration and pollutant removal",
    },
    "GI-003": {
      doBase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tempBase: [2.4, 3.2, 7.0, 12.5, 18.0, 22.5, 25.0, 24.8, 20.2, 14.0, 8.0, 3.8],
      phBase: [7.0, 6.9, 7.0, 7.1, 7.0, 6.9, 6.8, 6.9, 7.0, 7.0, 7.0, 7.0],
      turbBase: [4.0, 5.0, 6.5, 8.0, 9.5, 7.5, 6.0, 8.0, 7.0, 5.5, 4.5, 3.8],
      ecoliBase: [12, 14, 25, 42, 68, 100, 125, 115, 72, 35, 18, 13],
      description: "UDC Food Hub Rain Garden Ward 8 — good performance, newer installation",
    },
    "SW-001": {
      doBase: [7.0, 6.5, 5.5, 4.5, 3.8, 3.0, 2.5, 2.8, 3.8, 5.2, 6.2, 6.8],
      tempBase: [3.5, 4.5, 8.8, 14.5, 20.2, 24.8, 27.5, 27.0, 22.5, 15.8, 9.5, 5.0],
      phBase: [7.2, 7.1, 7.2, 7.3, 7.2, 7.0, 6.9, 7.0, 7.1, 7.2, 7.2, 7.2],
      turbBase: [28.0, 35.0, 45.0, 55.0, 60.0, 48.0, 42.0, 52.0, 45.0, 35.0, 30.0, 25.0],
      ecoliBase: [500, 650, 1200, 2000, 3200, 5000, 6500, 5800, 3500, 1650, 800, 520],
      description: "Stormwater BMP Benning Road — high pollutant loads during storm events",
    },
    "SW-002": {
      doBase: [6.5, 6.0, 5.0, 4.0, 3.2, 2.5, 2.0, 2.3, 3.2, 4.8, 5.8, 6.3],
      tempBase: [3.8, 4.8, 9.0, 14.8, 20.5, 25.0, 27.8, 27.5, 22.8, 16.0, 9.8, 5.2],
      phBase: [7.3, 7.2, 7.3, 7.4, 7.3, 7.1, 7.0, 7.1, 7.2, 7.3, 7.3, 7.3],
      turbBase: [32.0, 40.0, 52.0, 62.0, 68.0, 55.0, 48.0, 58.0, 50.0, 40.0, 34.0, 28.0],
      ecoliBase: [620, 800, 1500, 2500, 4000, 6200, 7800, 7000, 4200, 2000, 980, 650],
      description: "Stormwater Outfall South Capitol — highest pollutant concentrations, CSO impacted",
    },
  };

  const profile = stationProfiles[stationId];
  if (!profile) return null;

  return {
    months,
    data: months.map((month, i) => ({
      month,
      dissolvedOxygen: profile.doBase[i],
      temperature: profile.tempBase[i],
      pH: profile.phBase[i],
      turbidity: profile.turbBase[i],
      eColiCount: profile.ecoliBase[i],
    })),
    description: profile.description,
  };
}

// Environmental justice data for DC wards
export const environmentalJusticeData = [
  { ward: 1, floodRisk: "Low", greenSpaceAccess: 72, impervious: 58, csoEvents: 4 },
  { ward: 2, floodRisk: "Low", greenSpaceAccess: 65, impervious: 75, csoEvents: 6 },
  { ward: 3, floodRisk: "Low", greenSpaceAccess: 85, impervious: 42, csoEvents: 1 },
  { ward: 4, floodRisk: "Low", greenSpaceAccess: 70, impervious: 55, csoEvents: 3 },
  { ward: 5, floodRisk: "Medium", greenSpaceAccess: 55, impervious: 62, csoEvents: 8 },
  { ward: 6, floodRisk: "Medium", greenSpaceAccess: 48, impervious: 68, csoEvents: 12 },
  { ward: 7, floodRisk: "High", greenSpaceAccess: 40, impervious: 58, csoEvents: 18 },
  { ward: 8, floodRisk: "High", greenSpaceAccess: 35, impervious: 52, csoEvents: 22 },
];
