import type { ProductCategory, ProductResearchHint, UsageFrequency } from "../types";

type ProductRule = {
  keywords: string[];
  category: ProductCategory | null;
  frequency: UsageFrequency | null;
  ingredients: string[];
  notes: string[];
};

const rules: ProductRule[] = [
  {
    keywords: ["化粧水", "lotion", "toner"],
    category: "lotion",
    frequency: "daily",
    ingredients: ["水", "グリセリン", "BG", "ヒアルロン酸Na"],
    notes: ["化粧水系として推定しました。まずは保湿成分が入っているか確認するのがおすすめです。"],
  },
  {
    keywords: ["乳液", "ミルク", "emulsion"],
    category: "cream",
    frequency: "daily",
    ingredients: ["水", "グリセリン", "スクワラン", "セラミド"],
    notes: ["乳液やミルク系の可能性があります。油分と保湿のバランスを見ると入力しやすいです。"],
  },
  {
    keywords: ["美容液", "serum", "essence"],
    category: "serum",
    frequency: "daily",
    ingredients: ["ナイアシンアミド", "ヒアルロン酸Na", "ビタミンC誘導体"],
    notes: ["美容液として推定しました。訴求成分が商品名に入っていることが多いです。"],
  },
  {
    keywords: ["クリーム", "cream", "balm"],
    category: "cream",
    frequency: "daily",
    ingredients: ["セラミド", "スクワラン", "ワセリン"],
    notes: ["クリーム系として推定しました。バリア保護系の成分を優先確認すると早いです。"],
  },
  {
    keywords: ["日焼け止め", "uv", "spf", "sunscreen"],
    category: "sunscreen",
    frequency: "daily",
    ingredients: ["酸化亜鉛", "グリセリン", "水"],
    notes: ["UVケア系として推定しました。紫外線散乱剤や保湿剤が含まれることがあります。"],
  },
  {
    keywords: ["レチノール", "retinol"],
    category: "serum",
    frequency: "alternate-days",
    ingredients: ["レチノール", "グリセリン", "セラミド"],
    notes: ["レチノール系の可能性があります。頻度は毎日より少なめから始める想定が安全です。"],
  },
  {
    keywords: ["cica", "シカ", "ティーツリー"],
    category: "serum",
    frequency: "daily",
    ingredients: ["ティーツリー", "グリセリン", "BG"],
    notes: ["鎮静訴求の可能性があります。敏感肌向けでも香料やアルコールは別途確認したいです。"],
  },
  {
    keywords: ["ピーリング", "salicylic", "bha", "aha"],
    category: "spot-care",
    frequency: "weekly",
    ingredients: ["サリチル酸", "乳酸", "グリセリン"],
    notes: ["角質ケア系として推定しました。使用頻度は低めからの想定にしています。"],
  },
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export function researchProduct(name: string, brand: string): ProductResearchHint | null {
  const haystack = normalize(`${brand} ${name}`);
  if (!haystack) {
    return null;
  }

  const matchedRules = rules.filter((rule) => rule.keywords.some((keyword) => haystack.includes(normalize(keyword))));
  if (matchedRules.length === 0) {
    return null;
  }

  const matchedKeywords = matchedRules.flatMap((rule) => rule.keywords.filter((keyword) => haystack.includes(normalize(keyword))));
  const suggestedIngredients = Array.from(new Set(matchedRules.flatMap((rule) => rule.ingredients)));
  const notes = Array.from(new Set(matchedRules.flatMap((rule) => rule.notes)));

  return {
    title: "商品名からの推定ヒント",
    matchedKeywords: Array.from(new Set(matchedKeywords)),
    suggestedCategory: matchedRules.find((rule) => rule.category)?.category ?? null,
    suggestedFrequency: matchedRules.find((rule) => rule.frequency)?.frequency ?? null,
    suggestedIngredients,
    notes,
  };
}
