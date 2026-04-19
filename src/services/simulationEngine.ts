import type {
  ParsedIngredient,
  Product,
  SimulationDebugContribution,
  SimulationLabel,
  SimulationResult,
  SkinMetrics,
  SkinScan,
  UserProfile,
} from "../types";
import { clamp, createId } from "../utils/format";

const BARRIER_OFFSET = 0.2;
const HIGH_MW_PROTECTIVE_THRESHOLD = 10_000;
const HIGH_MW_PROTECTIVE_FACTOR = -0.2;
const RISK_SCALE_FACTOR = 30;
const FUTURE_YEARS = 3;
const BARRIER_ORDER = ["strong", "stable", "weakened", "fragile"] as const;

type EngineEnvironment = {
  uvIndex?: number;
};

function computeLabelFromRisk(riskScore: number): SimulationLabel {
  if (riskScore <= 29) return "safe";
  if (riskScore <= 69) return "caution";
  return "critical";
}

function barrierDeficit(scan: SkinScan) {
  const sRed = clamp(scan.metrics.rednessLevel / 100, 0, 1);
  const sTex = clamp((scan.metrics.poresLevel * 0.55 + scan.metrics.toneUnevenLevel * 0.45) / 100, 0, 1);
  const kEnv = scan.lightingMemo.includes("乾燥") ? 1.2 : 1.0;
  return {
    sRed,
    sTex,
    kEnv,
    value: (0.7 * sRed + 0.3 * sTex) * kEnv,
  };
}

function moleculeFactor(molecularWeight: number | null) {
  if (molecularWeight === null) return 1;
  return molecularWeight <= 500 ? 1.5 : 0.5;
}

function isProtectiveHighMwIngredient(ingredient: ParsedIngredient) {
  if ((ingredient.molecularWeight ?? 0) <= HIGH_MW_PROTECTIVE_THRESHOLD) {
    return false;
  }

  const haystacks = [ingredient.displayName, ingredient.raw, ingredient.normalized].map((value) => value.toLowerCase());
  const isHighMwHydrator = haystacks.some(
    (value) => value.includes("ヒアルロン") || value.includes("hyaluron") || value.includes("collagen") || value.includes("コラーゲン"),
  );
  const isBarrierSupportive = ingredient.tags.some((tag) => ["humectant", "barrier", "occlusive", "emollient"].includes(tag));
  const hasProtectiveEffect = ingredient.effect.hydration > 0 || ingredient.effect.barrierSupport > 0;
  return isHighMwHydrator && isBarrierSupportive && hasProtectiveEffect;
}

function estimatedProductPh(ingredients: ParsedIngredient[]) {
  if (ingredients.some((item) => ["salicylic-acid", "lactic-acid"].includes(item.matchedId ?? ""))) {
    return 3.9;
  }
  if (ingredients.some((item) => item.matchedId === "vitamin-c")) {
    return 4.8;
  }
  return 5.8;
}

function combinationFactor(ingredients: ParsedIngredient[], estimatedPh: number) {
  let value = 1;
  const flags: string[] = [];
  const hasRetinol = ingredients.some((item) => item.matchedId === "retinol");
  const hasAha = ingredients.some((item) => item.matchedId === "lactic-acid");
  const hasBha = ingredients.some((item) => item.matchedId === "salicylic-acid");

  if (hasRetinol && (hasAha || hasBha)) {
    value *= 1.5;
    flags.push("Retinol_AHA_Conflict");
  }

  if (estimatedPh < 4.5 && (hasAha || hasBha)) {
    value *= 1.15;
    flags.push("Low_pH_Acid_Boost");
  }

  return { value, flags };
}

