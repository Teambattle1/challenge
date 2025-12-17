import React, { useMemo, useState, useRef } from 'react';
import { GameTask, PlayerResult, PlayerAnswer } from '../types';
import { getTaskTitle } from '../services/loquizService';

interface TaskMasterProps {
    tasks: GameTask[];
    results: PlayerResult[];
}

const TaskMaster: React.FC<TaskMasterProps> = ({ tasks, results }) => {
    const [viewMode, setViewMode] = useState<'byTask' | 'byTeam'>('byTask');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Build the lookup map as requested
    const tasksById = useMemo(() => {
        return Object.fromEntries(tasks.map(t => [t.id, t]));
    }, [tasks]);

    // Helper to get human-readable title
    const resolveTitle = (taskId: string) => {
        const def = tasksById[taskId];
        return getTaskTitle(def || { id: taskId });
    };

    // Filter to tasks that actually have answers, but use defined tasks as primary sort order
    const filteredTasks = useMemo(() => {
        // Find all IDs that appeared in answers
        const answerIds = new Set<string>();
        results.forEach(r => r.answers?.forEach(a => answerIds.add(a.taskId)));
        
        // Return tasks in original order if possible
        const activeTasks = tasks.filter(t => answerIds.has(t.id));
        
        // If some IDs from answers aren't in tasks list, add them as synthetic entries
        const knownTaskIds = new Set(tasks.map(t => t.id));
        const syntheticTasks: GameTask[] = [];
        answerIds.forEach(id => {
            if (!knownTaskIds.has(id)) {
                syntheticTasks.push({ id, title: id, type: 'synthetic' });
            }
        });

        return [...activeTasks, ...syntheticTasks];
    }, [tasks, results]);

    const sortedTeams = useMemo(() => {
        return [...results].sort((a, b) => a.position - b.position);
    }, [results]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' });
        }
    };

    const renderCard = (mainText: string, subText: string | null, answer: PlayerAnswer, key: string) => {
        const isCorrect = answer.isCorrect === true || (answer.score || 0) > 0;
        return (
            <div key={key} className={`relative p-3 rounded-lg border-l-4 shadow-md transition-all duration-300 hover:scale-105 hover:z-20 group flex flex-col gap-1 min-w-[160px] ${isCorrect ? 'border-l-green-500 bg-zinc-900 border-green-500/20' : 'border-l-red-500 bg-zinc-900 border-red-500/20'}`}>
                <div className="text-sm font-black text-zinc-100 leading-tight break-words uppercase tracking-tight">{mainText}</div>
                {subText && <div className="text-[9px] text-zinc-500 leading-tight uppercase font-medium tracking-wide mt-1 line-clamp-2">{subText}</div>}
                <div className="flex justify-between items-end border-t border-white/5 pt-1.5 mt-1">
                    <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {answer.score} PTS
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
                        {filteredTasks.length} TASKS DETECTED
                    </span>
                </h3>
                <button onClick={() => setViewMode(prev => prev === 'byTask' ? 'byTeam' : 'byTask')} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 hover:text-orange-400 text-zinc-200 text-xs font-bold uppercase tracking-widest rounded border border-zinc-600 transition-all">
                    {viewMode === 'byTask' ? 'SWITCH TO BY TEAM' : 'SWITCH TO BY TASK'}
                </button>
            </div>

            <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 transform -translate-y-1/2 z-50 p-3 bg-zinc-800 hover:bg-orange-600 text-white rounded-full border border-zinc-600 shadow-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 transform -translate-y-1/2 z-50 p-3 bg-zinc-800 hover:bg-orange-600 text-white rounded-full border border-zinc-600 shadow-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
            </button>

            <div ref={scrollContainerRef} className="flex-grow overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-zinc-900 pb-4 scroll-smooth">
                <div className="flex px-4 pt-4 pb-2 gap-4 h-full">
                    {viewMode === 'byTask' ? filteredTasks.map((task) => (
                        <div key={task.id} className="min-w-[180px] max-w-[180px] flex flex-col h-full bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                            <div className="p-3 bg-zinc-950/80 rounded-t-xl border-b border-zinc-800 text-center sticky top-0 z-10 min-h-[70px] flex flex-col justify-center items-center">
                                <div className="text-[10px] font-bold text-zinc-500 mb-1 truncate w-full uppercase">OPGAVE {filteredTasks.indexOf(task) + 1}</div>
                                <div className="text-xs font-black text-white line-clamp-3 leading-tight uppercase tracking-tight">{resolveTitle(task.id)}</div>
                            </div>
                            <div className="p-2 flex-grow overflow-y-auto space-y-2">
                                {results.map(team => {
                                    const ans = team.answers?.find(a => a.taskId === task.id);
                                    return ans ? renderCard(team.name, null, ans, team.name) : null;
                                })}
                            </div>
                        </div>
                    )) : sortedTeams.map((team) => (
                        <div key={team.name} className="min-w-[180px] max-w-[180px] flex flex-col h-full bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                            <div className="p-3 bg-zinc-950/80 rounded-t-xl border-b border-zinc-800 text-center sticky top-0 z-10">
                                <div className="text-lg font-black text-white truncate mb-1">{team.name}</div>
                                <div className="text-[10px] font-mono text-orange-500">#{team.position} • {team.score} PTS</div>
                            </div>
                            <div className="p-2 flex-grow overflow-y-auto space-y-2">
                                {filteredTasks.map(task => {
                                    const ans = team.answers?.find(a => a.taskId === task.id);
                                    return ans ? renderCard(resolveTitle(task.id), null, ans, task.id) : null;
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskMaster;