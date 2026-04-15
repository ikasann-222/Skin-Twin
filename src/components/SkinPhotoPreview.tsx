import type { SkinMetrics } from "../types";

type Props = {
  title: string;
  subtitle: string;
  imageDataUrl: string;
  metrics: SkinMetrics;
  mode?: "raw" | "simulated";
};

function photoStyle(metrics: SkinMetrics) {
  const brightness = 1.02 + Math.max(0, 34 - metrics.toneUnevenLevel) / 260;
  const saturate = 1 - metrics.drynessLevel / 520;
  const contrast = 1 + metrics.poresLevel / 260;
  const blur = Math.max(0, metrics.drynessLevel - 44) / 80;
  const sepia = metrics.toneUnevenLevel / 700;

  return {
    filter: `brightness(${brightness}) saturate(${saturate}) contrast(${contrast}) sepia(${sepia}) blur(${blur}px)`,
  } as React.CSSProperties;
}

function overlayStyle(metrics: SkinMetrics) {
  const redness = metrics.rednessLevel / 100;
  const dryness = metrics.drynessLevel / 100;
  const tone = metrics.toneUnevenLevel / 100;
  const pores = metrics.poresLevel / 100;

  return {
    "--photo-redness": `${redness * 0.24}`,
    "--photo-dryness": `${dryness * 0.18}`,
    "--photo-tone": `${tone * 0.14}`,
    "--photo-pores": `${pores * 0.12}`,
  } as React.CSSProperties;
}

export function SkinPhotoPreview({ title, subtitle, imageDataUrl, metrics, mode = "simulated" }: Props) {
  return renderPreview({ title, subtitle, imageDataUrl, metrics, mode });
}

export function renderPreview({ title, subtitle, imageDataUrl, metrics, mode = "simulated" }: Props) {
  const isRaw = mode === "raw";

  return (
    <section className="glass-panel photo-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">{title}</p>
          <h3>{subtitle}</h3>
        </div>
      </div>
      <div className={isRaw ? "photo-preview-frame raw" : "photo-preview-frame"} style={isRaw ? undefined : overlayStyle(metrics)}>
        <img
          src={imageDataUrl}
          alt={subtitle}
          className="photo-preview-image"
          style={isRaw ? undefined : photoStyle(metrics)}
        />
        {isRaw ? null : <div className="photo-preview-overlay" />}
      </div>
      <div className="metric-chip-row">
        <span className="metric-chip">赤み {metrics.rednessLevel}</span>
        <span className="metric-chip">乾燥 {metrics.drynessLevel}</span>
        <span className="metric-chip">毛穴 {metrics.poresLevel}</span>
        <span className="metric-chip">色むら {metrics.toneUnevenLevel}</span>
      </div>
    </section>
  );
}
