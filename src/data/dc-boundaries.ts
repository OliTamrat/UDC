// DC Ward boundary polygons — simplified from official DC GIS data
// Coordinates: [latitude, longitude] for Leaflet
// Source reference: DC Office of Planning / DC GIS (opendata.dc.gov)

export interface WardBoundary {
  ward: number;
  name: string;
  coordinates: [number, number][];
  population: number;
  councilMember: string;
  floodRisk: "Low" | "Medium" | "High";
  impervious: number; // % impervious surface
}

export const dcWardBoundaries: WardBoundary[] = [
  {
    ward: 1,
    name: "Ward 1",
    population: 89610,
    councilMember: "Brianne K. Nadeau",
    floodRisk: "Low",
    impervious: 58,
    coordinates: [
      [38.9225, -77.0095], [38.9227, -77.0190], [38.9240, -77.0260],
      [38.9268, -77.0328], [38.9310, -77.0380], [38.9355, -77.0420],
      [38.9380, -77.0450], [38.9410, -77.0460], [38.9440, -77.0430],
      [38.9460, -77.0380], [38.9465, -77.0320], [38.9450, -77.0250],
      [38.9425, -77.0180], [38.9390, -77.0130], [38.9340, -77.0100],
      [38.9280, -77.0085], [38.9225, -77.0095],
    ],
  },
  {
    ward: 2,
    name: "Ward 2",
    population: 86977,
    councilMember: "Brooke Pinto",
    floodRisk: "Low",
    impervious: 75,
    coordinates: [
      [38.8880, -77.0095], [38.8880, -77.0200], [38.8890, -77.0310],
      [38.8910, -77.0420], [38.8950, -77.0500], [38.9000, -77.0530],
      [38.9080, -77.0520], [38.9150, -77.0480], [38.9200, -77.0420],
      [38.9225, -77.0340], [38.9240, -77.0260], [38.9227, -77.0190],
      [38.9225, -77.0095], [38.9160, -77.0050], [38.9080, -77.0030],
      [38.9000, -77.0040], [38.8940, -77.0065], [38.8880, -77.0095],
    ],
  },
  {
    ward: 3,
    name: "Ward 3",
    population: 85368,
    councilMember: "Matt Frumin",
    floodRisk: "Low",
    impervious: 42,
    coordinates: [
      [38.9440, -77.0430], [38.9460, -77.0480], [38.9500, -77.0560],
      [38.9540, -77.0640], [38.9580, -77.0720], [38.9620, -77.0780],
      [38.9680, -77.0800], [38.9740, -77.0780], [38.9790, -77.0720],
      [38.9830, -77.0640], [38.9850, -77.0560], [38.9840, -77.0480],
      [38.9800, -77.0420], [38.9750, -77.0380], [38.9680, -77.0360],
      [38.9610, -77.0370], [38.9540, -77.0390], [38.9490, -77.0410],
      [38.9440, -77.0430],
    ],
  },
  {
    ward: 4,
    name: "Ward 4",
    population: 84660,
    councilMember: "Janeese Lewis George",
    floodRisk: "Low",
    impervious: 55,
    coordinates: [
      [38.9465, -77.0320], [38.9500, -77.0270], [38.9560, -77.0210],
      [38.9620, -77.0160], [38.9680, -77.0120], [38.9740, -77.0100],
      [38.9800, -77.0100], [38.9850, -77.0130], [38.9880, -77.0190],
      [38.9890, -77.0260], [38.9870, -77.0340], [38.9830, -77.0400],
      [38.9800, -77.0420], [38.9750, -77.0380], [38.9680, -77.0360],
      [38.9610, -77.0370], [38.9540, -77.0390], [38.9490, -77.0410],
      [38.9460, -77.0380], [38.9465, -77.0320],
    ],
  },
  {
    ward: 5,
    name: "Ward 5",
    population: 86068,
    councilMember: "Zachary Parker",
    floodRisk: "Medium",
    impervious: 62,
    coordinates: [
      [38.9280, -77.0085], [38.9340, -77.0100], [38.9390, -77.0130],
      [38.9425, -77.0180], [38.9450, -77.0250], [38.9465, -77.0320],
      [38.9500, -77.0270], [38.9560, -77.0210], [38.9620, -77.0160],
      [38.9680, -77.0120], [38.9700, -77.0040], [38.9680, -76.9960],
      [38.9630, -76.9900], [38.9560, -76.9860], [38.9480, -76.9850],
      [38.9400, -76.9870], [38.9320, -76.9900], [38.9260, -76.9940],
      [38.9230, -77.0010], [38.9225, -77.0095], [38.9280, -77.0085],
    ],
  },
  {
    ward: 6,
    name: "Ward 6",
    population: 91828,
    councilMember: "Charles Allen",
    floodRisk: "Medium",
    impervious: 68,
    coordinates: [
      [38.8880, -77.0095], [38.8940, -77.0065], [38.9000, -77.0040],
      [38.9080, -77.0030], [38.9160, -77.0050], [38.9225, -77.0095],
      [38.9230, -77.0010], [38.9260, -76.9940], [38.9200, -76.9860],
      [38.9120, -76.9800], [38.9040, -76.9760], [38.8960, -76.9740],
      [38.8880, -76.9750], [38.8800, -76.9780], [38.8740, -76.9830],
      [38.8700, -76.9900], [38.8700, -76.9980], [38.8730, -77.0050],
      [38.8800, -77.0085], [38.8880, -77.0095],
    ],
  },
  {
    ward: 7,
    name: "Ward 7",
    population: 78472,
    councilMember: "Vincent C. Gray",
    floodRisk: "High",
    impervious: 58,
    coordinates: [
      [38.9200, -76.9860], [38.9260, -76.9940], [38.9320, -76.9900],
      [38.9400, -76.9870], [38.9480, -76.9850], [38.9560, -76.9860],
      [38.9580, -76.9780], [38.9560, -76.9680], [38.9510, -76.9580],
      [38.9440, -76.9500], [38.9360, -76.9420], [38.9280, -76.9380],
      [38.9200, -76.9360], [38.9120, -76.9380], [38.9040, -76.9420],
      [38.8960, -76.9470], [38.8910, -76.9540], [38.8880, -76.9630],
      [38.8880, -76.9750], [38.8960, -76.9740], [38.9040, -76.9760],
      [38.9120, -76.9800], [38.9200, -76.9860],
    ],
  },
  {
    ward: 8,
    name: "Ward 8",
    population: 86602,
    councilMember: "Trayon White",
    floodRisk: "High",
    impervious: 52,
    coordinates: [
      [38.8700, -76.9900], [38.8740, -76.9830], [38.8800, -76.9780],
      [38.8880, -76.9750], [38.8880, -76.9630], [38.8860, -76.9540],
      [38.8820, -76.9460], [38.8760, -76.9400], [38.8680, -76.9360],
      [38.8600, -76.9350], [38.8520, -76.9380], [38.8440, -76.9430],
      [38.8380, -76.9500], [38.8340, -76.9590], [38.8320, -76.9690],
      [38.8330, -76.9790], [38.8370, -76.9880], [38.8430, -76.9950],
      [38.8510, -77.0000], [38.8600, -77.0020], [38.8700, -77.0000],
      [38.8700, -76.9900],
    ],
  },
];

