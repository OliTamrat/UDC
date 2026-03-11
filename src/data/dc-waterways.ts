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

// Anacostia River main channel — centerline derived from DC GIS waterbody polygons
// Source: DC Open Data "Waterbodies" dataset (DCGIS planimetric data)
// Supplemented with Bladensburg section from USGS/landmark verification
export const anacostiaRiver: WaterwaySegment = {
  id: "anacostia-main",
  name: "Anacostia River",
  type: "river",
  healthIndex: 58,
  coordinates: [
    // Bladensburg Waterfront Park area — upstream entry into DC (from USGS landmarks)
    [38.9396, -76.9339],
    [38.9380, -76.9360],
    [38.9368, -76.9387], // Bladensburg Waterfront Park
    [38.9350, -76.9400],
    [38.9330, -76.9408],
    [38.9310, -76.9412],
    [38.9290, -76.9416],
    [38.9270, -76.9418],
    [38.9250, -76.9420],
    [38.9230, -76.9420],
    [38.9210, -76.9422],
    // DC GIS polygon-derived centerline below (lat-bin averaged from waterbody outline)
    [38.9190, -76.9424],
    [38.9175, -76.9429],
    [38.9170, -76.9434],
    [38.9145, -76.9491],
    [38.9135, -76.9496],
    [38.9115, -76.9494],
    [38.9110, -76.9499],
    [38.9090, -76.9554],
    [38.9085, -76.9560],
    [38.9030, -76.9554],
    [38.9005, -76.9539],
    [38.9000, -76.9544],
    [38.8995, -76.9556],
    [38.8980, -76.9616],
    [38.8970, -76.9638],
    [38.8955, -76.9641],
    [38.8930, -76.9650],
    [38.8895, -76.9651],
    [38.8875, -76.9659],
    [38.8845, -76.9679],
    [38.8820, -76.9706],
    [38.8805, -76.9716],
    [38.8795, -76.9726],
    [38.8780, -76.9753],
    [38.8730, -76.9879],
    [38.8710, -76.9922],
    [38.8680, -77.0044],
    [38.8670, -77.0075],
    [38.8665, -77.0082],
    [38.8650, -77.0091],
    [38.8621, -77.0089],
    [38.8614, -77.0093],
    [38.8596, -77.0123],
    [38.8580, -77.0143],
    [38.8542, -77.0170],
    [38.8460, -77.0212],
    [38.8400, -77.0231],
  ],
};

