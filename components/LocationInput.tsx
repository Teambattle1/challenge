import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LocationInputProps {
  onQuizGenerate: (location: string) => void;
  isLoading: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({ onQuizGenerate, isLoading }) => {
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim() && !isLoading) {
      onQuizGenerate(location.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="e.g., Paris, France"
        className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !location.trim()}
        className="flex justify-center items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition duration-200"
      >
        {isLoading ? <LoadingSpinner /> : 'Generate Quiz'}
      </button>
    </form>
  );
};

export default LocationInput;
