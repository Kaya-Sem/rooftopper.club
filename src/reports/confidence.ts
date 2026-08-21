// Confidence score algorithm. See confidence-score.typ for the full writeup.
const HALF_LIFE_DAYS = 45;

export function liveConfidence(score: number, lastEventAt: string, now: Date = new Date()): number {
  const days = (now.getTime() - new Date(lastEventAt).getTime()) / 86_400_000;
  return score * Math.exp(-Math.LN2 / HALF_LIFE_DAYS * days);
}

export function confidenceBucket(score: number): "high" | "medium" | "low" {
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
}
