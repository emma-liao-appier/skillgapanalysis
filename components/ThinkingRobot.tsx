import React from 'react';

const ThinkingRobot: React.FC<{message?: string}> = ({ message = "Thinking..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 py-10">
      <div className="text-6xl animate-robot-think">🤖</div>
      <p className="text-lg text-center">{message}</p>
    </div>
  );
};

export default ThinkingRobot;
