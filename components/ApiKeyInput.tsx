import React, { useState } from 'react';
import { KeyIcon } from './icons';

interface ApiKeyInputProps {
    onKeySubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySubmit }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validateKey = (key: string): string | null => {
        const trimmed = key.trim();
        if (trimmed.length === 0) return null;
        if (trimmed.length < 20) return "Key looks too short to be valid.";
        const isV3 = trimmed.toLowerCase().startsWith('apikey-v1');
        if (!isV3 && /\s/.test(trimmed)) return "Standard API tokens usually do not contain spaces.";
        if (isV3) {
             const parts = trimmed.split(/\s+/);
             if (parts.length < 2 || parts[1].length < 10) return "Invalid legacy key format.";
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setApiKey(val);
        setError(validateKey(val));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim() && !error) {
            onKeySubmit(apiKey.trim());
        }
    };

    const isError = !!error && apiKey.length > 0;

    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl text-center animate-fade-in relative overflow-hidden border-orange-500/20">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500 rounded-full mix-blend-screen filter blur-[80px] opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-500 rounded-full mix-blend-screen filter blur-[80px] opacity-10"></div>

            <div className="relative z-10">
                <div className="mx-auto bg-zinc-900 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 shadow-inner border border-orange-500/30 group">
                    <KeyIcon className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Team Access</h2>
                <p className="text-zinc-400 mb-8 text-sm font-medium">
                    Enter your TeamBattle credentials
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="text-left group">
                        <label className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1 block ml-1">Secure Key</label>
                        <input
                            type="text"
                            value={apiKey}
                            onChange={handleChange}
                            placeholder="ApiKey-v1..."
                            className={`w-full px-5 py-4 bg-black/40 border backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 font-mono text-sm text-white placeholder-zinc-600 ${
                                isError
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-900/50' 
                                    : 'border-zinc-700 focus:border-orange-500 focus:ring-orange-900/50'
                            }`}
                        />
                        {isError && (
                            <p className="text-red-500 text-xs mt-2 font-medium flex items-center">
                                <span className="mr-1">⚠️</span> {error}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={!apiKey.trim() || isError}
                        className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-black font-extrabold text-lg rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 uppercase tracking-wide"
                    >
                        Enter Lobby
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyInput;