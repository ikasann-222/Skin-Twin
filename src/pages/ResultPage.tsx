import { SkinPhotoPreview } from "../components/SkinPhotoPreview";
import { TwinComparisonView } from "../components/TwinComparisonView";
import { TwinFutureView } from "../components/TwinFutureView";
import { toTwinVisualState } from "../services/twinRenderer";
import type { SimulationResult, SkinMetrics, SkinScan } from "../types";
import { formatDateTime, labelText } from "../utils/format";

type Props = {
  result: SimulationResult | null;
  skinScan: SkinScan | null;
};

const VISUAL_MIN = {
  rednessLevel: 6,
  drynessLevel: 8,
  poresLevel: 6,
  toneUnevenLevel: 6,
} as const;

function normalizeVisualMetrics(metrics: SkinMetrics): SkinMetrics {
  return {
    rednessLevel: Math.max(VISUAL_MIN.rednessLevel, metrics.rednessLevel),
    drynessLevel: Math.max(VISUAL_MIN.drynessLevel, metrics.drynessLevel),
    poresLevel: Math.max(VISUAL_MIN.poresLevel, metrics.poresLevel),
    toneUnevenLevel: Math.max(VISUAL_MIN.toneUnevenLevel, metrics.toneUnevenLevel),
    barrier: metrics.barrier,
  };
}

function blendMetrics(from: SkinMetrics, to: SkinMetrics, ratio: number): SkinMetrics {
  return {
    rednessLevel: Math.round(from.rednessLevel + (to.rednessLevel - from.rednessLevel) * ratio),
    drynessLevel: Math.round(from.drynessLevel + (to.drynessLevel - from.drynessLevel) * ratio),
    poresLevel: Math.round(from.poresLevel + (to.poresLevel - from.poresLevel) * ratio),
    toneUnevenLevel: Math.round(from.toneUnevenLevel + (to.toneUnevenLevel - from.toneUnevenLevel) * ratio),
    barrier: ratio < 0.5 ? from.barrier : to.barrier,
  };
}

function visualMetricsForScore(base: SkinMetrics, target: SkinMetrics, score: number, futureWeight = 1) {
  const scoreBias = (score - 50) / 50;
  const improvementBoost = Math.max(0, scoreBias) * 12 * futureWeight;
  const deteriorationBoost = Math.max(0, -scoreBias) * 12 * futureWeight;
  const shouldForceImprovement = score >= 70;
  const shouldPreferImprovement = score >= 60;

  return normalizeVisualMetrics({
    rednessLevel:
      shouldForceImprovement
        ? Math.min(base.rednessLevel, Math.max(0, Math.round(target.rednessLevel - improvementBoost - 6)))
        : shouldPreferImprovement
        ? Math.min(base.rednessLevel, Math.max(0, Math.round(target.rednessLevel - improvementBoost)))
        : Math.max(base.rednessLevel, Math.min(100, Math.round(target.rednessLevel + deteriorationBoost))),
    drynessLevel:
      shouldForceImprovement
        ? Math.min(base.drynessLevel, Math.max(0, Math.round(target.drynessLevel - improvementBoost - 6)))
        : shouldPreferImprovement
        ? Math.min(base.drynessLevel, Math.max(0, Math.round(target.drynessLevel - improvementBoost)))
        : Math.max(base.drynessLevel, Math.min(100, Math.round(target.drynessLevel + deteriorationBoost))),
    poresLevel:
      shouldForceImprovement
        ? Math.min(base.poresLevel, Math.max(0, Math.round(target.poresLevel - improvementBoost * 0.6 - 3)))
        : score >= 80
        ? Math.min(base.poresLevel, Math.max(0, Math.round(target.poresLevel - improvementBoost * 0.7)))
        : shouldPreferImprovement
          ? Math.min(base.poresLevel + 2, Math.max(0, Math.round(target.poresLevel - improvementBoost * 0.35)))
          : Math.max(base.poresLevel, Math.min(100, Math.round(target.poresLevel + deteriorationBoost * 0.4))),
    toneUnevenLevel:
      shouldForceImprovement
        ? Math.min(base.toneUnevenLevel, Math.max(0, Math.round(target.toneUnevenLevel - improvementBoost - 5)))
        : shouldPreferImprovement
        ? Math.min(base.toneUnevenLevel, Math.max(0, Math.round(target.toneUnevenLevel - improvementBoost)))
        : Math.max(base.toneUnevenLevel, Math.min(100, Math.round(target.toneUnevenLevel + deteriorationBoost))),
    barrier: target.barrier,
  });
}

