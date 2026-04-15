import type { SkinMetrics } from "../types";
import { clamp } from "../utils/format";
import { deriveBarrier } from "./skinProfile";

type SampleZone = {
  x: number;
  y: number;
  width: number;
  height: number;
  weight: number;
};

type SkinPixelSample = {
  luma: number;
  redness: number;
  warmth: number;
  saturation: number;
};

type ZoneResult = {
  averageLuma: number;
  averageRedness: number;
  averageWarmth: number;
  averageSaturation: number;
  toneVariance: number;
  texture: number;
  weight: number;
  sampleCount: number;
};

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function rgbToYCbCr(r: number, g: number, b: number) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

function rgbSaturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function isLikelySkin(r: number, g: number, b: number) {
  const { y, cb, cr } = rgbToYCbCr(r, g, b);
  const saturation = rgbSaturation(r, g, b);

  const skinRange = cb >= 80 && cb <= 135 && cr >= 132 && cr <= 180;
  const brightnessRange = y >= 35 && y <= 235;
  const rgbOrder = r > g && r > b && r - g >= 4;
  const notTooSaturated = saturation <= 0.68;

  return skinRange && brightnessRange && rgbOrder && notTooSaturated;
}

function getZones(width: number, height: number): SampleZone[] {
  return [
    { x: width * 0.2, y: height * 0.28, width: width * 0.22, height: height * 0.2, weight: 1.2 },
    { x: width * 0.58, y: height * 0.28, width: width * 0.22, height: height * 0.2, weight: 1.2 },
    { x: width * 0.36, y: height * 0.16, width: width * 0.28, height: height * 0.14, weight: 0.9 },
    { x: width * 0.34, y: height * 0.5, width: width * 0.32, height: height * 0.16, weight: 0.7 },
  ];
}

function sampleZone(context: CanvasRenderingContext2D, zone: SampleZone) {
  const x = Math.max(0, Math.round(zone.x));
  const y = Math.max(0, Math.round(zone.y));
  const width = Math.max(1, Math.round(zone.width));
  const height = Math.max(1, Math.round(zone.height));
  const pixels = context.getImageData(x, y, width, height).data;

  const samples: SkinPixelSample[] = [];
  let totalTexture = 0;
  let prevLuma = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index] ?? 0;
    const g = pixels[index + 1] ?? 0;
    const b = pixels[index + 2] ?? 0;

    if (!isLikelySkin(r, g, b)) {
      continue;
    }

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const redness = (r - g) + (r - b) * 0.35;
    const warmth = r - b;
    const saturation = rgbSaturation(r, g, b);

    samples.push({ luma, redness, warmth, saturation });
    totalTexture += Math.abs(luma - prevLuma);
    prevLuma = luma;
  }

  if (samples.length === 0) {
    return null;
  }

  const averageLuma = samples.reduce((sum, sample) => sum + sample.luma, 0) / samples.length;
  const averageRedness = samples.reduce((sum, sample) => sum + sample.redness, 0) / samples.length;
  const averageWarmth = samples.reduce((sum, sample) => sum + sample.warmth, 0) / samples.length;
  const averageSaturation = samples.reduce((sum, sample) => sum + sample.saturation, 0) / samples.length;
  const toneVariance =
    samples.reduce((sum, sample) => sum + Math.abs(sample.luma - averageLuma), 0) / samples.length;

  return {
    averageLuma,
    averageRedness,
    averageWarmth,
    averageSaturation,
    toneVariance,
    texture: totalTexture / samples.length,
    weight: zone.weight,
    sampleCount: samples.length,
  };
}

function isZoneResult(value: ZoneResult | null): value is ZoneResult {
  return value !== null;
}

export async function analyzeSkinImage(dataUrl: string): Promise<SkinMetrics> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable");
  }

  const width = 220;
  const height = Math.max(220, Math.round((image.height / image.width) * width));
  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const zones = getZones(width, height);
  const zoneResults = zones.map((zone) => sampleZone(context, zone)).filter(isZoneResult);

  if (zoneResults.length === 0) {
    throw new Error("No skin-like region detected");
  }

  const weightedTotal = zoneResults.reduce((sum, zone) => sum + zone.weight, 0);
  const weightedAverage = (picker: (zone: ZoneResult) => number) =>
    zoneResults.reduce((sum, zone) => sum + picker(zone) * zone.weight, 0) / weightedTotal;

  const averageLuma = weightedAverage((zone) => zone.averageLuma);
  const averageRedness = weightedAverage((zone) => zone.averageRedness);
  const averageWarmth = weightedAverage((zone) => zone.averageWarmth);
  const averageSaturation = weightedAverage((zone) => zone.averageSaturation);
  const averageToneVariance = weightedAverage((zone) => zone.toneVariance);
  const averageTexture = weightedAverage((zone) => zone.texture);

  const crossZoneLumaVariance =
    zoneResults.reduce((sum, zone) => sum + Math.abs(zone.averageLuma - averageLuma), 0) / zoneResults.length;
  const crossZoneRednessVariance =
    zoneResults.reduce((sum, zone) => sum + Math.abs(zone.averageRedness - averageRedness), 0) / zoneResults.length;

  const rednessLevel = clamp(
    Math.round(averageRedness * 1.45 + averageWarmth * 0.28 + crossZoneRednessVariance * 0.6),
    6,
    92,
  );

  const drynessLevel = clamp(
    Math.round((155 - averageLuma) * 0.42 + averageToneVariance * 0.85 + (0.42 - averageSaturation) * 38),
    8,
    92,
  );

  const poresLevel = clamp(
    Math.round(averageTexture * 2.1 + averageToneVariance * 0.42 + Math.max(0, averageSaturation - 0.24) * 30),
    8,
    92,
  );

  const toneUnevenLevel = clamp(
    Math.round(averageToneVariance * 1.45 + crossZoneLumaVariance * 0.9 + crossZoneRednessVariance * 0.5),
    8,
    92,
  );

  const partialMetrics = {
    rednessLevel,
    drynessLevel,
    poresLevel,
    toneUnevenLevel,
  };

  return {
    ...partialMetrics,
    barrier: deriveBarrier(partialMetrics),
  };
}
