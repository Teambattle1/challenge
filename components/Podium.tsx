import React from 'react';
import { PlayerResult } from '../types';
import { TrophyIcon } from './icons';

interface PodiumProps {
  topThree: PlayerResult[];
  revealStep: number;
}

const PodiumCard: React.FC<{ player: PlayerResult, rank: number, isVisible: boolean }> = ({ player, rank, isVisible }) => {
    // Rank Styles: 1=Gold/Yellow, 2=Silver/Grey, 3=Bronze/OrangeDark
    // Heights reduced for compact view
    const rankStyles = {
        1: {
            border: 'border-yellow-500',
            bg: 'bg-zinc-950',
            text: 'text-yellow-400',
            glow: 'shadow-[0_0_40px_rgba(250,204,21,0.4)]',
            iconColor: 'text-yellow-500',
            height: 'h-32 md:h-44', // Reduced from 40/52
            label: 'WINNER'
        },
        2: {
            border: 'border-zinc-400',
            bg: 'bg-zinc-950',
            text: 'text-zinc-300',
            glow: 'shadow-[0_0_30px_rgba(161,161,170,0.3)]',
            iconColor: 'text-zinc-400',
            height: 'h-24 md:h-32', // Reduced from 32/40
            label: '2ND'
        },
        3: {
            border: 'border-orange-600',
            bg: 'bg-zinc-950',
            text: 'text-orange-500',
            glow: 'shadow-[0_0_30px_rgba(234,88,12,0.3)]',
            iconColor: 'text-orange-600',
            height: 'h-16 md:h-24', // Reduced from 24/32
            label: '3RD'
        },
    };

    const style = rankStyles[rank as 1|2|3];
    
    return (
        <div className={`w-full flex flex-col justify-end transition-all duration-[2000ms] ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-24 scale-90'}`}>
            {/* Player Info Card */}
            <div className={`mb-2 md:mb-4 mx-auto text-center w-full transition-opacity duration-1000 ${isVisible ? 'opacity-100 delay-[1000ms]' : 'opacity-0'}`}>
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-2 md:p-3 rounded-xl shadow-2xl inline-block min-w-[120px] md:min-w-[140px]">
                    <p className={`text-xl md:text-3xl font-black ${style.text} mb-1 drop-shadow-md`}>{style.label}</p>
                    <p className="text-white font-black text-lg md:text-2xl truncate max-w-[150px] md:max-w-[240px] mx-auto leading-tight uppercase tracking-wider">{player.name}</p>
                    <p className="text-zinc-300 font-mono font-bold text-sm md:text-xl mt-1 tracking-wide">{player.score.toLocaleString()} PTS</p>
                </div>
            </div>

            {/* The Bar/Pillar */}
            <div className={`w-full ${style.height} rounded-t-lg border-x-4 border-t-4 ${style.border} ${style.bg} ${style.glow} flex items-center justify-center relative overflow-hidden group`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:10px_10px] opacity-50"></div>
                
                {/* Large Background Rank Number Watermark */}
                <div className={`absolute -bottom-4 right-0 text-7xl md:text-9xl font-black opacity-10 select-none ${style.text}`}>
                    {rank}
                </div>

                {/* Graphic Icon */}
                <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-500">
                    <TrophyIcon className={`w-8 h-8 md:w-16 md:h-16 ${style.iconColor} drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]`} strokeWidth={1.5} />
                </div>
            </div>
        </div>
    );
};

const Podium: React.FC<PodiumProps> = ({ topThree, revealStep }) => {
  const [first, second, third] = topThree;

  // Reduced overall container height to fit screen better (280px mobile / 380px desktop)
  return (
    <div className="flex justify-center items-end gap-2 md:gap-6 w-full max-w-4xl mx-auto h-[280px] md:h-[380px] pb-0 px-2">
      {/* 2nd Place (Left) */}
      <div className="w-1/3 flex items-end">
        {second ? (
            <PodiumCard player={second} rank={2} isVisible={revealStep >= 2} />
        ) : (
            <div className="w-full h-2 bg-white/5 rounded mx-4"></div> // Placeholder
        )}
      </div>

      {/* 1st Place (Center) */}
      <div className="w-1/3 flex items-end z-10">
         {first ? (
             <PodiumCard player={first} rank={1} isVisible={revealStep >= 3} />
         ) : (
             <div className="w-full h-2 bg-white/5 rounded mx-4"></div> // Placeholder
         )}
      </div>

      {/* 3rd Place (Right) */}
      <div className="w-1/3 flex items-end">
        {third ? (
            <PodiumCard player={third} rank={3} isVisible={revealStep >= 1} />
        ) : (
            <div className="w-full h-2 bg-white/5 rounded mx-4"></div> // Placeholder
        )}
      </div>
    </div>
  );
};

export default Podium;