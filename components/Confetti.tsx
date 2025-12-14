import React, { useMemo } from 'react';

const Confetti: React.FC = () => {
  const confettiPieces = useMemo(() => {
    const pieces = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    
    for (let i = 0; i < 150; i++) {
      pieces.push({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animationName: 'fall, spin',
          animationDuration: `${Math.random() * 2 + 3}s, ${Math.random() * 2 + 2}s`,
          animationDelay: `${Math.random() * 3}s`,
          animationTimingFunction: 'linear, ease-in-out',
          animationIterationCount: 'infinite, infinite',
        }
      });
    }
    return pieces;
  }, []);

  return (
    <>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes spin {
          0% { transform: rotate3d(1, 1, 1, 0deg); }
          100% { transform: rotate3d(1, 1, 1, 360deg); }
        }
      `}</style>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-50">
        {confettiPieces.map(piece => (
          <div
            key={piece.id}
            className="absolute w-3 h-5"
            style={piece.style}
          />
        ))}
      </div>
    </>
  );
};

export default Confetti;
