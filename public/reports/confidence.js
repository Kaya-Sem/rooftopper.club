// Confidence score algorithm (browser mirror of src/reports/confidence.ts).
// See confidence-score.typ for the full writeup.
const HALF_LIFE_DAYS = 45;

function liveConfidence(score, lastEventAt, now = new Date()) {
    const days = (now.getTime() - new Date(lastEventAt).getTime()) / 86_400_000;
    return score * Math.exp(-Math.LN2 / HALF_LIFE_DAYS * days);
}

function confidenceBucket(score) {
    if (score >= 0.66) return "high";
    if (score >= 0.33) return "medium";
    return "low";
}

const CONFIDENCE_BUCKET_OPACITY = { high: 1.0, medium: 0.6, low: 0.3 };
