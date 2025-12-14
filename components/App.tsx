import React, { useState } from 'react';
import LoquizResults from './LoquizResults';
import GameListPage from './GameListPage';
import ApiKeyInput from './ApiKeyInput';

const App: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  // Pre-fill with the provided key.
  const [apiKey, setApiKey] = useState<string | null>('ApiKey-v1 63f6bec47b2cc86eb52ea7d84f2f96e250ab87544074cec8949d5862d368c154');

  const viewResults = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const goBackToLobby = () => {
    setSelectedGameId(null);
  };
  
  const handleKeySubmit = (key: string) => {
    setApiKey(key);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 transition-all duration-500 relative">
      <div className="w-full max-w-6xl flex items-center justify-center z-10 my-auto">
        {!apiKey ? (
          <ApiKeyInput onKeySubmit={handleKeySubmit} />
        ) : selectedGameId ? (
          <LoquizResults apiKey={apiKey} gameId={selectedGameId} onBack={goBackToLobby} />
        ) : (
          <GameListPage apiKey={apiKey} onGameSelect={viewResults} />
        )}
      </div>
    </div>
  );
};

export default App;