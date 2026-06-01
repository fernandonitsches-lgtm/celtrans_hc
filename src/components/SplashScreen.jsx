import React, { useEffect } from 'react';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
      <div className="text-center">
        {/* Logo CelTrans */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex gap-1">
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-green-400 opacity-40"></div>
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-green-400 opacity-70"></div>
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-green-400"></div>
          </div>
          <div>
            <span className="text-white text-3xl font-bold">CelTrans</span>
            <p className="text-slate-400 text-xs tracking-widest uppercase">Supply Chain Integrated</p>
          </div>
        </div>

        <h1 className="text-white text-4xl font-bold mb-2">
          Head<span className="text-green-400">Count</span>
        </h1>

        {/* Animação de setas */}
        <div className="flex items-center justify-center gap-2 my-10">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-0 h-0 border-t-[16px] border-t-transparent border-b-[16px] border-b-transparent border-l-[26px]"
              style={{
                borderLeftColor: '#22c55e',
                opacity: 0.3 + i * 0.23,
                animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`
              }}
            />
          ))}
        </div>

        <p className="text-slate-400 text-sm tracking-wider">Carregando operações...</p>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-600"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;