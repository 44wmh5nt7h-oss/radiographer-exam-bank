# DEPLOY_CHECKLIST

## Build 與環境

- [ ] `npm install` 成功
- [ ] `npm run build` 成功
- [ ] build output 為 `dist`
- [ ] `npm run preview` 本機測試成功
- [ ] Node 版本符合 `.node-version` / `package.json engines`

## 首頁與瀏覽流程

- [ ] 首頁正常顯示
- [ ] 題庫 metadata 正常載入
- [ ] 年份篩選正常
- [ ] 各科題數顯示正常
- [ ] 科目卡片可正常進入測驗

## 單科限時測驗

- [ ] 單科限時測驗可正常開始
- [ ] 題目能正確按科目 / 年份範圍載入
- [ ] 題目選項可正常點選
- [ ] 上一題 / 下一題正常
- [ ] 題號導航正常
- [ ] 倒數計時正常
- [ ] 交卷流程正常

## 結果頁

- [ ] 交卷結果頁統計正確
- [ ] 答對 / 答錯 / 未作答標示一致
- [ ] 題目列表可正常切換篩選
- [ ] 從結果頁可進入題目詳情

## 錯題本與收藏題

- [ ] 錯題本正常
- [ ] 收藏題正常
- [ ] 錯題詳情頁能顯示詳解與 tags
- [ ] 收藏題詳情可正常顯示

## 首頁學習分析

- [ ] 今日進度正常
- [ ] 今日建議正常
- [ ] 今日弱點摘要正常
- [ ] localStorage 舊資料不會造成 crash

## Router 與部署

- [ ] 重新整理深層頁面不會 404
- [ ] `public/_redirects` 已存在
- [ ] Cloudflare Pages build command 為 `npm run build`
- [ ] Cloudflare Pages output directory 為 `dist`
- [ ] Production branch 為 `main`

## 效能與靜態資源

- [ ] 主 JS bundle 不應過大
- [ ] 題庫 JSON 為按需載入
- [ ] 題目圖片走 `public/uploads` 靜態資源
- [ ] 題庫資料不直接打進主 bundle
- [ ] 手機版可用

## Console / Network

- [ ] console 無明顯 error
- [ ] 題庫 JSON fetch 成功
- [ ] 缺少某年份檔案時不會 crash
