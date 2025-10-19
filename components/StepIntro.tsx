import React from 'react';
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
  functionalLead: string;
}

interface StepIntroProps {
  user: User;
  onNext: () => void;
}

const StepIntro: React.FC<StepIntroProps> = ({ user, onNext }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col justify-center items-center h-full text-center">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">
          Hi, {user.name.split(' ')[0]}! 👋
        </h1>
        <h2 className="text-2xl font-semibold text-blue-200">
          Welcome to Your Skill Assessment
        </h2>
      </div>
      
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 max-w-2xl">
        <div className="text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-blue-200 font-medium">Role:</span>
            <span className="text-white">{user.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200 font-medium">Department:</span>
            <span className="text-white">{user.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200 font-medium">Location:</span>
            <span className="text-white">{user.location}</span>
          </div>
          {user.lineManager && (
            <div className="flex justify-between">
              <span className="text-blue-200 font-medium">Line Manager:</span>
              <span className="text-white">{user.lineManager}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="max-w-2xl mb-8">
        <p className="text-slate-300 text-lg mb-4">
          This conversational tool will help you reflect on your current skills and identify key areas for growth.
        </p>
        <p className="text-slate-400">
          The process should take about 5-10 minutes. Your honest self-assessment will help generate a personalized development summary.
        </p>
      </div>
      
      <button
        onClick={onNext}
        className="px-8 py-3 bg-cyan-500 text-white font-semibold rounded-full hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
      >
        Start Assessment
      </button>
    </div>
  );
};

export default StepIntro;
