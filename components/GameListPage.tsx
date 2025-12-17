import React, { useState, useEffect, useRef } from 'react';
import { GameListItem } from '../types';
import { fetchGames } from '../services/loquizService';

interface GameListPageProps {
  apiKey: string;
  onGameSelect: (gameId: string) => void;
  onLogout?: () => void;
}

type TabType = 'today' | 'planned' | 'completed';

const parseGameDate = (rawValue: string | number | undefined): Date | null => {
    if (!rawValue) return null;

    let d: Date | null = null;

    // Handle numeric timestamp
    if (typeof rawValue === 'number') {
        if (rawValue < 100000000000) {
             d = new Date(rawValue * 1000);
        } else {
             d = new Date(rawValue);
        }
    } 
    // Handle numeric string
    else if (typeof rawValue === 'string' && !isNaN(Number(rawValue)) && !rawValue.includes('-') && !rawValue.includes('.') && !rawValue.includes('/') && !rawValue.includes('T') && !rawValue.includes(':')) {
        const num = Number(rawValue);
        if (num < 100000000000) {
             d = new Date(num * 1000);
        } else {
             d = new Date(num);
        }
    }
    // Handle formatted string date
    else if (typeof rawValue === 'string') {
        const cleanVal = rawValue.trim();
        const euDateRegex = /^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})(?:\s.*)?$/;
        const euMatch = cleanVal.match(euDateRegex);

        if (euMatch) {
            const day = parseInt(euMatch[1], 10);
            const month = parseInt(euMatch[2], 10) - 1; 
            let year = parseInt(euMatch[3], 10);
            if (year < 100) year += 2000;
            d = new Date(year, month, day);
        } else {
            const iso = cleanVal.replace(' ', 'T');
            const temp = new Date(iso);
            if (!isNaN(temp.getTime())) {
                d = temp;
            } else {
                const original = new Date(cleanVal);
                if (!isNaN(original.getTime())) d = original;
            }
        }
    }

    if (d && !isNaN(d.getTime())) {
        return d;
    }
    return null;
};

