# Summary 階段 Prompt 重構說明

## 🎯 重構目標

將原本單一的 `generateSummary` prompt 拆分成三個專門的 prompt，每個都有明確的用途：

### 1. **Talent Type Analysis** 
- **用途**: 分析用戶的職業發展檔案，確定 talent type
- **輸入**: 角色、目標、技能評分、用戶反饋
- **輸出**: alignment level, readiness level, talent type, 描述, 焦點領域, 建議

### 2. **Venn Diagram Feedback**
- **用途**: 為 Venn 圖的三個區塊提供針對性反饋
- **輸入**: 用戶檔案、技能平均分、對齊分數
- **輸出**: business feedback, career feedback, alignment feedback

### 3. **Suggested Next Steps**
- **用途**: 基於完整評估生成個人化行動計劃
- **輸入**: 完整用戶檔案 + talent analysis 結果
- **輸出**: 3 個具體可執行的下一步行動

## 📋 使用方式

### Talent Type Analysis
```typescript
const talentAnalysis = await renderPrompt('summary', 'talentTypeAnalysis', {
  role: assessmentData.role,
  businessGoal: assessmentData.businessGoal,
  careerGoal: assessmentData.careerGoal,
  keyResults: assessmentData.keyResults,
  businessSkillsRatings: businessSkillsRatings,
  careerSkillsRatings: careerSkillsRatings,
  businessFeedbackSupport: assessmentData.businessFeedbackSupport,
  careerFeedback: assessmentData.careerFeedback
});
```

### Venn Diagram Feedback
```typescript
const vennFeedback = await renderPrompt('summary', 'vennDiagramFeedback', {
  role: assessmentData.role,
  businessGoal: assessmentData.businessGoal,
  careerGoal: assessmentData.careerGoal,
  businessSkillsAverage: businessSkillsAverage,
  careerSkillsAverage: careerSkillsAverage,
  alignmentScore: alignmentScore
});
```

### Suggested Next Steps
```typescript
const nextSteps = await renderPrompt('summary', 'suggestedNextSteps', {
  role: assessmentData.role,
  businessGoal: assessmentData.businessGoal,
  careerGoal: assessmentData.careerGoal,
  keyResults: assessmentData.keyResults,
  businessSkillsRatings: businessSkillsRatings,
  careerSkillsRatings: careerSkillsRatings,
  talentType: talentAnalysis.talentType,
  focusAreas: talentAnalysis.focusAreas,
  alignmentLevel: talentAnalysis.alignmentLevel,
  readinessLevel: talentAnalysis.readinessLevel,
  businessFeedbackSupport: assessmentData.businessFeedbackSupport,
  careerFeedback: assessmentData.careerFeedback
});
```

## 🔄 需要更新的服務

### 前端服務 (`services/geminiService.ts`)
需要將 `generateSummary` 函數拆分成三個獨立的函數：

```typescript
export const generateTalentTypeAnalysis = async (assessmentData: AssessmentData) => {
  // 使用 talentTypeAnalysis prompt
};

export const generateVennDiagramFeedback = async (assessmentData: AssessmentData, metrics: any) => {
  // 使用 vennDiagramFeedback prompt
};

export const generateSuggestedNextSteps = async (assessmentData: AssessmentData, talentAnalysis: any) => {
  // 使用 suggestedNextSteps prompt
};
```

### 後端服務 (`backend/src/services/geminiService.ts`)
同樣需要拆分 `generateSummary` 方法。

## 🎨 UI 組件更新

### StepSummary 組件
需要更新來使用三個獨立的 API 調用：

1. **Talent Type Card**: 使用 `talentTypeAnalysis` 結果
2. **Venn Diagram**: 使用 `vennDiagramFeedback` 結果
3. **Next Steps Section**: 使用 `suggestedNextSteps` 結果

## 💡 優勢

1. **更精確**: 每個 prompt 專注於特定功能
2. **更靈活**: 可以獨立優化每個區塊
3. **更可維護**: 問題更容易定位和修復
4. **更好的用戶體驗**: 每個區塊都有針對性的內容
5. **A/B 測試友好**: 可以獨立測試每個 prompt 的效果

## 🚀 下一步

1. 更新前端和後端的 geminiService
2. 修改 StepSummary 組件使用新的 API
3. 測試三個 prompt 的輸出品質
4. 根據用戶反饋進一步優化每個 prompt
