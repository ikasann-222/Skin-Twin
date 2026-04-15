import type { BarrierState, TwinVisualState } from "../types";

function barrierVitality(barrier: BarrierState) {
  if (barrier === "strong") return 88;
  if (barrier === "stable") return 72;
  if (barrier === "weakened") return 54;
  return 38;
}

export function toTwinVisualState(metrics: TwinVisualState | Omit<TwinVisualState, "vitality">): TwinVisualState {
  const vitality = "vitality" in metrics ? metrics.vitality : barrierVitality(metrics.barrier);
  return { ...metrics, vitality };
}

export function twinPalette(state: TwinVisualState) {
  const redness = state.rednessLevel / 100;
  const dryness = state.drynessLevel / 100;
  const tone = state.toneUnevenLevel / 100;
  const vitality = state.vitality / 100;

  const core = `rgba(${Math.round(248 - dryness * 46)}, ${Math.round(186 - redness * 66 - dryness * 10)}, ${Math.round(196 - tone * 48 - redness * 8)}, 0.96)`;
  const bloom = `rgba(${Math.round(255 - dryness * 28)}, ${Math.round(132 + vitality * 36 - redness * 44)}, ${Math.round(166 - tone * 32)}, 0.82)`;
  const flare = `rgba(${Math.round(255 - redness * 22)}, ${Math.round(242 - dryness * 54)}, ${Math.round(240 - tone * 46 + vitality * 8)}, 0.9)`;

  return { core, bloom, flare };
}

export function noiseLevel(state: TwinVisualState) {
  return 8 + state.drynessLevel * 0.6 + state.toneUnevenLevel * 0.28;
}

export function swayLevel(state: TwinVisualState) {
  return 2 + state.rednessLevel * 0.04 + state.drynessLevel * 0.03 + (state.barrier === "fragile" ? 3 : 0);
}

export function blurLevel(state: TwinVisualState) {
  return 0.8 + Math.max(0, 16 - state.poresLevel) * 0.12;
}

export function rednessGlow(state: TwinVisualState) {
  return 0.1 + state.rednessLevel / 120;
}

export function drynessCrack(state: TwinVisualState) {
  return 0.08 + state.drynessLevel / 150;
}
