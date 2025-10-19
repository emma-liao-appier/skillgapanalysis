# Alignment Score 計算系統整合指南

## 🎯 系統概述

基於你提供的多維度 alignment score 計算方法，我們已經建立了完整的對齊度分析系統：

### 計算組件 (權重)
1. **Skill Overlap Rate (40%)**: 技能重疊率
2. **Skill Rating Similarity (30%)**: 技能評分相似性  
3. **Category Balance Index (20%)**: 類別平衡指數
4. **Semantic Match (10%)**: 語意匹配度

## 📁 檔案結構

```
lib/
├── alignmentScore.ts    # Alignment 計算工具
├── prompts.ts          # 更新的 prompt 配置
└── types.ts            # 類型定義
```

## 🔧 使用方式

### 1. 計算 Alignment Score

```typescript
import { computeAlignmentScore, generateAlignmentAnalysis } from '../lib/alignmentScore';

// 基本計算
const components = computeAlignmentScore({
  businessSkills: assessmentData.businessSkills,
  careerSkills: assessmentData.careerSkills,
  businessGoal: assessmentData.businessGoal,
  careerGoal: assessmentData.careerGoal,
  semanticMatch: null // 可選的語意匹配分數
});

// 完整分析
const analysis = generateAlignmentAnalysis(
  assessmentData.businessSkills,
  assessmentData.careerSkills,
  assessmentData.businessGoal,
  assessmentData.careerGoal
);

console.log(analysis);
// {
//   score: 75.5,
//   level: 'High',
//   insights: 'Strong skill overlap (80%) indicates aligned development focus...',
//   components: { skillOverlapRate: 0.8, skillRatingSimilarity: 0.7, ... }
// }
```

### 2. 在 Prompt 中使用

```typescript
import { renderPrompt } from '../lib/prompts';

// Talent Type Analysis
const talentAnalysis = await renderPrompt('summary', 'talentTypeAnalysis', {
  role: assessmentData.role,
  businessGoal: assessmentData.businessGoal,
  careerGoal: assessmentData.careerGoal,
  keyResults: assessmentData.keyResults,
  businessSkillsRatings: formatSkillsRatings(assessmentData.businessSkills),
  careerSkillsRatings: formatSkillsRatings(assessmentData.careerSkills),
  businessFeedbackSupport: assessmentData.businessFeedbackSupport,
  careerFeedback: assessmentData.careerFeedback
});

// Venn Diagram Feedback
const vennFeedback = await renderPrompt('summary', 'vennDiagramFeedback', {
  role: assessmentData.role,
  businessGoal: assessmentData.businessGoal,
  careerGoal: assessmentData.careerGoal,
  businessSkillsAverage: calculateAverage(assessmentData.businessSkills),
  careerSkillsAverage: calculateAverage(assessmentData.careerSkills),
  alignmentScore: analysis.score,
  skillOverlapRate: analysis.components.skillOverlapRate * 100,
  skillRatingSimilarity: analysis.components.skillRatingSimilarity * 100,
  categoryBalance: analysis.components.categoryBalance * 100,
  semanticMatch: analysis.components.semanticMatch * 100
});
```

## 🎨 UI 整合

### StepSummary 組件更新

```typescript
// 在 StepSummary 組件中
const alignmentAnalysis = useMemo(() => {
  return generateAlignmentAnalysis(
    assessmentData.businessSkills,
    assessmentData.careerSkills,
    assessmentData.businessGoal,
    assessmentData.careerGoal
  );
}, [assessmentData]);

// Talent Type 顯示
const talentType = determineTalentType(
  alignmentAnalysis.level,
  calculateReadinessLevel([...assessmentData.businessSkills, ...assessmentData.careerSkills])
);
```

## 📊 輸出格式

### Alignment Analysis
```typescript
{
  score: 75.5,           // 0-100 分數
  level: 'High',         // 'High' | 'Partial' | 'Low'
  insights: '...',       // 人類可讀的洞察
  components: {
    skillOverlapRate: 0.8,
    skillRatingSimilarity: 0.7,
    categoryBalance: 0.6,
    semanticMatch: 0.5,
    finalScore: 0.755
  }
}
```

### Talent Type Matrix
```
High Alignment + High Readiness    → Strategic Contributor
High Alignment + Medium Readiness → Emerging Talent
High Alignment + Low Readiness     → Foundational Builder
Partial Alignment + High Readiness → Functional Expert
Partial Alignment + Medium Readiness → Evolving Generalist
Partial Alignment + Low Readiness  → Exploring Talent
Low Alignment + High Readiness     → Re-direction Needed
Low Alignment + Medium Readiness   → Potential Shifter
Low Alignment + Low Readiness     → Career Explorer
```

## 🚀 優勢

1. **數學嚴謹**: 使用餘弦相似度等專業算法
2. **多維度分析**: 不只看目標重疊，還考慮技能層面
3. **可解釋性**: 提供詳細的洞察和建議
4. **靈活性**: 支援可選的語意匹配
5. **一致性**: 與現有的 talent type 系統完美整合

## 🔄 下一步

1. **更新服務層**: 整合新的計算邏輯到 geminiService
2. **UI 更新**: 在 StepSummary 中顯示詳細的 alignment 分析
3. **測試驗證**: 確保計算結果符合預期
4. **優化調整**: 根據實際使用情況調整權重和閾值

這個系統現在提供了比單純目標重疊更全面、更精確的對齊度分析！
