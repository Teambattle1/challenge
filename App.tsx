import React, { useState, useEffect } from 'react';
import LoquizResults from './components/LoquizResults';
import GameListPage from './components/GameListPage';
import ApiKeyInput from './components/ApiKeyInput';

// Explicitly define views for better type safety and to prevent 'string vs ViewState' issues
type ViewState = 'login' | 'lobby' | 'results';

// PASTE YOUR API KEY HERE - Leave empty to use manual input
const HARDCODED_API_KEY: string = "ApiKey-v1 63f6bec47b2cc86eb52ea7d84f2f96e250ab87544074cec8949d5862d368c154"; 

const App: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  // Initialize key with hardcoded value or from localStorage
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (HARDCODED_API_KEY && HARDCODED_API_KEY.trim() !== "") {
      return HARDCODED_API_KEY.trim();
    }
    return localStorage.getItem('loquiz_api_key') || null;
  });

  // Calculate the current view based on state
  const currentView: ViewState = !apiKey ? 'login' : (selectedGameId ? 'results' : 'lobby');

  const viewResults = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const goBackToLobby = () => {
    setSelectedGameId(null);
  };

  const handleLogout = () => {
    // Prevent logout if using a hardcoded key as it would immediately log back in
    if (HARDCODED_API_KEY && HARDCODED_API_KEY.trim() !== "") return;
    
    localStorage.removeItem('loquiz_api_key');
    setApiKey(null);
    setSelectedGameId(null);
  };

  useEffect(() => {
    if (apiKey && apiKey !== "GUEST") {
      localStorage.setItem('loquiz_api_key', apiKey);
    }
  }, [apiKey]);
  
  const handleKeySubmit = (key: string) => {
    setApiKey(key);
  };

  const handleGuestEntry = () => {
    setApiKey("GUEST");
  };

  const isHardcoded = !!(HARDCODED_API_KEY && HARDCODED_API_KEY.trim() !== "");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 transition-all duration-500 relative">
      <div className="w-full max-w-6xl flex items-center justify-center z-10 my-auto">
        {currentView === 'login' && (
          <ApiKeyInput onKeySubmit={handleKeySubmit} />
        )}
        
        {currentView === 'results' && selectedGameId && (
          <LoquizResults apiKey={apiKey!} gameId={selectedGameId} onBack={goBackToLobby} />
        )}
        
        {currentView === 'lobby' && (
          <GameListPage 
            apiKey={apiKey!} 
            onGameSelect={viewResults} 
            onLogout={isHardcoded ? undefined : handleLogout} 
          />
        )}
      </div>
      
      {currentView === 'login' && !isHardcoded && (
        <button 
          onClick={handleGuestEntry}
          className="absolute bottom-4 text-zinc-600 text-xs hover:text-zinc-400 uppercase tracking-widest transition-colors"
        >
          Continue as Guest
        </button>
      )}
    </div>
  );
};

export default App;