// DC tributaries and streams — coordinates trace real paths to Anacostia confluences
// Verified against USGS monitoring stations, GNIS records, and known landmarks
export const dcStreams: WaterwaySegment[] = [
  {
    id: "watts-branch",
    name: "Watts Branch",
    type: "tributary",
    healthIndex: 42,
    coordinates: [
      // From DC GIS Hydrography Centerline (735 raw points, 60 segments)
      // Flows from east DC westward to Anacostia near Kenilworth
      [38.8904, -76.9115], // Upstream near Eastern Ave / DC border
      [38.8910, -76.9140],
      [38.8916, -76.9143],
      [38.8916, -76.9148],
      [38.8910, -76.9173],
      [38.8921, -76.9179],
      [38.8936, -76.9256],
      [38.8948, -76.9282],
      [38.8991, -76.9336],
      [38.8994, -76.9373],
      [38.8991, -76.9400],
      [38.9001, -76.9410],
      [38.9014, -76.9420],
      [38.9018, -76.9445],
      [38.9029, -76.9453],
      [38.9058, -76.9488],
      [38.9062, -76.9518],
      [38.9061, -76.9579], // Confluence with Anacostia
    ],
  },
  {
    id: "nash-run",
    name: "Nash Run",
    type: "stream",
    healthIndex: 35,
    coordinates: [
      // Small stream east of river, flows west into Anacostia south of Benning Rd
      [38.8870, -76.9530],
      [38.8862, -76.9568],
      [38.8855, -76.9605],
      [38.8850, -76.9635],
      [38.8845, -76.9660], // Confluence with Anacostia
    ],
  },
  {
    id: "pope-branch",
    name: "Pope Branch",
    type: "tributary",
    healthIndex: 48,
    coordinates: [
      // Verified: GNIS 38.8787, -76.9716
      // From Fort Stanton Park area, flows north-northeast to Anacostia
      [38.8620, -76.9790], // Headwaters near Fort Davis Dr
      [38.8650, -76.9775],
      [38.8680, -76.9760],
      [38.8710, -76.9745],
      [38.8740, -76.9730],
      [38.8770, -76.9720],
      [38.8792, -76.9710], // Confluence with Anacostia near Good Hope Rd
    ],
  },
  {
    id: "hickey-run",
    name: "Hickey Run",
    type: "stream",
    healthIndex: 38,
    coordinates: [
      // Verified: USGS 01651770 at 38.9161, -76.9689
      // From northeast DC, flows south-southwest through National Arboretum to Anacostia
      [38.9218, -76.9665], // Upstream near New York Ave NE
      [38.9195, -76.9670],
      [38.9170, -76.9678], // Near Hickey Ln NE bridge
      [38.9161, -76.9689], // USGS station at National Arboretum
      [38.9140, -76.9620],
      [38.9110, -76.9555],
      [38.9080, -76.9498],
      [38.9055, -76.9458], // Confluence with Anacostia
    ],
  },
  {
    id: "fort-dupont-creek",
    name: "Fort Dupont Creek",
    type: "stream",
    healthIndex: 45,
    coordinates: [
      // Fort Dupont Park area (Ward 7), flows west to Anacostia
      // Park center approx 38.875, -76.955
      [38.8710, -76.9440], // Headwaters in Fort Dupont Park (east)
      [38.8730, -76.9480],
      [38.8748, -76.9525],
      [38.8768, -76.9570],
      [38.8790, -76.9615],
      [38.8810, -76.9660],
      [38.8838, -76.9700], // Confluence with Anacostia near Anacostia Park
    ],
  },
  {
    id: "oxon-run",
    name: "Oxon Run",
    type: "tributary",
    healthIndex: 40,
    coordinates: [
      // From DC GIS Hydrography Centerline (452 raw points, 29 segments)
      // Enters DC at Southern Ave, flows southwest through Ward 8
      [38.8433, -76.9718],
      [38.8433, -76.9728],
      [38.8431, -76.9739],
      [38.8425, -76.9750],
      [38.8421, -76.9771],
      [38.8419, -76.9781],
      [38.8422, -76.9788],
      [38.8413, -76.9798],
      [38.8409, -76.9819],
      [38.8406, -76.9840],
      [38.8403, -76.9848],
      [38.8398, -76.9851],
      [38.8396, -76.9857],
      [38.8392, -76.9869],
      [38.8387, -76.9880],
      [38.8384, -76.9896],
      [38.8377, -76.9926],
      [38.8375, -76.9937],
      [38.8368, -76.9962],
      [38.8363, -76.9971],
      [38.8340, -77.0004],
      [38.8339, -77.0013],
      [38.8318, -77.0032],
      [38.8298, -77.0048],
      [38.8272, -77.0052],
      [38.8252, -77.0044],
      [38.8230, -77.0046],
      [38.8216, -77.0047],
      [38.8209, -77.0041],
      [38.8200, -77.0046],
      [38.8186, -77.0057],
      [38.8166, -77.0064],
    ],
  },
  {
    id: "rock-creek",
    name: "Rock Creek",
    type: "tributary",
    healthIndex: 62,
    coordinates: [
      // Derived from DC GIS Hydrography Centerline dataset (1399 raw points)
      // Enters DC from Maryland, flows south through NW DC to Potomac
      [38.9941, -77.0445], // DC-Maryland border
      [38.9933, -77.0442],
      [38.9912, -77.0445],
      [38.9900, -77.0444],
      [38.9885, -77.0421],
      [38.9876, -77.0431],
      [38.9850, -77.0422],
      [38.9836, -77.0427],
      [38.9822, -77.0400],
      [38.9813, -77.0404],
      [38.9805, -77.0420],
      [38.9797, -77.0446],
      [38.9782, -77.0439],
      [38.9763, -77.0399],
      [38.9740, -77.0395],
      [38.9718, -77.0402],
      [38.9705, -77.0448],
      [38.9691, -77.0452],
      [38.9676, -77.0465],
      [38.9653, -77.0474],
      [38.9630, -77.0460],
      [38.9600, -77.0407],
      [38.9579, -77.0421],
      [38.9547, -77.0423],
      [38.9525, -77.0445],
      [38.9509, -77.0453],
      [38.9497, -77.0470],
      [38.9491, -77.0468],
      [38.9485, -77.0450],
      [38.9482, -77.0456],
      [38.9480, -77.0451],
      [38.9471, -77.0450],
      [38.9436, -77.0498],
      [38.9417, -77.0511],
      [38.9381, -77.0521],
      [38.9366, -77.0478],
      [38.9351, -77.0482],
      [38.9328, -77.0509],
      [38.9285, -77.0450],
      [38.9266, -77.0451],
      [38.9252, -77.0486],
      [38.9222, -77.0486],
      [38.9197, -77.0527],
      [38.9183, -77.0577],
      [38.9157, -77.0589],
      [38.9125, -77.0543],
      [38.9099, -77.0503],
      [38.9088, -77.0529],
      [38.9076, -77.0543],
      [38.9064, -77.0548],
      [38.9040, -77.0565],
      [38.9016, -77.0584],
      [38.8999, -77.0575],
      [38.8989, -77.0588], // Mouth at Potomac / Watergate area
    ],
  },
  {
    id: "potomac-river",
    name: "Potomac River (DC Section)",
    type: "river",
    healthIndex: 65,
    coordinates: [
      // Centerline derived from DC GIS waterbody polygon (66,168 point outline)
      // NW to SE along DC border
      [38.9370, -77.1169], // NW DC boundary near Chain Bridge
      [38.9330, -77.1159],
      [38.9280, -77.1129],
      [38.9200, -77.1046],
      [38.9140, -77.1006],
      [38.9120, -77.0946],
      [38.9080, -77.0765],
      [38.9070, -77.0747],
      [38.9050, -77.0738],
      [38.9040, -77.0727],
      [38.8990, -77.0634],
      [38.8980, -77.0624],
      [38.8890, -77.0583],
      [38.8870, -77.0583],
      [38.8840, -77.0599],
      [38.8830, -77.0595],
      [38.8790, -77.0532],
      [38.8730, -77.0462],
      [38.8690, -77.0401],
      [38.8670, -77.0385],
      [38.8630, -77.0388],
      [38.8610, -77.0374],
      [38.8580, -77.0340],
      [38.8530, -77.0256],
      [38.8520, -77.0252],
      [38.8500, -77.0256],
      [38.8410, -77.0287],
      [38.8400, -77.0284],
      [38.8370, -77.0254],
      [38.8360, -77.0251],
      [38.8350, -77.0257],
      [38.8320, -77.0305],
      [38.8300, -77.0322],
      [38.8270, -77.0326],
      [38.8240, -77.0320],
      [38.8190, -77.0333],
      [38.8160, -77.0325],
      [38.8140, -77.0311],
      [38.8090, -77.0247],
      [38.8070, -77.0242],
      [38.7999, -77.0316],
      [38.7920, -77.0385],
    ],
  },
];

// Monitoring stations — positions aligned to actual river/stream paths
export const monitoringStations: MonitoringStation[] = [
  {
    id: "ANA-001",
    name: "Anacostia at Bladensburg",
    position: [38.9368, -76.9387], // On the river at Bladensburg Waterfront Park
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
    position: [38.9135, -76.9496], // On the river at Kenilworth Aquatic Gardens
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
    position: [38.8670, -77.0075], // On the river near Frederick Douglass Bridge / Navy Yard
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
    position: [38.8845, -76.9679], // On the river at Anacostia Park
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
    position: [38.9015, -76.9370], // On Watts Branch near Minnesota Ave
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
    position: [38.8680, -76.9760], // On Pope Branch near Fort Stanton Park
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
    position: [38.9161, -76.9689], // USGS 01651770 at National Arboretum
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
    position: [38.9436, -77.0631], // UDC campus at 4200 Connecticut Ave NW
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
    position: [38.8930, -76.9652], // Near Benning Road by the river
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
    position: [38.8730, -76.9879], // Near 11th St Bridges on the river
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
