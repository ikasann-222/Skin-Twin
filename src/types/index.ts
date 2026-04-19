export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";

export type BarrierState = "strong" | "stable" | "weakened" | "fragile";

export type ProductCategory = "cleanser" | "lotion" | "serum" | "cream" | "sunscreen" | "spot-care";

export type UsageFrequency = "daily" | "alternate-days" | "weekly" | "spot";

export type HabitProfile = {
  sleepHours: number;
  stressLevel: number;
  waterIntakeLevel: number;
  uvExposureLevel: number;
};

export type SkinMetrics = {
  rednessLevel: number;
  drynessLevel: number;
  poresLevel: number;
  toneUnevenLevel: number;
  barrier: BarrierState;
};

export type UserProfile = {
  name: string;
  ageRange: string;
  skinType: SkinType;
  sensitivities: string[];
  concerns: string[];
  currentProductName: string;
  habits: HabitProfile;
  notes: string;
  updatedAt: string;
};

export type SkinScan = {
  imageDataUrl: string;
  lightingMemo: string;
  uploadedAt: string;
  metrics: SkinMetrics;
};

export type IngredientEffect = {
  hydration: number;
  barrierSupport: number;
  irritation: number;
  acneRisk: number;
  rednessRisk: number;
  brightening: number;
};

export type IngredientMasterItem = {
  id: string;
  displayName: string;
  aliases: string[];
  molecularWeight: number;
  irritationPotential: number;
  source?: string;
  effect: IngredientEffect;
  tags: string[];
};

export type ParsedIngredient = {
  raw: string;
  normalized: string;
  matchedId: string | null;
  displayName: string;
  rank: number;
  confidence: "exact" | "alias" | "guessed" | "unknown";
  molecularWeight: number | null;
  irritationPotential: number;
  source?: string;
  effect: IngredientEffect;
  tags: string[];
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  usageFrequency: UsageFrequency;
  ingredientText: string;
  parsedIngredients: ParsedIngredient[];
  memo: string;
  createdAt: string;
};

export type ProductResearchHint = {
  title: string;
  matchedKeywords: string[];
  suggestedCategory: ProductCategory | null;
  suggestedFrequency: UsageFrequency | null;
  suggestedIngredients: string[];
  notes: string[];
};

export type SimulationLabel = "safe" | "caution" | "critical";

export type SimulationDebugContribution = {
  ingredient: string;
  rank: number;
  irritationPotential: number;
  molecularWeight: number | null;
  moleculeFactor: number;
  rankWeight: number;
  contribution: number;
  protective: boolean;
};

export type SimulationDebugInfo = {
  barrier: {
    sRed: number;
    sTex: number;
    kEnv: number;
    value: number;
  };
  ingredientContributions: SimulationDebugContribution[];
  combinationFlags: string[];
  estimatedPh: number;
  invasion: number;
  rawRisk: number;
};

export type SimulationResult = {
  id: string;
  productId: string;
  productName: string;
  createdAt: string;
  score: number;
  label: SimulationLabel;
  shortTermRisk: number;
  longTermRisk: number;
  futureImpactScore: number;
  summaryReason: string;
  reasons: string[];
  beforeMetrics: SkinMetrics;
  afterMetrics: SkinMetrics;
  futureMetrics: SkinMetrics;
  debugInfo?: SimulationDebugInfo;
};

export type TwinVisualState = SkinMetrics & {
  vitality: number;
};

export type AppPage =
  | "top"
  | "onboarding"
  | "profile"
  | "scan"
  | "dashboard"
  | "product"
  | "result"
  | "history"
  | "settings";

export type AppState = {
  profile: UserProfile | null;
  skinScan: SkinScan | null;
  products: Product[];
  simulationResults: SimulationResult[];
};