const GameListPage: React.FC<GameListPageProps> = ({ apiKey, onGameSelect, onLogout }) => {
  const [games, setGames] = useState<GameListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [manualGameId, setManualGameId] = useState('');
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('today');

  useEffect(() => {
    const loadGames = async () => {
      // In Guest mode, skip fetch and show manual input
      if (apiKey === 'GUEST' || apiKey === 'SKIP') {
          setIsLoading(false);
          setTimeout(() => manualInputRef.current?.focus(), 100);
          return;
      }

      try {
        setListError(null);
        setIsLoading(true);
        const gameList = await fetchGames(apiKey);
        setGames(gameList);
      } catch (err: any) {
        console.warn("Could not load game list:", err);
        let errorMessage = 'Could not load the list of games. Please enter your Game ID manually below.';
        if (err.message) {
            const msg = err.message.toLowerCase();
            if (msg.includes('401') || msg.includes('unauthorized')) errorMessage = 'Invalid API Key.';
            else if (msg.includes('403')) errorMessage = 'Access forbidden.';
            else if (msg.includes('network')) errorMessage = 'Connection failed.';
        }
        setListError(errorMessage);
        setTimeout(() => manualInputRef.current?.focus(), 100);
      } finally {
        setIsLoading(false);
      }
    };
    loadGames();
  }, [apiKey]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualGameId.trim()) onGameSelect(manualGameId.trim());
  };

  const getGroupedGames = () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const grouped = {
          today: [] as GameListItem[],
          planned: [] as GameListItem[],
          completed: [] as GameListItem[]
      };

      games.forEach(game => {
          const statusStr = String(game.status || '').toLowerCase();
          const isClosed = statusStr === 'closed' || statusStr === 'ended' || statusStr === 'archived' || game.isPlayable === false;
          
          if (isClosed) {
              grouped.completed.push(game);
              return;
          }

          const date = parseGameDate(game.created);
          
          if (!date) {
              grouped.completed.push(game);
              return;
          }

          const time = date.getTime();

          if (time < todayStart.getTime()) {
              grouped.completed.push(game);
          } else if (time > todayEnd.getTime()) {
              grouped.planned.push(game);
          } else {
              grouped.today.push(game);
          }
      });

      grouped.today.sort((a, b) => (parseGameDate(a.created)?.getTime() || 0) - (parseGameDate(b.created)?.getTime() || 0));
      grouped.planned.sort((a, b) => (parseGameDate(a.created)?.getTime() || 0) - (parseGameDate(b.created)?.getTime() || 0));
      grouped.completed.sort((a, b) => (parseGameDate(b.created)?.getTime() || 0) - (parseGameDate(a.created)?.getTime() || 0));

      return grouped;
  };

  const groupedGames = getGroupedGames();
  const currentList = groupedGames[activeTab];

  const TabButton: React.FC<{ tab: TabType, label: string, count: number }> = ({ tab, label, count }) => (
      <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-3 md:py-4 flex flex-col items-center justify-center relative transition-all duration-300 ${activeTab === tab ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
          <span className={`text-sm md:text-lg font-black uppercase tracking-widest z-10 ${activeTab === tab ? 'drop-shadow-glow' : ''}`}>
              {label}
          </span>
          <span className={`text-[10px] md:text-xs font-mono mt-1 ${activeTab === tab ? 'text-orange-300' : 'text-zinc-600'}`}>
              {count} Games
          </span>
          
          {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
          )}
          
          {activeTab === tab && (
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-100"></div>
          )}
      </button>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col items-center min-h-[85vh]">
      <div className="text-center mb-6 relative w-full">
        {/* Logout/Login Button - Only shown if onLogout is provided */}
        {onLogout && (
             <button 
                onClick={onLogout}
                className="absolute top-0 right-0 text-[9px] uppercase font-bold text-zinc-600 hover:text-orange-500 border border-zinc-800 hover:border-orange-500 px-2 py-1 rounded transition-colors"
             >
                {apiKey === 'GUEST' ? 'Login' : 'Logout'}
             </button>
        )}
        
        <h1 className="text-4xl md:text-6xl font-black text-orange-500 mb-2 tracking-tighter uppercase drop-shadow-sm filter">
            TEAMCHALLENGE
        </h1>
        <p className="text-zinc-500 font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase">Select your battleground</p>
      </div>
      
      {listError && !isLoading && apiKey !== 'GUEST' && (
          <div className="w-full max-w-md bg-red-900/20 border border-red-500/50 p-4 mb-6 rounded text-red-300 text-sm flex items-center">
             <span className="mr-2 text-xl">!</span> {listError}
          </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center flex-grow justify-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 uppercase tracking-widest text-xs animate-pulse">Scanning...</p>
        </div>
      ) : (
         (!listError || games.length > 0) && (
             <div className="w-full max-w-4xl flex flex-col flex-grow">
                 {/* Tabs */}
                 <div className="flex border-b border-zinc-800 bg-zinc-900/30 rounded-t-xl overflow-hidden mb-0">
                     <TabButton tab="today" label="Today" count={groupedGames.today.length} />
                     <TabButton tab="planned" label="Planned" count={groupedGames.planned.length} />
                     <TabButton tab="completed" label="Completed" count={groupedGames.completed.length} />
                 </div>

                 {/* List Container */}
                 <div className="bg-black/40 border-x border-b border-zinc-800 rounded-b-xl min-h-[400px] max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 relative p-2 md:p-4">
                     {currentList.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                            {currentList.map(game => {
                                const dateObj = parseGameDate(game.created);
                                const isCompletedTab = activeTab === 'completed';
                                
                                return (
                                <li key={game.id} className="animate-fade-in">
                                    <button
                                    onClick={() => onGameSelect(game.id)}
                                    className={`w-full text-left p-4 md:p-5 transition-all duration-200 rounded-lg focus:outline-none group border-l-4 relative overflow-hidden ${
                                        isCompletedTab 
                                        ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-800/60' 
                                        : 'border-orange-500/50 hover:border-orange-500 bg-zinc-900/60 hover:bg-orange-500/10'
                                    }`}
                                    >
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="flex-grow">
                                            <p className={`font-bold text-lg md:text-xl mb-1 ${isCompletedTab ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-100 group-hover:text-white'}`}>
                                                {game.name}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                                                <span className="font-mono text-zinc-600 bg-black/30 px-2 py-0.5 rounded">ID: {game.id}</span>
                                                {dateObj && (
                                                    <span className={`${isCompletedTab ? 'text-zinc-600' : 'text-orange-400/80'} font-medium`}>
                                                        {dateObj.toLocaleString(undefined, { 
                                                            weekday: 'short', 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                                            {isCompletedTab ? (
                                                <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider border border-zinc-700 px-2 py-1 rounded">View Results</span>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black shadow-lg shadow-orange-500/50">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    </button>
                                </li>
                                );
                            })}
                        </ul>
                     ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 opacity-60 pointer-events-none">
                            <div className="text-4xl mb-4 grayscale opacity-20">
                                {activeTab === 'today' ? '📅' : activeTab === 'planned' ? '🚀' : '🏁'}
                            </div>
                            <p className="text-lg font-medium italic">No games found in {activeTab}</p>
                            {activeTab === 'completed' && games.length === 0 && (
                                <p className="text-xs text-zinc-500 mt-2">(If you are missing games, check if you are logged in as Guest)</p>
                            )}
                        </div>
                     )}
                 </div>
             </div>
         )
      )}

      {/* Footer / Manual Input Section */}
      <div className="w-full mt-auto pt-6 flex flex-col items-center">
          <div className="w-full max-w-lg opacity-80 hover:opacity-100 transition-opacity duration-300">
             <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm flex items-center gap-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                    {apiKey === 'GUEST' ? 'Enter Game ID:' : 'Or enter ID:'}
                </span>
                <form onSubmit={handleManualSubmit} className="flex-grow flex gap-2">
                  <input
                    ref={manualInputRef}
                    type="text"
                    value={manualGameId}
                    onChange={(e) => setManualGameId(e.target.value)}
                    placeholder="Game ID..."
                    className="flex-grow px-3 py-2 bg-black border border-zinc-700 rounded focus:outline-none focus:border-zinc-500 text-white font-mono uppercase text-center tracking-widest placeholder-zinc-800 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!manualGameId.trim()}
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 transition-all uppercase tracking-wider text-xs"
                  >
                    GO
                  </button>
                </form>
             </div>
          </div>
      </div>
    </div>
  );
};

export default GameListPage;