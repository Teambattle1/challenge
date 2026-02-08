import React, { useState } from 'react';
import { PlayerResult, GamePhoto } from '../types';
import { sendResultsEmail, sendShowtimeEmail } from '../services/emailService';

interface SendModalProps {
  mode: 'results' | 'showtime';
  gameName: string;
  gameId: string;
  results: PlayerResult[];
  photos: GamePhoto[];
  onClose: () => void;
}

const SendModal: React.FC<SendModalProps> = ({ mode, gameName, gameId, results, photos, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  const togglePhoto = (id: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPhotos = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map(p => p.id)));
    }
  };

  const handleSend = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      if (mode === 'results') {
        await sendResultsEmail(email.trim(), gameName, gameId, results);
      } else {
        const selected = photos.filter(p => selectedPhotoIds.has(p.id));
        await sendShowtimeEmail(email.trim(), gameName, gameId, photos, selected);
      }
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send email');
      setStatus('error');
    }
  };

  const isResults = mode === 'results';

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl glass-panel rounded-3xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-6 border-b border-white/10 flex justify-between items-center ${isResults ? 'bg-orange-600/10' : 'bg-pink-600/10'}`}>
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-wider ${isResults ? 'text-orange-500' : 'text-pink-500'}`}>
              Send {isResults ? 'Results' : 'Showtime'}
            </h2>
            <p className="text-zinc-400 text-xs font-mono uppercase mt-1">{gameName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
          {/* Email input */}
          <div>
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Recipient Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-4 py-3 bg-black/60 border border-zinc-700 rounded-xl focus:outline-none focus:border-orange-500 text-white font-mono placeholder-zinc-700"
              disabled={status === 'sending' || status === 'success'}
            />
          </div>

          {/* Preview */}
          {isResults && (
            <div>
              <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                Preview ({results.length} teams)
              </label>
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 max-h-48 overflow-y-auto">
                {results.slice(0, 5).map(p => (
                  <div key={p.position} className="flex justify-between items-center py-1.5 text-sm">
                    <span className={`font-bold ${p.position <= 3 ? 'text-orange-400' : 'text-zinc-400'}`}>
                      #{p.position} {p.name}
                    </span>
                    <span className="font-mono text-zinc-500">{p.score.toLocaleString()}</span>
                  </div>
                ))}
                {results.length > 5 && (
                  <p className="text-zinc-600 text-xs mt-2">+ {results.length - 5} more teams in PDF</p>
                )}
              </div>
              <p className="text-zinc-600 text-[10px] mt-2 uppercase tracking-wider">
                PDF with full results will be attached
              </p>
            </div>
          )}

          {/* Photo selector for showtime */}
          {!isResults && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">
                  Attach photos ({selectedPhotoIds.size} selected)
                </label>
                <button
                  onClick={selectAllPhotos}
                  className="text-[10px] text-pink-400 hover:text-pink-300 uppercase tracking-wider font-bold"
                >
                  {selectedPhotoIds.size === photos.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto bg-black/40 border border-zinc-800 rounded-xl p-3">
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative ${
                      selectedPhotoIds.has(photo.id)
                        ? 'border-pink-500 scale-95'
                        : 'border-transparent hover:border-zinc-600'
                    }`}
                  >
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.teamName || ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selectedPhotoIds.has(photo.id) && (
                      <div className="absolute inset-0 bg-pink-500/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-zinc-600 text-[10px] mt-2 uppercase tracking-wider">
                Gallery link is always included. Selected photos will be attached to the email.
              </p>
            </div>
          )}

          {/* Status messages */}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm font-bold">
              {errorMsg}
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm font-bold text-center">
              Email sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/10 flex justify-end gap-4">
          {status === 'success' ? (
            <button
              onClick={onClose}
              className="px-8 py-3 bg-zinc-800 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-700 transition-colors border border-zinc-700"
                disabled={status === 'sending'}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={status === 'sending' || !email.trim()}
                className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all border disabled:opacity-40 ${
                  isResults
                    ? 'bg-orange-600 text-white hover:bg-orange-500 border-orange-400'
                    : 'bg-pink-600 text-white hover:bg-pink-500 border-pink-400'
                }`}
              >
                {status === 'sending' ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  `Send ${isResults ? 'Results' : 'Photos'}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendModal;
