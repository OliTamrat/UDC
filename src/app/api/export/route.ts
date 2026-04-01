import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { institution, watershed, deployment } from "@/config/site.config";

export const dynamic = "force-dynamic";

function buildCitation(stationId: string | null, rowCount: number): {
  text: string;
  dataset: string;
  publisher: string;
  accessed: string;
  url: string;
} {
  const now = new Date().toISOString();
  const dateStr = now.split("T")[0];
  const baseExportUrl = `${deployment.siteUrl}/api/export`;
  return {
    text: `${institution.name} ${institution.institute}. (2026). ${
      stationId
        ? `Station ${stationId} Water Quality Data`
        : `${watershed.name} Watershed Water Quality Data`
    } [Dataset]. ${institution.name} ${institution.departmentAcronym}. Accessed ${dateStr}.`,
    dataset: stationId
      ? `${institution.acronym} ${institution.instituteAcronym} Station ${stationId} Water Quality Readings`
      : `${institution.acronym} ${institution.instituteAcronym} ${watershed.name} Watershed Water Quality Readings`,
    publisher: `${institution.name} — ${institution.department} (${institution.departmentAcronym})`,
    accessed: now,
    url: stationId
      ? `${baseExportUrl}?format=json&station=${stationId}`
      : `${baseExportUrl}?format=json`,
  };
}

export async function GET(request: NextRequest) {
  const db = await getDbClient();
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "json";
  const stationId = searchParams.get("station");

  let query = `
    SELECT
      r.station_id, s.name AS station_name, s.type AS station_type,
      r.timestamp, r.temperature, r.dissolved_oxygen, r.ph,
      r.turbidity, r.conductivity, r.ecoli_count, r.nitrate_n, r.phosphorus, r.source
    FROM readings r
    JOIN stations s ON s.id = r.station_id
  `;
  const params: unknown[] = [];

  if (stationId) {
    query += " WHERE r.station_id = ?";
    params.push(stationId);
  }
  query += " ORDER BY r.timestamp ASC";

  const { rows } = await db.query(query, params);

  const citation = buildCitation(stationId, rows.length);

  if (format === "csv") {
    // Citation header block for CSV
    const citationLines = [
      `# Citation: ${citation.text}`,
      `# Dataset: ${citation.dataset}`,
      `# Publisher: ${citation.publisher}`,
      `# Exported: ${citation.accessed}`,
      `# Records: ${rows.length}`,
      `# Data sources: ${[...new Set(rows.map((r) => r.source).filter(Boolean))].join(", ") || "N/A"}`,
      "#",
    ];

    const headers = [
      "station_id", "station_name", "station_type", "timestamp",
      "temperature", "dissolved_oxygen", "ph", "turbidity",
      "conductivity", "ecoli_count", "nitrate_n", "phosphorus", "source",
    ];
    const csvLines = [...citationLines, headers.join(",")];
    for (const row of rows) {
      csvLines.push(headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") ? `"${str}"` : str;
      }).join(","));
    }

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${institution.acronym.toLowerCase()}-water-data${stationId ? `-${stationId}` : ""}.csv`,
      },
    });
  }

  return NextResponse.json({
    citation,
    exported_at: citation.accessed,
    count: rows.length,
    sources: [...new Set(rows.map((r) => r.source).filter(Boolean))],
    data: rows,
  });
}
