import React from 'react';

interface LiveToastProps {
    message: string;
    subtext?: string;
}

const LiveToast: React.FC<LiveToastProps> = ({ message, subtext }) => {
    return (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
            <div className="bg-black/80 backdrop-blur-md border border-green-500/50 rounded-xl px-6 py-4 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center gap-4 min-w-[300px]">
                <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute top-0 right-0"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
                </div>
                <div>
                    <div className="text-green-500 font-black text-sm uppercase tracking-widest leading-none mb-1">
                        {message}
                    </div>
                    {subtext && (
                        <div className="text-white font-bold text-xs font-mono uppercase">
                            {subtext}
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes bounceIn {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    60% { opacity: 1; transform: translate(-50%, 10px); }
                    100% { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-bounce-in {
                    animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};

export default LiveToast;