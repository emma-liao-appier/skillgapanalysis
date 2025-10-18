import React, { useState } from 'react';

interface AlignmentData {
  level: 'Strong alignment' | 'Partial alignment' | 'Low alignment';
  explanation: string;
}

interface AItlasReflectionProps {
  intro: string;
  alignment: AlignmentData;
  skillThemes: string[];
  onEditSkills: () => void;
  onContinue: () => void;
  onSkillThemesChange?: (themes: string[]) => void;
}

const AItlasReflection: React.FC<AItlasReflectionProps> = ({
  intro,
  alignment,
  skillThemes,
  onEditSkills,
  onContinue,
  onSkillThemesChange
}) => {
  const [editableThemes, setEditableThemes] = useState<string[]>(skillThemes);
  const [newTheme, setNewTheme] = useState('');
  const [isAddingTheme, setIsAddingTheme] = useState(false);

  const getAlignmentIcon = (level: string) => {
    switch (level) {
      case 'Strong alignment':
        return '✅';
      case 'Partial alignment':
        return '⚖️';
      case 'Low alignment':
        return '⚠️';
      default:
        return '⚖️';
    }
  };

  const getAlignmentColor = (level: string) => {
    switch (level) {
      case 'Strong alignment':
        return 'text-green-400';
      case 'Partial alignment':
        return 'text-yellow-400';
      case 'Low alignment':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const handleAddTheme = () => {
    if (newTheme.trim() && !editableThemes.includes(newTheme.trim())) {
      const updatedThemes = [...editableThemes, newTheme.trim()];
      setEditableThemes(updatedThemes);
      setNewTheme('');
      setIsAddingTheme(false);
      onSkillThemesChange?.(updatedThemes);
    }
  };

  const handleRemoveTheme = (index: number) => {
    const updatedThemes = editableThemes.filter((_, i) => i !== index);
    setEditableThemes(updatedThemes);
    onSkillThemesChange?.(updatedThemes);
  };

  // Split explanation into summary and bullet points - fix HTML rendering
  const cleanExplanation = alignment.explanation.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const explanationParts = cleanExplanation.split('.').filter(part => part.trim());
  const summary = explanationParts[0] || cleanExplanation;
  const bulletPoints = explanationParts.slice(1);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-4xl w-full space-y-6">
        
        {/* Goal Alignment Analysis - Simplified */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-center mb-4">
            <span className="text-3xl mr-3">{getAlignmentIcon(alignment.level)}</span>
            <h3 className={`text-xl font-bold ${getAlignmentColor(alignment.level)}`}>
              {alignment.level}
            </h3>
          </div>
          
          <div className="space-y-3">
            <p className="text-slate-300 text-base leading-relaxed">
              {summary}
            </p>
            
            {bulletPoints.length > 0 && (
              <div className="text-left">
                <ul className="space-y-1">
                  {bulletPoints.map((point, index) => (
                    <li key={index} className="text-slate-400 text-sm flex items-start">
                      <span className="text-cyan-400 mr-2 mt-1">•</span>
                      <span>{point.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Editable Skills */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <span className="mr-2">🌱</span>
              Skills
            </h3>
            <button
              onClick={() => setIsAddingTheme(true)}
              className="px-3 py-1 text-xs bg-cyan-600 text-white font-medium rounded-md hover:bg-cyan-500 transition-colors"
            >
              Edit
            </button>
          </div>
          
          <div className="space-y-3">
            {editableThemes.map((theme, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between group">
                <span className="text-white font-medium">{theme}</span>
                <button
                  onClick={() => handleRemoveTheme(index)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all px-2 py-1 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
            
            {isAddingTheme && (
              <div className="bg-white/5 rounded-lg p-3 border border-cyan-500/30">
                <input
                  type="text"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  placeholder="Enter new skill..."
                  className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTheme()}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAddTheme}
                    className="px-3 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-500"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingTheme(false);
                      setNewTheme('');
                    }}
                    className="px-3 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AItlasReflection;

