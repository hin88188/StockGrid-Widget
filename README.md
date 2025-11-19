# 📊 StockGrid Widget

一個專為 iOS Scriptable 設計的多股票圖表顯示小工具，支援 1-6 個股票的響應式網格佈局，完全填滿顯示無空白。

## ✨ 特色功能

- 🎯 **完全填滿佈局** - 圖片完全拉伸，無上下左右空白
- 🎲 **隨機熱門股** - 支援顯示市場熱門股票排行
- 📱 **響應式網格** - 自動適配 1-6 個股票的最佳佈局
- ⚡ **並發下載** - 智能限流，最多同時 6 個請求
- 🔄 **自動重試** - 網路失敗自動重試，單個失敗不影響整體
- 📐 **動態尺寸** - 根據設備自動計算最佳尺寸
- 🎨 **可自訂** - 支援自訂股票、間距、背景色等

## 📸 預覽

| 1 股票 (1×1) | 3 股票 (1×3) |
|-------------|-------------|
| ![1股票](https://i.imgur.com/1BwfAhS.jpeg) | ![3股票](https://i.imgur.com/DFE1Qv0.jpeg) |

| 4 股票 (2×2) | 6 股票 (2×3) |
|-------------|-------------|
| ![4股票](https://i.imgur.com/cCGgclg.jpeg) | ![6股票](https://i.imgur.com/5A5kNbC.jpeg) |

## 📦 安裝步驟

### 前置需求
- iOS 14 或更新版本
- 已安裝 [Scriptable](https://scriptable.app/) App

### 安裝
1. 下載 [`StockGrid.js`](https://github.com/hin88188/StockGrid-Widget/blob/main/src/Widget.js)
2. 在 iPhone 上打開 **Scriptable** App
3. 點擊右上角 `+` 創建新腳本
4. 將代碼完整複製貼上
5. 命名為 `StockGrid Widget`（或任意名稱）
6. 點擊右上角「完成」保存

### 添加到主畫面
1. 長按 iPhone 主畫面空白處
2. 點擊左上角 `+`
3. 搜尋並選擇 **Scriptable**
4. 選擇 **Medium** 尺寸
5. 添加後長按 Widget → 編輯 Widget
6. **Script** 選擇剛才創建的腳本
7. 完成！

## ⚙️ 配置選項

在腳本開頭的 `CONFIG` 區域進行設定：

const CONFIG = {
  // 資料來源: 'custom' (自訂) 或 'rank' (熱門排行)
  dataSource: 'custom', 

  // 股票代碼列表（1-6 個，僅在 custom 模式使用）
  stockSymbols: ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'],
  
  // 熱門排行 API（僅在 rank 模式使用）
  rankApiUrl: 'https://m-gl.lbkrs.com/...', // (完整 URL 省略)
  
  // 排行榜顯示數量
  rankLimit: 6,
  
  // 網格間距（像素）
  gridSpacing: 2,
  
  // 背景色
  backgroundColor: '#1a1a1a',
  
  // 並發下載數量
  maxConcurrent: 6,
  
  // 重試次數
  maxRetries: 2,
  
  // 超時時間（秒）
  timeout: 10,
  
  // 調試模式
  debugMode: false
};
```

## 🎨 自訂範例

### 追蹤科技股
```javascript
stockSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
```

### 追蹤 AI 概念股
```javascript
stockSymbols: ['NVDA', 'AMD', 'INTC', 'AVGO', 'QCOM', 'TSM']
```

### 顯示熱門排行 (隨機)
```javascript
dataSource: 'rank',
rankLimit: 6  // 每次隨機顯示 6 個熱門股票
```

### 調整外觀
```javascript
gridSpacing: 0,              // 完全無縫
backgroundColor: '#000000',  // 純黑背景
```

## 📐 佈局規則

Widget 會根據股票數量自動選擇最佳佈局：

| 股票數量 | 佈局 | 說明 |
|---------|------|------|
| 1 | 1×1 | 單個大圖 |
| 2 | 1×2 | 單行兩列 |
| 3 | 1×3 | 單行三列 |
| 4 | 2×2 | 雙行雙列 |
| 5 | 2×3 | 雙行三列（最後一格空白）|
| 6 | 2×3 | 雙行三列（完全填滿）|

## 🔧 技術特點

- **完全拉伸技術** - 使用 `DrawContext` 重繪圖片，確保完全填滿格子
- **精確尺寸計算** - 針對不同 iPhone 型號優化
- **並發控制** - 自定義並發限流邏輯，避免請求過載
- **錯誤容錯** - 單個股票失敗顯示占位符，不影響其他股票

## 📱 支援設備

已針對以下設備優化 Medium Widget 尺寸：
- iPhone 14 Pro Max / 13 Pro Max
- iPhone 14 Pro / 14 / 13 / 12
- iPhone 11 Pro Max / XS Max
- iPhone SE (3rd gen) / 11 Pro / XS / X
- 其他 iPhone 使用通用計算

## ⚠️ 注意事項

1. **網路流量** - 每次 Widget 刷新都會重新下載圖片，建議設定較長刷新間隔
2. **API 限制** - Finviz 可能有請求頻率限制，避免過度頻繁刷新
3. **Widget 刷新** - iOS 系統控制 Widget 刷新頻率，無法即時更新
4. **圖片來源** - 圖表來自 Finviz，需要網路連線

## 🐛 疑難排解

### Widget 顯示空白
- 檢查網路連線
- 確認股票代碼正確
- 在 Scriptable App 中執行查看錯誤訊息

### 圖片載入失敗
- 股票代碼可能不存在
- 網路連線問題
- Finviz 服務暫時不可用

### 佈局異常
- 確認 Widget 尺寸為 **Medium**
- 重新添加 Widget
- 重啟 Scriptable App

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

## 🙏 致謝

- 圖表數據來源：[Finviz](https://finviz.com/)
- 開發平台：[Scriptable](https://scriptable.app/)

## 📞 聯絡方式

如有問題或建議，歡迎：
- 提交 Issue
- 發起 Discussion

---

<div align="center">

⭐ 如果這個專案對你有幫助，請給個星星！

Made with ❤️ for iOS Scriptable

</div>