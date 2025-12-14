import React from 'react';

interface ScoreScreenProps {
  score: number;
  totalQuestions: number;
  onPlayAgain: () => void;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({ score, totalQuestions, onPlayAgain }) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getFeedback = () => {
    if (percentage === 100) return "Perfect Score! You're a geography genius!";
    if (percentage >= 80) return "Excellent! You really know your stuff.";
    if (percentage >= 50) return "Good job! A solid score.";
    return "Nice try! Keep exploring and learn more.";
  };

  return (
    <div className="w-full max-w-md text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
      <p className="text-gray-500 mb-6">Here's how you did:</p>
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-indigo-600"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-indigo-600">{score}/{totalQuestions}</span>
        </div>
      </div>
      <p className="text-xl font-medium text-gray-700 mb-8">{getFeedback()}</p>
      <button
        onClick={onPlayAgain}
        className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
      >
        Play Again
      </button>
    </div>
  );
};

export default ScoreScreen;
