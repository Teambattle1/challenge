import React, { useState, useEffect, useCallback } from 'react';
import { PlayerResult, GameTask } from '../types';
import { fetchGameResults, fetchGameInfo, fetchGameTasks } from '../services/loquizService';
import Podium from './Podium';
import TaskMaster from './TaskMaster'; // Import new component
import { HouseIcon } from './icons';

interface LoquizResultsProps {
    apiKey: string;
    gameId: string;
    onBack: () => void;
}

const LoquizResults: React.FC<LoquizResultsProps> = ({ apiKey, gameId, onBack }) => {
    const [results, setResults] = useState<PlayerResult[] | null>(null);
    const [tasks, setTasks] = useState<GameTask[]>([]); // Store tasks
    const [gameName, setGameName] = useState<string | null>(null);
    const [gameLogo, setGameLogo] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revealStep, setRevealStep] = useState(0); 
    const [viewMode, setViewMode] = useState<'ranking' | 'taskmaster'>('ranking'); // View toggle

    const loadData = useCallback(async (isRefresh = false) => {
        if (!gameId) return;
        if (!isRefresh && viewMode === 'ranking') setIsLoading(true); 
        setError(null);
        
        try {
            // Fetch game info, results, AND tasks
            const promises: Promise<any>[] = [
                fetchGameResults(gameId, apiKey)
            ];

            // Only fetch metadata on first load
            if (!isRefresh) {
                promises.push(fetchGameInfo(gameId, apiKey));
                promises.push(fetchGameTasks(gameId, apiKey));
            }

            const responses = await Promise.all(promises);
            const data = responses[0] as PlayerResult[];
            
            setResults(data);

            if (!isRefresh) {
                const info = responses[1];
                let taskList = responses[2] as GameTask[] || [];

                // Fallback: If no tasks returned (API error or empty), generate from results
                // This ensures TaskMaster still works (showing IDs) even if definition fetch fails
                if (taskList.length === 0 && data && data.length > 0) {
                     const derivedTasks = new Map<string, GameTask>();
                     data.forEach(team => {
                         team.answers?.forEach(ans => {
                             if (!derivedTasks.has(ans.taskId)) {
                                 // Try to make a readable title from the ID if possible, otherwise generic
                                 derivedTasks.set(ans.taskId, {
                                     id: ans.taskId,
                                     title: `Task ${ans.taskId}`, 
                                     type: 'unknown'
                                 });
                             }
                         });
                     });
                     taskList = Array.from(derivedTasks.values());
                }

                setGameName(info.name);
                setGameLogo(info.logoUrl || null);
                setTasks(taskList);
            }

        } catch (err) {
            console.error(err);
            if (!isRefresh) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            }
        } finally {
            if (!isRefresh) setIsLoading(false);
        }
    }, [gameId, apiKey]);

    useEffect(() => {
        loadData();
        const intervalId = setInterval(() => {
            loadData(true);
        }, 10000);
        return () => clearInterval(intervalId);
    }, [loadData]);

    const handleRefresh = () => {
        loadData(true);
    };

    const handleNextReveal = () => {
        setRevealStep(prev => Math.min(prev + 1, 3));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-64">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-white rounded-full animate-spin mb-6"></div>
                <p className="text-white/80 text-xl font-bold tracking-wider uppercase">Loading Battle Data...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="w-full max-w-md text-center glass-panel p-8 rounded-2xl shadow-2xl border border-red-500/30">
                <div className="mx-auto w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mb-4 border border-red-500">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-red-400 mb-2 uppercase">System Error</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                 <button onClick={onBack} className="px-6 py-3 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 border border-zinc-600 transition-colors uppercase tracking-wider">
                    Back to Lobby
                </button>
            </div>
        );
    }

    if (!results) return null;

    const topThree = results.slice(0, 3);
    const restOfTeams = results.slice(3);

    const getButtonText = () => {
        switch(revealStep) {
            case 0: return "Reveal 3rd Place";
            case 1: return "Reveal 2nd Place";
            case 2: return "Reveal Winner";
            default: return "";
        }
    };

    return (
        <div className="w-full max-w-full px-2 md:px-4 flex flex-col items-center relative z-10 h-full">
            
            {/* Header Section - Super Compact */}
            <div className="w-full text-center mb-1 relative px-4 mt-2">
                 {/* Top Left House Icon */}
                 <div className="absolute top-0 left-0 z-20">
                    <button 
                        onClick={onBack}
                        className="p-1.5 md:p-2 bg-black/40 hover:bg-orange-600 text-orange-500 hover:text-white rounded-full transition-all backdrop-blur-sm border border-orange-500/30 shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.6)]"
                        title="Back to Lobby"
                    >
                        <HouseIcon className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                 {/* Top Right: TaskMaster Toggle AND Refresh */}
                 <div className="absolute top-0 right-0 z-20 flex gap-2">
                    {/* TaskMaster Button */}
                    <button 
                        onClick={() => setViewMode(prev => prev === 'ranking' ? 'taskmaster' : 'ranking')}
                        className={`
                            px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest transition-all backdrop-blur-sm border
                            ${viewMode === 'taskmaster' 
                                ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.6)]' 
                                : 'bg-black/40 text-zinc-400 border-zinc-700 hover:text-orange-400 hover:border-orange-500/50'}
                        `}
                    >
                        {viewMode === 'ranking' ? 'TaskMaster' : 'Ranking'}
                    </button>

                    {/* Refresh Button */}
                    <button 
                        onClick={handleRefresh}
                        className="p-1.5 md:p-2 bg-black/40 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 rounded-full transition-all backdrop-blur-sm border border-orange-500/30"
                        title="Refresh Data"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Main Title Area */}
                <div className="flex flex-col items-center justify-center">
                    {/* Client Logo - Larger */}
                    {gameLogo && (
                        <div className="mb-2">
                            <img 
                                src={gameLogo} 
                                alt={`${gameName} Logo`} 
                                className="h-24 md:h-40 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform duration-500" 
                            />
                        </div>
                    )}
                    
                    {/* TEAMCHALLENGE Title - White and Compact */}
                    <h1 className="text-xl md:text-3xl font-black text-white mb-0 uppercase tracking-tighter drop-shadow-sm filter">
                        TEAMCHALLENGE
                    </h1>

                    {/* Game Name - Smaller and Orange */}
                    <div className="flex flex-col md:flex-row items-center gap-2 mt-0.5">
                        {gameName && (
                            <span className="text-[10px] md:text-xs text-orange-500 font-bold uppercase tracking-wide opacity-100 drop-shadow-md">
                                {gameName}
                            </span>
                        )}
                        <span className="hidden md:inline text-zinc-700 text-[10px]">|</span>
                        <span className="text-zinc-600 font-bold tracking-[0.2em] text-[8px] md:text-[9px] uppercase">by TeamBattle</span>
                    </div>
                </div>
            </div>

            {/* CONDITIONAL CONTENT */}
            {viewMode === 'ranking' ? (
                <>
                    {/* Podium Section - Compact Height */}
                    <div className="w-full mb-2 relative">
                         {/* Reveal Controls */}
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-full flex justify-center pointer-events-none">
                             {revealStep < 3 && (
                                <button 
                                    onClick={handleNextReveal} 
                                    className="pointer-events-auto mt-20 md:mt-24 px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white text-base font-black rounded-full shadow-[0_0_30px_rgba(234,88,12,0.6)] hover:scale-110 transition-all duration-300 border-2 border-orange-400 uppercase tracking-widest"
                                >
                                    {getButtonText()}
                                </button>
                             )}
                         </div>

                        <Podium topThree={topThree} revealStep={revealStep} />
                    </div>

                    {/* The List - Compact Row Padding */}
                    <div className="w-full max-w-7xl glass-panel rounded-xl overflow-hidden border-t-4 border-t-orange-500 flex flex-col mb-4">
                        <div className="bg-black/40 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">Ranking List</h3>
                            <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                 <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-zinc-900">
                            <table className="min-w-full relative border-collapse text-left">
                                <thead className="bg-zinc-900/90 text-zinc-500 text-xs uppercase font-black tracking-wider sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="px-6 py-3">Rank</th>
                                        <th className="px-4 py-3">Team Name</th>
                                        <th className="px-4 py-3 text-right">Score</th>
                                        <th className="px-4 py-3 text-center hidden md:table-cell">Accuracy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {restOfTeams.map((player) => (
                                        <tr key={player.position} className="hover:bg-white/5 transition-colors group uppercase">
                                            <td className="px-6 py-2 md:py-3 font-black text-2xl md:text-3xl text-orange-500 drop-shadow-md">
                                                #{player.position}
                                            </td>
                                            <td className="px-4 py-2 md:py-3">
                                                <div className="flex items-center">
                                                    <div 
                                                        className="w-1.5 h-6 md:h-8 mr-4 rounded-sm shadow-[0_0_8px_currentColor]" 
                                                        style={{ backgroundColor: player.color || '#555', color: player.color || '#555' }}
                                                    />
                                                    <span className="font-bold text-zinc-200 text-base md:text-xl tracking-tight group-hover:text-white group-hover:tracking-wide transition-all duration-300">
                                                        {player.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 md:py-3 text-right font-mono font-black text-white text-xl md:text-2xl tracking-tighter">
                                                {player.score.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 md:py-3 text-center hidden md:table-cell text-zinc-500 text-sm md:text-base font-bold">
                                                <span className="text-green-500">{player.correctAnswers || 0}</span>
                                                <span className="mx-1 text-zinc-700">/</span>
                                                <span className="text-red-500">{player.incorrectAnswers || 0}</span>
                                            </td>
                                        </tr>
                                    ))}
                                     {restOfTeams.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-zinc-600 italic text-lg uppercase">
                                                {results.length <= 3 ? "All teams have conquered the podium!" : "No other teams found."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                // TASK MASTER VIEW
                <div className="w-full max-w-[95vw] h-[70vh] glass-panel rounded-xl overflow-hidden border-t-4 border-t-orange-500 flex flex-col mb-4 animate-fade-in">
                    <TaskMaster tasks={tasks} results={results} />
                </div>
            )}
        </div>
    );
};

export default LoquizResults;