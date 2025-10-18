# SSO 認證系統使用說明

## 🔐 SSO 認證流程

### 1. 用戶登入流程
```
用戶輸入 email → 系統檢查 email 是否在 User collection 中
├─ 如果 email 存在且 isEmployee = true → 登入成功
├─ 如果 email 不存在 → 顯示錯誤："請聯繫 L&D 檢查權限"
└─ 如果 email 存在但 isEmployee = false → 顯示錯誤："請聯繫 L&D 檢查權限"
```

### 2. API 端點

#### SSO 認證
```http
POST /api/users/authenticate
Content-Type: application/json

{
  "email": "user@company.com"
}
```

**成功回應：**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@company.com",
    "name": "User Name",
    "role": "Software Engineer",
    "department": "Engineering",
    "division": "Technology",
    "businessObjectives": "可編輯的業務目標",
    "keyObjectives": ["關鍵目標1", "關鍵目標2"],
    "personalGoals": "個人目標"
  },
  "isEmployee": true,
  "message": "Authentication successful"
}
```

**失敗回應：**
```json
{
  "error": "User not found",
  "message": "You are not in the employee list. Please contact L&D at emma.liao@appier.com for further support.",
  "isEmployee": false
}
```

#### 更新用戶目標
```http
PUT /api/users/{email}/objectives
Content-Type: application/json

{
  "businessObjectives": "新的業務目標",
  "keyObjectives": ["目標1", "目標2"],
  "personalGoals": "個人目標"
}
```

#### 獲取用戶完整檔案
```http
GET /api/users/profile/{email}
```

### 3. 認證中間件

#### 基本認證中間件
```typescript
import { authenticateUser } from '../middleware/auth';

// 保護需要登入的端點
router.get('/protected', authenticateUser, controller.method);
```

#### 可選認證中間件
```typescript
import { optionalAuth } from '../middleware/auth';

// 可選認證，如果有 email 則驗證
router.get('/optional', optionalAuth, controller.method);
```

#### 部門限制中間件
```typescript
import { requireDepartment } from '../middleware/auth';

// 只允許特定部門訪問
router.get('/hr-only', requireDepartment(['HR', 'People']), controller.method);
```

#### 角色限制中間件
```typescript
import { requireRole } from '../middleware/auth';

// 只允許特定角色訪問
router.get('/manager-only', requireRole(['Manager', 'Director']), controller.method);
```

### 4. 前端使用

#### SSO 認證組件
```typescript
import SSOAuth from './components/SSOAuth';

<SSOAuth 
  onUserAuthenticated={(user) => {
    // 用戶認證成功
    console.log('User authenticated:', user);
  }}
  onError={(message) => {
    // 認證失敗
    console.error('Authentication failed:', message);
  }}
/>
```

#### API 服務使用
```typescript
import { apiService } from './services/apiService';

// SSO 認證
const response = await apiService.authenticateSSO('user@company.com');

// 更新用戶目標
await apiService.updateUserObjectives('user@company.com', {
  businessObjectives: '新的業務目標',
  keyObjectives: ['目標1', '目標2'],
  personalGoals: '個人目標'
});

// 獲取用戶檔案
const profile = await apiService.getUserProfile('user@company.com');
```

### 5. 錯誤處理

#### 常見錯誤訊息
- `"You are not in the employee list. Please contact L&D at emma.liao@appier.com for further support."` - 用戶不在員工清單中
- `"Authentication required"` - 需要提供 email 進行認證
- `"Access denied"` - 用戶無權限訪問
- `"Internal server error during authentication"` - 認證過程發生內部錯誤

### 6. 安全考量

1. **Email 正規化**：所有 email 都會轉換為小寫並去除空白
2. **權限檢查**：檢查 `isEmployee` 欄位確保只有員工可以訪問
3. **錯誤訊息**：不洩露敏感資訊，統一導向 L&D 聯繫方式
4. **中間件保護**：敏感端點使用認證中間件保護

### 7. 資料庫欄位說明

#### User 模型新增欄位
- `businessObjectives?: string` - 業務目標（可編輯）
- `keyObjectives?: string[]` - 關鍵目標陣列（可編輯）
- `personalGoals?: string` - 個人目標

#### 使用方式
用戶可以透過 API 更新這些欄位，系統會自動保存到資料庫中。

