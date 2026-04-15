import type { SimulationResult } from "../types";
import { formatDateTime } from "../utils/format";

type Props = {
  results: SimulationResult[];
  onSelect: (id: string) => void;
};

export function HistoryPage({ results, onSelect }: Props) {
  return (
    <div className="page-stack">
      <section className="glass-panel">
        <p className="section-kicker">History</p>
        <h2>履歴保存</h2>
        <div className="history-list">
          {results.length === 0 ? <p className="empty-copy">まだ保存された結果はありません。</p> : null}
          {results.map((result) => (
            <button key={result.id} type="button" className="history-row" onClick={() => onSelect(result.id)}>
              <div>
                <strong>{result.productName}</strong>
                <p>{formatDateTime(result.createdAt)}</p>
              </div>
              <div className={`score-pill ${result.label}`}>{result.label}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
