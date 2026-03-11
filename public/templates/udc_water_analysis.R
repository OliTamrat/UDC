# ============================================================================
# UDC Water Resources Data Analysis Template (R)
# ============================================================================
#
# University of the District of Columbia
# College of Agriculture, Urban Sustainability and Environmental Sciences (CAUSES)
# Water Resources Research Institute (WRRI)
#
# This script fetches water quality data from the UDC Water Dashboard API
# and performs basic analysis. Designed for UDC students and researchers.
#
# Required packages:
#   install.packages(c("httr", "jsonlite", "ggplot2", "dplyr", "tidyr"))
#
# Usage:
#   source("udc_water_analysis.R")
#
# ============================================================================

library(httr)
library(jsonlite)
library(ggplot2)
library(dplyr)
library(tidyr)

# ---------------------------------------------------------------------------
# Configuration — update BASE_URL to your deployment
# ---------------------------------------------------------------------------
BASE_URL <- "https://udc-water.vercel.app"  # Change to your deployment URL
STATION_ID <- "ANA-001"  # Change to any station ID

# ---------------------------------------------------------------------------
# 1. Fetch station list
# ---------------------------------------------------------------------------
cat("Fetching stations...\n")
stations_resp <- GET(paste0(BASE_URL, "/api/stations"))
stations <- fromJSON(content(stations_resp, "text", encoding = "UTF-8"))

cat(sprintf("Found %d monitoring stations:\n\n", nrow(stations)))
for (i in seq_len(nrow(stations))) {
  cat(sprintf("  %-10s  %-40s  Status: %s\n",
              stations$id[i], stations$name[i], stations$status[i]))
}

# ---------------------------------------------------------------------------
# 2. Fetch historical data for a station
# ---------------------------------------------------------------------------
cat(sprintf("\nFetching historical data for %s...\n", STATION_ID))
history_resp <- GET(paste0(BASE_URL, "/api/stations/", STATION_ID, "/history"))
history <- fromJSON(content(history_resp, "text", encoding = "UTF-8"))

df <- as_tibble(history$data)

if (nrow(df) == 0) {
  stop("No historical data available. Run USGS ingestion first.")
}

df <- df %>%
  mutate(timestamp = as.POSIXct(timestamp, format = "%Y-%m-%dT%H:%M:%S")) %>%
  arrange(timestamp)

cat(sprintf("Loaded %d readings from %s to %s\n",
            nrow(df),
            format(min(df$timestamp, na.rm = TRUE)),
            format(max(df$timestamp, na.rm = TRUE))))
cat(sprintf("Data sources: %s\n", paste(unique(df$source), collapse = ", ")))

# ---------------------------------------------------------------------------
# 3. Summary statistics
# ---------------------------------------------------------------------------
cat("\n", strrep("=", 60), "\n")
cat(sprintf("Summary Statistics for %s\n", STATION_ID))
cat(strrep("=", 60), "\n")

params <- c("dissolvedOxygen", "temperature", "pH", "turbidity", "eColiCount")
for (param in params) {
  if (param %in% names(df)) {
    values <- df[[param]]
    values <- values[!is.na(values)]
    if (length(values) > 0) {
      cat(sprintf("\n  %s:\n", param))
      cat(sprintf("    Mean:   %.2f\n", mean(values)))
      cat(sprintf("    Median: %.2f\n", median(values)))
      cat(sprintf("    Min:    %.2f\n", min(values)))
      cat(sprintf("    Max:    %.2f\n", max(values)))
      cat(sprintf("    SD:     %.2f\n", sd(values)))
    }
  }
}

# ---------------------------------------------------------------------------
# 4. EPA compliance check
# ---------------------------------------------------------------------------
cat("\n", strrep("=", 60), "\n")
cat("EPA Compliance Check\n")
cat(strrep("=", 60), "\n")

if ("dissolvedOxygen" %in% names(df)) {
  do_data <- df$dissolvedOxygen[!is.na(df$dissolvedOxygen)]
  do_violations <- sum(do_data < 5.0)
  cat(sprintf("\n  Dissolved Oxygen < 5.0 mg/L: %d/%d readings (%.1f%% non-compliant)\n",
              do_violations, length(do_data),
              100 * do_violations / length(do_data)))
}

if ("eColiCount" %in% names(df)) {
  ecoli_data <- df$eColiCount[!is.na(df$eColiCount)]
  ecoli_violations <- sum(ecoli_data > 410)
  cat(sprintf("  E. coli > 410 CFU/100mL: %d/%d readings (%.1f%% non-compliant)\n",
              ecoli_violations, length(ecoli_data),
              100 * ecoli_violations / length(ecoli_data)))
}

# ---------------------------------------------------------------------------
# 5. Visualization
# ---------------------------------------------------------------------------

# Dissolved Oxygen trend with EPA threshold
if ("dissolvedOxygen" %in% names(df)) {
  p1 <- ggplot(df, aes(x = timestamp, y = dissolvedOxygen)) +
    geom_line(color = "#3B82F6", linewidth = 0.8) +
    geom_hline(yintercept = 5.0, linetype = "dashed", color = "#EF4444") +
    annotate("text", x = min(df$timestamp, na.rm = TRUE), y = 5.2,
             label = "EPA Min (5 mg/L)", color = "#EF4444", hjust = 0, size = 3) +
    labs(title = sprintf("Dissolved Oxygen — %s", STATION_ID),
         x = "Date", y = "DO (mg/L)") +
    theme_minimal() +
    theme(plot.title = element_text(face = "bold"))

  ggsave(sprintf("udc_do_%s.png", STATION_ID), p1, width = 10, height = 5, dpi = 150)
  cat(sprintf("\nChart saved: udc_do_%s.png\n", STATION_ID))
}

# Multi-parameter comparison
df_long <- df %>%
  select(timestamp, dissolvedOxygen, temperature, pH, turbidity) %>%
  pivot_longer(cols = -timestamp, names_to = "parameter", values_to = "value") %>%
  filter(!is.na(value))

if (nrow(df_long) > 0) {
  p2 <- ggplot(df_long, aes(x = timestamp, y = value, color = parameter)) +
    geom_line(linewidth = 0.6) +
    facet_wrap(~parameter, scales = "free_y", ncol = 2) +
    labs(title = sprintf("Water Quality Parameters — %s", STATION_ID),
         x = "Date", y = "Value") +
    theme_minimal() +
    theme(plot.title = element_text(face = "bold"),
          legend.position = "none")

  ggsave(sprintf("udc_multi_%s.png", STATION_ID), p2, width = 12, height = 8, dpi = 150)
  cat(sprintf("Chart saved: udc_multi_%s.png\n", STATION_ID))
}

# ---------------------------------------------------------------------------
# 6. Export for further analysis
# ---------------------------------------------------------------------------
csv_filename <- sprintf("udc_water_%s_%s.csv", STATION_ID, format(Sys.Date(), "%Y%m%d"))
write.csv(df, csv_filename, row.names = FALSE)
cat(sprintf("Data exported: %s\n", csv_filename))

cat("\n", strrep("=", 60), "\n")
cat("Citation:\n")
cat("  UDC Water Resources Research Institute. (2026).\n")
cat(sprintf("  Station %s Water Quality Data [Dataset].\n", STATION_ID))
cat("  University of the District of Columbia CAUSES.\n")
cat(sprintf("  Retrieved %s from %s/api/export\n", format(Sys.Date()), BASE_URL))
cat(strrep("=", 60), "\n")