// Anacostia watershed boundary (simplified) — covers the area draining into the Anacostia River
export interface WatershedBoundary {
  id: string;
  name: string;
  coordinates: [number, number][];
  area: string; // sq miles
  description: string;
}

export const anacostiaWatershed: WatershedBoundary = {
  id: "anacostia-watershed",
  name: "Anacostia River Watershed",
  area: "176 sq mi",
  description: "The Anacostia watershed spans DC and parts of Maryland, draining through Wards 5, 6, 7, and 8",
  coordinates: [
    // Northern boundary (Maryland)
    [39.0200, -76.9800], [39.0150, -76.9500], [39.0050, -76.9250],
    [38.9900, -76.9100], [38.9750, -76.9000], [38.9600, -76.8950],
    // Eastern boundary
    [38.9400, -76.8950], [38.9200, -76.9000], [38.9000, -76.9100],
    [38.8800, -76.9200], [38.8600, -76.9250], [38.8400, -76.9300],
    // Southern boundary (confluence with Potomac)
    [38.8300, -76.9400], [38.8250, -76.9550], [38.8300, -76.9700],
    [38.8400, -76.9800], [38.8500, -76.9900], [38.8600, -76.9950],
    // Western boundary (ridge line)
    [38.8700, -77.0000], [38.8850, -77.0050], [38.9000, -77.0050],
    [38.9150, -77.0020], [38.9300, -76.9980], [38.9500, -76.9950],
    [38.9700, -76.9920], [38.9900, -76.9880], [39.0050, -76.9850],
    [39.0200, -76.9800],
  ],
};

// FEMA flood zone areas (simplified polygons for high-risk zones in DC)
export interface FloodZone {
  id: string;
  name: string;
  riskLevel: "AE" | "A" | "X500"; // AE = 100yr floodplain, X500 = 500yr
  coordinates: [number, number][];
}

