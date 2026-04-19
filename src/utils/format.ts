import type { BarrierState, SimulationLabel, SkinType } from "../types";

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function labelText(label: SimulationLabel) {
  if (label === "safe") return "合う：あなたの肌に最適";
  if (label === "caution") return "注意：部分的な刺激の恐れ";
  return "合わない：強い刺激の恐れ";
}

export function barrierText(barrier: BarrierState) {
  return {
    strong: "バリア強め",
    stable: "安定",
    weakened: "ゆらぎ気味",
    fragile: "とても敏感",
  }[barrier];
}

export function skinTypeText(type: SkinType) {
  return {
    dry: "乾燥肌",
    oily: "脂性肌",
    combination: "混合肌",
    sensitive: "敏感肌",
    normal: "普通肌",
  }[type];
}
