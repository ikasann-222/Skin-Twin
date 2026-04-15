type Props = {
  onComplete: () => void;
};

export function OnboardingPage({ onComplete }: Props) {
  return (
    <div className="page-stack">
      <section className="glass-panel">
        <p className="section-kicker">How It Works</p>
        <h2>3つの情報で、いまの一本をみる</h2>
        <div className="story-steps">
          <div className="story-step">
            <span>01</span>
            <p>写真から今の赤み、乾燥、毛穴感、色むらを自動で読みます。</p>
          </div>
          <div className="story-step">
            <span>02</span>
            <p>過去に苦手だった成分だけを登録して、避けたい地雷を覚えます。</p>
          </div>
          <div className="story-step">
            <span>03</span>
            <p>今使っているメイン化粧品名から、あなたの肌にどの程度合っていそうかを判断します。</p>
          </div>
        </div>
        <p className="tiny-note">医療診断ではありません。結果は購入判断の参考としてご利用ください。</p>
        <button type="button" className="primary-button" onClick={onComplete}>
          まず3つの情報を入れる
        </button>
      </section>
    </div>
  );
}
