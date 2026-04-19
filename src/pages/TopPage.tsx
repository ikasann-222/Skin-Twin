type Props = {
  onStart: () => void;
};

export function TopPage({ onStart }: Props) {
  return (
    <div className="top-page-shell">
      <div className="top-page-gradient" />
      <div className="top-page-grain" />
      <section className="top-hero-panel">
        <div className="top-brand-row">
          <p className="top-brand-mark">Skin Twin</p>
        </div>

        <div className="top-hero-copy">
          <h1 className="top-hero-title">Skin Twin</h1>
          <p className="top-hero-tagline">あなたの肌の双子が、待っています。</p>
        </div>

        <button type="button" className="top-hero-button" onClick={onStart}>
          はじめる
        </button>
      </section>
    </div>
  );
}
