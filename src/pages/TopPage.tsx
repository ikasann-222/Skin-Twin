type Props = {
  onStart: () => void;
};

export function TopPage({ onStart }: Props) {
  return (
    <div className="page-stack hero-layout">
      <section className="hero-block">
        <p className="eyebrow">Skin Twin</p>
        <h1>Skin Twin</h1>
        <p className="lead">
          写真で見る今の肌、過去に苦手だった成分、そして今使っている一本。Skin Twin はその3点から、あなたの肌との相性を見ます。
        </p>
        <button type="button" className="primary-button" onClick={onStart}>
          はじめる
        </button>
      </section>

      <section className="glass-panel">
        <div className="feature-list">
          <div>
            <p className="section-kicker">Twin</p>
            <strong>自分の肌の分身</strong>
          </div>
          <div>
            <p className="section-kicker">Experiment</p>
            <strong>購入前に仮想テスト</strong>
          </div>
          <div>
            <p className="section-kicker">Future</p>
            <strong>3年後を見た目で可視化</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
