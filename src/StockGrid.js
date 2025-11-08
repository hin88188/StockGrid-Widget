// StockGrid.js - 多股票圖表顯示小工具
// 版本：1.0 | 適用於 Scriptable iOS
// 特性：完全填滿策略，無上下左右空白

// ==================== 配置區 ====================
const CONFIG = {
  // 股票代碼列表（支援 1-6 個股票）
  stockSymbols: ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'],
  
  // 圖表 URL 模板
  chartUrlTemplate: 'https://charts2-node.finviz.com/chart.ashx?t={symbol}&tf=d&s=linear&ct=candle_stick&tm=d',
  
  // 並發下載設定
  maxConcurrent: 6,
  
  // 背景色
  backgroundColor: '#1a1a1a',
  
  // 網格間距（像素）
  gridSpacing: 2,
  
  // 錯誤重試次數
  maxRetries: 2,
  
  // 超時設定（秒）
  timeout: 10,
  
  // 調試模式（顯示尺寸資訊）
  debugMode: false
};

// ==================== 主程式 ====================
class StockGrid {
  constructor(config) {
    this.config = config;
    this.widget = new ListWidget();
    this.errors = [];
  }
  
  // 執行主流程
  async run() {
    try {
      // 設定 widget 基本屬性
      this.setupWidget();
      
      // 獲取 widget 尺寸
      const widgetSize = this.getWidgetSize();
      
      if (this.config.debugMode) {
        console.log(`Widget 尺寸: ${widgetSize.width}x${widgetSize.height}`);
      }
      
      // 驗證股票數量
      const stockCount = this.config.stockSymbols.length;
      if (stockCount < 1 || stockCount > 6) {
        throw new Error('股票數量必須在 1-6 之間');
      }
      
      // 計算佈局
      const layout = this.calculateLayout(stockCount);
      
      // 並發下載圖片
      const images = await this.downloadImagesWithConcurrency(
        this.config.stockSymbols,
        this.config.maxConcurrent
      );
      
      // 渲染圖表網格（完全填滿模式）
      await this.renderChartGridFullStretch(images, layout, widgetSize);
      
      // 如果有錯誤，顯示在底部（但不佔用空間）
      if (this.errors.length > 0 && this.config.debugMode) {
        this.addErrorFooter();
      }
      
    } catch (error) {
      this.renderError(error.message);
    }
    
    return this.widget;
  }
  
  // 設定 widget 基本屬性
  setupWidget() {
    this.widget.backgroundColor = new Color(this.config.backgroundColor);
    this.widget.setPadding(0, 0, 0, 0);
  }
  
  // 獲取 Medium Widget 尺寸
  getWidgetSize() {
    // Medium widget 尺寸（根據不同 iPhone 型號動態計算）
    const screenSize = Device.screenSize();
    const screenScale = Device.screenScale();
    
    // 根據不同設備精確計算 Medium widget 尺寸
    let widgetWidth, widgetHeight;
    
    // iPhone 尺寸對照表（Medium widget）
    if (screenSize.width === 428) { // iPhone 14 Pro Max, 13 Pro Max
      widgetWidth = 364;
      widgetHeight = 170;
    } else if (screenSize.width === 414) { // iPhone 11 Pro Max, XS Max
      widgetWidth = 360;
      widgetHeight = 169;
    } else if (screenSize.width === 393) { // iPhone 14 Pro
      widgetWidth = 338;
      widgetHeight = 158;
    } else if (screenSize.width === 390) { // iPhone 14, 13, 12
      widgetWidth = 338;
      widgetHeight = 158;
    } else if (screenSize.width === 375) { // iPhone SE3, 11 Pro, XS, X
      widgetWidth = 329;
      widgetHeight = 155;
    } else {
      // 通用計算公式
      widgetWidth = Math.floor((screenSize.width - 60) * 0.94);
      widgetHeight = Math.floor(widgetWidth * 0.47);
    }
    
    return { 
      width: widgetWidth, 
      height: widgetHeight 
    };
  }
  