function emphasizeFutureStep(base: SkinMetrics, target: SkinMetrics, multiplier: number): SkinMetrics {
  return normalizeVisualMetrics({
    rednessLevel: Math.max(0, Math.min(100, Math.round(base.rednessLevel + (target.rednessLevel - base.rednessLevel) * multiplier))),
    drynessLevel: Math.max(0, Math.min(100, Math.round(base.drynessLevel + (target.drynessLevel - base.drynessLevel) * multiplier))),
    poresLevel: Math.max(0, Math.min(100, Math.round(base.poresLevel + (target.poresLevel - base.poresLevel) * multiplier))),
    toneUnevenLevel: Math.max(
      0,
      Math.min(100, Math.round(base.toneUnevenLevel + (target.toneUnevenLevel - base.toneUnevenLevel) * multiplier)),
    ),
    barrier: target.barrier,
  });
}

export function ResultPage({ result, skinScan }: Props) {
  if (!result || !skinScan) {
    return (
      <div className="page-stack result-page-shell">
        <section className="glass-panel">
          <p className="section-kicker">Simulation Result</p>
          <h2>まだシミュレーションがありません</h2>
          <p className="lead compact">商品を登録して、あなたの肌の分身に試してみてください。</p>
        </section>
      </div>
    );
  }

  const afterVisualMetrics = visualMetricsForScore(result.beforeMetrics, result.afterMetrics, result.score, 0.8);
  const futureBaseMetrics = visualMetricsForScore(afterVisualMetrics, result.futureMetrics, result.futureImpactScore, 1.05);
  const futureVisualMetrics = emphasizeFutureStep(afterVisualMetrics, futureBaseMetrics, 0.82);
  const yearOneMetrics = emphasizeFutureStep(afterVisualMetrics, futureVisualMetrics, 0.42);

  return (
    <div className="page-stack result-page-shell">
      <section className="glass-panel">
        <div className="section-head">
          <div>
            <p className="section-kicker">Simulation Result</p>
            <h2>{result.productName}</h2>
          </div>
          <div className={`score-pill ${result.label}`}>{result.score}</div>
        </div>
        <p className="lead compact">判定: {labelText(result.label)} / 実行日時 {formatDateTime(result.createdAt)}</p>
        <p className="lead compact">{result.reason}</p>
        <div className="stat-grid">
          <div className="stat-card">
            <span>Short term risk</span>
            <strong>{result.shortTermRisk}</strong>
          </div>
          <div className="stat-card">
            <span>Long term risk</span>
            <strong>{result.longTermRisk}</strong>
          </div>
          <div className="stat-card">
            <span>Future impact</span>
            <strong>{result.futureImpactScore}</strong>
          </div>
        </div>
        <div className="reason-list">
          {result.reasons.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </div>
        <p className="tiny-note">医療診断ではなく、登録情報と成分傾向から推定した参考シミュレーションです。</p>
      </section>

      <section className="glass-panel">
        <p className="section-kicker">Photo Based Preview</p>
        <h3>実際の顔写真でみる肌の予想</h3>
        <p className="lead compact">
          登録した写真をもとに、赤み・乾燥・色むら・不安定さの変化を重ねて表示します。精密診断ではなく、見た目の未来プレビューです。
        </p>
      </section>

      <div className="comparison-grid">
        <SkinPhotoPreview
          title="Before"
          subtitle="いまの肌写真"
          imageDataUrl={skinScan.imageDataUrl}
          metrics={result.beforeMetrics}
          mode="raw"
        />
        <SkinPhotoPreview
          title="After"
          subtitle="使った直後の写真予想"
          imageDataUrl={skinScan.imageDataUrl}
          metrics={afterVisualMetrics}
        />
      </div>

      <TwinComparisonView
        before={toTwinVisualState(result.beforeMetrics)}
        after={toTwinVisualState(result.afterMetrics)}
        imageDataUrl={skinScan.imageDataUrl}
      />

      <section className="glass-panel">
        <p className="section-kicker">3 Year Simulation</p>
        <h3>数年後の予想</h3>
        <p className="lead compact">
          グラフではなく、分身の質感とゆらぎの変化で未来を表現しています。下にいくほど先の時間です。
        </p>
      </section>

      <div className="future-grid">
        <SkinPhotoPreview
          title="Now"
          subtitle="現在の写真"
          imageDataUrl={skinScan.imageDataUrl}
          metrics={result.beforeMetrics}
          mode="raw"
        />
        <SkinPhotoPreview
          title="1 Year"
          subtitle="1年後の写真予想"
          imageDataUrl={skinScan.imageDataUrl}
          metrics={yearOneMetrics}
        />
        <SkinPhotoPreview
          title="3 Years"
          subtitle="3年後の写真予想"
          imageDataUrl={skinScan.imageDataUrl}
          metrics={futureVisualMetrics}
        />
      </div>

      <TwinFutureView
        current={toTwinVisualState(result.afterMetrics)}
        future={toTwinVisualState(result.futureMetrics)}
        imageDataUrl={skinScan.imageDataUrl}
      />
    </div>
  );
}
