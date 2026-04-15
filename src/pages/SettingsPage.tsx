type Props = {
  onReset: () => void;
};

export function SettingsPage({ onReset }: Props) {
  return (
    <div className="page-stack">
      <section className="glass-panel">
        <p className="section-kicker">Settings</p>
        <h2>設定と免責</h2>
        <div className="reason-list">
          <p>このアプリは医療診断ではありません。</p>
          <p>結果は肌プロフィール、生活習慣、画像メモ、成分傾向をもとにした参考情報です。</p>
          <p>保存データはこのブラウザの LocalStorage のみを利用します。</p>
        </div>
        <button type="button" className="danger-button" onClick={onReset}>
          保存データをリセット
        </button>
      </section>
    </div>
  );
}