  // 計算佈局（行數和列數）
  calculateLayout(stockCount) {
    const layouts = {
      1: { rows: 1, cols: 1 },
      2: { rows: 1, cols: 2 },
      3: { rows: 1, cols: 3 },
      4: { rows: 2, cols: 2 },
      5: { rows: 2, cols: 3 },
      6: { rows: 2, cols: 3 }
    };
    
    return layouts[stockCount];
  }
  
  // 並發下載圖片（帶限流控制）
  async downloadImagesWithConcurrency(symbols, maxConcurrent) {
    const results = [];
    const queue = [...symbols];
    const inProgress = new Set();
    
    // 下載單個圖片的函數
    const downloadOne = async (symbol) => {
      try {
        const url = this.config.chartUrlTemplate.replace('{symbol}', symbol);
        const image = await this.downloadImageWithRetry(url, symbol);
        return { symbol, image, success: true };
      } catch (error) {
        this.errors.push(`${symbol}: ${error.message}`);
        return { symbol, image: null, success: false };
      }
    };
    
    // 並發控制邏輯
    while (queue.length > 0 || inProgress.size > 0) {
      // 啟動新任務直到達到並發上限
      while (queue.length > 0 && inProgress.size < maxConcurrent) {
        const symbol = queue.shift();
        const promise = downloadOne(symbol);
        inProgress.add(promise);
        
        promise.then(result => {
          inProgress.delete(promise);
          results.push(result);
        });
      }
      
      // 等待任一任務完成
      if (inProgress.size > 0) {
        await Promise.race(Array.from(inProgress));
      }
    }
    
    // 按原始順序排序結果
    return symbols.map(symbol => 
      results.find(r => r.symbol === symbol) || { symbol, image: null, success: false }
    );
  }
  
  // 下載圖片（帶重試機制）
  async downloadImageWithRetry(url, symbol) {
    let lastError;
    
    for (let i = 0; i <= this.config.maxRetries; i++) {
      try {
        const request = new Request(url);
        request.timeoutInterval = this.config.timeout;
        const image = await request.loadImage();
        
        if (image) {
          return image;
        }
        throw new Error('圖片載入失敗');
      } catch (error) {
        lastError = error;
        if (i < this.config.maxRetries) {
          await this.sleep(500 * (i + 1)); // 遞增延遲
        }
      }
    }
    
    throw new Error(`下載失敗（重試 ${this.config.maxRetries} 次）`);
  }
  
  // 渲染圖表網格（完全拉伸填滿模式）
  async renderChartGridFullStretch(imageResults, layout, widgetSize) {
    const { rows, cols } = layout;
    const spacing = this.config.gridSpacing;
    
    // 計算每個格子的精確尺寸（填滿整個 widget）
    const totalSpacingWidth = spacing * (cols + 1);
    const totalSpacingHeight = spacing * (rows + 1);
    
    const cellWidth = Math.floor((widgetSize.width - totalSpacingWidth) / cols);
    const cellHeight = Math.floor((widgetSize.height - totalSpacingHeight) / rows);
    
    if (this.config.debugMode) {
      console.log(`佈局: ${rows}x${cols}, 格子尺寸: ${cellWidth}x${cellHeight}`);
    }
    
    let index = 0;
    
    // 使用絕對定位來確保完全填滿
    const mainStack = this.widget.addStack();
    mainStack.layoutVertically();
    mainStack.spacing = 0;
    
    // 逐行渲染
    for (let row = 0; row < rows; row++) {
      // 上間距
      if (row === 0) {
        mainStack.addSpacer(spacing);
      }
      
      const rowStack = mainStack.addStack();
      rowStack.layoutHorizontally();
      rowStack.spacing = 0;
      rowStack.size = new Size(widgetSize.width, cellHeight);
      
      // 逐列渲染
      for (let col = 0; col < cols; col++) {
        // 左間距
        if (col === 0) {
          rowStack.addSpacer(spacing);
        }
        
        if (index >= imageResults.length) {
          // 填充空白
          rowStack.addSpacer(cellWidth);
        } else {
          const result = imageResults[index];
          const cell = rowStack.addStack();
          cell.size = new Size(cellWidth, cellHeight);
          cell.backgroundColor = new Color(this.config.backgroundColor);
          
          if (result.success && result.image) {
            // 完全拉伸圖片以填滿格子（不保持比例）
            await this.addFullStretchImage(cell, result.image, cellWidth, cellHeight);
          } else {
            // 顯示錯誤占位符
            this.addErrorPlaceholder(cell, result.symbol, cellWidth, cellHeight);
          }
          
          index++;
        }
        
        // 右間距
        rowStack.addSpacer(spacing);
      }
      
      // 下間距
      mainStack.addSpacer(spacing);
    }
  }
  
