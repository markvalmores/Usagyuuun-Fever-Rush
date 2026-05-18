import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { submitScore, fetchLeaderboard, ScoreEntry } from '../services/leaderboard';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export const TitleScreen = () => {
    const { setScreen } = useGameStore();

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/90 pointer-events-auto h-full w-full backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 0.5 }}
               className="flex flex-col items-center"
            >
                <motion.div 
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="text-[100px] mb-4"
                >🐇</motion.div>
                <h1 className="text-6xl sm:text-8xl font-black text-white mb-2 tracking-tighter italic uppercase text-center drop-shadow-[0_10px_0_rgba(255,255,255,0.1)]">
                  USAGYUUUN
                </h1>
                <h2 className="text-2xl sm:text-4xl font-black text-cyan-400 mb-16 italic uppercase tracking-widest">
                  FEVER RUSH
                </h2>
                
                <button 
                    onClick={() => setScreen('NAME_INPUT')} 
                    className="flex items-center gap-3 bg-white text-black font-black py-6 px-12 text-3xl uppercase tracking-widest transition-all hover:bg-cyan-400 hover:text-white border-4 border-white hover:border-cyan-400 shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2"
                >
                    <Play className="fill-black" />
                    PLAY GAME
                </button>
            </motion.div>
        </div>
    );
};

export const NameInputScreen = () => {
    const { setPlayerName, setScreen } = useGameStore();
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setPlayerName(name.trim());
            setScreen('MAIN_MENU');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/90 pointer-events-auto h-full w-full">
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-2 tracking-tighter italic uppercase text-center drop-shadow-[0_10px_0_rgba(255,255,255,0.1)]">
              USAGYUUUN
            </h1>
            <h2 className="text-xl sm:text-2xl font-black text-cyan-400 mb-12 italic uppercase tracking-widest">
              ENTER YOUR NAME
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-sm">
                <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={15}
                    placeholder="PLAYER NAME" 
                    className="w-full bg-neutral-900 border-4 border-white text-white text-center text-3xl font-black uppercase tracking-widest p-4 mb-8 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button type="submit" disabled={!name.trim()} className="w-full bg-white text-black font-black py-4 px-8 rounded-none text-2xl uppercase tracking-widest transition-all hover:bg-cyan-400 hover:text-white border-4 border-white hover:border-cyan-400 shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    CONFIRM
                </button>
            </form>
        </div>
    );
};

export const MainMenuScreen = () => {
    const { startGame, setScreen } = useGameStore();

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/80 pointer-events-auto h-full w-full backdrop-blur-md">
            <h1 className="text-6xl sm:text-8xl font-black text-white mb-2 tracking-tighter italic uppercase text-center drop-shadow-[0_10px_0_rgba(255,255,255,0.1)]">
              USAGYUUUN
            </h1>
            <h2 className="text-2xl sm:text-4xl font-black text-cyan-400 mb-12 italic uppercase tracking-widest">
              FEVER RUSH
            </h2>
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <button onClick={startGame} className="w-full bg-white text-black font-black py-4 px-8 text-2xl uppercase tracking-widest transition-all hover:bg-cyan-400 hover:text-white border-4 border-white hover:border-cyan-400 shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2">
                    START RUN
                </button>
                <button onClick={() => setScreen('LEADERBOARD')} className="w-full bg-neutral-900 text-white font-black py-4 px-8 text-xl uppercase tracking-widest transition-all hover:bg-neutral-800 border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2">
                    LEADERBOARDS
                </button>
                <button onClick={() => setScreen('OPTIONS')} className="w-full bg-neutral-900 text-white font-black py-4 px-8 text-xl uppercase tracking-widest transition-all hover:bg-neutral-800 border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2">
                    HOW TO PLAY / OPTIONS
                </button>
            </div>
            
            {/* Device Orientation Permission button (needed for iOS) */}
            {typeof (DeviceOrientationEvent as any)?.requestPermission === "function" && (
            <button
                onClick={() => {
                (DeviceOrientationEvent as any)
                    .requestPermission()
                    .then((response: string) => {
                    if (response == "granted") console.log("Tilt allowed");
                    })
                    .catch(console.error);
                }}
                className="mt-8 text-xs text-blue-300 underline"
            >
                Enable Mobile Tilt (iOS)
            </button>
            )}
        </div>
    );
};

export const GameOverScreen = () => {
    const { score, distance, playerName, startGame, setScreen } = useGameStore();

    useEffect(() => {
        submitScore(playerName, score, distance);
    }, [score, distance, playerName]);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/90 pointer-events-auto h-full w-full backdrop-blur-md">
            <span className="text-sm font-black tracking-[0.3em] text-red-500 mb-1 uppercase">
                CRASHED!
            </span>
            <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-none text-white text-center mb-8">
                {Math.floor(distance)}<span className="text-3xl not-italic ml-2 opacity-50">m</span>
            </h1>
            <div className="text-xl text-yellow-400 font-bold mb-12 tracking-widest uppercase">
                Score: {score}
            </div>

            <div className="flex flex-col gap-6 w-full max-w-sm">
                <button onClick={startGame} className="w-full bg-white text-black font-black py-4 px-8 text-2xl uppercase tracking-widest transition-all hover:bg-cyan-400 hover:text-white border-4 border-white hover:border-cyan-400 shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2">
                    TRY AGAIN
                </button>
                <button onClick={() => setScreen('MAIN_MENU')} className="w-full bg-neutral-900 text-white font-black py-4 px-8 text-xl uppercase tracking-widest transition-all hover:bg-neutral-800 border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2">
                    MAIN MENU
                </button>
            </div>
        </div>
    );
};

export const LeaderboardScreen = () => {
    const { setScreen } = useGameStore();
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard().then(data => {
            setScores(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="flex flex-col items-center pt-16 p-8 bg-black/95 pointer-events-auto h-full w-full max-h-screen overflow-y-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-cyan-400 mb-10 italic uppercase tracking-widest text-center">
              GLOBAL RANKINGS
            </h2>
            
            <div className="w-full max-w-lg mb-12">
                {loading ? (
                    <div className="text-white text-center animate-pulse font-bold tracking-widest">LOADING SECRETS...</div>
                ) : scores.length === 0 ? (
                    <div className="text-white text-center font-bold tracking-widest opacity-50">NO SCORES YET</div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {scores.map((entry, index) => (
                            <div key={entry.id || index} className="flex justify-between items-center bg-neutral-900 border border-white/20 p-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-cyan-400 font-black text-xl w-6">{index + 1}.</span>
                                    <span className="text-white font-bold uppercase tracking-widest">{entry.playerName}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-yellow-400 font-black">{entry.score} pts</span>
                                    <span className="text-white/50 text-xs font-bold">{Math.floor(entry.distance)}m</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={() => setScreen('MAIN_MENU')} className="bg-neutral-800 text-white font-black py-3 px-8 text-lg uppercase tracking-widest transition-all hover:bg-neutral-700 border-2 border-white/50 active:translate-x-1 active:translate-y-1">
                BACK
            </button>
        </div>
    );
};

export const OptionsScreen = () => {
    const { setScreen, volume, setVolume, baseSpeed, setBaseSpeed } = useGameStore();

    return (
        <div className="flex flex-col items-center pt-8 sm:pt-16 p-8 bg-black/95 pointer-events-auto h-full w-full overflow-y-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-8 italic uppercase tracking-widest text-center">
              OPTIONS & INSTRUCTIONS
            </h2>

            <div className="w-full max-w-md bg-neutral-900 border border-white/20 p-6 mb-8">
                <h3 className="text-cyan-400 font-black tracking-widest mb-4">HOW TO PLAY</h3>
                <ul className="text-white text-sm font-bold flex flex-col gap-2 opacity-80 pl-4 list-disc mb-6">
                    <li>Dodge obstacles (Blocks, over-head Hazards, low Hazards).</li>
                    <li>Collect Neon Diamonds for Score & Fever Energy.</li>
                    <li>When Fever Meter is full, trigger it to destroy anything and sprint!</li>
                </ul>

                <h3 className="text-orange-400 font-black tracking-widest mb-4">CONTROLS</h3>
                <div className="text-white text-sm font-bold flex flex-col gap-3">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span>PC</span>
                        <span className="opacity-70">Arrows to Move/Dodge, Space for Fever</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span>Mobile</span>
                        <span className="opacity-70">Tilt to Move/Dodge, Tap for Fever</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Gamepad</span>
                        <span className="opacity-70">D-Pad/Stick to Move, South Btn for Fever</span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-md flex flex-col gap-6 mb-12">
                <div>
                    <label className="text-white font-black tracking-widest text-sm mb-2 flex justify-between">
                        VOLUME <span>{Math.round(volume * 100)}%</span>
                    </label>
                    <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                    />
                </div>
                <div>
                    <label className="text-white font-black tracking-widest text-sm mb-2 flex justify-between">
                        BASE SPEED <span>{baseSpeed}</span>
                    </label>
                    <input 
                        type="range" min="10" max="40" step="5" 
                        value={baseSpeed} onChange={(e) => setBaseSpeed(parseFloat(e.target.value))}
                        className="w-full accent-orange-400"
                    />
                </div>
            </div>

            <button onClick={() => setScreen('MAIN_MENU')} className="bg-neutral-800 text-white font-black py-3 px-8 text-lg uppercase tracking-widest transition-all hover:bg-neutral-700 border-2 border-white/50 active:translate-x-1 active:translate-y-1">
                BACK
            </button>
        </div>
    );
};

export const PauseMenuScreen = () => {
    const { resumeGame, setScreen } = useGameStore();

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/80 pointer-events-auto h-full w-full backdrop-blur-md">
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-12 italic uppercase tracking-widest shadow-[0_4px_0_cyan]">
              PAUSED
            </h2>
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <button onClick={resumeGame} className="w-full bg-white text-black font-black py-4 px-8 text-2xl uppercase tracking-widest transition-all hover:bg-cyan-400 hover:text-white border-4 border-white hover:border-cyan-400 shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2">
                    RESUME
                </button>
                <button onClick={() => setScreen('MAIN_MENU')} className="w-full bg-neutral-900 text-white font-black py-4 px-8 text-xl uppercase tracking-widest transition-all hover:bg-neutral-800 border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2">
                    QUIT TO MENU
                </button>
            </div>
        </div>
    );
};