function ingredientInvasionPotential(ingredients: ParsedIngredient[], environment?: EngineEnvironment) {
  const contributions: SimulationDebugContribution[] = [];
  const weightedSum = ingredients.reduce((sum, ingredient) => {
    const safeRank = Math.max(1, Number.isFinite(ingredient.rank) ? ingredient.rank : 1);
    const rankDenominator = Math.max(Math.log(safeRank + 1), 0.5);
    const rankWeight = 1 / rankDenominator;
    const adjustedIrritationPotential = ingredient.irritationPotential;

    let dynamicIrritationPotential = adjustedIrritationPotential;
    const isPhototoxicCandidate = ["vitamin-c", "lactic-acid", "salicylic-acid"].includes(ingredient.matchedId ?? "");
    if ((environment?.uvIndex ?? 0) >= 6 && isPhototoxicCandidate) {
      dynamicIrritationPotential *= 1.2;
    }

    if (isProtectiveHighMwIngredient(ingredient)) {
      const contribution = rankWeight * HIGH_MW_PROTECTIVE_FACTOR;
      contributions.push({
        ingredient: ingredient.displayName,
        rank: safeRank,
        irritationPotential: dynamicIrritationPotential,
        molecularWeight: ingredient.molecularWeight,
        moleculeFactor: HIGH_MW_PROTECTIVE_FACTOR,
        rankWeight,
        contribution,
        protective: true,
      });
      return sum + contribution;
    }

    const mwFactor = moleculeFactor(ingredient.molecularWeight);
    const contribution = dynamicIrritationPotential * rankWeight * mwFactor;
    contributions.push({
      ingredient: ingredient.displayName,
      rank: safeRank,
      irritationPotential: dynamicIrritationPotential,
      molecularWeight: ingredient.molecularWeight,
      moleculeFactor: mwFactor,
      rankWeight,
      contribution,
      protective: false,
    });
    return sum + contribution;
  }, 0);

  const invasion = Math.max(0, weightedSum / Math.max(1, Math.sqrt(ingredients.length)));
  return { invasion, contributions };
}

function allergyOverride(profile: UserProfile, ingredients: ParsedIngredient[]) {
  const normalizedSensitivities = profile.sensitivities.map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (normalizedSensitivities.length === 0) {
    return null;
  }

  const matched = ingredients.find((ingredient) => {
    const haystacks = [ingredient.displayName, ingredient.raw, ingredient.normalized].map((item) => item.toLowerCase());
    return normalizedSensitivities.some((sensitivity) => haystacks.some((value) => value.includes(sensitivity)));
  });

  return matched ?? null;
}

function aggregateEffects(product: Product) {
  return product.parsedIngredients.reduce(
    (acc, ingredient) => {
      acc.hydration += ingredient.effect.hydration;
      acc.barrierSupport += ingredient.effect.barrierSupport;
      acc.irritation += ingredient.effect.irritation;
      acc.acneRisk += ingredient.effect.acneRisk;
      acc.rednessRisk += ingredient.effect.rednessRisk;
      acc.brightening += ingredient.effect.brightening;
      return acc;
    },
    { hydration: 0, barrierSupport: 0, irritation: 0, acneRisk: 0, rednessRisk: 0, brightening: 0 },
  );
}

function hasTopRankHydrator(product: Product) {
  return product.parsedIngredients
    .slice(0, 5)
    .some((ingredient) => ingredient.effect.hydration > 0 || ingredient.effect.barrierSupport > 0);
}

function countProtectiveHighMwIngredients(product: Product) {
  return product.parsedIngredients.filter((ingredient) => isProtectiveHighMwIngredient(ingredient)).length;
}

function shiftBarrierState(current: SkinMetrics["barrier"], direction: "up" | "down", steps: number) {
  const currentIndex = BARRIER_ORDER.indexOf(current);
  if (currentIndex === -1) {
    return current;
  }

  const delta = direction === "down" ? steps : -steps;
  const nextIndex = clamp(currentIndex + delta, 0, BARRIER_ORDER.length - 1);
  return BARRIER_ORDER[nextIndex] ?? current;
}

