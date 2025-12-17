import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerResult, GameTask, GamePhoto } from '../types';
import { fetchGameResults, fetchGameInfo, fetchGameTasks, fetchGamePhotos, getTaskTitle } from '../services/loquizService';
import Podium from './Podium';
import TaskMaster from './TaskMaster';
import Showtime from './Showtime';
import LiveToast from './LiveToast';
import TaskInspector from './TaskInspector';
import { HouseIcon } from './icons';

interface LoquizResultsProps {
    apiKey: string;
    gameId: string;
    onBack: () => void;
}

const LoquizResults: React.FC<LoquizResultsProps> = ({ apiKey, gameId, onBack }) => {
    const [results, setResults] = useState<PlayerResult[] | null>(null);
    const [tasks, setTasks] = useState<GameTask[]>([]);
    const [gameName, setGameName] = useState<string | null>(null);
    const [gameLogo, setGameLogo] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revealStep, setRevealStep] = useState(0); 
    const [viewMode, setViewMode] = useState<'ranking' | 'taskmaster'>('ranking');

    const [photos, setPhotos] = useState<GamePhoto[]>([]);
    const [isShowtimeOpen, setIsShowtimeOpen] = useState(false);
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    const [liveEvent, setLiveEvent] = useState<{ message: string, subtext: string } | null>(null);
    const totalAnswerCountRef = useRef<number>(0);
    const isFirstLoadRef = useRef<boolean>(true);

    const loadData = useCallback(async (isRefresh = false) => {
        if (!gameId) return;
        if (!isRefresh && viewMode === 'ranking') setIsLoading(true);
        
        try {
            const resultsData = await fetchGameResults(gameId, apiKey);
            setResults(resultsData);

            let currentTotalAnswers = 0;
            resultsData.forEach(team => currentTotalAnswers += (team.answers?.length || 0));
            
            if (!isFirstLoadRef.current && currentTotalAnswers > totalAnswerCountRef.current) {
                const diff = currentTotalAnswers - totalAnswerCountRef.current;
                setLiveEvent({ message: "INCOMING TRANSMISSION", subtext: `${diff} NEW ANSWER RECEIVED` });
                setTimeout(() => setLiveEvent(null), 4000);
            }
            totalAnswerCountRef.current = currentTotalAnswers;
            isFirstLoadRef.current = false;

            if (!isRefresh) {
                const [info, taskList] = await Promise.all([
                    fetchGameInfo(gameId, apiKey),
                    fetchGameTasks(gameId, apiKey)
                ]);

                setGameName(info.name);
                setGameLogo(info.logoUrl || null);
                
                let finalTasks: GameTask[] = taskList.length > 0 ? taskList : [];
                
                if (finalTasks.length === 0 && info.tasks && Array.isArray(info.tasks)) {
                   finalTasks = info.tasks.map((t: any) => ({
                      id: t.id,
                      title: getTaskTitle(t),
                      type: t.type || 'v4-embedded',
                      raw: t
                   }));
                }

                if (resultsData.length > 0) {
                    const existingIds = new Set(finalTasks.map(t => t.id));
                    const newSyntheticTasks: GameTask[] = [];
                    
                    resultsData.forEach(team => {
                        team.answers?.forEach(ans => {
                            if (!existingIds.has(ans.taskId)) {
                                existingIds.add(ans.taskId);
                                newSyntheticTasks.push({
                                    id: ans.taskId,
                                    title: ans.taskId,
                                    type: 'synthetic'
                                });
                            }
                        });
                    });
                    
                    finalTasks = [...finalTasks, ...newSyntheticTasks];
                }

                setTasks(finalTasks);
            }
        } catch (err) {
            console.warn("Sync error:", err);
            if (!isRefresh) setError(err instanceof Error ? err.message : 'Error syncing data');
        } finally {
            if (!isRefresh) setIsLoading(false);
        }
    }, [gameId, apiKey, viewMode]);

    useEffect(() => {
        loadData();
        const intervalId = setInterval(() => loadData(true), 15000);
        return () => clearInterval(intervalId);
    }, [loadData]);

    const handleShowtimeClick = async () => {
        setIsShowtimeOpen(true);
        if (photos.length === 0) {
            setIsLoadingPhotos(true);
            const fetchedPhotos = await fetchGamePhotos(gameId, apiKey);
            setPhotos(fetchedPhotos);
            setIsLoadingPhotos(false);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-white rounded-full animate-spin mb-6"></div>
            <p className="text-white/80 text-xl font-bold tracking-wider uppercase">Connecting to Satellite...</p>
        </div>
    );
    
    if (error) return (
        <div className="w-full max-w-md text-center glass-panel p-8 rounded-2xl border border-red-500/30 mx-auto">
            <h2 className="text-2xl font-bold text-red-400 mb-2 uppercase">Sync Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
                <button onClick={() => { setError(null); loadData(); }} className="px-6 py-3 bg-orange-600 text-black rounded-lg hover:bg-orange-500 transition-all uppercase tracking-widest text-xs font-bold">Retry Connection</button>
                <button onClick={onBack} className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors uppercase tracking-widest text-xs font-bold border border-zinc-700">Abort to Lobby</button>
            </div>
        </div>
    );

    if (!results || results.length === 0) return (
        <div className="w-full flex flex-col items-center pt-32 px-4 animate-fade-in">
             <div className="fixed top-8 left-8 z-50">
                    <button onClick={onBack} className="p-3 bg-black/60 hover:bg-orange-600 text-orange-500 hover:text-white rounded-full transition-all border border-orange-500/30 shadow-2xl">
                        <HouseIcon className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
            </div>
            <div className="text-center glass-panel p-12 rounded-3xl border border-white/5 max-w-2xl">
                <div className="text-6xl mb-6">🛰️</div>
                <h1 className="text-4xl font-black text-white uppercase mb-4 tracking-tighter">No Active Signals</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-8">This game code exists, but no scores or team results were found on the server.</p>
                <div className="flex flex-col items-center gap-4">
                    <button onClick={handleShowtimeClick} className="px-8 py-3 bg-pink-600 text-white font-black rounded-full uppercase tracking-widest text-xs hover:bg-pink-500 transition-all shadow-[0_0_20px_rgba(219,39,119,0.4)]">Check Media Gallery Anyway</button>
                    <button onClick={() => loadData(true)} className="text-orange-500 hover:text-orange-400 font-bold uppercase text-xs tracking-widest mt-4">Force Refresh Signal</button>
                    <button onClick={onBack} className="text-zinc-600 hover:text-zinc-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Return to Base</button>
                </div>
            </div>
            {isShowtimeOpen && (
                isLoadingPhotos ? (
                    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-2xl">
                        <div className="w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                        <p className="text-pink-500 font-black uppercase tracking-[0.4em] text-2xl animate-pulse">Syncing Media...</p>
                    </div>
                ) : <Showtime photos={photos} onClose={() => setIsShowtimeOpen(false)} />
            )}
        </div>
    );

    return (
        <div className="w-full max-w-full px-2 md:px-4 flex flex-col items-center relative z-10 h-full pt-20 md:pt-32 lg:pt-40">
            {liveEvent && <LiveToast message={liveEvent.message} subtext={liveEvent.subtext} />}

            <div className="w-full text-center mb-10 relative px-4">
                <div className="fixed top-8 left-8 z-50">
                    <button onClick={onBack} className="p-3 bg-black/60 hover:bg-orange-600 text-orange-500 hover:text-white rounded-full transition-all border border-orange-500/30 shadow-2xl">
                        <HouseIcon className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center mb-10">
                    {gameLogo && (
                        <div className="mb-12 animate-fade-in">
                            <img src={gameLogo} alt="Logo" className="h-44 md:h-64 lg:h-80 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-700" />
                        </div>
                    )}
                    
                    <div className="flex flex-wrap justify-center items-center gap-4 mb-10 bg-black/40 p-2.5 rounded-full border border-white/10 shadow-2xl backdrop-blur-md">
                        <button onClick={() => setIsInspectorOpen(true)} className="hidden md:block px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest text-blue-400 border border-blue-500/30 hover:bg-blue-500/20">
                            Inspector
                        </button>
                        <button onClick={handleShowtimeClick} className="px-6 py-2.5 md:px-8 md:py-3 rounded-full font-black text-[11px] md:text-xs uppercase tracking-widest transition-all bg-pink-500/10 text-pink-500 border border-pink-500/30 hover:bg-pink-500 hover:text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                            Showtime
                        </button>
                        <button onClick={() => setViewMode(prev => prev === 'ranking' ? 'taskmaster' : 'ranking')} className={`px-6 py-2.5 md:px-8 md:py-3 rounded-full font-black text-[11px] md:text-xs uppercase tracking-widest transition-all border ${viewMode === 'taskmaster' ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_25px_rgba(234,88,12,0.5)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-orange-400'}`}>
                            {viewMode === 'ranking' ? 'TaskMaster' : 'Ranking'}
                        </button>
                        <button onClick={() => loadData(true)} className="p-2.5 md:p-3 bg-zinc-800 text-orange-400 hover:text-orange-300 rounded-full border border-zinc-700 shadow-xl">
                            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-2xl">TEAMCHALLENGE</h1>
                    <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
                        {gameName && <span className="text-base md:text-xl text-orange-500 font-black uppercase tracking-[0.3em] drop-shadow-md">{gameName}</span>}
                        <span className="hidden md:inline text-zinc-800 text-xl">|</span>
                        <span className="text-zinc-600 font-bold tracking-[0.6em] text-[10px] md:text-xs uppercase">Official Terminal</span>
                    </div>
                </div>
            </div>

            {viewMode === 'ranking' ? (
                <>
                    <div className="w-full mb-10 relative">
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-full flex justify-center pointer-events-none">
                             {revealStep < 3 && (
                                <button onClick={() => setRevealStep(prev => prev + 1)} className="pointer-events-auto mt-28 md:mt-36 px-12 py-5 bg-gradient-to-r from-orange-600 to-red-700 text-white text-xl md:text-2xl font-black rounded-full shadow-[0_0_50px_rgba(234,88,12,0.6)] hover:scale-110 transition-all border-2 border-orange-400 uppercase tracking-widest">
                                    {revealStep === 0 ? "Reveal 3rd Place" : revealStep === 1 ? "Reveal 2nd Place" : "Reveal Winner"}
                                </button>
                             )}
                         </div>
                        <Podium topThree={results.slice(0, 3)} revealStep={revealStep} />
                    </div>

                    <div className="w-full max-w-7xl glass-panel rounded-3xl overflow-hidden border-t-8 border-t-orange-600 flex flex-col mb-16 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
                        <div className="bg-black/60 px-8 py-5 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Combat Log: Rankings</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-zinc-950">
                            <table className="min-w-full relative border-collapse text-left">
                                <thead className="bg-zinc-950 text-zinc-500 text-[10px] md:text-xs uppercase font-black tracking-widest sticky top-0 border-b border-white/5 z-10">
                                    <tr>
                                        <th className="px-12 py-6">Rank</th>
                                        <th className="px-8 py-6">Unit Designation</th>
                                        <th className="px-8 py-6 text-right">Battle Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {results.slice(3).map((player) => (
                                        <tr key={player.position} className="hover:bg-white/[0.04] transition-all group uppercase">
                                            <td className="px-12 py-6 md:py-8 font-black text-4xl md:text-6xl text-orange-500/80">#{player.position}</td>
                                            <td className="px-8 py-6 md:py-8">
                                                <div className="flex items-center">
                                                    <div className="w-2.5 h-12 md:h-16 mr-8 rounded-sm" style={{ backgroundColor: player.color || '#555' }} />
                                                    <span className="font-black text-zinc-100 text-2xl md:text-4xl tracking-tighter">{player.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 md:py-8 text-right font-mono font-black text-white text-3xl md:text-5xl">{player.score.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="w-full max-w-[98vw] h-[80vh] glass-panel rounded-3xl overflow-hidden border-t-8 border-t-orange-600 flex flex-col mb-16 shadow-[0_40px_80px_rgba(0,0,0,0.7)]">
                    <TaskMaster tasks={tasks} results={results} />
                </div>
            )}

            {isShowtimeOpen && (
                isLoadingPhotos ? (
                    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-2xl">
                        <div className="w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                        <p className="text-pink-500 font-black uppercase tracking-[0.4em] text-2xl animate-pulse">Syncing Media...</p>
                    </div>
                ) : <Showtime photos={photos} onClose={() => setIsShowtimeOpen(false)} />
            )}

            {isInspectorOpen && <TaskInspector tasks={tasks} results={results} onClose={() => setIsInspectorOpen(false)} />}
        </div>
    );
};

export default LoquizResults;