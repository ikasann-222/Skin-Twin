import type { BarrierState, SkinMetrics, SkinType } from "../types";

export function deriveBarrier(metrics: Omit<SkinMetrics, "barrier">): BarrierState {
  const burden = metrics.rednessLevel * 0.35 + metrics.drynessLevel * 0.45 + metrics.toneUnevenLevel * 0.2;
  if (burden >= 62) return "fragile";
  if (burden >= 44) return "weakened";
  if (burden >= 26) return "stable";
  return "strong";
}

export function inferSkinType(metrics: SkinMetrics): SkinType {
  if (metrics.drynessLevel >= 62) return "dry";
  if (metrics.poresLevel >= 62 && metrics.drynessLevel < 42) return "oily";
  if (metrics.rednessLevel >= 58 || metrics.barrier === "fragile") return "sensitive";
  if (metrics.poresLevel >= 44 && metrics.drynessLevel >= 44) return "combination";
  return "normal";
}