function buildReasons(
  riskScore: number,
  profile: UserProfile,
  offendingIngredient: ParsedIngredient | null,
  estimatedPh: number,
  combination: number,
  barrierValue: number,
  invasionValue: number,
  product: Product,
) {
  const reasons: string[] = [];

  if (offendingIngredient) {
    reasons.push(`不適合。${offendingIngredient.displayName} は過去に苦手成分として登録されています`);
    return reasons;
  }

  if (barrierValue >= 0.55) {
    reasons.push("いまの赤みとキメ乱れから、皮膚バリアが不安定寄りと推定されます");
  } else {
    reasons.push("現在のバリア欠損指標は比較的低く、急性刺激には耐えやすい状態です");
  }

  if (invasionValue >= 7) {
    reasons.push("低分子かつ刺激定数が高い成分が上位にあり、浸透刺激リスクが高めです");
  } else {
    reasons.push("成分侵入ポテンシャルは中程度以下で、接触刺激は強すぎない構成です");
  }

  if (combination > 1.3) {
    reasons.push("レチノールと酸系成分の併用が推定され、併用禁忌係数が上昇しています");
  }

  if (estimatedPh < 4.5) {
    reasons.push("推定pHが低めで、バリアが揺らいでいる日は刺激寄りに働く可能性があります");
  }

  if (riskScore <= 29) {
    reasons.push(`あなたの今のバリア状態に対して、${product.name} は比較的適合しやすい構成です`);
  } else if (riskScore <= 69) {
    reasons.push("一部の浸透性成分が刺激になる可能性があり、体調の良い日のパッチテストが向いています");
  } else {
    reasons.push("現在の肌状態と処方特性の不一致が大きく、接触性皮膚炎や赤み悪化リスクが高いです");
  }

  return reasons.slice(0, 4);
}

function buildSummaryReason(
  riskScore: number,
  barrierValue: number,
  invasionValue: number,
  contributions: SimulationDebugContribution[],
) {
  const topRiskIngredient = contributions.find((item) => !item.protective && item.contribution > 0);
  const ingredientText = topRiskIngredient ? `${topRiskIngredient.ingredient}などの成分` : "配合成分";

  if (riskScore <= 29) {
    if (barrierValue < 0.35 && invasionValue < 1.2) {
      return "バリア状態が比較的安定しており、刺激の強い成分も少ないため、今の肌に合いやすい構成です。";
    }

    return `${ingredientText}の刺激寄与が低く、全体として今の肌に合いやすい構成です。`;
  }

  if (riskScore <= 69) {
    if (barrierValue >= 0.45) {
      return `バリア機能がやや低下しているため、${ingredientText}が部分的な刺激になる可能性があります。`;
    }

    return `${ingredientText}の刺激寄与が中程度あるため、肌状態によっては刺激を感じる可能性があります。`;
  }

  if (barrierValue >= 0.45) {
    return `バリア機能が低下しているため、${ingredientText}が強い刺激になる可能性があります。`;
  }

  return `${ingredientText}の刺激寄与が高く、今の肌には負担が大きい可能性があります。`;
}

function buildAfterMetrics(before: SkinMetrics, product: Product, riskScore: number) {
  const effects = aggregateEffects(product);
  const compatibility = 100 - riskScore;
  const hasHydratorUpTop = hasTopRankHydrator(product);
  const criticalRednessBoost = riskScore > 70 ? before.rednessLevel * 0.2 : 0;
  const lowRiskDrynessRelief = riskScore < 30 && hasHydratorUpTop ? before.drynessLevel * 0.2 : 0;

  return {
    rednessLevel: clamp(
      Math.round(before.rednessLevel + effects.rednessRisk * 2 - effects.barrierSupport * 1.2 - compatibility * 0.05 + criticalRednessBoost),
    ),
    drynessLevel: clamp(
      Math.round(before.drynessLevel - effects.hydration * 1.3 - effects.barrierSupport * 0.8 + effects.irritation * 1.1 - lowRiskDrynessRelief),
    ),
    poresLevel: clamp(Math.round(before.poresLevel + Math.max(0, effects.acneRisk) * 1.4 - Math.max(0, -effects.acneRisk) * 0.8)),
    toneUnevenLevel: clamp(Math.round(before.toneUnevenLevel - effects.brightening * 1.2 + effects.rednessRisk * 0.8)),
    barrier: before.barrier,
  };
}

