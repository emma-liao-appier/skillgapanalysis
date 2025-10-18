import express from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// SSO 認證端點
router.post('/authenticate', userController.authenticateSSO);

// Create a new user
router.post('/', userController.createUser);

// Get user by ID
router.get('/:id', userController.getUser);

// Update user
router.put('/:id', userController.updateUser);

// Get user by email (for SSO-style lookup)
router.get('/lookup/:email', userController.lookupUserByEmail);

// Get user profile (完整檔案)
router.get('/profile/:email', userController.getUserProfile);

// Get user OKR data
router.get('/:email/okr', userController.getUserOkr);

// Update user OKR
router.put('/:email/okr', userController.updateUserOkr);

// Get all users (with pagination) - 需要認證
router.get('/', authenticateUser, userController.getUsers);

export default router;
