"""
UDC Water Resources Data Analysis Template
==========================================

University of the District of Columbia
College of Agriculture, Urban Sustainability and Environmental Sciences (CAUSES)
Water Resources Research Institute (WRRI)

This script fetches water quality data from the UDC Water Dashboard API
and performs basic analysis. Designed for UDC students and researchers.

Usage:
    pip install requests pandas matplotlib
    python udc_water_analysis.py

API Base URL: Update BASE_URL below to match your deployment.
"""

import requests
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

# ---------------------------------------------------------------------------
# Configuration — update BASE_URL to your deployment
# ---------------------------------------------------------------------------
BASE_URL = "https://udc-water.vercel.app"  # Change to your deployment URL

# ---------------------------------------------------------------------------
# 1. Fetch station list
# ---------------------------------------------------------------------------
print("Fetching stations...")
stations_resp = requests.get(f"{BASE_URL}/api/stations")
stations_resp.raise_for_status()
stations = stations_resp.json()

print(f"Found {len(stations)} monitoring stations:\n")
for s in stations:
    reading = s.get("lastReading", {})
    source = reading.get("source", "N/A") if reading else "N/A"
    print(f"  {s['id']:10s}  {s['name']:40s}  Status: {s['status']:12s}  Source: {source}")

# ---------------------------------------------------------------------------
# 2. Fetch historical data for a station
# ---------------------------------------------------------------------------
STATION_ID = "ANA-001"  # Change to any station ID from the list above

print(f"\nFetching historical data for {STATION_ID}...")
history_resp = requests.get(f"{BASE_URL}/api/stations/{STATION_ID}/history")
history_resp.raise_for_status()
history = history_resp.json()

df = pd.DataFrame(history["data"])
if not df.empty:
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp")
    print(f"Loaded {len(df)} readings from {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Data sources: {df['source'].unique().tolist()}")
else:
    print("No historical data available. Run USGS ingestion first.")
    exit()

# ---------------------------------------------------------------------------
# 3. Summary statistics
# ---------------------------------------------------------------------------
print(f"\n{'='*60}")
print(f"Summary Statistics for {STATION_ID}")
print(f"{'='*60}")

params = ["dissolvedOxygen", "temperature", "pH", "turbidity", "eColiCount"]
for param in params:
    if param in df.columns and df[param].notna().any():
        series = df[param].dropna()
        print(f"\n  {param}:")
        print(f"    Mean:   {series.mean():.2f}")
        print(f"    Median: {series.median():.2f}")
        print(f"    Min:    {series.min():.2f}")
        print(f"    Max:    {series.max():.2f}")
        print(f"    Std:    {series.std():.2f}")

# ---------------------------------------------------------------------------
# 4. EPA compliance check
# ---------------------------------------------------------------------------
print(f"\n{'='*60}")
print("EPA Compliance Check")
print(f"{'='*60}")

if "dissolvedOxygen" in df.columns:
    do_violations = df[df["dissolvedOxygen"] < 5.0]
    total_do = df["dissolvedOxygen"].notna().sum()
    print(f"\n  Dissolved Oxygen < 5.0 mg/L: {len(do_violations)}/{total_do} readings "
          f"({100*len(do_violations)/total_do:.1f}% non-compliant)" if total_do > 0 else "  No DO data")

if "eColiCount" in df.columns:
    ecoli_violations = df[df["eColiCount"] > 410]
    total_ecoli = df["eColiCount"].notna().sum()
    print(f"  E. coli > 410 CFU/100mL: {len(ecoli_violations)}/{total_ecoli} readings "
          f"({100*len(ecoli_violations)/total_ecoli:.1f}% non-compliant)" if total_ecoli > 0 else "  No E. coli data")

# ---------------------------------------------------------------------------
# 5. Visualization
# ---------------------------------------------------------------------------
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle(f"UDC Water Quality — Station {STATION_ID}", fontsize=14, fontweight="bold")

# Dissolved Oxygen
if "dissolvedOxygen" in df.columns:
    ax = axes[0, 0]
    ax.plot(df["timestamp"], df["dissolvedOxygen"], color="#3B82F6", linewidth=1.5)
    ax.axhline(y=5.0, color="#EF4444", linestyle="--", linewidth=1, label="EPA Min (5 mg/L)")
    ax.set_ylabel("DO (mg/L)")
    ax.set_title("Dissolved Oxygen")
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)

# Temperature
if "temperature" in df.columns:
    ax = axes[0, 1]
    ax.plot(df["timestamp"], df["temperature"], color="#22D3EE", linewidth=1.5)
    ax.set_ylabel("Temperature (°C)")
    ax.set_title("Water Temperature")
    ax.grid(alpha=0.3)

# E. coli
if "eColiCount" in df.columns:
    ax = axes[1, 0]
    ax.bar(df["timestamp"], df["eColiCount"], color="#EF4444", alpha=0.7, width=20)
    ax.axhline(y=410, color="#F59E0B", linestyle="--", linewidth=1, label="EPA Rec. Limit (410)")
    ax.set_ylabel("E. coli (CFU/100mL)")
    ax.set_title("E. coli Levels")
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)

# Turbidity
if "turbidity" in df.columns:
    ax = axes[1, 1]
    ax.plot(df["timestamp"], df["turbidity"], color="#F59E0B", linewidth=1.5)
    ax.set_ylabel("Turbidity (NTU)")
    ax.set_title("Turbidity")
    ax.grid(alpha=0.3)

plt.tight_layout()
plt.savefig(f"udc_water_{STATION_ID}.png", dpi=150, bbox_inches="tight")
print(f"\nChart saved: udc_water_{STATION_ID}.png")
plt.show()

# ---------------------------------------------------------------------------
# 6. Export for further analysis
# ---------------------------------------------------------------------------
csv_filename = f"udc_water_{STATION_ID}_{datetime.now().strftime('%Y%m%d')}.csv"
df.to_csv(csv_filename, index=False)
print(f"Data exported: {csv_filename}")

print(f"\n{'='*60}")
print("Citation:")
print("  UDC Water Resources Research Institute. (2026).")
print(f"  Station {STATION_ID} Water Quality Data [Dataset].")
print("  University of the District of Columbia CAUSES.")
print(f"  Retrieved {datetime.now().strftime('%Y-%m-%d')} from {BASE_URL}/api/export")
print(f"{'='*60}")
