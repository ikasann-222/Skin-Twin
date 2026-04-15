import { useMemo, useRef, useState } from "react";
import { ingredientMaster } from "../data/ingredients";
import { parseIngredientText } from "../services/ingredientParser";
import { extractIngredientsFromImage } from "../services/ocr";
import { researchProduct } from "../services/productResearch";
import type { Product } from "../types";
import { createId } from "../utils/format";

type Props = {
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onSimulate: (productId: string) => void;
  onSaveAndSimulate: (product: Product) => void;
};

export function ProductPage({ products, onSaveProduct, onSimulate, onSaveAndSimulate }: Props) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<Product["category"]>("serum");
  const [usageFrequency, setUsageFrequency] = useState<Product["usageFrequency"]>("daily");
  const [ingredientText, setIngredientText] = useState("");
  const [memo, setMemo] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ocrMessage, setOcrMessage] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parsedIngredients = useMemo(() => parseIngredientText(ingredientText), [ingredientText]);
  const researchHint = useMemo(() => researchProduct(name, brand), [name, brand]);

  function appendIngredient(nameToAdd: string) {
    setIngredientText((current) => {
      const items = current
        .split(/[、,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.includes(nameToAdd)) {
        return current;
      }

      return items.length === 0 ? nameToAdd : `${current}、${nameToAdd}`;
    });
  }

  function applyResearchHint() {
    if (!researchHint) return;

    if (researchHint.suggestedCategory) {
      setCategory(researchHint.suggestedCategory);
    }

    if (researchHint.suggestedFrequency) {
      setUsageFrequency(researchHint.suggestedFrequency);
    }

    researchHint.suggestedIngredients.forEach((ingredient) => appendIngredient(ingredient));
    if (researchHint.notes.length > 0) {
      setMemo((current) => (current.trim() ? current : researchHint.notes.join(" ")));
    }
  }

  function buildProduct() {
    const safeIngredientText = ingredientText.trim() || "水";
    const fallbackParsedIngredients = parseIngredientText(safeIngredientText);
    const safeName = name.trim() || "無題の商品";

    return {
      id: createId("product"),
      name: safeName,
      brand,
      category,
      usageFrequency,
      ingredientText: safeIngredientText,
      parsedIngredients: fallbackParsedIngredients,
      memo,
      createdAt: new Date().toISOString(),
    };
  }

  function resetDraft() {
    setName("");
    setBrand("");
    setMemo("");
    setIngredientText("");
    setOcrStatus("idle");
    setOcrMessage("");
  }

  function saveProduct() {
    const product: Product = buildProduct();
    onSaveProduct(product);
    resetDraft();
  }

  function saveAndSimulate() {
    const product: Product = buildProduct();
    onSaveAndSimulate(product);
    resetDraft();
  }

  async function handleIngredientImage(file?: File | null) {
    if (!file) return;

    setOcrStatus("loading");
    setOcrMessage("画像から成分を読み取っています。初回は少し時間がかかります。");

    try {
      const text = await extractIngredientsFromImage(file);
      if (!text) {
        setOcrStatus("error");
        setOcrMessage("文字をうまく読み取れませんでした。成分ラベルがはっきり写る画像で再度お試しください。");
        return;
      }

      setIngredientText(text);
      setOcrStatus("done");
      setOcrMessage("成分テキストを読み込みました。必要なら少し手直ししてからそのままシミュレーションできます。");
    } catch {
      setOcrStatus("error");
      setOcrMessage("読み取りに失敗しました。通信状態や画像の鮮明さをご確認ください。");
    }
  }

  async function handlePasteIngredients() {
    if (!navigator.clipboard?.readText) {
      setPasteMessage("このブラウザでは直接ペーストに対応していません。手入力か長押しメニューをお試しください。");
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setPasteMessage("クリップボードが空でした。");
        return;
      }

      setIngredientText(text.trim());
      setPasteMessage("クリップボードの成分テキストを貼り付けました。");
    } catch {
      setPasteMessage("ペーストできませんでした。ブラウザの貼り付け許可をご確認ください。");
    }
  }

  return (
    <div className="page-stack">
      <section className="glass-panel">
        <p className="section-kicker">Product Input</p>
        <h2>化粧品登録と成分補正</h2>
        <p className="lead compact">商品名と成分を入れたら、保存せずそのまま未来シミュレーションまで進めます。</p>
        <p className="tiny-note">OCRがうまく読めなくても、下の候補成分を数個タップすればそのまま試せます。</p>

        <div className="form-grid">
          <label className="field">
            <span>商品名</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="バランシングセラム" />
          </label>

          <label className="field">
            <span>ブランド</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Sample Beauty" />
          </label>

          {researchHint ? (
            <div className="hint-card">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Name Research</span>
                  <h3>{researchHint.title}</h3>
                </div>
                <button type="button" className="secondary-button" onClick={applyResearchHint}>
                  候補を反映
                </button>
              </div>
              <p className="tiny-note">一致した語: {researchHint.matchedKeywords.join(" / ")}</p>
              {researchHint.notes.map((note) => (
                <p key={note} className="tiny-note">
                  {note}
                </p>
              ))}
              <div className="chip-picker">
                {researchHint.suggestedIngredients.map((ingredient) => (
                  <button
                    key={ingredient}
                    type="button"
                    className="ingredient-chip-button"
                    onClick={() => appendIngredient(ingredient)}
                  >
                    {ingredient}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="field">
            <span>カテゴリ</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as Product["category"])}>
              <option value="cleanser">洗顔</option>
              <option value="lotion">化粧水</option>
              <option value="serum">美容液</option>
              <option value="cream">クリーム</option>
              <option value="sunscreen">日焼け止め</option>
              <option value="spot-care">ポイントケア</option>
            </select>
          </label>

          <label className="field">
            <span>使用頻度</span>
            <select value={usageFrequency} onChange={(e) => setUsageFrequency(e.target.value as Product["usageFrequency"])}>
              <option value="daily">毎日</option>
              <option value="alternate-days">1日おき</option>
              <option value="weekly">週1-2回</option>
              <option value="spot">部分使い</option>
            </select>
          </label>

          <label className="field">
            <span>全成分</span>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={handlePasteIngredients}>
                クリップボードから貼り付け
              </button>
            </div>
            <textarea
              value={ingredientText}
              onChange={(e) => setIngredientText(e.target.value)}
              placeholder="水、グリセリン、BG、ヒアルロン酸Na..."
            />
            {pasteMessage ? <p className="tiny-note">{pasteMessage}</p> : null}
          </label>

          <div className="field">
            <span>成分画像から読み取る</span>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
                成分ラベル画像を選ぶ
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={(e) => handleIngredientImage(e.target.files?.[0])}
            />
            {ocrStatus !== "idle" ? (
              <p className={`tiny-note ${ocrStatus === "error" ? "error-text" : ""}`}>{ocrMessage}</p>
            ) : (
              <p className="tiny-note">成分表示の写真を選ぶと、OCRで読み取り後に成分らしい語を優先して入力欄へ反映します。</p>
            )}
            <p className="tiny-note">丸いボトルは歪みや反射で精度が落ちやすいので、箱の裏面や公式サイトの成分表のほうが安定します。</p>
          </div>

          <label className="field">
            <span>メモ</span>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="香り強め、夜のみ使用予定 など" />
          </label>
        </div>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={saveProduct}>
            商品を保存
          </button>
          <button type="button" className="primary-button" disabled={ocrStatus === "loading"} onClick={saveAndSimulate}>
            保存してすぐシミュレーション
          </button>
        </div>
      </section>

      <section className="glass-panel">
        <div className="section-head">
          <div>
            <p className="section-kicker">Ingredient Parser</p>
            <h3>成分補正プレビュー</h3>
          </div>
          <div className="micro-badge">{ingredientMaster.length} master items</div>
        </div>
        <div className="ingredient-list">
          {parsedIngredients.map((ingredient) => (
            <div key={`${ingredient.raw}-${ingredient.displayName}`} className="ingredient-row">
              <div>
                <strong>{ingredient.displayName}</strong>
                <p>{ingredient.raw}</p>
              </div>
              <span className={`confidence-chip ${ingredient.confidence}`}>{ingredient.confidence}</span>
            </div>
          ))}
        </div>
        <div className="field">
          <span>読み取れなかったときはタップ追加</span>
          <div className="chip-picker">
            {ingredientMaster.map((ingredient) => (
              <button
                key={ingredient.id}
                type="button"
                className="ingredient-chip-button"
                onClick={() => appendIngredient(ingredient.displayName)}
              >
                {ingredient.displayName}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel">
        <p className="section-kicker">Saved Products</p>
        <h3>登録済みの化粧品</h3>
        <div className="product-list">
          {products.length === 0 ? <p className="empty-copy">まだ商品はありません。</p> : null}
          {products.map((product) => (
            <div key={product.id} className="product-row">
              <div>
                <strong>{product.name}</strong>
                <p>
                  {product.brand || "No brand"} / {product.parsedIngredients.length} ingredients
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={() => onSimulate(product.id)}>
                もう一度試す
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
