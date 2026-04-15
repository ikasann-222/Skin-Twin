import { createWorker } from "tesseract.js";
import { ingredientMaster } from "../data/ingredients";

function normalizeIngredientText(rawText: string) {
  return rawText
    .replace(/[()\[\]{}]/g, " ")
    .replace(/[：:]/g, " ")
    .replace(/全成分表示|成分表示|配合成分|ingredients?/gi, " ")
    .replace(/[・]/g, "、")
    .replace(/\s+/g, " ")
    .replace(/[,，]/g, "、")
    .trim();
}

function compact(text: string) {
  return text.toLowerCase().replace(/[\s、，,.\-_/]/g, "");
}

function extractKnownIngredients(text: string) {
  const normalizedText = normalizeIngredientText(text);
  const compactText = compact(normalizedText);
  const matched = new Map<string, string>();

  ingredientMaster.forEach((item) => {
    const candidates = [item.displayName, ...item.aliases];
    const isMatch = candidates.some((candidate) => {
      const normalizedCandidate = candidate.toLowerCase();
      return normalizedText.toLowerCase().includes(normalizedCandidate) || compactText.includes(compact(candidate));
    });

    if (isMatch) {
      matched.set(item.id, item.displayName);
    }
  });

  return Array.from(matched.values());
}

export async function extractIngredientsFromImage(image: File) {
  const worker = await createWorker("jpn+eng");

  try {
    const result = await worker.recognize(image);
    const normalized = normalizeIngredientText(result.data.text);
    const knownIngredients = extractKnownIngredients(normalized);

    if (knownIngredients.length >= 2) {
      return knownIngredients.join("、");
    }

    return normalized;
  } finally {
    await worker.terminate();
  }
}
