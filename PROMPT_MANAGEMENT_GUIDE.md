# AItlas Prompt 集中管理系統

## 概述

我們已經成功建立了 AItlas prompt 的集中管理系統，所有 AI 生成的 prompt 現在都統一儲存在 `lib/prompts.ts` 檔案中。

## 檔案結構

```
lib/
├── prompts.ts          # 集中 prompt 配置檔案
├── skills.ts           # 技能定義檔案
└── translations.ts      # 翻譯檔案

services/
└── geminiService.ts     # 前端 AI 服務

backend/src/services/
└── geminiService.ts     # 後端 AI 服務
```

## Prompt 配置結構

### 主要配置物件

```typescript
export const AITLAS_PROMPTS: PromptConfig = {
  version: "1.0.0",
  model: "gemini-2.5-flash",
  prompts: {
    business: { ... },    # Business 階段 prompts
    career: { ... },      # Career 階段 prompts  
    summary: { ... },     # Summary 階段 prompts
    utility: { ... }      # 工具類 prompts
  }
}
```

### 各階段 Prompt 詳情

#### 🎯 Business 階段
- **keyResults**: 生成 Key Results
- **businessSkills**: 生成 Business Skills
- **optimizeBusinessGoal**: 優化 Business Goal

#### 🚀 Career 階段  
- **careerAnalysis**: Career 分析和技能生成
- **optimizeCareerGoal**: 優化 Career Goal

#### 📊 Summary 階段
- **generateSummary**: 生成總結報告

#### 🔧 Utility 工具
- **skillSimilarityCheck**: 技能相似度檢測

## 使用方法

### 1. 基本使用

```typescript
import { renderPrompt } from '../lib/prompts';

// 渲染 Key Results prompt
const prompt = renderPrompt('business', 'keyResults', {
  role: 'Software Engineer',
  businessGoal: 'Improve system performance'
});
```

### 2. 條件渲染

```typescript
// 支援條件語法 {{#if variable}}...{{/if}}
const prompt = renderPrompt('business', 'businessSkills', {
  role: 'Product Manager',
  businessGoal: 'Launch new feature',
  keyResults: 'Increase user engagement by 20%', // 可選參數
  predefinedSkillsString: skillsList
});
```

### 3. 版本管理

```typescript
import { PromptVersionManager } from '../lib/prompts';

// 獲取當前版本
const currentVersion = PromptVersionManager.getCurrentVersion();

// 檢查版本
const isCurrent = PromptVersionManager.isCurrentVersion('1.0.0');
```

## 優化建議

### 1. 如何優化特定 Prompt

要優化某個階段的 prompt，只需要編輯 `lib/prompts.ts` 檔案中對應的模板：

```typescript
// 例如：優化 Key Results 生成
business: {
  keyResults: `
    You are an expert business analyst. Generate 3 SMART Key Results for:
    Role: "{{role}}"
    Objective: "{{businessGoal}}"
    
    Requirements:
    - Each KR must be Specific, Measurable, Achievable, Relevant, Time-bound
    - Focus on business impact and user value
    - Include quantitative metrics where possible
    
    Format as bullet points starting with "-"
  `
}
```

### 2. A/B 測試

可以建立多個版本的 prompt 進行測試：

```typescript
export const AITLAS_PROMPTS_V2: PromptConfig = {
  version: "2.0.0",
  // ... 新的 prompt 配置
};

// 在服務中選擇版本
const prompt = version === '2.0.0' 
  ? renderPromptV2('business', 'keyResults', variables)
  : renderPrompt('business', 'keyResults', variables);
```

### 3. 國際化支援

可以為不同語言建立對應的 prompt：

```typescript
export const AITLAS_PROMPTS_ZH: PromptConfig = {
  version: "1.0.0-zh",
  prompts: {
    business: {
      keyResults: `
        作為業務分析師，為以下目標建議 3 個具體且可衡量的關鍵結果：
        負責人角色："{{role}}"
        目標："{{businessGoal}}"
        
        請以項目符號格式返回關鍵結果...
      `
    }
  }
};
```

## 維護指南

### 1. 添加新的 Prompt

1. 在 `lib/prompts.ts` 中添加新的 prompt 模板
2. 更新 `PromptConfig` 介面類型定義
3. 在對應的服務檔案中使用 `renderPrompt()` 函數

### 2. 修改現有 Prompt

1. 直接編輯 `lib/prompts.ts` 中的對應模板
2. 更新版本號（如果需要）
3. 測試修改後的效果

### 3. 版本控制

- 每次重大修改時更新版本號
- 使用 `PromptVersionManager` 追蹤版本變更
- 保留舊版本以備回滾使用

## 優勢

✅ **集中管理**: 所有 prompt 在一個檔案中，易於維護  
✅ **版本控制**: 支援 prompt 版本管理和追蹤  
✅ **類型安全**: TypeScript 類型定義確保正確使用  
✅ **模板語法**: 支援條件渲染和變數替換  
✅ **一致性**: 前後端使用相同的 prompt 配置  
✅ **可擴展**: 易於添加新的 prompt 類型  

## 下一步

1. **監控效果**: 追蹤不同 prompt 版本的生成效果
2. **持續優化**: 根據用戶反饋持續改進 prompt 品質
3. **A/B 測試**: 建立測試框架比較不同 prompt 版本
4. **國際化**: 為多語言環境建立對應的 prompt 版本

現在你可以輕鬆地優化任何階段的 AItlas 產出，只需要編輯 `lib/prompts.ts` 檔案中的對應 prompt 模板即可！
