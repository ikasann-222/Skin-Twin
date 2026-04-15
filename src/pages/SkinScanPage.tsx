import { useRef, useState } from "react";
import { analyzeSkinImage } from "../services/imageAnalysis";
import { deriveBarrier } from "../services/skinProfile";
import type { SkinScan } from "../types";

type Props = {
  initialValue: SkinScan | null;
  onSave: (scan: SkinScan) => void;
};

async function optimizeImageForStorage(file: File) {
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("image-load-failed"));
      nextImage.src = sourceUrl;
    });

    const maxSide = 960;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas-context-failed");
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function SkinScanPage({ initialValue, onSave }: Props) {
  const [scan, setScan] = useState<SkinScan>(
    initialValue ?? {
      imageDataUrl: "",
      lightingMemo: "自然光・朝",
      uploadedAt: new Date().toISOString(),
      metrics: {
        rednessLevel: 40,
        drynessLevel: 46,
        poresLevel: 42,
        toneUnevenLevel: 40,
        barrier: "weakened",
      },
    },
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function setMetricLevel(metric: "rednessLevel" | "drynessLevel" | "poresLevel" | "toneUnevenLevel", value: number) {
    setScan((current) => {
      const base = {
        rednessLevel: current.metrics.rednessLevel,
        drynessLevel: current.metrics.drynessLevel,
        poresLevel: current.metrics.poresLevel,
        toneUnevenLevel: current.metrics.toneUnevenLevel,
        [metric]: value,
      };

      return {
        ...current,
        metrics: {
          ...base,
          barrier: deriveBarrier(base),
        },
      };
    });
  }

  function onFileChange(file?: File | null) {
    if (!file) return;
    setAnalysisStatus("loading");
    setAnalysisMessage("写真を軽くして保存しやすくしたあと、肌状態を自動推定しています。");

    optimizeImageForStorage(file)
      .then(async (imageDataUrl) => {
        setScan((current) => ({ ...current, imageDataUrl }));

        try {
          const metrics = await analyzeSkinImage(imageDataUrl);
          setScan((current) => ({
            ...current,
            imageDataUrl,
            metrics,
          }));
          setAnalysisStatus("done");
          setAnalysisMessage("写真から肌状態を自動推定しました。必要なら下のボタンで少しだけ補正できます。");
        } catch {
          setAnalysisStatus("error");
          setAnalysisMessage("写真の自動推定に失敗しました。別の明るい写真で試すか、下の補正ボタンを使ってください。");
        }
      })
      .catch(() => {
        setAnalysisStatus("error");
        setAnalysisMessage("画像の読み込みに失敗しました。別の写真でもう一度試してください。");
      });
  }

  return (
    <div className="page-stack">
      <section className="glass-panel">
        <p className="section-kicker">Skin Scan</p>
        <h2>肌画像を基準に現在状態を登録</h2>
        <p className="lead compact">
          写真をアップすると、ブラウザ内で肌らしい色の画素だけを拾い、頬や額を中心に赤み・乾燥・毛穴感・色むらを自動推定します。バリア状態もそこから自動で決めます。
        </p>
        <div className="scan-upload" onClick={() => fileInputRef.current?.click()} aria-hidden="true">
          {scan.imageDataUrl ? <img src={scan.imageDataUrl} alt="肌スキャン" className="scan-preview" /> : <span>タップして肌画像を追加</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={(e) => onFileChange(e.target.files?.[0])}
        />

        <div className="form-grid">
          <label className="field">
            <span>撮影メモ</span>
            <input value={scan.lightingMemo} onChange={(e) => setScan({ ...scan, lightingMemo: e.target.value })} />
          </label>

          {analysisStatus !== "idle" ? (
            <div className="field">
              <span>自動解析ステータス</span>
              <div className="auto-badge-row">
                <div className={`micro-badge ${analysisStatus === "error" ? "danger-text" : ""}`}>{analysisStatus}</div>
                <p className={`tiny-note ${analysisStatus === "error" ? "error-text" : ""}`}>{analysisMessage}</p>
              </div>
            </div>
          ) : null}

          <div className="field">
            <span>写真から推定した数値</span>
            <div className="metric-chip-row">
              <span className="metric-chip">赤み {scan.metrics.rednessLevel}</span>
              <span className="metric-chip">乾燥 {scan.metrics.drynessLevel}</span>
              <span className="metric-chip">毛穴 {scan.metrics.poresLevel}</span>
              <span className="metric-chip">色むら {scan.metrics.toneUnevenLevel}</span>
            </div>
          </div>

          <div className="field">
            <span>赤みだけ少し補正する</span>
            <div className="option-row">
              <button type="button" className={scan.metrics.rednessLevel <= 20 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("rednessLevel", 14)}>
                弱め
              </button>
              <button type="button" className={scan.metrics.rednessLevel > 20 && scan.metrics.rednessLevel <= 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("rednessLevel", 40)}>
                標準
              </button>
              <button type="button" className={scan.metrics.rednessLevel > 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("rednessLevel", 72)}>
                強め
              </button>
            </div>
          </div>

          <div className="field">
            <span>乾燥だけ少し補正する</span>
            <div className="option-row">
              <button type="button" className={scan.metrics.drynessLevel <= 20 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("drynessLevel", 18)}>
                弱め
              </button>
              <button type="button" className={scan.metrics.drynessLevel > 20 && scan.metrics.drynessLevel <= 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("drynessLevel", 46)}>
                標準
              </button>
              <button type="button" className={scan.metrics.drynessLevel > 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("drynessLevel", 74)}>
                強め
              </button>
            </div>
          </div>

          <div className="field">
            <span>毛穴だけ少し補正する</span>
            <div className="option-row">
              <button type="button" className={scan.metrics.poresLevel <= 20 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("poresLevel", 16)}>
                弱め
              </button>
              <button type="button" className={scan.metrics.poresLevel > 20 && scan.metrics.poresLevel <= 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("poresLevel", 42)}>
                標準
              </button>
              <button type="button" className={scan.metrics.poresLevel > 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("poresLevel", 70)}>
                強め
              </button>
            </div>
          </div>

          <div className="field">
            <span>色むらだけ少し補正する</span>
            <div className="option-row">
              <button type="button" className={scan.metrics.toneUnevenLevel <= 20 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("toneUnevenLevel", 16)}>
                弱め
              </button>
              <button type="button" className={scan.metrics.toneUnevenLevel > 20 && scan.metrics.toneUnevenLevel <= 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("toneUnevenLevel", 40)}>
                標準
              </button>
              <button type="button" className={scan.metrics.toneUnevenLevel > 50 ? "option-pill active" : "option-pill"} onClick={() => setMetricLevel("toneUnevenLevel", 68)}>
                強め
              </button>
            </div>
          </div>

          <div className="field">
            <span>自動推定バリア状態</span>
            <div className="auto-badge-row">
              <div className="micro-badge">{scan.metrics.barrier}</div>
              <p className="tiny-note">赤み・乾燥・色むらの見え方から自動で推定しています。</p>
            </div>
          </div>
        </div>

        <p className="tiny-note">
          ここで出している数値は医療的な真値ではなく、写真から推定した肌状態の近似値です。
        </p>

        <div className="action-safe-zone">
          <button
            type="button"
            className="primary-button action-primary"
            disabled={isSaving}
            onClick={() => {
              setIsSaving(true);
              onSave({ ...scan, uploadedAt: new Date().toISOString() });
              window.location.hash = "dashboard";
              window.setTimeout(() => {
                setIsSaving(false);
              }, 1200);
            }}
          >
            {isSaving ? "保存中..." : "保存してダッシュボードへ"}
          </button>
        </div>
      </section>
    </div>
  );
}
