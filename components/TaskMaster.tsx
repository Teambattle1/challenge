import React, { useMemo, useState, useRef } from 'react';
import { GameTask, PlayerResult, PlayerAnswer } from '../types';

interface TaskMasterProps {
    tasks: GameTask[];
    results: PlayerResult[];
}

const TaskMaster: React.FC<TaskMasterProps> = ({ tasks, results }) => {
    const [viewMode, setViewMode] = useState<'byTask' | 'byTeam'>('byTask');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 1. Filter Tasks (Respect Original Order)
    const filteredTasks = useMemo(() => {
        // STRICTLY preserve the order of the input 'tasks' array.
        const activeTasks = tasks.filter(task => 
            results.some(r => r.answers?.some(a => a.taskId === task.id))
        );
        return activeTasks;
    }, [tasks, results]);

    // 2. Sort Teams (for By Team view)
    const sortedTeams = useMemo(() => {
        return [...results].sort((a, b) => a.position - b.position);
    }, [results]);

    // Helper: Get the sequential number based on the ORIGINAL full list order
    const getTaskSequenceLabel = (taskId: string) => {
        const index = tasks.findIndex(t => t.id === taskId);
        const num = index >= 0 ? index + 1 : 0;
        return String(num).padStart(2, '0');
    };

    // Helper: Get the best possible title for the header
    const getTaskOriginalTitle = (task: GameTask) => {
        // 1. Explicit Short Intro (V4)
        if (task.shortIntro && task.shortIntro.trim().length > 0) {
            return task.shortIntro.trim().toUpperCase();
        }

        // 2. Fallback to standard Intro (cleaned)
        if (task.intro && task.intro.trim().length > 0) {
            return task.intro.trim().toUpperCase();
        }
        
        // 3. Fallback to Title
        const title = task.title ? task.title.trim() : '';
        
        // Return blank if it's just a generic ID to avoid clutter, 
        // unless we have literally nothing else, then return ID.
        if (title.length > 20 || !/^TASK\s+[A-Z0-9]+$/i.test(title)) {
             return title.toUpperCase();
        }
        return title.toUpperCase();
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = 400; 
            container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    // Shared Card Renderer
    // Added 'team' parameter to calculate stats
    const renderCard = (mainText: string, subText: string | null, answer: PlayerAnswer, key: string, team?: PlayerResult) => {
        // Correctness Logic: 
        // 1. Explicitly marked correct by API
        // 2. OR Score > 0
        const isCorrect = answer.isCorrect === true || (answer.score || 0) > 0;
        
        // Stats Logic (X/Y Correct)
        let statsLine = null;
        if (team) {
            const correctCount = team.correctAnswers || 0;
            const totalAnswered = (team.correctAnswers || 0) + (team.incorrectAnswers || 0);
            // Fallback if API doesn't provide counts: calculate from answers array
            const finalTotal = totalAnswered === 0 ? (team.answers?.length || 0) : totalAnswered;
            
            statsLine = `${correctCount}/${finalTotal} CORRECT`;
        }

        return (
            <div 
                key={key}
                className={`
                    relative p-2.5 rounded-lg border-l-4 shadow-md
                    transition-all duration-300 hover:scale-105 hover:z-20 group
                    flex flex-col gap-1 min-w-[160px]
                    ${isCorrect 
                        ? 'border-l-green-500 bg-zinc-900 border-y border-r border-green-500/20' 
                        : 'border-l-red-500 bg-zinc-900 border-y border-r border-red-500/20'}
                `}
            >
                <div className="flex justify-between items-start gap-2">
                    <div className="text-sm md:text-base font-black text-zinc-100 leading-tight break-words uppercase tracking-tight">
                        {mainText}
                    </div>
                </div>
                
                {/* Stats Line (Under Team Name) */}
                {statsLine && (
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {statsLine}
                    </div>
                )}
                
                {/* Secondary Subtext (e.g. Task Title in Team View) */}
                {subText && (
                    <div className="text-[9px] text-zinc-500 leading-tight line-clamp-2 uppercase font-medium tracking-wide mt-1">
                        {subText}
                    </div>
                )}
                
                <div className="flex justify-between items-end border-t border-white/5 pt-1.5 mt-1">
                    <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <span className="font-bold">{answer.score}</span> 
                        <span className="text-[8px] opacity-70">PTS</span>
                    </div>

                    {/* Status Icon */}
                    <div>
                        {isCorrect ? (
                                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/40 text-green-400 text-[9px]">
                                ✓
                                </div>
                        ) : (
                                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 text-red-400 text-[9px]">
                                ✕
                                </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col relative group uppercase">
            <div className="bg-black/40 px-4 py-3 border-b border-orange-500 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <span className="text-orange-500">TaskMaster</span> 
                    <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-700 font-mono">
                        {viewMode === 'byTask' ? `${filteredTasks.length} TASKS` : `${sortedTeams.length} TEAMS`}
                    </span>
                </h3>
                
                <button 
                    onClick={() => setViewMode(prev => prev === 'byTask' ? 'byTeam' : 'byTask')}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 hover:text-orange-400 text-zinc-200 text-xs font-bold uppercase tracking-widest rounded border border-zinc-600 hover:border-orange-500 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-2"
                >
                    <span className="opacity-50 text-[10px]">VIEW:</span>
                    {viewMode === 'byTask' ? 'TASK BY TEAM' : 'TEAM BY TASK'}
                </button>
            </div>

            {/* Navigation Buttons */}
            <button 
                onClick={() => scroll('left')}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-50 p-3 bg-zinc-800 hover:bg-orange-600 text-white rounded-full border border-zinc-600 shadow-2xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                title="Scroll Left"
            >
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <button 
                onClick={() => scroll('right')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-50 p-3 bg-zinc-800 hover:bg-orange-600 text-white rounded-full border border-zinc-600 shadow-2xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                title="Scroll Right"
            >
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Horizontal Scroll Container */}
            <div ref={scrollContainerRef} className="flex-grow overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-zinc-900 pb-4 scroll-smooth">
                <div className="flex px-4 pt-4 pb-2 gap-4 h-full">
                    
                    {/* MODE 1: BY TASK (Columns = Tasks, Items = Teams) */}
                    {viewMode === 'byTask' && filteredTasks.map((task) => {
                        const taskSequence = getTaskSequenceLabel(task.id);
                        const originalTitle = getTaskOriginalTitle(task);
                        const mainHeader = `TASK ${taskSequence}`;
                        
                        // Sort teams for this task: Correct answers first
                        const relevantTeams = results
                            .map(team => ({ team, answer: team.answers?.find(a => a.taskId === task.id) }))
                            .filter(item => item.answer !== undefined)
                            .sort((a, b) => {
                                const scoreA = a.answer?.score || 0;
                                const scoreB = b.answer?.score || 0;
                                // Positive scores first
                                if (scoreA > 0 && scoreB <= 0) return -1;
                                if (scoreA <= 0 && scoreB > 0) return 1;
                                // Then by score desc
                                if (scoreA !== scoreB) return scoreB - scoreA;
                                return 0;
                            });

                        return (
                            <div key={task.id} className="min-w-[180px] max-w-[180px] flex flex-col h-full bg-zinc-900/30 rounded-xl border border-zinc-800/50 hover:border-orange-500/30 transition-colors">
                                {/* Task Header - Swapped Logic: Title First, Sequence Small */}
                                <div className="p-3 bg-zinc-950/80 rounded-t-xl border-b border-zinc-800 text-center sticky top-0 z-10 shadow-lg min-h-[70px] flex flex-col justify-center items-center group/header">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover/header:text-orange-500 transition-colors">
                                        {mainHeader}
                                    </div>
                                    <div className="text-sm font-black text-white drop-shadow-sm line-clamp-3 leading-tight break-words tracking-tight uppercase px-1">
                                        {originalTitle}
                                    </div>
                                </div>

                                {/* Vertical Team List */}
                                <div className="p-2 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent space-y-2">
                                    {relevantTeams.map(({ team, answer }) => {
                                        if (!answer) return null;
                                        // In "By Task" mode, render Card with Team Name and Stats
                                        return renderCard(team.name, null, answer, team.name, team);
                                    })}
                                    
                                    {/* Placeholder if no one has answered yet */}
                                    {relevantTeams.length === 0 && (
                                        <div className="text-center py-8 opacity-10 flex flex-col items-center justify-center">
                                            <div className="text-3xl mb-1 grayscale">⚡</div>
                                            <span className="text-[10px] uppercase font-bold tracking-widest">Pending</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* MODE 2: BY TEAM (Columns = Teams, Items = Tasks) */}
                    {viewMode === 'byTeam' && sortedTeams.map((team) => {
                        const teamTasks = filteredTasks.map(task => {
                            const answer = team.answers?.find(a => a.taskId === task.id);
                            return { task, answer };
                        }).filter(item => item.answer)
                          .sort((a, b) => {
                            const scoreA = a.answer?.score || 0;
                            const scoreB = b.answer?.score || 0;
                            
                            // 1. Positive scores first
                            if (scoreA > 0 && scoreB <= 0) return -1;
                            if (scoreA <= 0 && scoreB > 0) return 1;
                            
                            // 2. Then by score desc
                            if (scoreA !== scoreB) return scoreB - scoreA;

                            return 0;
                        });

                        return (
                            <div key={team.name} className="min-w-[180px] max-w-[180px] flex flex-col h-full bg-zinc-900/30 rounded-xl border border-zinc-800/50 hover:border-orange-500/30 transition-colors">
                                {/* Team Header */}
                                <div className="p-3 bg-zinc-950/80 rounded-t-xl border-b border-zinc-800 text-center sticky top-0 z-10 shadow-lg">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <div className="text-xl font-black text-white drop-shadow-sm truncate max-w-full">
                                            {team.name}
                                        </div>
                                    </div>
                                    <div className="h-6 flex items-center justify-center gap-2">
                                        <span className="text-[10px] font-mono bg-zinc-900 px-1.5 rounded text-orange-500 border border-zinc-700">
                                            #{team.position}
                                        </span>
                                        <span className="text-xs font-mono text-zinc-400">
                                            {team.score.toLocaleString()} pts
                                        </span>
                                    </div>
                                </div>

                                {/* Vertical Task List */}
                                <div className="p-2 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent space-y-2">
                                    {teamTasks.map(({ task, answer }) => {
                                        if (!answer) return null;

                                        const taskSequence = getTaskSequenceLabel(task.id);
                                        const originalTitle = getTaskOriginalTitle(task);
                                        const mainText = `TASK ${taskSequence}`;

                                        // In "By Team" mode, we don't pass 'team' param so we don't show stats (redundant)
                                        return renderCard(mainText, originalTitle, answer, task.id);
                                    })}

                                    {teamTasks.length === 0 && (
                                        <div className="text-center py-8 opacity-10 flex flex-col items-center justify-center">
                                            <div className="text-3xl mb-1 grayscale">💤</div>
                                            <span className="text-[10px] uppercase font-bold tracking-widest">No Activity</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TaskMaster;