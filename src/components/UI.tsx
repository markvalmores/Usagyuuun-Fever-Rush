import React, { useEffect, useState } from "react";
import { useGameStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import { TitleScreen, NameInputScreen, MainMenuScreen, GameOverScreen, LeaderboardScreen, OptionsScreen, PauseMenuScreen } from "./Screens";

export const UI = () => {
  const {
    screen,
    score,
    distance,
    energy,
    isFeverMode,
    lives,
    isHit,
    isTransitioning,
    pauseGame,
    isAutoplay,
    toggleAutoplay,
    endGame,
  } = useGameStore();
  const [actionPrompt, setActionPrompt] = useState<string | null>(null);

  // Provide some visual action prompts randomly (optional)
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const prompts = ["SWIPE!", "TILT NOW!", "DUCK!", "JUMP!"];
        setActionPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
        setTimeout(() => setActionPrompt(null), 800);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [screen]);

  // Handle escape/pause and end run
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (screen !== 'PLAYING') return;
          if ((e.key === 'Escape' || e.key === 'p')) {
              pauseGame();
          } else if (e.key === 'e') {
              endGame();
          } else if (e.key === 'y') {
              endGame();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, pauseGame, endGame]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between font-sans">
      {/* Damage Overlay */}
      <AnimatePresence>
        {isHit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600 z-10 mix-blend-multiply"
          />
        )}
      </AnimatePresence>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 bg-white z-40 flex items-center justify-center font-black italic tracking-tighter"
          >
            <motion.h2
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-black text-4xl sm:text-7xl uppercase"
            >
              Stage Clear!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD */}
      {screen === 'PLAYING' && (
        <div className="relative z-20 p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-[0.3em] text-cyan-400 mb-1 uppercase">
              Total Distance
            </span>
            <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-none text-white">
              {Math.floor(distance)}
              <span className="text-2xl sm:text-3xl not-italic ml-2 opacity-50">
                m
              </span>
            </h1>
            <span className="text-yellow-400 font-bold mt-2">Score: {Math.floor(score)}</span>
            <div className="flex items-center gap-1 mt-2">
               {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                 <Heart key={i} className="text-red-500 fill-red-500 w-5 h-5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />
               ))}
               {Array.from({ length: Math.max(0, 3 - lives) }).map((_, i) => (
                 <Heart key={`empty-${i}`} className="text-red-500/30 w-5 h-5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />
               ))}
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end pointer-events-auto">
            <div className="w-48 sm:w-64 h-4 bg-white/10 rounded-full overflow-hidden border border-white/20 relative">
              <motion.div
                className={`h-full ${isFeverMode ? "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" : "bg-gradient-to-r from-orange-500 to-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]"}`}
                initial={{ width: 0 }}
                animate={{ width: `${energy}%` }}
                transition={{ ease: "linear", duration: 0.2 }}
              />
            </div>
            <div className="mt-2 flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                 <span
                   className={`text-xs sm:text-sm font-bold ${energy >= 100 ? "animate-pulse text-orange-400" : isFeverMode ? "text-cyan-400" : "text-neutral-400"}`}
                 >
                   {isFeverMode
                     ? "FEVER ACTIVE!"
                     : energy >= 100
                       ? "FEVER READY"
                       : "FEVER METER"}
                 </span>
                 <div className="px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest hidden sm:block">
                   TAP A / SPACE
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={toggleAutoplay} className={`text-[10px] uppercase border px-2 py-1 pointer-events-auto ${isAutoplay ? "border-green-500 text-green-500" : "border-white/20 text-white/50 hover:text-white"}`}>
                    AUTOPLAY: {isAutoplay ? 'ON' : 'OFF'}
                 </button>
                 <button onClick={pauseGame} className="text-[10px] text-white/50 border border-white/20 px-2 py-1 hover:text-white pointer-events-auto">PAUSE (ESC)</button>
                 <button onClick={endGame} className="text-[10px] text-red-500 border border-red-500/50 px-2 py-1 hover:text-white hover:bg-red-500 pointer-events-auto">END RUN</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Central Action Prompts */}
      <AnimatePresence>
        {actionPrompt && screen === 'PLAYING' && !isFeverMode && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -6 }}
            animate={{ scale: 1.1, opacity: 1, rotate: -6 }}
            exit={{ scale: 1.5, opacity: 0, rotate: -6 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
          >
            <div className="relative whitespace-nowrap">
              <h2 className="text-[60px] sm:text-[140px] font-black italic leading-none drop-shadow-[0_10px_0_rgba(255,255,255,0.1)] text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 uppercase">
                {actionPrompt}
              </h2>
              <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-2 sm:h-4 bg-cyan-500 blur-md opacity-50"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screens */}
      <AnimatePresence>
        {screen !== 'PLAYING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex"
          >
             {screen === 'TITLE' && <TitleScreen />}
             {screen === 'NAME_INPUT' && <NameInputScreen />}
             {screen === 'MAIN_MENU' && <MainMenuScreen />}
             {screen === 'OPTIONS' && <OptionsScreen />}
             {screen === 'LEADERBOARD' && <LeaderboardScreen />}
             {screen === 'GAME_OVER' && <GameOverScreen />}
             {screen === 'PAUSED' && <PauseMenuScreen />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
