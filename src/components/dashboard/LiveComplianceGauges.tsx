"use client";

import { useState, useEffect } from "react";
import RadialGauge from "./RadialGauge";

interface StationReading {
  dissolvedOxygen?: number | null;
  pH?: number | null;
  eColiCount?: number | null;
  temperature?: number | null;
  turbidity?: number | null;
  conductivity?: number | null;
}

interface Station {
  id: string;
  status: string;
  type: string;
  lastReading?: StationReading | null;
}

function computeCompliance(stations: Station[]) {
  const active = stations.filter(
    (s) => s.status === "active" && s.lastReading
  );
  if (active.length === 0) return { wqi: 0, doCompliance: 0, phCompliance: 0, ecoliSafety: 0 };

  let doPass = 0, doTotal = 0;
  let phPass = 0, phTotal = 0;
  let ecoliPass = 0, ecoliTotal = 0;
  let wqiSum = 0, wqiCount = 0;

  for (const s of active) {
    const r = s.lastReading;
    if (!r) continue;

    // DO compliance: >= 5.0 mg/L (EPA minimum)
    if (r.dissolvedOxygen != null) {
      doTotal++;
      if (r.dissolvedOxygen >= 5.0) doPass++;
    }

    // pH compliance: 6.5-9.0 (EPA range)
    if (r.pH != null) {
      phTotal++;
      if (r.pH >= 6.5 && r.pH <= 9.0) phPass++;
    }

    // E. coli safety: <= 410 CFU/100mL (EPA single-sample max)
    if (r.eColiCount != null) {
      ecoliTotal++;
      if (r.eColiCount <= 410) ecoliPass++;
    }

    // Simple WQI: average of individual compliance scores per station
    let score = 0, factors = 0;
    if (r.dissolvedOxygen != null) {
      // DO score: 100 at 10+ mg/L, 0 at 0 mg/L, linear
      score += Math.min(100, (r.dissolvedOxygen / 10) * 100);
      factors++;
    }
    if (r.pH != null) {
      // pH score: 100 if 6.5-9.0, drops linearly outside
      const deviation = r.pH < 6.5 ? 6.5 - r.pH : r.pH > 9.0 ? r.pH - 9.0 : 0;
      score += Math.max(0, 100 - deviation * 40);
      factors++;
    }
    if (r.eColiCount != null) {
      // E. coli score: 100 at 0, 0 at 820 (2x EPA limit)
      score += Math.max(0, Math.min(100, 100 - (r.eColiCount / 820) * 100));
      factors++;
    }
    if (r.turbidity != null) {
      // Turbidity score: 100 at 0, 0 at 100 NTU
      score += Math.max(0, Math.min(100, 100 - r.turbidity));
      factors++;
    }
    if (factors > 0) {
      wqiSum += score / factors;
      wqiCount++;
    }
  }

  return {
    wqi: wqiCount > 0 ? Math.round(wqiSum / wqiCount) : 0,
    doCompliance: doTotal > 0 ? Math.round((doPass / doTotal) * 100) : 0,
    phCompliance: phTotal > 0 ? Math.round((phPass / phTotal) * 100) : 0,
    ecoliSafety: ecoliTotal > 0 ? Math.round((ecoliPass / ecoliTotal) * 100) : 0,
  };
}

export default function LiveComplianceGauges() {
  const [scores, setScores] = useState({ wqi: 0, doCompliance: 0, phCompliance: 0, ecoliSafety: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.ok ? r.json() : null)
      .then((stations: Station[] | null) => {
        if (stations) setScores(computeCompliance(stations));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center gap-6 py-2">
        {[1,2,3,4].map((i) => (
          <div key={i} className="w-[88px] h-[108px] rounded-full animate-pulse bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-6 flex-wrap">
      <RadialGauge value={scores.wqi} max={100} label="Water Quality Index" unit="WQI" color="#14B8A6" />
      <RadialGauge value={scores.doCompliance} max={100} label="DO Compliance" unit="EPA 5mg/L" color="#3B82F6" />
      <RadialGauge value={scores.phCompliance} max={100} label="pH Compliance" unit="EPA 6.5-9" color="#10B981" />
      <RadialGauge value={scores.ecoliSafety} max={100} label="E. coli Safety" unit="EPA 410" color="#EF4444" />
    </div>
  );
}
