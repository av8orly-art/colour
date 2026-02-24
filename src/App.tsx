/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RefreshCw, Play, Info, AlertCircle, Languages } from 'lucide-react';

// --- Constants & Types ---

const INITIAL_TIME = 30;
const INITIAL_GRID_SIZE = 2;
const MAX_GRID_SIZE = 8;
const BASE_DIFFERENCE = 40; // Initial color difference in HSL lightness/saturation

type Language = 'en' | 'zh';

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

const translations = {
  en: {
    title: 'Chromatic Vision',
    subtitle: 'Art Student Sensitivity Challenge',
    score: 'Score',
    time: 'Time',
    ready: 'Ready to test your eyes?',
    idleDesc: 'Find the block with the slightly different shade. It gets harder as you score higher.',
    start: 'Start Challenge',
    timesUp: "Time's Up!",
    finalScore: 'Final Score',
    tryAgain: 'Try Again',
    proTip: 'Pro Tip',
    proTipContent: 'Art students usually score above 30. Focus on the subtle shifts in saturation rather than just brightness.',
    diffCurve: 'Difficulty Curve',
    diffCurveContent: 'The color delta (ΔE) decreases logarithmically. By level 20, the difference is less than 2% in lightness.',
    gridScaling: 'Grid Scaling',
    gridScalingContent: 'Starting at 2x2, the grid expands up to 8x8 as you progress, increasing the cognitive load of visual search.',
    feedback: 'Visual Feedback',
    feedbackContent: 'Correct choices grant +1s bonus. Incorrect choices penalize -3s. Precision is more important than speed.',
  },
  zh: {
    title: '色彩视觉',
    subtitle: '艺术生色彩敏感度挑战',
    score: '得分',
    time: '时间',
    ready: '准备好测试你的眼力了吗？',
    idleDesc: '找出那个颜色略有不同的色块。得分越高，难度越大。',
    start: '开始挑战',
    timesUp: '时间到！',
    finalScore: '最终得分',
    tryAgain: '再试一次',
    proTip: '专业贴士',
    proTipContent: '艺术生通常能得分30以上。专注于饱和度的细微变化，而不仅仅是亮度。',
    diffCurve: '难度曲线',
    diffCurveContent: '色彩差异 (ΔE) 呈对数级递减。到第20关时，亮度差异不足2%。',
    gridScaling: '网格缩放',
    gridScalingContent: '从2x2开始，网格随进度扩展至8x8，增加了视觉搜索的认知负荷。',
    feedback: '视觉反馈',
    feedbackContent: '选择正确奖励+1秒。选择错误扣除3秒。精准度比速度更重要。',
  }
};

// --- Helper Functions ---

const generateRandomColor = (): Color => ({
  h: Math.floor(Math.random() * 360),
  s: Math.floor(Math.random() * 40) + 40, // 40-80% saturation
  l: Math.floor(Math.random() * 40) + 30, // 30-70% lightness
});

const getDifferentColor = (base: Color, level: number): Color => {
  const diff = Math.max(2, BASE_DIFFERENCE / (1 + Math.log2(level + 1) * 0.8));
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
  const [lang, setLang] = useState<Language>('zh');
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
  const t = translations[lang];

  const generateLevel = useCallback((level: number) => {
    const base = generateRandomColor();
    const diff = getDifferentColor(base, level);
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
      const nextLevel = gameState.level + 1;
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        level: nextLevel,
        timeLeft: prev.timeLeft + 1,
      }));
      generateLevel(nextLevel);
    } else {
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
      <header className="w-full max-w-2xl mb-8 flex flex-col md:flex-row justify-between items-end gap-4 relative">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">
            {lang === 'en' ? (
              <>Chromatic<br />Vision</>
            ) : (
              t.title
            )}
          </h1>
          <p className="text-sm font-mono uppercase opacity-60">{t.subtitle}</p>
        </div>
        
        <div className="flex gap-6 items-center">
          <button 
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#F5F5F0] transition-colors rounded-sm"
            title="Switch Language"
          >
            <Languages size={20} />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-1">
              <Trophy size={10} /> {t.score}
            </span>
            <span className="text-3xl font-black leading-none">{gameState.score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-1">
              <Timer size={10} /> {t.time}
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
              <h2 className="text-2xl font-bold mb-4">{t.ready}</h2>
              <p className="text-sm opacity-70 mb-8 max-w-xs">
                {t.idleDesc}
              </p>
              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-[#141414] text-[#F5F5F0] font-bold uppercase tracking-widest hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
              >
                {t.start} <Play size={18} />
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
              <h2 className="text-4xl font-black uppercase mb-2">{t.timesUp}</h2>
              <div className="mb-8 text-center">
                <p className="text-sm font-mono uppercase opacity-60">{t.finalScore}</p>
                <p className="text-6xl font-black">{gameState.score}</p>
              </div>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-[#141414] text-[#F5F5F0] font-bold uppercase tracking-widest hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                >
                  {t.tryAgain} <RefreshCw size={18} />
                </button>
                <div className="p-4 border border-[#141414] text-left">
                  <p className="text-[10px] font-mono uppercase font-bold mb-1 flex items-center gap-1">
                    <Info size={10} /> {t.proTip}
                  </p>
                  <p className="text-xs opacity-70">
                    {t.proTipContent}
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
            <div className="w-2 h-2 bg-red-500 rounded-full" /> {t.diffCurve}
          </h3>
          <p className="text-xs opacity-60 leading-relaxed">
            {t.diffCurveContent}
          </p>
        </div>
        <div className="border-t border-[#141414] pt-4">
          <h3 className="text-xs font-mono uppercase font-bold mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" /> {t.gridScaling}
          </h3>
          <p className="text-xs opacity-60 leading-relaxed">
            {t.gridScalingContent}
          </p>
        </div>
        <div className="border-t border-[#141414] pt-4">
          <h3 className="text-xs font-mono uppercase font-bold mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" /> {t.feedback}
          </h3>
          <p className="text-xs opacity-60 leading-relaxed">
            {t.feedbackContent}
          </p>
        </div>
      </footer>

      {/* Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    </div>
  );
}
