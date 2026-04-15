import { ingredientMaster } from "../data/ingredients";
import type { IngredientEffect, ParsedIngredient } from "../types";

const ZERO_EFFECT: IngredientEffect = {
  hydration: 0,
  barrierSupport: 0,
  irritation: 0,
  acneRisk: 0,
  rednessRisk: 0,
  brightening: 0,
};

const UNKNOWN_DEFAULT_MW = 600;
const UNKNOWN_DEFAULT_IRRITATION = 0.1;
const UNKNOWN_ALERT_IRRITATION = 0.5;
const UNKNOWN_ALERT_KEYWORDS = ["エタノール", "酸", "ピール", "ethanol", "acid", "peel", "alcohol"];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function splitIngredients(input: string) {
  return input
    .split(/[\n,、/・]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function guessMatch(normalized: string) {
  return ingredientMaster.find((item) => {
    if (item.displayName.toLowerCase() === normalized) return true;
    if (item.aliases.some((alias) => normalize(alias) === normalized)) return true;
    if (normalized.includes(item.displayName.toLowerCase())) return true;
    return item.aliases.some((alias) => normalized.includes(normalize(alias)));
  });
}

function inferUnknownIrritation(raw: string) {
  const normalized = raw.toLowerCase();
  return UNKNOWN_ALERT_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()))
    ? UNKNOWN_ALERT_IRRITATION
    : UNKNOWN_DEFAULT_IRRITATION;
}

function buildParsedIngredient(
  raw: string,
  rank: number,
  matched: (typeof ingredientMaster)[number] | null,
  confidence: ParsedIngredient["confidence"],
): ParsedIngredient {
  const normalized = normalize(raw);

  if (!matched) {
    return {
      raw,
      normalized,
      matchedId: null,
      displayName: raw,
      rank: Math.max(1, rank),
      confidence,
      molecularWeight: UNKNOWN_DEFAULT_MW,
      irritationPotential: inferUnknownIrritation(raw),
      effect: ZERO_EFFECT,
      tags: [],
    };
  }

  return {
    raw,
    normalized,
    matchedId: matched.id,
    displayName: matched.displayName,
    rank: Math.max(1, rank),
    confidence,
    molecularWeight: matched.molecularWeight,
    irritationPotential: matched.irritationPotential,
    effect: matched.effect,
    tags: matched.tags,
  };
}

export function parseIngredientText(input: string): ParsedIngredient[] {
  return splitIngredients(input).map((raw, index) => {
    const normalized = normalize(raw);
    const rank = index + 1;
    const exact = ingredientMaster.find((item) => item.displayName === raw);
    if (exact) {
      return buildParsedIngredient(raw, rank, exact, "exact");
    }

    const alias = ingredientMaster.find((item) => item.aliases.some((name) => normalize(name) === normalized));
    if (alias) {
      return buildParsedIngredient(raw, rank, alias, "alias");
    }

    const guessed = guessMatch(normalized);
    if (guessed) {
      return buildParsedIngredient(raw, rank, guessed, "guessed");
    }

    return buildParsedIngredient(raw, rank, null, "unknown");
  });
}
