import type { Product, SimulationResult, SkinScan, UserProfile } from "../types";

const KEYS = {
  profile: "user_profile_v2",
  scan: "skin_scan_v2",
  products: "products_v2",
  results: "simulation_results_v2",
} as const;

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadProfile() {
  return readJson<UserProfile | null>(KEYS.profile, null);
}

export function saveProfile(profile: UserProfile) {
  writeJson(KEYS.profile, profile);
}

export function loadSkinScan() {
  return readJson<SkinScan | null>(KEYS.scan, null);
}

export function saveSkinScan(scan: SkinScan) {
  writeJson(KEYS.scan, scan);
}

export function loadProducts() {
  return readJson<Product[]>(KEYS.products, []);
}

export function saveProducts(products: Product[]) {
  writeJson(KEYS.products, products);
}

export function loadSimulationResults() {
  return readJson<SimulationResult[]>(KEYS.results, []);
}

export function saveSimulationResults(results: SimulationResult[]) {
  writeJson(KEYS.results, results);
}

export function clearAllStorage() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
