import React, { useState, useEffect } from 'react';
import { GamePhoto } from '../types';

interface ShowtimeProps {
  photos: GamePhoto[];
  onClose: () => void;
}

const Showtime = ({ photos, onClose }: ShowtimeProps) => {
    const [view, setView] = useState<'grid' | 'slideshow'>('grid');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    // Auto-play effect for slideshow with proper interval typing and cleanup
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;

        if (view === 'slideshow' && isPlaying && photos.length > 0) {
            interval = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % photos.length);
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, view, photos.length]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (view === 'slideshow') setView('grid');
                else onClose();
            }
            if (view === 'slideshow') {
                if (e.key === 'ArrowRight') nextSlide();
                if (e.key === 'ArrowLeft') prevSlide();
                if (e.key === ' ') {
                    e.preventDefault();
                    setIsPlaying(prev => !prev);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view, photos.length, onClose]);

    const nextSlide = () => {
        setCurrentIndex(prev => (prev + 1) % photos.length);
    };

    const prevSlide = () => {
        setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
    };

    const enterSlideshow = (index: number) => {
        setCurrentIndex(index);
        setView('slideshow');
        setIsPlaying(true);
    };

    if (photos.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
                <p className="text-zinc-500 font-bold uppercase tracking-widest mb-4">No photos found for this game</p>
                <button onClick={onClose} className="px-6 py-2 bg-zinc-800 text-white rounded-full border border-zinc-700 hover:bg-orange-600 transition-colors uppercase tracking-wider font-bold">Close</button>
            </div>
        );
    }

    if (view === 'grid') {
        return (
            <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col animate-fade-in">
                {/* Header */}
                <div className="p-4 md:p-6 flex justify-between items-center bg-black/40 border-b border-white/5">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-orange-500 uppercase tracking-tighter flex items-center gap-3">
                            Showtime Gallery
                            <div className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </div>
                        </h2>
                        <p className="text-zinc-400 text-xs font-mono uppercase tracking-wide">{photos.length} Photos Detected • Updating Live</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-grow overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-zinc-900">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {photos.map((photo, idx) => (
                            <div 
                                key={photo.id} 
                                onClick={() => enterSlideshow(idx)}
                                className="aspect-square relative group cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all hover:scale-105 hover:z-10 bg-zinc-900"
                            >
                                <img 
                                    src={photo.thumbnailUrl || photo.url} 
                                    alt="Thumbnail" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                    <span className="text-white text-[10px] font-bold uppercase truncate">{photo.teamName || 'Unknown Team'}</span>
                                    <span className="text-orange-400 text-[9px] uppercase truncate">{photo.taskTitle}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Slideshow View
    const currentPhoto = photos[currentIndex];

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-fade-in">
            {/* Header / Controls */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('grid')} className="text-zinc-400 hover:text-white flex items-center gap-1 uppercase text-xs font-bold tracking-wider">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        Grid
                    </button>
                    <span className="text-xs font-mono text-zinc-400 bg-black/50 px-2 py-1 rounded border border-zinc-700">
                        {currentIndex + 1} / {photos.length}
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${isPlaying ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                    >
                        {isPlaying ? 'Pause ⏸' : 'Play ▶'}
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-red-900/50 hover:text-red-400 border border-zinc-700 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex items-center justify-center relative overflow-hidden h-full w-full">
                {/* Previous Button Hover Area */}
                <div 
                    className="absolute left-0 top-0 h-full w-1/4 z-10 opacity-0 hover:opacity-100 flex items-center justify-start pl-4 bg-gradient-to-r from-black/50 to-transparent cursor-pointer transition-opacity"
                    onClick={prevSlide}
                >
                    <div className="p-3 rounded-full bg-black/50 border border-white/20 text-white text-2xl">‹</div>
                </div>

                {/* Photo Display */}
                <div key={currentPhoto.id} className="relative max-w-full max-h-full flex items-center justify-center p-4 animate-fade-in">
                    <img 
                        src={currentPhoto.url} 
                        alt="Game Photo" 
                        className="max-h-[85vh] max-w-[95vw] object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 rounded"
                    />
                    
                    {/* Caption Overlay */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-center max-w-[90%]">
                        {currentPhoto.teamName && (
                            <p className="text-orange-400 font-black text-lg md:text-2xl uppercase tracking-wide leading-none mb-1">
                                {currentPhoto.teamName}
                            </p>
                        )}
                        {currentPhoto.taskTitle && (
                            <p className="text-zinc-300 font-bold text-xs md:text-sm uppercase tracking-wider">
                                {currentPhoto.taskTitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Next Button Hover Area */}
                <div 
                    className="absolute right-0 top-0 h-full w-1/4 z-10 opacity-0 hover:opacity-100 flex items-center justify-end pr-4 bg-gradient-to-l from-black/50 to-transparent cursor-pointer transition-opacity"
                    onClick={nextSlide}
                >
                     <div className="p-3 rounded-full bg-black/50 border border-white/20 text-white text-2xl">›</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-zinc-900 w-full relative">
                <div 
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }}
                ></div>
            </div>
        </div>
    );
};

export default Showtime;