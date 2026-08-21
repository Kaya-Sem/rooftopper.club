import { escapeHtml } from "../html.ts";
import type { Location } from "../templates.ts";
import { confidenceBucket, liveConfidence } from "./confidence.ts";

const BUCKET_LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Likely gone",
} as const;

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffSec = (new Date(iso).getTime() - now.getTime()) / 1000;

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, secInUnit] of units) {
    if (Math.abs(diffSec) >= secInUnit) {
      return RTF.format(Math.round(diffSec / secInUnit), unit);
    }
  }
  return RTF.format(0, "minute");
}

// Info-rows to splice into the location detail page's "user-info" block.
export function renderConfidenceInfoRows(location: Location): string {
  const score = liveConfidence(location.confidence_score, location.last_event_at);
  const bucket = confidenceBucket(score);
  const scorePct = Math.round(Math.max(0, Math.min(1, score)) * 100);

  const confidenceLine = `<div class="info-row">
        <span class="info-label">Confidence</span>
        <span class="info-value"><span class="confidence-badge confidence-badge--${bucket}">${BUCKET_LABELS[bucket]} (${scorePct}%)</span></span>
      </div>`;

  const lastConfirmedLine = location.last_confirmed_at
    ? `<div class="info-row">
        <span class="info-label">Last confirmed</span>
        <span class="info-value">${formatRelativeTime(location.last_confirmed_at)}</span>
      </div>`
    : "";

  const lastNegativeLine = location.last_negative_at
    ? `<div class="info-row">
        <span class="info-label">Last reported gone</span>
        <span class="info-value">${formatRelativeTime(location.last_negative_at)}</span>
      </div>`
    : "";

  return `${confidenceLine}\n      ${lastConfirmedLine}\n      ${lastNegativeLine}`;
}

// "Still here" / "No longer here" buttons, hidden until client JS confirms login.
export function renderReportActions(location: Location): string {
  return `<section class="location-report-section" data-location-id="${
    escapeHtml(location.id)
  }">
      <div id="location-report-actions" class="location-report-actions" style="display: none;">
        <button type="button" id="reportStillPresentBtn" class="report-btn report-btn--positive">Still here</button>
        <button type="button" id="reportNoLongerHereBtn" class="report-btn report-btn--negative">No longer here</button>
      </div>
      <div id="locationReportError" class="error-message" style="display: none;"></div>
    </section>`;
}
