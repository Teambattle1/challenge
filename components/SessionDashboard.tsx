import React, { useState, useEffect } from 'react';
import { fetchGameInfo } from '../services/loquizService';
import { PlayerResult, GamePhoto } from '../types';
import { HouseIcon } from './icons';
import SendModal from './SendModal';

interface SessionDashboardProps {
    apiKey: string;
    gameId: string;
    gameName: string | null;
    results: PlayerResult[];
    photos: GamePhoto[];
    onBack: () => void;
    onNavigate: (view: 'results' | 'showtime' | 'taskmaster' | 'admin') => void;
}

const navButtons = [
    { id: 'results' as const, label: 'Results', icon: '🏆', color: 'from-orange-600 to-amber-600', border: 'border-orange-500/40', glow: 'shadow-[0_0_40px_rgba(234,88,12,0.3)]', hoverGlow: 'hover:shadow-[0_0_60px_rgba(234,88,12,0.5)]' },
    { id: 'showtime' as const, label: 'Showtime', icon: '📸', color: 'from-pink-600 to-rose-600', border: 'border-pink-500/40', glow: 'shadow-[0_0_40px_rgba(236,72,153,0.3)]', hoverGlow: 'hover:shadow-[0_0_60px_rgba(236,72,153,0.5)]' },
    { id: 'taskmaster' as const, label: 'TaskMaster', icon: '📊', color: 'from-blue-600 to-cyan-600', border: 'border-blue-500/40', glow: 'shadow-[0_0_40px_rgba(37,99,235,0.3)]', hoverGlow: 'hover:shadow-[0_0_60px_rgba(37,99,235,0.5)]' },
    { id: 'admin' as const, label: 'Admin', icon: '⚙️', color: 'from-zinc-600 to-zinc-500', border: 'border-zinc-500/40', glow: 'shadow-[0_0_40px_rgba(113,113,122,0.2)]', hoverGlow: 'hover:shadow-[0_0_60px_rgba(113,113,122,0.4)]' },
];

const SessionDashboard: React.FC<SessionDashboardProps> = ({ apiKey, gameId, gameName, results, photos, onBack, onNavigate }) => {
    const [gameLogo, setGameLogo] = useState<string | null>(null);
    const [sendMode, setSendMode] = useState<'results' | 'showtime' | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const info = await fetchGameInfo(gameId, apiKey);
                setGameLogo(info.logoUrl || null);
            } catch (err) {
                console.warn('Failed to load game info:', err);
            }
        };
        load();
    }, [gameId, apiKey]);

    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[80vh] animate-fade-in px-4">
            <div className="fixed top-8 left-8 z-50">
                <button onClick={onBack} className="p-3 bg-black/60 hover:bg-orange-600 text-orange-500 hover:text-white rounded-full transition-all border border-orange-500/30 shadow-2xl">
                    <HouseIcon className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            </div>

            {gameLogo && (
                <div className="mb-8 animate-fade-in">
                    <img src={gameLogo} alt="Logo" className="h-32 md:h-48 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
                </div>
            )}

            <h1 className="text-4xl md:text-7xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-2xl">TEAMCHALLENGE</h1>
            {gameName && <p className="text-base md:text-xl text-orange-500 font-black uppercase tracking-[0.3em] drop-shadow-md mb-12">{gameName}</p>}

            {/* 2x2 Navigation Grid */}
            <div className="grid grid-cols-2 gap-6 md:gap-8 w-full max-w-lg">
                {navButtons.map(btn => (
                    <button
                        key={btn.id}
                        onClick={() => onNavigate(btn.id)}
                        className={`aspect-square rounded-full bg-gradient-to-br ${btn.color} ${btn.border} border-2 ${btn.glow} ${btn.hoverGlow} hover:scale-110 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center gap-2 md:gap-3`}
                    >
                        <span className="text-3xl md:text-5xl">{btn.icon}</span>
                        <span className="text-white font-black text-xs md:text-sm uppercase tracking-widest">{btn.label}</span>
                    </button>
                ))}
            </div>

            {/* Send to Customer */}
            <div className="mt-12 flex flex-col items-center gap-4 w-full max-w-lg">
                <p className="text-zinc-600 text-[10px] uppercase tracking-[0.4em] font-bold">Send to Customer</p>
                <div className="flex gap-4 w-full">
                    <button
                        onClick={() => setSendMode('results')}
                        disabled={results.length === 0}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900/60 border border-orange-500/20 rounded-2xl hover:bg-orange-500/10 hover:border-orange-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                        <svg className="w-5 h-5 text-orange-500 group-hover:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-zinc-300 font-bold text-xs uppercase tracking-widest group-hover:text-orange-400">Send Results</span>
                    </button>
                    <button
                        onClick={() => setSendMode('showtime')}
                        disabled={photos.length === 0}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900/60 border border-pink-500/20 rounded-2xl hover:bg-pink-500/10 hover:border-pink-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                        <svg className="w-5 h-5 text-pink-500 group-hover:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-zinc-300 font-bold text-xs uppercase tracking-widest group-hover:text-pink-400">Send Photos</span>
                    </button>
                </div>
            </div>

            {/* Send Modal */}
            {sendMode && (
                <SendModal
                    mode={sendMode}
                    gameName={gameName || 'Unknown Game'}
                    gameId={gameId}
                    results={results}
                    photos={photos}
                    onClose={() => setSendMode(null)}
                />
            )}
        </div>
    );
};

export default SessionDashboard;