export const floodZones: FloodZone[] = [
  {
    id: "fz-anacostia-1",
    name: "Anacostia Floodplain - Bladensburg",
    riskLevel: "AE",
    coordinates: [
      [38.9420, -76.9380], [38.9400, -76.9300], [38.9350, -76.9290],
      [38.9300, -76.9310], [38.9280, -76.9360], [38.9300, -76.9400],
      [38.9350, -76.9410], [38.9400, -76.9400], [38.9420, -76.9380],
    ],
  },
  {
    id: "fz-anacostia-2",
    name: "Anacostia Floodplain - Kenilworth",
    riskLevel: "AE",
    coordinates: [
      [38.9120, -76.9480], [38.9100, -76.9400], [38.9050, -76.9380],
      [38.9000, -76.9400], [38.8970, -76.9450], [38.8980, -76.9510],
      [38.9020, -76.9530], [38.9070, -76.9520], [38.9120, -76.9480],
    ],
  },
  {
    id: "fz-anacostia-3",
    name: "Anacostia Floodplain - Anacostia Park",
    riskLevel: "AE",
    coordinates: [
      [38.8950, -76.9680], [38.8930, -76.9600], [38.8880, -76.9580],
      [38.8830, -76.9600], [38.8810, -76.9660], [38.8830, -76.9720],
      [38.8880, -76.9740], [38.8930, -76.9720], [38.8950, -76.9680],
    ],
  },
  {
    id: "fz-anacostia-4",
    name: "Anacostia Floodplain - Navy Yard",
    riskLevel: "AE",
    coordinates: [
      [38.8780, -76.9760], [38.8760, -76.9690], [38.8710, -76.9680],
      [38.8670, -76.9700], [38.8650, -76.9760], [38.8670, -76.9810],
      [38.8710, -76.9820], [38.8760, -76.9800], [38.8780, -76.9760],
    ],
  },
  {
    id: "fz-watts-branch",
    name: "Watts Branch Flood Area",
    riskLevel: "AE",
    coordinates: [
      [38.8940, -76.9460], [38.8920, -76.9420], [38.8880, -76.9440],
      [38.8860, -76.9500], [38.8870, -76.9560], [38.8900, -76.9580],
      [38.8930, -76.9540], [38.8940, -76.9460],
    ],
  },
  {
    id: "fz-oxon-run",
    name: "Oxon Run Flood Area",
    riskLevel: "A",
    coordinates: [
      [38.8400, -76.9960], [38.8380, -76.9900], [38.8340, -76.9880],
      [38.8310, -76.9920], [38.8320, -76.9980], [38.8360, -77.0010],
      [38.8390, -76.9990], [38.8400, -76.9960],
    ],
  },
];

// Impervious surface overlay data — simplified high-density areas
export interface ImperviousZone {
  id: string;
  name: string;
  percentage: number; // impervious %
  coordinates: [number, number][];
}

export const imperviousZones: ImperviousZone[] = [
  {
    id: "imp-downtown",
    name: "Downtown / Federal Triangle",
    percentage: 92,
    coordinates: [
      [38.9000, -77.0400], [38.9000, -77.0200], [38.8900, -77.0150],
      [38.8850, -77.0200], [38.8850, -77.0400], [38.8920, -77.0450],
      [38.9000, -77.0400],
    ],
  },
  {
    id: "imp-navy-yard",
    name: "Navy Yard / Capitol Riverfront",
    percentage: 88,
    coordinates: [
      [38.8800, -76.9950], [38.8810, -76.9850], [38.8760, -76.9800],
      [38.8700, -76.9830], [38.8690, -76.9930], [38.8730, -76.9970],
      [38.8800, -76.9950],
    ],
  },
  {
    id: "imp-benning",
    name: "Benning Road Commercial",
    percentage: 78,
    coordinates: [
      [38.8980, -76.9600], [38.8990, -76.9500], [38.8950, -76.9480],
      [38.8910, -76.9500], [38.8900, -76.9580], [38.8940, -76.9620],
      [38.8980, -76.9600],
    ],
  },
  {
    id: "imp-anacostia-commercial",
    name: "Anacostia Commercial District",
    percentage: 75,
    coordinates: [
      [38.8660, -76.9850], [38.8670, -76.9770], [38.8630, -76.9740],
      [38.8590, -76.9770], [38.8580, -76.9840], [38.8610, -76.9870],
      [38.8660, -76.9850],
    ],
  },
];
