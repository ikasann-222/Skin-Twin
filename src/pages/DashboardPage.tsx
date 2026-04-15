import type { SimulationResult, SkinScan, UserProfile } from "../types";
import { assessCurrentProduct } from "../services/currentProductAssessment";
import { DigitalTwinView } from "../components/DigitalTwinView";
import { inferSkinType } from "../services/skinProfile";
import { toTwinVisualState } from "../services/twinRenderer";
import { formatDateTime, skinTypeText } from "../utils/format";

type Props = {
  profile: UserProfile;
  skinScan: SkinScan;
  latestResult: SimulationResult | null;
  onGoProfile: () => void;
  onGoScan: () => void;
  onGoProduct: () => void;
};

export function DashboardPage({ profile, skinScan, latestResult, onGoProfile, onGoScan, onGoProduct }: Props) {
  const estimatedSkinType = inferSkinType(skinScan.metrics);
  const currentProductAssessment = assessCurrentProduct(profile, skinScan.metrics);

  return (
    <div className="page-stack">
      <section className="glass-panel overview-card">
        <p className="section-kicker">Dashboard</p>
        <h2>{profile.name || "Your"} Digital Twin</h2>
        <p className="lead compact">
          写真推定: {skinTypeText(estimatedSkinType)} / {profile.ageRange} / 最終更新 {formatDateTime(profile.updatedAt)}
        </p>
      </section>

      <DigitalTwinView
        title="Current Twin"
        subtitle="いまの肌の分身"
        state={toTwinVisualState(skinScan.metrics)}
        imageDataUrl={skinScan.imageDataUrl}
      />

      <section className="glass-panel quick-grid">
        <button type="button" className="secondary-button" onClick={onGoProfile}>
          3つの情報を編集
        </button>
        <button type="button" className="secondary-button" onClick={onGoScan}>
          肌画像を更新
        </button>
        <button type="button" className="primary-button" onClick={onGoProduct}>
          化粧品を登録して試す
        </button>
      </section>

      <section className="glass-panel">
        <div className="section-head">
          <div>
            <p className="section-kicker">Current Match</p>
            <h3>{profile.currentProductName || "メイン化粧品名を入れると判定できます"}</h3>
          </div>
          {currentProductAssessment ? (
            <div className={`score-pill ${currentProductAssessment.label}`}>{currentProductAssessment.label}</div>
          ) : null}
        </div>
        {currentProductAssessment ? (
          <>
            <p className="lead compact">相性スコア {currentProductAssessment.score}</p>
            <div className="reason-list">
              {currentProductAssessment.reasons.map((reason) => (
                <p key={reason}>{reason}</p>
              ))}
            </div>
            {currentProductAssessment.inferredSignals.length > 0 ? (
              <div className="metric-chip-row">
                {currentProductAssessment.inferredSignals.map((signal) => (
                  <span key={signal} className="metric-chip">
                    {signal}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="lead compact">プロフィールで「現在使っているメインの化粧品名」を入れると、この一本の相性を見られます。</p>
        )}
      </section>

      {latestResult ? (
        <section className="glass-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Latest Simulation</p>
              <h3>{latestResult.productName}</h3>
            </div>
            <div className={`score-pill ${latestResult.label}`}>{latestResult.label}</div>
          </div>
          <p className="lead compact">直近の未来インパクト {latestResult.futureImpactScore}</p>
          <div className="reason-list">
            {latestResult.reasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
