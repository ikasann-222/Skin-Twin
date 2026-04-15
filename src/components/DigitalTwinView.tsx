import type { TwinVisualState } from "../types";
import { barrierText } from "../utils/format";
import { blurLevel, drynessCrack, noiseLevel, rednessGlow, swayLevel, twinPalette } from "../services/twinRenderer";

type Props = {
  title: string;
  subtitle: string;
  state: TwinVisualState;
  imageDataUrl?: string;
};

export function DigitalTwinView({ title, subtitle, state, imageDataUrl }: Props) {
  const palette = twinPalette(state);
  const noise = noiseLevel(state);
  const sway = swayLevel(state);
  const blur = blurLevel(state);
  const redness = rednessGlow(state);
  const crack = drynessCrack(state);

  return (
    <section className="glass-panel twin-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">{title}</p>
          <h3>{subtitle}</h3>
        </div>
        <div className="micro-badge">抽象ツイン</div>
      </div>

      <div className="twin-stage">
        <div
          className="twin-orb"
          style={
            {
              "--twin-core": palette.core,
              "--twin-bloom": palette.bloom,
              "--twin-flare": palette.flare,
              "--twin-noise": `${noise}%`,
              "--twin-sway": `${sway}s`,
              "--twin-blur": `${blur}px`,
              "--twin-redness": redness,
              "--twin-crack": crack,
            } as React.CSSProperties
          }
        >
          <div className="twin-outline" />
          <div className="twin-glow" />
          <div className="twin-surface" />
          <div className="twin-state-overlay" />
          <div className="twin-noise" />
        </div>
      </div>

      <div className="twin-state-copy">
        <p className="tiny-note">これは顔写真そのものではなく、肌状態を抽象化したデジタルツインです。</p>
        <div className="metric-chip-row">
          <span className="metric-chip">{barrierText(state.barrier)}</span>
          <span className="metric-chip">{state.rednessLevel >= 55 ? "赤み強め" : "赤みおだやか"}</span>
          <span className="metric-chip">{state.drynessLevel >= 55 ? "乾燥強め" : "水分バランス安定"}</span>
        </div>
      </div>

      {imageDataUrl ? (
        <div className="reference-row">
          <img src={imageDataUrl} alt="肌スキャン" className="twin-reference-thumb" />
          <p className="tiny-note">右の写真は参照用、上の球体は状態を見せるための抽象表示です。</p>
        </div>
      ) : null}

      <div className="metric-chip-row">
        <span className="metric-chip">Redness {state.rednessLevel}</span>
        <span className="metric-chip">Dryness {state.drynessLevel}</span>
        <span className="metric-chip">Pores {state.poresLevel}</span>
        <span className="metric-chip">Tone {state.toneUnevenLevel}</span>
      </div>
    </section>
  );
}