function buildFutureMetrics(after: SkinMetrics, product: Product, riskScore: number) {
  const effects = aggregateEffects(product);
  const longTermPenalty = riskScore / 100;
  const protectiveHighMwCount = countProtectiveHighMwIngredients(product);
  const drynessAgingFactor = protectiveHighMwCount > 0 ? 0.5 : 1;
  const annualDrynessRise = (3 + longTermPenalty * 5) * drynessAgingFactor;
  const toneAccumulation = riskScore >= 70 ? 10 * FUTURE_YEARS : riskScore <= 30 ? -2 * FUTURE_YEARS : 4 * FUTURE_YEARS;
  const barrierDirection = riskScore >= 70 ? "down" : "up";
  const barrierSteps = riskScore >= 70 ? FUTURE_YEARS : riskScore <= 30 ? 1 : 0;
  const futureBarrier = barrierSteps === 0 ? after.barrier : shiftBarrierState(after.barrier, barrierDirection, barrierSteps);

  return {
    rednessLevel: clamp(
      Math.round(after.rednessLevel + longTermPenalty * 14 + Math.max(0, effects.rednessRisk) * 1.2 * FUTURE_YEARS - Math.max(0, effects.barrierSupport) * 0.5),
    ),
    drynessLevel: clamp(
      Math.round(after.drynessLevel + annualDrynessRise * FUTURE_YEARS + Math.max(0, effects.irritation) * 0.8 - effects.hydration * 0.8),
    ),
    poresLevel: clamp(Math.round(after.poresLevel + longTermPenalty * 8 + Math.max(0, effects.acneRisk) * 0.8)),
    toneUnevenLevel: clamp(Math.round(after.toneUnevenLevel + toneAccumulation - effects.brightening * 0.7)),
    barrier: futureBarrier,
  };
}

export function simulateProduct(profile: UserProfile, scan: SkinScan, product: Product, environment?: EngineEnvironment): SimulationResult {
  const offendingIngredient = allergyOverride(profile, product.parsedIngredients);
  const barrier = barrierDeficit(scan);
  const estimatedPh = estimatedProductPh(product.parsedIngredients);
  const invasionInfo = ingredientInvasionPotential(product.parsedIngredients, environment);
  const invasion = invasionInfo.invasion;
  const cCombInfo = combinationFactor(product.parsedIngredients, estimatedPh);
  const cComb = cCombInfo.value;

  const rawRisk = offendingIngredient ? 100 : (barrier.value + BARRIER_OFFSET) * invasion * cComb * RISK_SCALE_FACTOR;
  const riskScore = clamp(Math.round(rawRisk));
  const label = computeLabelFromRisk(riskScore);
  const compatibilityScore = clamp(100 - riskScore);
  const shortTermRisk = riskScore;
  const longTermRisk = clamp(Math.round(riskScore * (estimatedPh < 4.5 ? 1.08 : 1) * cComb));
  const futureImpactScore = compatibilityScore;

  const beforeMetrics = scan.metrics;
  const afterMetrics = buildAfterMetrics(beforeMetrics, product, riskScore);
  const futureMetrics = buildFutureMetrics(afterMetrics, product, longTermRisk);
  const debugInfo = {
    barrier,
    ingredientContributions: [...invasionInfo.contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    combinationFlags: cCombInfo.flags,
    estimatedPh,
    invasion,
    rawRisk,
  };
  const summaryReason = buildSummaryReason(riskScore, barrier.value, invasion, debugInfo.ingredientContributions);

  if (import.meta.env.DEV) {
    console.log("[SIME]", {
      productName: product.name,
      score: compatibilityScore,
      riskScore,
      debugInfo,
    });
  }

  return {
    id: createId("simulation"),
    productId: product.id,
    productName: product.name,
    createdAt: new Date().toISOString(),
    score: compatibilityScore,
    label,
    shortTermRisk,
    longTermRisk,
    futureImpactScore,
    summaryReason,
    reasons: buildReasons(riskScore, profile, offendingIngredient, estimatedPh, cComb, barrier.value, invasion, product),
    beforeMetrics,
    afterMetrics,
    futureMetrics,
    debugInfo,
  };
}
