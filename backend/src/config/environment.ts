import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-gap-assessment',
  
  // Gemini AI configuration
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Email configuration (for 360 feedback invites)
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: parseInt(process.env.EMAIL_PORT || '587'),
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
  
  // Google Sheets configuration (for data import)
  googleSheetsClientId: process.env.GOOGLE_SHEETS_CLIENT_ID || '',
  googleSheetsClientSecret: process.env.GOOGLE_SHEETS_CLIENT_SECRET || '',
  googleSheetsRedirectUri: process.env.GOOGLE_SHEETS_REDIRECT_URI || '',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased for development
  
  // Security
  helmetEnabled: process.env.HELMET_ENABLED !== 'false',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables
export const validateConfig = (): void => {
  const requiredVars = ['GEMINI_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
    if (config.nodeEnv === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
};
