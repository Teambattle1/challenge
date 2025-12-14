import React, { useState, useMemo } from 'react';
import { Question } from '../types';
import { CheckIcon, XIcon } from './icons';

interface QuizProps {
  quizData: Question[];
  onQuizComplete: (score: number) => void;
  location: string;
}

const Quiz: React.FC<QuizProps> = ({ quizData, onQuizComplete, location }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = useMemo(() => quizData[currentQuestionIndex], [quizData, currentQuestionIndex]);
  const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswerIndex;

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswerIndex(index);
    setIsAnswered(true);
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
    } else {
      onQuizComplete(score);
    }
  };

  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return 'bg-white hover:bg-indigo-50 border-gray-300';
    }
    if (index === currentQuestion.correctAnswerIndex) {
      return 'bg-green-100 border-green-500 text-green-800';
    }
    if (index === selectedAnswerIndex) {
      return 'bg-red-100 border-red-500 text-red-800';
    }
    return 'bg-white border-gray-300 opacity-60';
  };

  return (
    <div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
      <div className="mb-6">
        <p className="text-indigo-600 font-semibold">Quiz for {location}</p>
        <div className="flex justify-between items-center mt-2">
          <h2 className="text-xl font-bold text-gray-700">Question {currentQuestionIndex + 1}/{quizData.length}</h2>
          <p className="text-lg font-bold text-gray-700">Score: {score}</p>
        </div>
      </div>

      <p className="text-lg text-gray-800 font-medium mb-6 min-h-[56px]">{currentQuestion.questionText}</p>

      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={isAnswered}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${getButtonClass(index)}`}
          >
            <span className="font-medium">{option}</span>
            {isAnswered && index === currentQuestion.correctAnswerIndex && <CheckIcon className="w-6 h-6 text-green-600" />}
            {isAnswered && index === selectedAnswerIndex && index !== currentQuestion.correctAnswerIndex && <XIcon className="w-6 h-6 text-red-600" />}
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className="mt-6 text-center">
            {isCorrect ? (
                <p className="text-green-600 font-semibold">Correct!</p>
            ) : (
                <p className="text-red-600 font-semibold">
                    Sorry, the correct answer was: {currentQuestion.options[currentQuestion.correctAnswerIndex]}
                </p>
            )}
            <button
            onClick={handleNextQuestion}
            className="mt-4 w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
            >
            {currentQuestionIndex < quizData.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
