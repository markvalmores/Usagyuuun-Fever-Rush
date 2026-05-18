import { create } from "zustand";
import { playSound, stopSound, setGlobalVolume } from "./AudioManager";

export type GameScreen = 'TITLE' | 'NAME_INPUT' | 'MAIN_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEADERBOARD' | 'OPTIONS';

interface GameState {
  screen: GameScreen;
  playerName: string;
  score: number;
  distance: number;
  energy: number; // 0 to 100 for fever
  isFeverMode: boolean;
  speed: number;
  baseSpeed: number; // adjustable via options
  volume: number;
  lives: number;
  isHit: boolean;
  isTransitioning: boolean;
  isAutoplay: boolean;
  lane: number;

  setScreen: (screen: GameScreen) => void;
  setPlayerName: (name: string) => void;
  setVolume: (volume: number) => void;
  setBaseSpeed: (speed: number) => void;
  setTransitioning: (isTransitioning: boolean) => void;
  toggleAutoplay: () => void;
  setLane: (lane: number) => void;
  
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  loseLife: () => void;
  addScore: (points: number) => void;
  addDistance: (amount: number) => void;
  addEnergy: (amount: number) => void;
  triggerFever: () => void;
  resetFever: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'TITLE',
  playerName: '',
  score: 0,
  distance: 0,
  energy: 0,
  isFeverMode: false,
  baseSpeed: 15,
  speed: 15,
  volume: 0.5,
  lives: 3,
  isHit: false,
  isTransitioning: false,
  isAutoplay: false,
  lane: 0,

  setScreen: (screen) => set({ screen }),
  setPlayerName: (name) => set({ playerName: name }),
  setVolume: (volume) => {
    setGlobalVolume(volume);
    set({ volume })
  },
  setBaseSpeed: (baseSpeed) => set({ baseSpeed }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  toggleAutoplay: () => set((state) => ({ isAutoplay: !state.isAutoplay })),
  setLane: (lane) => set({ lane }),

  startGame: () => {
    playSound("bgm");
    set((state) => ({
      screen: 'PLAYING',
      score: 0,
      distance: 0,
      energy: 0,
      speed: state.baseSpeed,
      isFeverMode: false,
      lives: 3,
      isHit: false,
      isTransitioning: false,
      isAutoplay: false,
      lane: 0,
    }));
  },
  pauseGame: () => {
     set({ screen: 'PAUSED' });
  },
  resumeGame: () => {
     set({ screen: 'PLAYING' });
  },
  endGame: () => {
    stopSound("bgm");
    stopSound("feverBgm");
    playSound("hit");
    set({ screen: 'GAME_OVER', speed: 0 });
  },
  loseLife: () => {
    const state = useGameStore.getState();
    if (state.screen !== 'PLAYING' || state.isFeverMode || state.isTransitioning) return;
    playSound("hit");
    
    // VFX Red Flash
    useGameStore.setState({ isHit: true });
    setTimeout(() => useGameStore.setState({ isHit: false }), 200);

    const newLives = state.lives - 1;
    const newDistance = Math.max(0, state.distance - 10);
    const newScore = Math.max(0, state.score - 10);
    
    if (newLives <= 0) {
      stopSound("bgm");
      stopSound("feverBgm");
      useGameStore.setState({ lives: 0, distance: newDistance, score: newScore, screen: 'GAME_OVER', speed: 0 });
    } else {
      useGameStore.setState({ lives: newLives, distance: newDistance, score: newScore });
    }
  },
  addScore: (points) => set((state) => ({ score: state.score + points })),
  addDistance: (amount) => set((state) => {
    let newEnergy = state.energy;
    let playedSound = false;
    
    if (!state.isFeverMode && newEnergy < 100) {
      newEnergy = Math.min(100, state.energy + amount * 3.3);
      if (newEnergy >= 100 && state.energy < 100) {
        playedSound = true;
      }
    }
    
    if (playedSound) {
      playSound("ring");
    }
    
    return { 
      distance: state.distance + amount,
      score: state.score + (amount * 10),
      energy: newEnergy
    };
  }),
  addEnergy: (amount) => {
    playSound("energy");
    set((state) => {
      if (state.isFeverMode) return state;
      const newEnergy = Math.min(state.energy + amount, 100);
      return { energy: newEnergy };
    });
  },
  triggerFever: () => {
    set((state) => {
      if (state.energy >= 100 && !state.isFeverMode) {
        stopSound("bgm");
        playSound("feverBgm");
        playSound("fever");

        // Auto reset fever after some time
        setTimeout(() => {
          useGameStore.getState().resetFever();
        }, 10000); // 10 seconds of fever

        return { isFeverMode: true, speed: state.baseSpeed * 2.5 };
      }
      return state;
    });
  },
  resetFever: () => {
    set((state) => {
      if (state.screen === 'GAME_OVER') return state;
      stopSound("feverBgm");
      stopSound("fever");
      playSound("bgm");
      return { isFeverMode: false, energy: 0, speed: state.baseSpeed };
    });
  },
}));
