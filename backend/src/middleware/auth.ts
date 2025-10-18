import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

// 擴展 Request 介面以包含用戶資訊
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role?: string;
        department?: string;
        division?: string;
        isEmployee: boolean;
      };
    }
  }
}

/**
 * SSO 認證中間件
 * 檢查用戶是否在允許的員工清單中
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 從 header 或 query 參數獲取 email
    const email = req.headers['x-user-email'] as string || req.query.email as string;
    
    if (!email) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide your email address for authentication'
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // 查找用戶
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      res.status(404).json({ 
        error: 'User not found',
        message: 'You are not in the employee list. Please contact L&D at emma.liao@appier.com for further support.',
        isEmployee: false
      });
      return;
    }

    if (!user.isEmployee) {
      res.status(403).json({ 
        error: 'Access denied',
        message: 'You are not in the employee list. Please contact L&D at emma.liao@appier.com for further support.',
        isEmployee: false
      });
      return;
    }

    // 將用戶資訊附加到 request 物件
    req.user = {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      division: user.division,
      isEmployee: user.isEmployee
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * 可選認證中間件
 * 如果提供 email 則驗證，否則繼續執行
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.headers['x-user-email'] as string || req.query.email as string;
    
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      
      if (user && user.isEmployee) {
        req.user = {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          division: user.division,
          isEmployee: user.isEmployee
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // 可選認證失敗時不阻擋請求
    next();
  }
};

/**
 * 檢查用戶是否為特定部門
 */
export const requireDepartment = (allowedDepartments: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
      return;
    }

    if (!req.user.department || !allowedDepartments.includes(req.user.department)) {
      res.status(403).json({ 
        error: 'Access denied',
        message: `Access restricted to: ${allowedDepartments.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * 檢查用戶是否為特定角色
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Access denied',
        message: `Access restricted to roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};
