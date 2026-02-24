/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RefreshCw, Play, Info, AlertCircle, ChevronRight } from 'lucide-react';

// --- Constants & Types ---

const INITIAL_TIME = 30;
const INITIAL_GRID_SIZE = 2;
const MAX_GRID_SIZE = 8;
const BASE_DIFFERENCE = 40; // Initial color difference in HSL lightness/saturation

interface GameState {
  score: number;
  timeLeft: number;
  level: number;
  status: 'idle' | 'playing' | 'gameover';
  gridSize: number;
}

interface Color {
  h: number;
  s: number;
  l: number;
}

// --- Helper Functions ---

const generateRandomColor = (): Color => ({
  h: Math.floor(Math.random() * 360),
  s: Math.floor(Math.random() * 40) + 40, // 40-80% saturation
  l: Math.floor(Math.random() * 40) + 30, // 30-70% lightness
});

const getDifferentColor = (base: Color, level: number): Color => {
  // Difficulty curve: difference decreases as level increases
  // We use a logarithmic-like decay for the difference
  const diff = Math.max(2, BASE_DIFFERENCE / (1 + Math.log2(level + 1) * 0.8));
  
  // Randomly decide whether to change lightness or saturation
  const changeLightness = Math.random() > 0.5;
  
  return {
    ...base,
    l: changeLightness ? (base.l + diff > 90 ? base.l - diff : base.l + diff) : base.l,
    s: !changeLightness ? (base.s + diff > 90 ? base.s - diff : base.s + diff) : base.s,
  };
};

const colorToCss = (c: Color) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`;

// --- Components ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: INITIAL_TIME,
    level: 1,
    status: 'idle',
    gridSize: INITIAL_GRID_SIZE,
  });

  const [colors, setColors] = useState<{ base: Color; diff: Color; diffIndex: number }>({
    base: { h: 0, s: 0, l: 0 },
    diff: { h: 0, s: 0, l: 0 },
    diffIndex: -1,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateLevel = useCallback((level: number) => {
    const base = generateRandomColor();
    const diff = getDifferentColor(base, level);
    
    // Grid size increases every few levels
    const newGridSize = Math.min(MAX_GRID_SIZE, INITIAL_GRID_SIZE + Math.floor(level / 3));
    const diffIndex = Math.floor(Math.random() * (newGridSize * newGridSize));

    setColors({ base, diff, diffIndex });
    setGameState(prev => ({ ...prev, gridSize: newGridSize }));
  }, []);

  const startGame = () => {
    setGameState({
      score: 0,
      timeLeft: INITIAL_TIME,
      level: 1,
      status: 'playing',
      gridSize: INITIAL_GRID_SIZE,
    });
    generateLevel(1);
  };

  const handleBlockClick = (index: number) => {
    if (gameState.status !== 'playing') return;

    if (index === colors.diffIndex) {
      // Correct!
      const nextLevel = gameState.level + 1;
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        level: nextLevel,
        timeLeft: prev.timeLeft + 1, // Bonus time
      }));
      generateLevel(nextLevel);
    } else {
      // Wrong! Penalty
      setGameState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 3),
      }));
    }
  };

  useEffect(() => {
    if (gameState.status === 'playing' && gameState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return { ...prev, timeLeft: 0, status: 'gameover' };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.status]);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#F5F5F0] p-4 md:p-8 flex flex-col items-center justify-center">
      {/* Header Section */}
      <header className="w-full max-w-2xl mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">
            Chromatic<br />Vision
          </h1>
          <p className="text-sm font-mono uppercase opacity-60">Art Student Sensitivity Challenge</p>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-1">
              <Trophy size={10} /> Score
            </span>
            <span className="text-3xl font-black leading-none">{gameState.score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-1">
              <Timer size={10} /> Time
            </span>
            <span className={`text-3xl font-black leading-none ${gameState.timeLeft <= 5 ? 'text-red-500 animate-pulse' : ''}`}>
              {gameState.timeLeft}s
            </span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative w-full max-w-md aspect-square bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState.status === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="mb-6 p-4 border border-dashed border-[#141414] rounded-full animate-spin-slow">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-400 via-green-400 to-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Ready to test your eyes?</h2>
              <p className="text-sm opacity-70 mb-8 max-w-xs">
                Find the block with the slightly different shade. It gets harder as you score higher.
              </p>
              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-[#141414] text-[#F5F5F0] font-bold uppercase tracking-widest hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
              >
                Start Challenge <Play size={18} />
              </button>
            </motion.div>
          )}

          {gameState.status === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full p-2 grid gap-2"
              style={{ 
                gridTemplateColumns: `repeat(${gameState.gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gameState.gridSize}, 1fr)`
              }}
            >
              {Array.from({ length: gameState.gridSize * gameState.gridSize }).map((_, i) => (
                <motion.button
                  key={`${gameState.level}-${i}`}
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBlockClick(i)}
                  className="w-full h-full rounded-sm transition-transform duration-100"
                  style={{ 
                    backgroundColor: i === colors.diffIndex ? colorToCss(colors.diff) : colorToCss(colors.base)
                  }}
                />
              ))}
            </motion.div>
          )}

          {gameState.status === 'gameover' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white/95 backdrop-blur-sm"
            >
              <AlertCircle size={48} className="mb-4 text-red-500" />
              <h2 className="text-4xl font-black uppercase mb-2">Time's Up!</h2>
              <div className="mb-8">
                <p className="text-sm font-mono uppercase opacity-60">Final Score</p>
                <p className="text-6xl font-black">{gameState.score}</p>
              </div>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-[#141414] text-[#F5F5F0] font-bold uppercase tracking-widest hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                >
                  Try Again <RefreshCw size={18} />
                </button>
                <div className="p-4 border border-[#141414] text-left">
                  <p className="text-[10px] font-mono uppercase font-bold mb-1 flex items-center gap-1">
                    <Info size={10} /> Pro Tip
                  </p>
                  <p className="text-xs opacity-70">
                    Art students usually score above 30. Focus on the subtle shifts in saturation rather than just brightness.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Explanation Section */}
      <footer className="w-full max-w-2xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border-t border-[#141414] pt-4">
          <h3 className="text-xs font-mono uppercase font-bold mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" /> Difficulty Curve
          </h3>
          <p className="text-xs opacity-60 leading-relaxed">
            The color delta (ΔE) decreases logarithmically. By level 20, the difference is less than 2% in lightness.
          </p>
        </div>
        <div className="border-t border-[#141414] pt-4">
          <h3 className="text-xs font-mono uppercase font-bold mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" /> Grid Scaling
          </h3>
          <p className="text-xs opacity-60 leading-relaxed">
            Starting at 2x2, the grid expands up to 8x8 as you progress, increasing the cognitive load of visual search.
          </p>
        </div>
        <div className="border-t border-[#141414] pt-4">
          <h3 className="text-xs font-mono uppercase font-bold mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" /> Visual Feedback
          </h3>
          <p className="text-xs opacity-60 leading-relaxed">
            Correct choices grant +1s bonus. Incorrect choices penalize -3s. Precision is more important than speed.
          </p>
        </div>
      </footer>

      {/* Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    </div>
  );
}
