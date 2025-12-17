import React, { useState } from 'react';
import { GameTask, PlayerResult } from '../types';

interface TaskInspectorProps {
    tasks: GameTask[];
    results?: PlayerResult[]; // Optional results for debugging answers
    onClose: () => void;
}

const TaskInspector: React.FC<TaskInspectorProps> = ({ tasks, results, onClose }) => {
    const [tab, setTab] = useState<'tasks' | 'results'>('tasks');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in backdrop-blur-sm font-mono">
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-orange-500 uppercase tracking-widest">System Inspector</h2>
                    <div className="flex gap-2 bg-black rounded p-1">
                        <button 
                            onClick={() => setTab('tasks')}
                            className={`px-3 py-1 text-xs font-bold rounded uppercase ${tab === 'tasks' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Tasks ({tasks.length})
                        </button>
                        <button 
                            onClick={() => setTab('results')}
                            className={`px-3 py-1 text-xs font-bold rounded uppercase ${tab === 'results' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Results Sample
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 uppercase font-bold text-xs">Close</button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700">
                {tab === 'tasks' && (
                    <>
                        <div className="text-zinc-400 text-xs mb-4 uppercase">
                            Task Definitions (Fetched from API or Derived)
                        </div>
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div key={task.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded text-left">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="max-w-[70%]">
                                            <div className="text-orange-400 font-mono text-xs font-bold mb-1">ID: {task.id}</div>
                                            <div className="text-white font-bold text-sm uppercase break-words">{task.title}</div>
                                            <div className="text-zinc-500 text-xs mt-1">Type: {task.type}</div>
                                        </div>
                                        <button 
                                            onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                                            className="text-[10px] bg-zinc-800 px-3 py-1.5 rounded text-zinc-300 hover:text-white border border-zinc-700 hover:border-orange-500 transition-colors uppercase font-bold tracking-wider"
                                        >
                                            {expandedId === task.id ? 'Hide Raw' : 'Show Raw'}
                                        </button>
                                    </div>
                                    
                                    {expandedId === task.id && (
                                        <div className="mt-2 bg-black p-3 rounded border border-zinc-800 overflow-x-auto">
                                            <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap break-all">
                                                {JSON.stringify(task.raw || { error: "No raw data (Derived task)" }, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="text-zinc-500 italic text-center p-8">No tasks found.</div>
                            )}
                        </div>
                    </>
                )}

                {tab === 'results' && (
                    <>
                        <div className="text-zinc-400 text-xs mb-4 uppercase">
                            Raw Answer Data (First 2 Teams) - Use this to find photo fields
                        </div>
                        <div className="space-y-4">
                            {results?.slice(0, 2).map((team, idx) => (
                                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded">
                                    <h4 className="text-white font-bold mb-2 uppercase">{team.name}</h4>
                                    <div className="bg-black p-3 rounded border border-zinc-800 overflow-x-auto">
                                        <pre className="text-[10px] text-blue-300 font-mono whitespace-pre-wrap break-all">
                                            {JSON.stringify(team.answers ? team.answers.slice(0, 5).map(a => a.raw || a) : "No answers", null, 2)}
                                        </pre>
                                        {team.answers && team.answers.length > 5 && (
                                            <div className="text-zinc-500 text-[10px] mt-1 italic">... {team.answers.length - 5} more answers truncated</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!results || results.length === 0) && (
                                <div className="text-zinc-500 italic text-center p-8">No results available to inspect.</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TaskInspector;