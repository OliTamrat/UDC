"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { StationSnapshot } from "@/data/scenarios";

interface AnimatedMapLayerProps {
  stations: StationSnapshot[];
  onStationClick?: (station: StationSnapshot) => void;
  className?: string;
}

const STATUS_COLORS = {
  normal: { fill: "#22C55E", ring: "rgba(34,197,94,0.3)" },
  elevated: { fill: "#F59E0B", ring: "rgba(245,158,11,0.3)" },
  warning: { fill: "#F97316", ring: "rgba(249,115,22,0.3)" },
  critical: { fill: "#EF4444", ring: "rgba(239,68,68,0.4)" },
};

// SVG-based mini map showing station positions and statuses
export default function AnimatedMapLayer({
  stations,
  onStationClick,
  className = "",
}: AnimatedMapLayerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  // Map lat/lon to SVG coordinates — focused on Anacostia watershed
  const mapBounds = {
    minLat: 38.82,
    maxLat: 38.95,
    minLon: -77.08,
    maxLon: -76.91,
  };

  const toSvg = (lat: number, lon: number): [number, number] => {
    const x = ((lon - mapBounds.minLon) / (mapBounds.maxLon - mapBounds.minLon)) * 700 + 25;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 400 + 25;
    return [x, y];
  };

  // Simplified Anacostia River path
  const riverPoints: [number, number][] = [
    [38.94, -76.934],
    [38.93, -76.941],
    [38.92, -76.942],
    [38.915, -76.949],
    [38.91, -76.950],
    [38.90, -76.955],
    [38.895, -76.965],
    [38.885, -76.968],
    [38.88, -76.975],
    [38.875, -76.988],
    [38.87, -76.993],
    [38.867, -77.008],
    [38.86, -77.012],
    [38.855, -77.017],
    [38.845, -77.021],
    [38.84, -77.023],
  ];

  const riverPath = riverPoints
    .map((p, i) => {
      const [x, y] = toSvg(p[0], p[1]);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className={className}>
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white/90 border-[#E5E7EB] shadow-sm"
        }`}
      >
        <div className="p-3 pb-0">
          <h4 className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
            Watershed Station Map
          </h4>
          <p className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
            Station colors reflect current water quality status
          </p>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 750 450"
          className="w-full"
          style={{ minHeight: 300 }}
        >
          {/* Background */}
          <rect width="750" height="450" fill={isDark ? "#0F1B2E" : "#F0F7FF"} />

          {/* Grid */}
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={`vg-${i}`}
              x1={i * 100 + 25}
              y1="25"
              x2={i * 100 + 25}
              y2="425"
              stroke={isDark ? "#1E3A5F20" : "#CBD5E120"}
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={`hg-${i}`}
              x1="25"
              y1={i * 100 + 25}
              x2="725"
              y2={i * 100 + 25}
              stroke={isDark ? "#1E3A5F20" : "#CBD5E120"}
              strokeWidth="0.5"
            />
          ))}

          {/* River path */}
          <path
            d={riverPath}
            fill="none"
            stroke={isDark ? "#1E4D8C" : "#93C5FD"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          />
          <path
            d={riverPath}
            fill="none"
            stroke={isDark ? "#3B82F6" : "#60A5FA"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />

          {/* Animated flow arrows */}
          <path
            d={riverPath}
            fill="none"
            stroke={isDark ? "#60A5FA" : "#3B82F6"}
            strokeWidth="2"
            strokeDasharray="8 16"
            strokeLinecap="round"
            opacity="0.5"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-24"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>

          {/* Station markers */}
          {stations.map((station) => {
            const [x, y] = toSvg(station.position[0], station.position[1]);
            const colors = STATUS_COLORS[station.status];
            const isHovered = hoveredStation === station.stationId;
            const isAffected = station.status !== "normal";
            const radius = isHovered ? 16 : 12;

            return (
              <g
                key={station.stationId}
                className="cursor-pointer"
                onClick={() => onStationClick?.(station)}
                onMouseEnter={() => setHoveredStation(station.stationId)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Pulse ring for affected stations */}
                {isAffected && (
                  <>
                    <circle cx={x} cy={y} r={radius + 8} fill="none" stroke={colors.fill} strokeWidth="1.5" opacity="0">
                      <animate
                        attributeName="r"
                        values={`${radius};${radius + 14}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx={x} cy={y} r={radius + 4} fill={colors.ring}>
                      <animate
                        attributeName="opacity"
                        values="0.4;0.15;0.4"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                {/* Main marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={colors.fill}
                  stroke={isDark ? "#0F1B2E" : "white"}
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                />

                {/* Inner value */}
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={isHovered ? "8" : "7"}
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {Math.round(station.values.turbidity)}
                </text>

                {/* Label */}
                <text
                  x={x}
                  y={y + radius + 12}
                  textAnchor="middle"
                  fill={isDark ? "#94A3B8" : "#64748B"}
                  fontSize="8"
                  fontWeight={isHovered ? "600" : "400"}
                  className="pointer-events-none select-none"
                >
                  {station.stationId}
                </text>

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 70}
                      y={y - radius - 50}
                      width="140"
                      height="38"
                      rx="6"
                      fill={isDark ? "#1E293B" : "white"}
                      stroke={colors.fill}
                      strokeWidth="1"
                      opacity="0.95"
                    />
                    <text
                      x={x}
                      y={y - radius - 37}
                      textAnchor="middle"
                      fill={isDark ? "#F1F5F9" : "#1E293B"}
                      fontSize="8"
                      fontWeight="600"
                    >
                      {station.stationName}
                    </text>
                    <text
                      x={x}
                      y={y - radius - 23}
                      textAnchor="middle"
                      fill={isDark ? "#94A3B8" : "#64748B"}
                      fontSize="7"
                    >
                      DO: {station.values.dissolvedOxygen.toFixed(1)} · Turb: {station.values.turbidity} · E.coli: {station.values.eColiCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(580, 380)">
            <rect
              x="0"
              y="0"
              width="150"
              height="58"
              rx="6"
              fill={isDark ? "#1E293B" : "white"}
              stroke={isDark ? "#1E3A5F" : "#E2E8F0"}
              opacity="0.9"
            />
            {Object.entries(STATUS_COLORS).map(([status, colors], i) => (
              <g key={status} transform={`translate(10, ${10 + i * 12})`}>
                <circle cx="5" cy="4" r="4" fill={colors.fill} />
                <text
                  x="14"
                  y="7"
                  fill={isDark ? "#94A3B8" : "#64748B"}
                  fontSize="8"
                  className="capitalize"
                >
                  {status}
                </text>
              </g>
            ))}
          </g>

          {/* NTU label */}
          <text x="25" y="440" fill={isDark ? "#475569" : "#94A3B8"} fontSize="8">
            Values show turbidity (NTU)
          </text>
        </svg>
      </div>
    </div>
  );
}