  // 完全拉伸圖片填滿（不保持比例，無黑邊）
  async addFullStretchImage(container, image, targetWidth, targetHeight) {
    // 方法：使用 DrawContext 重新繪製圖片到精確尺寸
    const ctx = new DrawContext();
    ctx.size = new Size(targetWidth, targetHeight);
    ctx.opaque = true;
    ctx.respectScreenScale = true;
    
    // 繪製拉伸後的圖片
    const rect = new Rect(0, 0, targetWidth, targetHeight);
    ctx.drawImageInRect(image, rect);
    
    // 獲取處理後的圖片
    const stretchedImage = ctx.getImage();
    
    // 添加到容器（確保完全填滿）
    container.setPadding(0, 0, 0, 0);
    const imageElement = container.addImage(stretchedImage);
    imageElement.imageSize = new Size(targetWidth, targetHeight);
    imageElement.applyFillingContentMode();
  }
  
  // 添加錯誤占位符
  addErrorPlaceholder(container, symbol, width, height) {
    container.backgroundColor = new Color('#2a2a2a');
    container.setPadding(0, 0, 0, 0);
    
    const centerStack = container.addStack();
    centerStack.layoutVertically();
    centerStack.spacing = 4;
    centerStack.size = new Size(width, height);
    centerStack.centerAlignContent();
    
    const innerStack = centerStack.addStack();
    innerStack.layoutVertically();
    innerStack.spacing = 4;
    innerStack.centerAlignContent();
    
    // 股票代碼
    const symbolText = innerStack.addText(symbol);
    symbolText.font = Font.boldSystemFont(Math.min(14, width / 8));
    symbolText.textColor = Color.white();
    symbolText.centerAlignText();
    
    // 錯誤圖標
    const errorText = innerStack.addText('⚠️');
    errorText.font = Font.systemFont(Math.min(20, width / 6));
    errorText.centerAlignText();
    
    // 錯誤提示
    const errorMsg = innerStack.addText('載入失敗');
    errorMsg.font = Font.systemFont(Math.min(10, width / 12));
    errorMsg.textColor = new Color('#ff6b6b');
    errorMsg.centerAlignText();
  }
  
  // 添加錯誤頁腳
  addErrorFooter() {
    const footer = this.widget.addText(`⚠️ ${this.errors.length} 個圖表載入失敗`);
    footer.font = Font.systemFont(8);
    footer.textColor = new Color('#ff6b6b', 0.7);
    footer.centerAlignText();
  }
  
  // 渲染完整錯誤
  renderError(message) {
    this.widget.backgroundColor = new Color('#2a2a2a');
    this.widget.setPadding(20, 20, 20, 20);
    
    const stack = this.widget.addStack();
    stack.layoutVertically();
    stack.centerAlignContent();
    stack.spacing = 8;
    
    const icon = stack.addText('❌');
    icon.font = Font.systemFont(40);
    icon.centerAlignText();
    
    const errorText = stack.addText('Widget 錯誤');
    errorText.font = Font.boldSystemFont(16);
    errorText.textColor = Color.white();
    errorText.centerAlignText();
    
    const detailText = stack.addText(message);
    detailText.font = Font.systemFont(12);
    detailText.textColor = new Color('#ff6b6b');
    detailText.centerAlignText();
  }
  
  // 延遲函數
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== 執行入口 ====================
const widget = new StockGrid(CONFIG);
const finalWidget = await widget.run();

if (config.runsInWidget) {
  Script.setWidget(finalWidget);
} else {
  await finalWidget.presentMedium();
}

Script.complete();