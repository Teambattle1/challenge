import React, { useMemo } from 'react';
import { GameTask, PlayerResult } from '../types';

interface TaskMasterProps {
    tasks: GameTask[];
    results: PlayerResult[];
}

const TaskMaster: React.FC<TaskMasterProps> = ({ tasks, results }) => {
    // 1. Filter and Sort Tasks
    // Logic: Try to sort numeric titles, limit to 32 max as requested
    const filteredTasks = useMemo(() => {
        const sorted = [...tasks].sort((a, b) => {
            // Extract number from title if possible (e.g. "1. Task" -> 1)
            const numA = parseInt(a.title.match(/^\d+/)?.[0] || '9999');
            const numB = parseInt(b.title.match(/^\d+/)?.[0] || '9999');
            
            if (numA !== 9999 && numB !== 9999) return numA - numB;
            return a.title.localeCompare(b.title);
        });
        
        // Return first 32 tasks
        return sorted.slice(0, 32);
    }, [tasks]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="bg-black/40 px-4 py-3 border-b border-orange-500 flex justify-between items-center">
                <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <span className="text-orange-500">TaskMaster</span> 
                    <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-700 font-mono">
                        {filteredTasks.length} TASKS TRACKED
                    </span>
                </h3>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex-grow overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-zinc-900 pb-4">
                <div className="flex px-4 pt-4 pb-2 gap-4 h-full">
                    
                    {filteredTasks.map((task, index) => (
                        <div key={task.id} className="min-w-[140px] max-w-[140px] flex flex-col h-full bg-zinc-900/40 rounded-xl border border-zinc-800/50 hover:border-orange-500/30 transition-colors">
                            {/* Task Header */}
                            <div className="p-3 bg-zinc-950/80 rounded-t-xl border-b border-zinc-800 text-center sticky top-0 z-10">
                                <div className="text-3xl font-black text-zinc-700 mb-1">
                                    {/* Try to show just the number if it starts with one, else Index+1 */}
                                    {parseInt(task.title.match(/^\d+/)?.[0] || '') || (index + 1)}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-bold uppercase truncate leading-tight" title={task.title}>
                                    {task.title.replace(/^\d+[.)\s]*/, '') || task.title}
                                </div>
                            </div>

                            {/* Vertical Team List */}
                            <div className="p-2 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent space-y-2">
                                {results.map(team => {
                                    // Find if team answered this task
                                    const answer = team.answers?.find(a => a.taskId === task.id);
                                    
                                    // Only show if they have an interaction with this task
                                    if (!answer) return null;

                                    return (
                                        <div 
                                            key={team.name}
                                            className={`
                                                relative p-2 rounded border-l-4 bg-black/60 shadow-lg backdrop-blur-sm
                                                transition-all duration-300 hover:scale-105
                                                ${answer.isCorrect 
                                                    ? 'border-l-green-500 border-t border-r border-b border-green-900/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                                                    : 'border-l-red-500 border-t border-r border-b border-red-900/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}
                                            `}
                                        >
                                            <div className="text-xs font-bold text-white leading-tight truncate">
                                                {team.name}
                                            </div>
                                            {/* Optional Status Icon */}
                                            <div className="absolute top-1 right-1">
                                                {answer.isCorrect ? (
                                                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                                                ) : (
                                                     <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Placeholder if no one has answered yet */}
                                {!results.some(t => t.answers?.some(a => a.taskId === task.id)) && (
                                    <div className="text-center py-4 opacity-20">
                                        <div className="text-2xl grayscale">⏳</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {filteredTasks.length === 0 && (
                        <div className="w-full text-center text-zinc-500 italic mt-10">
                            No tasks found matching criteria (1-32).
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskMaster;