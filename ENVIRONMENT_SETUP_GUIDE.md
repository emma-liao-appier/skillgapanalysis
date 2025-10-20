# Skill Gap Assessment Tool - 環境設置指南

## 📋 概述

這份指南將幫助你的同事快速設置和測試 Skill Gap Assessment Tool 的完整環境，包括前端、後端 API 和 MongoDB 數據庫。

## 🎯 系統架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port 3000     │    │   Port 3001     │    │   Port 27017    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐             │
         │              │   Gemini AI     │             │
         └──────────────►│   (Backend)     │◄────────────┘
                        └─────────────────┘
```

## 🛠️ 前置需求

### 必要軟體
- **Docker** (版本 20.10+)
- **Docker Compose** (版本 2.0+)
- **Node.js** (版本 18+，用於本地開發)
- **Git**

### API 金鑰
- **Google Gemini API Key** - 用於 AI 技能生成功能

## 🚀 快速設置 (推薦方式)

### 步驟 1: 克隆專案
```bash
git clone <repository-url>
cd skillgapanalysis
```

### 步驟 2: 運行設置腳本
```bash
chmod +x setup.sh
./setup.sh
```

### 步驟 3: 配置環境變數
創建 `backend/.env` 文件：
```bash
# 服務器配置
PORT=3001
NODE_ENV=development

# 數據庫配置
MONGODB_URI=mongodb://admin:password123@mongodb:27017/skill-gap-assessment?authSource=admin

# AI 配置 (必須)
GEMINI_API_KEY=your_gemini_api_key_here

# JWT 安全配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:3000

# 電子郵件配置 (360 度反饋功能)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourcompany.com

# Google Sheets 配置 (數據導入功能)
GOOGLE_SHEETS_CLIENT_ID=your_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_client_secret
GOOGLE_SHEETS_REDIRECT_URI=http://localhost:3001/auth/google/callback

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5000
```

### 步驟 4: 啟動服務
```bash
docker-compose up -d
```

### 步驟 5: 驗證服務狀態
```bash
# 檢查容器狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

## 🌐 訪問應用程式

- **前端應用**: http://localhost:3000
- **後端 API**: http://localhost:3001
- **API 健康檢查**: http://localhost:3001/health
- **MongoDB**: localhost:27017

## 📊 數據庫 Schema

### Users Collection
```typescript
{
  email: string;                    // 用戶電子郵件 (唯一)
  name: string;                     // 用戶姓名
  department?: string;              // 部門
  role?: string;                    // 職位
  division?: string;                // 事業部
  location?: string;                // 地點
  jobLevel?: string;                // 職級
  careerLadder?: string;            // 職涯階梯
  lineManager?: string;             // 直屬主管
  lineManagerEmail?: string;        // 直屬主管郵箱
  functionalLead?: string;          // 功能主管
  functionalLeadEmail?: string;     // 功能主管郵箱
  companyEntryDate?: string;       // 入職日期
  q4Okr?: string;                  // Q4 OKR
  isEmployee: boolean;             // 是否為員工
  isActive: boolean;                // 是否啟用
  assessments: ObjectId[];         // 關聯的評估
  createdAt: Date;
  updatedAt: Date;
}
```

### Assessments Collection
```typescript
{
  userId: ObjectId;                 // 用戶 ID
  period: string;                   // 評估期間 (預設: "2025Q4")
  status: 'draft' | 'submitted';   // 狀態
  language: string;                 // 語言 (預設: 'English')
  
  // 商業相關
  role: string;                     // 職位
  businessGoal: string;             // 商業目標
  keyResults: string;               // 關鍵結果
  businessSkills: ISkill[];         // 商業技能
  businessFeedbackSupport: string; // 支持反饋
  businessFeedbackObstacles: string; // 障礙反饋
  
  // 職涯相關
  careerGoal: string;               // 職涯目標
  careerSkills: ISkill[];           // 職涯技能
  
  // 總結
  nextSteps: string[];              // 下一步行動
  nextStepsOther: string;           // 其他行動
  finalThoughts: string;           // 最終想法
  
  // 分析數據 (快取)
  readinessBusiness: number;        // 商業準備度 (0-1)
  readinessCareer: number;          // 職涯準備度 (0-1)
  alignmentScore: number;           // 對齊分數 (0-100)
  alignmentLevel: 'High' | 'Partial' | 'Low'; // 對齊等級
  talentType: string;               // 人才類型
  focusAreas: string[];             // 重點領域
  categoryAverages: any;            // 類別平均
  alignmentInsights: string;        // 對齊洞察
  alignmentComponents: {            // 對齊組件
    skillOverlapRate: number;
    skillRatingSimilarity: number;
    categoryBalance: number;
    semanticMatch: number;
    finalScore: number;
  };
  vennDiagramFeedback: {           // 韋恩圖反饋
    businessFeedback: string;
    careerFeedback: string;
    alignmentFeedback: string;
  };
  
  submittedAt?: Date;               // 提交時間
  createdAt: Date;
  updatedAt: Date;
}
```

### Skills Collection
```typescript
{
  skillId: string;                  // 技能 ID (唯一)
  name: string;                     // 技能名稱
  description: string;             // 技能描述
  category: SkillCategory;          // 技能類別
  type: 'general' | 'functional';  // 技能類型
  isActive: boolean;                // 是否啟用
  createdAt: Date;
  updatedAt: Date;
}
```

### AI 生成技能 Collection (`GeneratedSkill`)
為了追蹤 AI 生成的 functional skills 並避免重複/重疊，我們新增 `GeneratedSkill` 集合：
```typescript
{
  userId: ObjectId;                 // 生成時的使用者，用於上下文
  assessmentId: ObjectId;           // 關聯的評估，用於回溯
  name: string;                     // 技能名稱 (原始)
  normalizedName: string;           // 標準化名稱 (小寫、去標點) 用於重複檢查
  description: string;              // 技能描述
  category: SkillCategory;          // 技能類別 (functional/ai_capability/…)
  source: 'ai';                     // 來源
  model?: string;                   // 例如 gemini-1.5-pro
  promptHash?: string;              // 提示詞雜湊，便於審計
  dedupHash: string;                // 名稱+類別雜湊，唯一約束
  createdAt: Date;
  updatedAt: Date;
}
```

索引與唯一性策略：
- `dedupHash` 唯一，避免相同語義重複寫入
- `(assessmentId, normalizedName)`、`(userId, normalizedName)` 複合索引，快速檢查重疊

### Skill Categories
```typescript
enum SkillCategory {
  ProblemSolving = 'problem_solving',
  Communication = 'communication',
  AICapability = 'ai_capability',
  Leadership = 'leadership',
  Functional = 'functional'
}
```

### 360 度反饋 Collections(Building, 感覺有點複雜可能先略過)

#### FeedbackInvite
```typescript
{
  assessmentId: ObjectId;          // 評估 ID
  assesseeUserId: ObjectId;        // 被評估者 ID
  assessorEmail: string;            // 評估者郵箱
  relationship: 'manager' | 'peer' | 'directReport' | 'other'; // 關係
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'responded'; // 狀態
  tokenHash: string;                // 令牌雜湊
  expiresAt: Date;                  // 過期時間
  createdAt: Date;
  updatedAt: Date;
}
```

#### FeedbackResponse
```typescript
{
  inviteId: ObjectId;               // 邀請 ID
  assessmentId: ObjectId;           // 評估 ID
  ratings: {                        // 評分
    skillId: string;
    rating: number;
    comment?: string;
  }[];
  overallComments?: string;         // 整體評論
  submittedAt: Date;                // 提交時間
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 數據庫初始化

### 手動初始化
如果需要手動設置數據庫，可以運行以下腳本：

```bash
# 進入後端目錄
cd backend

# 安裝依賴
npm install

# 運行數據導入腳本
npm run import-employees    # 導入員工數據
npm run import-skills      # 導入技能目錄
npm run import-okr         # 導入 OKR 數據
```

### 數據導入腳本說明
- `importEmployees.ts`: 從 CSV 文件導入員工數據
- `importSkillCatalogue.ts`: 導入技能目錄
- `importOkrData.ts`: 導入 OKR 數據
- `migrate-assessment-schema.ts`: 遷移評估架構

## 🔍 測試功能

### 1. 基本功能測試
```bash
# 測試 API 健康狀態
curl http://localhost:3001/health

# 測試用戶創建
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### 2. AI 功能測試
```bash
# 測試技能生成
curl -X POST http://localhost:3001/api/assessments/optimize-text \
  -H "Content-Type: application/json" \
  -d '{"text":"I want to improve my leadership skills"}'
```

### 3. 前端功能測試
1. 訪問 http://localhost:3000
2. 測試多語言切換
3. 測試技能評估流程
4. 測試 AI 生成功能

