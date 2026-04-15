import { researchProduct } from "./productResearch";
import type { SimulationLabel, SkinMetrics, UserProfile } from "../types";
import { clamp } from "../utils/format";

export type CurrentProductAssessment = {
  score: number;
  label: SimulationLabel;
  reasons: string[];
  inferredSignals: string[];
};

function scoreLabel(score: number): SimulationLabel {
  if (score >= 70) return "safe";
  if (score >= 30) return "caution";
  return "critical";
}

export function assessCurrentProduct(profile: UserProfile, metrics: SkinMetrics): CurrentProductAssessment | null {
  if (!profile.currentProductName.trim()) {
    return null;
  }

  const hint = researchProduct(profile.currentProductName, "");
  const sensitivities = profile.sensitivities.map((item) => item.toLowerCase());
  const nameText = profile.currentProductName.toLowerCase();
  const inferredIngredients = hint?.suggestedIngredients ?? [];

  let score = 62;
  const reasons: string[] = [];

  score -= metrics.rednessLevel * 0.14;
  score -= metrics.drynessLevel * 0.12;
  score -= metrics.poresLevel * 0.05;

  if (hint?.matchedKeywords.length) {
    reasons.push(`商品名から ${hint.matchedKeywords.join(" / ")} 系として推定しました`);
  }

  if (inferredIngredients.some((item) => ["セラミド", "ヒアルロン酸Na", "グリセリン", "スクワラン"].includes(item))) {
    score += 10;
    reasons.push("保湿寄りの構成が推定され、いまの肌負担を和らげやすそうです");
  }

  if (inferredIngredients.some((item) => ["レチノール", "サリチル酸", "乳酸", "ビタミンC誘導体"].includes(item))) {
    score -= metrics.rednessLevel > 45 ? 14 : 6;
    reasons.push("攻めの成分が含まれる可能性があり、赤みがある時期は注意が必要です");
  }

  if (inferredIngredients.some((item) => ["ティーツリー"].includes(item))) {
    score -= metrics.rednessLevel > 50 ? 8 : 2;
    reasons.push("鎮静訴求でも、いま赤みが強い時は刺激に傾く可能性があります");
  }

  const sensitivityMatches = sensitivities.filter(
    (sensitivity) =>
      nameText.includes(sensitivity) ||
      inferredIngredients.some((ingredient) => ingredient.toLowerCase().includes(sensitivity)),
  );

  if (sensitivityMatches.length > 0) {
    score -= 18;
    reasons.push(`過去に苦手だった ${sensitivityMatches.join(" / ")} と重なる可能性があります`);
  }

  if (!hint) {
    reasons.push("商品名だけでは成分傾向を強く推定できないため、今回は控えめな判断です");
  }

  const inferredSignals = inferredIngredients.slice(0, 4);
  const finalScore = clamp(Math.round(score));

  return {
    score: finalScore,
    label: scoreLabel(finalScore),
    reasons: reasons.slice(0, 4),
    inferredSignals,
  };
}
