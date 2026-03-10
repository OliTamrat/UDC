"use client";

import { monitoringStations } from "@/data/dc-waterways";
import { MapPin, AlertCircle, CheckCircle2, Wrench } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2, label: "Active" },
    maintenance: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Wrench, label: "Maintenance" },
    offline: { color: "text-gray-400 bg-gray-500/10 border-gray-500/20", icon: AlertCircle, label: "Offline" },
  }[status] || { color: "text-gray-400", icon: AlertCircle, label: status };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function WaterQualityIndicator({ value, thresholds }: { value: number; thresholds: { good: number; moderate: number } }) {
  let color = "bg-green-400";
  if (value > thresholds.moderate) color = "bg-red-400";
  else if (value > thresholds.good) color = "bg-amber-400";

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm">{value.toLocaleString()}</span>
    </div>
  );
}

export default function StationTable() {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-panel-border">
        <h3 className="text-sm font-semibold text-white">Monitoring Stations</h3>
        <p className="text-xs text-slate-500 mt-0.5">Real-time status across the Anacostia watershed</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel-border bg-udc-dark/30">
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">Station</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">DO (mg/L)</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">pH</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">Turbidity</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">E. coli</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 uppercase">Updated</th>
            </tr>
          </thead>
          <tbody>
            {monitoringStations.map((station) => {
              const r = station.lastReading;
              return (
                <tr
                  key={station.id}
                  className="border-b border-panel-border/50 hover:bg-panel-hover transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-water-blue flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-white">{station.name}</div>
                        <div className="text-[10px] text-slate-500">{station.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-xs text-slate-400 capitalize">{station.type.replace("-", " ")}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={station.status} />
                  </td>
                  <td className="py-2.5 px-4 text-xs text-blue-400">
                    {r?.dissolvedOxygen || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-green-400">
                    {r?.pH || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-amber-400">
                    {r?.turbidity || "—"}
                  </td>
                  <td className="py-2.5 px-4">
                    {r ? (
                      <WaterQualityIndicator
                        value={r.eColiCount}
                        thresholds={{ good: 400, moderate: 1000 }}
                      />
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[10px] text-slate-500">
                    {r ? new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
