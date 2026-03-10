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

// Anacostia River main channel coordinates (real geographic path through DC)
export const anacostiaRiver: WaterwaySegment = {
  id: "anacostia-main",
  name: "Anacostia River",
  type: "river",
  healthIndex: 58,
  coordinates: [
    [38.8415, -76.9725],
    [38.8455, -76.9740],
    [38.8510, -76.9755],
    [38.8565, -76.9770],
    [38.8620, -76.9760],
    [38.8675, -76.9745],
    [38.8730, -76.9720],
    [38.8780, -76.9700],
    [38.8830, -76.9680],
    [38.8870, -76.9660],
    [38.8910, -76.9640],
    [38.8945, -76.9610],
    [38.8975, -76.9575],
    [38.9005, -76.9540],
    [38.9035, -76.9505],
    [38.9060, -76.9470],
    [38.9075, -76.9430],
    [38.9085, -76.9390],
    [38.9082, -76.9340],
  ],
};

// DC tributaries and streams
export const dcStreams: WaterwaySegment[] = [
  {
    id: "watts-branch",
    name: "Watts Branch",
    type: "tributary",
    healthIndex: 42,
    coordinates: [
      [38.8920, -76.9440],
      [38.8905, -76.9480],
      [38.8890, -76.9520],
      [38.8870, -76.9560],
      [38.8855, -76.9600],
    ],
  },
  {
    id: "nash-run",
    name: "Nash Run",
    type: "stream",
    healthIndex: 35,
    coordinates: [
      [38.8580, -76.9640],
      [38.8600, -76.9680],
      [38.8620, -76.9720],
      [38.8640, -76.9760],
    ],
  },
  {
    id: "pope-branch",
    name: "Pope Branch",
    type: "tributary",
    healthIndex: 48,
    coordinates: [
      [38.8790, -76.9820],
      [38.8810, -76.9790],
      [38.8830, -76.9750],
      [38.8850, -76.9710],
    ],
  },
  {
    id: "hickey-run",
    name: "Hickey Run",
    type: "stream",
    healthIndex: 38,
    coordinates: [
      [38.9060, -76.9600],
      [38.9040, -76.9560],
      [38.9020, -76.9520],
      [38.9000, -76.9480],
    ],
  },
  {
    id: "fort-dupont-creek",
    name: "Fort Dupont Creek",
    type: "stream",
    healthIndex: 45,
    coordinates: [
      [38.8750, -76.9500],
      [38.8770, -76.9540],
      [38.8790, -76.9580],
      [38.8810, -76.9620],
    ],
  },
  {
    id: "oxon-run",
    name: "Oxon Run",
    type: "tributary",
    healthIndex: 40,
    coordinates: [
      [38.8350, -76.9950],
      [38.8380, -76.9900],
      [38.8410, -76.9850],
      [38.8440, -76.9800],
    ],
  },
  {
    id: "rock-creek",
    name: "Rock Creek",
    type: "tributary",
    healthIndex: 62,
    coordinates: [
      [38.9600, -77.0500],
      [38.9550, -77.0480],
      [38.9500, -77.0460],
      [38.9450, -77.0430],
      [38.9400, -77.0400],
      [38.9350, -77.0370],
      [38.9300, -77.0340],
      [38.9250, -77.0310],
    ],
  },
  {
    id: "potomac-river",
    name: "Potomac River (DC Section)",
    type: "river",
    healthIndex: 65,
    coordinates: [
      [38.8030, -77.0460],
      [38.8200, -77.0400],
      [38.8400, -77.0350],
      [38.8600, -77.0300],
      [38.8800, -77.0250],
      [38.9000, -77.0200],
      [38.9200, -77.0150],
      [38.9400, -77.0100],
    ],
  },
];

// Real monitoring station locations in the Anacostia watershed
export const monitoringStations: MonitoringStation[] = [
  {
    id: "ANA-001",
    name: "Anacostia at Bladensburg",
    position: [38.9390, -76.9340],
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
    position: [38.9075, -76.9430],
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
    position: [38.8730, -76.9720],
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
    position: [38.8870, -76.9660],
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
    position: [38.8905, -76.9480],
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
    position: [38.8810, -76.9790],
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
    position: [38.9060, -76.9600],
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
    position: [38.9435, -77.0230],
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
    position: [38.8900, -76.9350],
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
    position: [38.8500, -76.9900],
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
    position: [38.8950, -76.9550],
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
    position: [38.8620, -76.9760],
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
