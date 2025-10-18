import { Request, Response } from 'express';
import { User, IUser } from '../models/User';

export class UserController {
  // Create a new user
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, name, department, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      const user = new User({
        email,
        name,
        department,
        role
      });

      const savedUser = await user.save();
      res.status(201).json(savedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  };

  // Get user by ID
  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  // Update user
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  };

  // Get user by email
  getUserByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user by email:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  // Get all users (with pagination)
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments();

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  // Lookup user by email (SSO-style)
  lookupUserByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const normalizedEmail = email.toLowerCase().trim();

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

      // Return user data for role confirmation
      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          division: user.division,
          location: user.location,
          jobLevel: user.jobLevel,
          careerLadder: user.careerLadder,
          lineManager: user.lineManager,
          functionalLead: user.functionalLead,
          q4Okr: user.q4Okr
        },
        isEmployee: true,
        message: 'User found successfully'
      });

    } catch (error) {
      console.error('Error looking up user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get user OKR data
  getUserOkr = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail }).select('email name q4Okr');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        email: user.email,
        name: user.name,
        q4Okr: user.q4Okr || null
      });
    } catch (error) {
      console.error('Error fetching user OKR:', error);
      res.status(500).json({ error: 'Failed to fetch user OKR' });
    }
  };

  // Update user OKR
  updateUserOkr = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const normalizedEmail = email.toLowerCase().trim();
      const { q4Okr } = req.body;

      const user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { q4Okr },
        { new: true, runValidators: true }
      ).select('email name q4Okr');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        email: user.email,
        name: user.name,
        q4Okr: user.q4Okr
      });
    } catch (error) {
      console.error('Error updating user OKR:', error);
      res.status(500).json({ error: 'Failed to update user OKR' });
    }
  };

  // SSO 認證 - 驗證用戶並返回基本資訊
  authenticateSSO = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ 
          error: 'Email required',
          message: 'Please provide your email address'
        });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
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

      // 返回用戶基本資訊
      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          division: user.division,
          location: user.location,
          jobLevel: user.jobLevel,
          careerLadder: user.careerLadder,
          lineManager: user.lineManager,
          lineManagerEmail: user.lineManagerEmail,
          functionalLead: user.functionalLead,
          functionalLeadEmail: user.functionalLeadEmail,
          q4Okr: user.q4Okr
        },
        isEmployee: true,
        message: 'Authentication successful'
      });

    } catch (error) {
      console.error('Error in SSO authentication:', error);
      res.status(500).json({ 
        error: 'Authentication failed',
        message: 'Internal server error during authentication'
      });
    }
  };

  // 獲取用戶完整檔案
  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        division: user.division,
        location: user.location,
        jobLevel: user.jobLevel,
        careerLadder: user.careerLadder,
        lineManager: user.lineManager,
        lineManagerEmail: user.lineManagerEmail,
        functionalLead: user.functionalLead,
        functionalLeadEmail: user.functionalLeadEmail,
        companyEntryDate: user.companyEntryDate,
        q4Okr: user.q4Okr,
        isEmployee: user.isEmployee,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  };
}
