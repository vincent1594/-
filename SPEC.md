# 專案規格書（Technical Specification）

版本: 1.0
日期: 2026-05-23
作者: 自動產生

## 一、專案概覽

- 名稱：智慧電網控制中心（前端模擬與 OpenSpec 工作流整合）
- 類型：單頁前端模擬 (React + Vite)
- 主要程式檔案位置：`src/App.jsx`, `src/*`
- OpenSpec 設定：`openspec/config.yaml`
- 啟動：參考 `package.json`

目的：提供一個互動式的前端模擬介面，用於展示市場撮合、AI 預測、最佳化調度與需量反應流程，搭配 OpenSpec 工作流定義協助變更管理與 agent 驗證。

範圍：此規格覆蓋使用者故事、系統功能、資料模型（TypeScript 版型）、UI 介面要點、主要演算法（簡述）、測試策略與逐步拆模建議。

非目標：此模擬系統非生產級電力控制系統，不包含實際電力系統保護、實時 SCADA 連線或交易結算後端。

## 二、主要利害關係人與使用者

- 系統操作員（Operator）：檢視 KPI、執行市場出清、觸發 DR 事件。
- 研究/資料科學人員（Data Scientist）：使用 AI 預測介面與 rerun 功能，匯出預測數據。
- 開發/維運（Dev）：維護模擬邏輯、撰寫測試、整合 OpenSpec 變更流程。

## 三、使用者故事（Use Cases）

1. 作為操作員，我要查看系統即時 KPI（系統負載、LMP、頻率），以監控系統狀態。
2. 作為交易員，我要在委託簿新增 bid/ask，並可執行一鍵市場撮合，查看成交價格與成交量。
3. 作為資料科學人員，我要啟動 AI 預測，查看與匯出負載預測曲線，並可用預測結果驅動 dispatch 優化。
4. 作為系統管理員，我要發布需量反應（DR）活動並監控用戶回應與總減載量。
5. 作為開發者，我要將撮合與最佳化算法拆成純函式以便單元測試。

## 四、功能需求（Functional Requirements）

- Dashboard：顯示 KPI 卡片（LMP、systemLoad、frequency、reserveMargin）與時間序列。
- Market：bid/ask 新增表單、委託簿顯示、深度圖、出清按鈕、出清結果呈現（price、quantity、matched orders）。
- Forecasting：觸發 AI 重新推理、預測圖表、匯出 CSV、預測狀態顯示。
- Dispatch / Optimization：基於 forecast 與 network constraints 產生 dispatch 建議，回報 dispatchStats。
- Demand Response：DR 事件發布/中止、DR 客戶管理、即時減載統計。
- Network Visualization：Bus 與 Line 的簡易互動顯示（點選 bus 查看 node 資訊，line 顯示負載率）。
- OpenSpec Integration：提供 artifacts（changes/）與 workflow hooks 供 agent 使用（propose / apply / archive）。

## 五、非功能性需求（Non-Functional）

- 可測試性：演算法應是純函式或 deterministic，易於模擬與單元測試。
- 可維護性：UI 與邏輯分層（component / lib），避免「巨型 App.jsx」。
- 可用性：介面以顏色標示重要變數（danger/warning/success），並提供簡易說明。
- 效能：UI 更新與渲染應以最小化重繪為目標；演算法在前端模擬範圍內應能在 <300ms 回應（小量資料）。

## 六、主要資料模型（TypeScript）

請參考 `src/types/spec-types.ts`（本專案提供的型別草案）。主要模型摘要：

- Order：{ id, type, price, quantity, owner, timestamp }
- MarketState：{ bids[], asks[], clearingPrice, clearingQuantity }
- ForecastCurve：時間序列數據點
- DispatchSuggestion：各資源出力建議
- DREvent：{ id, active, rate, affectedCustomers }
- Network：Bus[]、Line[]，包含容量與實際流量

## 七、介面（UI）流程要點

- 首頁 / Dashboard：KPI 與快捷按鈕（執行出清 / 觸發預測 / 發布 DR）。
- Market 頁：左側為委託簿（bids/asks），右側為深度條與成交歷史，下方為出清結果。
- Forecast 頁：時間選擇 -> 觸發預測 -> 顯示曲線 -> 匯出/套用至 dispatch。
- Dispatch 頁：上傳/選取 forecast -> 執行最佳化 -> 顯示 dispatchStats 與建議下達矩陣。

## 八、主要演算法（簡述）

1. 市場撮合（簡單版）：
   - 以價格排序買單（descending）與賣單（ascending），逐筆撮合直到價格不相容或數量耗盡。
   - 出清價格可採加權平均（成交價）或邊際稀釋價（最後成交對手價格）。

2. AI 預測（介面層）：
   - 預測按鈕會呼叫純函式提供樣本過去負載序列，輸出 horizon 內的預測值；實作細節可由 data-science 團隊以模型更新。

3. Dispatch 最佳化（簡化）：
   - 目標：最小化成本或偏離預測的絕對誤差，受限於容量、ramp rate、line limits。
   - 建議初期實作：使用簡單線性規劃（LP）或貪婪法以便在前端快速驗證。

## 九、品質門檻與測試策略

- 單元測試：為 market.matchOrders(), forecast.generate(), dispatch.optimize() 編寫測試（happy path + empty inputs + boundary cases）。
- 整合測試：模擬一套從 forecast -> dispatch -> apply 的流程，檢查 state 傳遞正確性。
- Lint / Typecheck：確保 TypeScript 型別完整（若把核心邏輯轉為 .ts）。

## 十、拆模與重構建議（短期優先）

1. 把 `src/App.jsx` 中的業務邏輯抽成 `src/lib/market.ts`, `src/lib/forecast.ts`, `src/lib/dispatch.ts`。
2. 將 UI 元件拆為 `src/components/Market/*`, `src/components/Forecast/*`, `src/components/Dashboard/*`。
3. 把 types 放到 `src/types/`（已新增 `spec-types.ts` 作為參考）。
4. 為每個 lib 建立對應的 unit tests（Jest 或 Vitest），新增 CI 檢查流程。

## 十一、部署 / 開發流程

- 啟動開發伺服器：參見 `package.json` 的 `dev` script。
- 變更流程：使用 OpenSpec artifacts -> agent propose -> review -> apply（具體流程見 `openspec/` 與 `.agent/`）。

## 十二、風險與緩解

- 風險：商業/演算法邏輯集中在單一檔案，造成測試與維護困難。
  - 緩解：立即抽出純函式並加入單元測試。

- 風險：前端演算法性能在大量資料下退化。
  - 緩解：限制前端模擬資料量，或搬移 heavy-lift 算法到後端/worker。

## 十三、下一步建議

- 決定是否要把現有 `App.jsx` 拆模（我可以直接協助拆成 `components/` 與 `lib/`）。
- 我可將 `market.matchOrders()`、`forecast.generate()`、`dispatch.optimize()` 撰寫成 TypeScript 檔案與基本單元測試，若您同意我會繼續實作。

---

欲展開的章節請回覆：
- "用例流程"（我將為每個使用者故事寫出步驟與 UI mock flow）
- "資料模型與 TypeScript 型別"（我將擴充 `src/types/spec-types.ts`）
- "拆模實作"（我將開始把 App.jsx 的主要邏輯抽成模組並加入測試）
- "完整測試套件"（建立 Vitest/Jest config 與範例測試）

或直接說 "請生成全部" 我會依優先順序繼續。