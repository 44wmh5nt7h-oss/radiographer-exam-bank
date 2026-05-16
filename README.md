# radiographer-exam-bank

放射師國考刷題庫，使用 React + Vite + Tailwind CSS 建置，已整理成適合部署到 Cloudflare Pages 的純靜態站。

## 專案特點

- 免費可部署到 Cloudflare Pages
- 使用 GitHub repository + Cloudflare Pages 自動部署
- `main` 分支更新後可自動重新建置正式網站
- 題庫資料改為 `public/data` 動態載入，不再把大 JSON 直接打進主 JS bundle
- 題目圖片改為 `public/uploads` 靜態資產，不再透過 eager import 全部進 bundle
- 保留目前單科限時測驗、結果頁、錯題本、收藏題、首頁統計與 localStorage 功能

## 開發環境

建議 Node 版本：

- `20`

本專案已提供：

- [.node-version](./.node-version)
- `package.json > engines.node`

## 本機開發

```bash
npm install
npm run dev
```

`npm run dev` 會先執行題庫切檔：

- 來源：`src/data/fiinal_enriched_questions.json`
- 輸出：`public/data/...`
- 圖片同步：`src/uploads -> public/uploads`

## 建置

```bash
npm run build
```

目前 production build 會：

1. 執行 `npm run build:data`
2. 生成 `public/data/question-index.json`
3. 依科目 / 年份切出 `public/data/questions/...`
4. 同步題目圖片到 `public/uploads`
5. 執行 `vite build`

Build output：

- `dist`

## 題庫資料策略

為了避免主 bundle 過大，目前題庫不再直接 `import` 進 React app。

### 首頁只載入 metadata

首頁使用：

- `public/data/question-index.json`

內容包含：

- `subject`
- `subjectSlug`
- `year`
- `questionCount`
- `filePath`
- `hasExplanation`
- `updatedAt`

### 題庫採按需載入

進入單科限時測驗後，前端才會根據：

- 科目
- 起始年份
- 終止年份

動態載入需要的 JSON 檔案。

### 切檔規則

題庫目前依「科目 / 年份」拆檔，例如：

- `public/data/questions/basic/100.json`
- `public/data/questions/basic/101.json`
- `public/data/questions/physics-safety/100.json`
- `public/data/questions/radiation-therapy/100.json`

### 題目 key 查找

另有：

- `public/data/question-key-map.json`

用來支援：

- 錯題本找回原始題目
- 收藏題找回原始題目
- 結果頁 / 題目詳情頁 deep link 查找

## Cloudflare Pages 部署流程

這個專案目前已整理成適合 Cloudflare Pages 的 Git 自動部署流程。

### 1. 建立 GitHub repository

```bash
git init
git add .
git commit -m "init deploy-ready app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. 登入 Cloudflare

進入 Cloudflare Dashboard，開啟：

- `Workers & Pages`

### 3. 建立 Pages project

1. Click `Create application`
2. 選 `Pages`
3. 選 `Connect to Git`
4. 選擇你的 GitHub repository

### 4. 設定建置參數

推薦設定：

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

### 5. 首次部署

按下 Deploy 後，Cloudflare Pages 會：

1. 安裝依賴
2. 執行 `npm run build`
3. 將 `dist` 發佈到正式站

部署完成後會得到：

- `https://<your-project>.pages.dev`

### 6. 後續更新流程

之後每次更新只需要：

```bash
git add .
git commit -m "update question bank"
git push origin main
```

Cloudflare Pages 會自動重新部署正式網站。

## React Router 與深層路由

本專案使用 React Router。

為避免 Cloudflare Pages 重新整理深層頁面時出現 404，已加入：

- [public/_redirects](./public/_redirects)

內容：

```txt
/* /index.html 200
```

這樣像以下路由重新整理時也能正確回到 SPA：

- `/quiz/...`
- `/results/...`
- `/wrong-book`
- `/bookmarks`
- `/questions/...`

## Cloudflare Pages 免費方案注意事項

Cloudflare Pages 很適合這個 React + Vite 靜態網站，但有幾點要注意：

1. Free plan 適合目前純前端靜態站。
2. 請避免把題庫拆成「每題一個檔案」，檔案數會暴增。
3. 目前建議做法是「依科目 / 年份拆 JSON」，而不是每題一檔。
4. 題目圖片請持續壓縮，避免首次載入過慢。
5. 若未來加入 AI API，不要把 API key 放在前端。
6. 若未來需要 AI 詳解生成、帳號系統或受保護 API，應改用後端或 Cloudflare Workers。

## 目前部署架構

- Hosting: Cloudflare Pages
- Source control: GitHub
- Frontend: React + Vite
- Routing: React Router SPA
- Static data: `public/data`
- Static images: `public/uploads`
- Study record storage: browser `localStorage`

## 驗證結果

本次整理後已確認：

- `npm install` 可完成
- `npm run build` 可完成
- build output 為 `dist`
- 主 JS bundle 已從原本把大題庫打進 bundle 的做法，改成 metadata + dynamic fetch
- SPA deep link 已補 `_redirects`

## 額外說明

目前專案沒有 TypeScript，也沒有配置 ESLint 指令；因此本次主要以：

- production build 成功
- 資料載入流程可運作
- Cloudflare Pages 部署設定完整

作為部署前的主要驗證基準。