## 🐛 常見問題排除

### 問題 1: Docker 容器無法啟動
```bash
# 檢查 Docker 狀態
docker --version
docker-compose --version

# 重啟 Docker 服務
sudo systemctl restart docker  # Linux
# 或重啟 Docker Desktop (macOS/Windows)
```

### 問題 2: MongoDB 連接失敗
```bash
# 檢查 MongoDB 容器
docker-compose logs mongodb

# 重啟 MongoDB
docker-compose restart mongodb
```

### 問題 3: API 無法訪問
```bash
# 檢查後端容器
docker-compose logs backend

# 檢查端口占用
netstat -tulpn | grep :3001
```

### 問題 4: Gemini API 錯誤
- 確認 `GEMINI_API_KEY` 已正確設置
- 檢查 API 配額和限制
- 查看後端日誌中的詳細錯誤信息

## 📝 開發模式設置

### 本地開發 (不使用 Docker)
```bash
# 1. 啟動 MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 2. 設置後端
cd backend
npm install
cp .env.example .env  # 編輯 .env 文件
npm run dev

# 3. 設置前端
cd ..
npm install
npm run dev
```

### 環境變數檢查
```bash
# 檢查後端環境變數
cd backend
node -e "require('dotenv').config(); console.log(process.env.GEMINI_API_KEY ? '✅ Gemini API Key 已設置' : '❌ Gemini API Key 未設置')"
```

## 🔒 安全注意事項

1. **生產環境設置**:
   - 更改所有預設密碼
   - 使用強 JWT 密鑰
   - 設置適當的 CORS 政策
   - 啟用 HTTPS

2. **API 金鑰保護**:
   - 不要將 API 金鑰提交到版本控制
   - 使用環境變數存儲敏感信息
   - 定期輪換 API 金鑰

3. **數據庫安全**:
   - 設置 MongoDB 認證
   - 限制數據庫訪問權限
   - 定期備份數據

## 📞 支援與協助

如果遇到問題，請：

1. 檢查 Docker 容器日誌: `docker-compose logs -f`
2. 確認所有環境變數已正確設置
3. 檢查端口是否被占用
4. 查看 README.md 獲取更多信息
5. 聯繫開發團隊獲取協助

## 🎉 完成設置

設置完成後，你應該能夠：

- ✅ 訪問前端應用 (http://localhost:3000)
- ✅ 使用後端 API (http://localhost:3001)
- ✅ 連接 MongoDB 數據庫
- ✅ 使用 AI 技能生成功能
- ✅ 測試 360 度反饋系統
- ✅ 導入 Google Sheets 數據

---

**祝測試順利！** 🚀

## 🤖 AI 推薦與重疊檢查策略

### 目標
針對 biz/career 推薦：
- 從 `Skill` catalogue 推薦 3 個 `general` 技能
- 由 AI 生成 2 個 `functional` 技能

### 重疊檢查流程（functional skills）
1. 將候選技能名稱標準化為 `normalizedName`（小寫、移除標點、合併空白）
2. 查詢是否與現有 `businessSkills`/`careerSkills` 名稱近似（可用 normalized 比對）
3. 查詢 `GeneratedSkill`：
   - 先比對相同 `assessmentId` + `normalizedName`
   - 其次比對相同 `userId` + `normalizedName`（避免同人多評估重覆）
   - 以及比對 `Skill` catalogue 中是否已有等價條目
4. 若發現重疊則：
   - 以語義相似度（如簡單字串相似度、或向量相似度若可用）過濾掉
   - 或改名（例如加入語境詞）以避免與 catalogue 撞名
5. 寫入 `GeneratedSkill`，保存 `model`、`promptHash` 與 `dedupHash` 以利審計

### 推薦 API 實作要點
- 先從 `Skill` 集合查出 3 個 `type = general` 且符合 `category`/語境的技能
- 取得 AI 生成的 2 個 functional 候選，逐一套用上述重疊檢查
- 將過濾後的結果：
  - 回填到 `Assessment.businessSkills` 或 `Assessment.careerSkills`
  - 同步寫入 `GeneratedSkill` 作為審計與日後重用依據

### 為什麼需要 `GeneratedSkill`
- 可追蹤來源與審計（model、promptHash）
- 便於跨評估/跨時段去重
- 為將來做推薦回用（例如從歷史生成中挑選高接受度的技能）
