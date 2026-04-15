# 買う前に「肌荒れ」を予知する、パーソナル美肌シミュレーター

GitHub Pages で公開できる、フロントエンドのみの美容シミュレーションアプリです。  
React + TypeScript + Vite で構成し、保存先は `LocalStorage` のみです。

このアプリの中心はスコア診断ではなく、ユーザー自身の肌情報から作る「デジタルツイン体験」です。  
化粧品を登録すると、自分の肌の分身に対して BEFORE / AFTER / 3年後の変化を見た目で観察できます。

## MVP 機能

- 肌プロフィール登録
- 肌画像登録
- 化粧品登録
- 成分入力と簡易補正
- 相性シミュレーション
- デジタルツイン表示
- BEFORE / AFTER 可視化
- 3年後シミュレーション
- 履歴保存

## 技術構成

- React 18
- TypeScript
- Vite
- GitHub Pages 対応
- Frontend only
- LocalStorage only

## 画面構成

- トップ
- オンボーディング
- 肌プロフィール登録
- 肌画像登録
- ダッシュボード
- 商品登録
- 結果
- 履歴
- 設定

## ディレクトリ構成

```text
src/
  components/
    AppShell.tsx
    BottomNav.tsx
    DigitalTwinView.tsx
    TwinComparisonView.tsx
    TwinFutureView.tsx
  data/
    ingredients.ts
  pages/
    DashboardPage.tsx
    HistoryPage.tsx
    OnboardingPage.tsx
    ProductPage.tsx
    ProfilePage.tsx
    ResultPage.tsx
    SettingsPage.tsx
    SkinScanPage.tsx
    TopPage.tsx
  services/
    ingredientParser.ts
    simulationEngine.ts
    twinRenderer.ts
  types/
    index.ts
  utils/
    format.ts
    storage.ts
  App.tsx
  main.tsx
  styles.css
```

## LocalStorage キー

- `user_profile`
- `skin_scan`
- `products`
- `simulation_results`

## シミュレーションの考え方

- 初期スコアは `60`
- 加点
  - 保湿
  - バリア改善
- 減点
  - 刺激
  - ニキビ
  - 赤み
- 補正
  - 肌タイプ
  - 生活習慣
  - 肌画像メトリクス
  - 使用頻度

出力:

- `score`
- `shortTermRisk`
- `longTermRisk`
- `futureImpactScore`

判定ラベル:

- `80+ excellent`
- `65+ good`
- `45+ caution`
- `below 45 risky`

## 免責

- このアプリは医療診断ではありません
- 結果は参考情報です
- 実際の使用前にはパッチテスト等を検討してください

## セットアップ

Node.js 18 以上を利用してください。

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

成果物は `dist/` に出力されます。

## GitHub Pages 公開手順

このプロジェクトは `vite.config.ts` で `base: "./"` を使っているため、GitHub Pages の project pages でそのまま公開しやすい構成です。

### 手順

1. リポジトリを GitHub に push する
2. `npm install`
3. `npm run build`
4. `dist/` を Pages 用ブランチへ配置する

### 例

```bash
npm run build
git checkout --orphan gh-pages
git --work-tree dist add --all
git --work-tree dist commit -m "Deploy GitHub Pages"
git push origin gh-pages --force
```

GitHub の `Settings > Pages` で `gh-pages` ブランチを公開対象に設定してください。

## 今後の拡張案

- OCR による成分自動読取
- より詳細な肌画像解析
- 朝夜ルーティンの比較シミュレーション
- 季節別の未来分岐
- 複数商品のレイヤー使用シミュレーション
