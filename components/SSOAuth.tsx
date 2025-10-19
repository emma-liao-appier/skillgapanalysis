import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  division: string;
  location: string;
  jobLevel: string;
  careerLadder: string;
  lineManager: string;
  lineManagerEmail: string;
  functionalLead: string;
  functionalLeadEmail: string;
  q4Okr?: string;
}

interface SSOAuthProps {
  onUserAuthenticated: (user: User) => void;
  onError: (message: string) => void;
}

const SSOAuth: React.FC<SSOAuthProps> = ({ onUserAuthenticated, onError }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);

  useEffect(() => {
    // Simulate SSO detection - in a real implementation, this would be handled by your SSO provider
    // For now, we'll try to detect the user automatically
    attemptSSOLogin();
  }, []);

  const attemptSSOLogin = async () => {
    try {
      // In a real SSO implementation, you would:
      // 1. Check for SSO tokens/cookies
      // 2. Validate with your identity provider
      // 3. Extract user information
      
      // For demo purposes, let's try to get user info from browser storage or URL params
      const ssoEmail = getSSOEmail();
      
      if (ssoEmail) {
        await authenticateUser(ssoEmail);
      } else {
        // No SSO detected, show manual entry option
        setIsManualEntry(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('SSO authentication failed:', error);
      setIsManualEntry(true);
      setIsLoading(false);
    }
  };

  const getSSOEmail = (): string | null => {
    // In a real implementation, this would extract email from:
    // - SSO tokens
    // - Cookies
    // - URL parameters
    // - Browser storage
    
    // For demo, let's check URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (emailParam) {
      return emailParam;
    }
    
    // Check localStorage for demo purposes
    const storedEmail = localStorage.getItem('sso_email');
    if (storedEmail) {
      return storedEmail;
    }
    
    return null;
  };

  const authenticateUser = async (userEmail: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.authenticateSSO(userEmail) as any;
      
      if (response.isEmployee) {
        // Store for future use
        localStorage.setItem('sso_email', userEmail);
        onUserAuthenticated(response.user);
      } else {
        onError(response.message || 'Access denied');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      onError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async () => {
    if (!email.trim()) {
      onError('Please enter your email address');
      return;
    }
    
    await authenticateUser(email.trim());
  };

  const handleDemoLogin = () => {
    // For demo purposes, let's use Emma's email
    authenticateUser('emma.liao@appier.com');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-blue-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Authenticating...</p>
          <p className="text-blue-200 text-sm mt-2">Please wait while we verify your identity</p>
        </div>
      </div>
    );
  }

  if (isManualEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Skill Assessment</h1>
            <p className="text-blue-200">Please enter your email to continue</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@appier.com"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyPress={(e) => e.key === 'Enter' && handleManualLogin()}
              />
            </div>
            
            <button
              onClick={handleManualLogin}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue
            </button>
            
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-2">Demo Mode</p>
              <button
                onClick={handleDemoLogin}
                className="text-blue-300 hover:text-blue-200 underline text-sm"
              >
                Login as Emma Liao (Demo)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SSOAuth;

