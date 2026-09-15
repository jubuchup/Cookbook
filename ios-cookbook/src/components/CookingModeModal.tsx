import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Sparkles,
  Volume2,
  Lock,
  List
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe } from '../types';
import { haptics } from '../hooks/useHaptics';

interface CookingModeModalProps {
  recipe: Recipe;
  servings: number;
  onClose: () => void;
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({
  recipe,
  servings,
  onClose,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showIngredientsDrawer, setShowIngredientsDrawer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);

  const step = recipe.steps[currentStepIdx];
  const totalSteps = recipe.steps.length;

  // Initialize timer whenever step changes
  useEffect(() => {
    if (step.durationMinutes && step.durationMinutes > 0) {
      setTimerSeconds(step.durationMinutes * 60);
      setIsTimerRunning(false);
    } else {
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  }, [currentStepIdx, step]);

  // Timer countdown loop
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev !== null && prev <= 1) {
            setIsTimerRunning(false);
            haptics.chime();
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Keep screen awake via Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock
        .request('screen')
        .then((lock: any) => {
          wakeLock = lock;
          setScreenLocked(true);
        })
        .catch(() => {});
    }
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const handleNextStep = () => {
    haptics.tap();
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      // Recipe completed!
      setIsFinished(true);
      haptics.success();
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
      });
    }
  };

  const handlePrevStep = () => {
    haptics.tap();
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const scale = servings / (recipe.servings || 1);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1220] text-white flex flex-col justify-between select-none animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-neutral-800">
        <button
          id="exit-cooking-mode-btn"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center active:scale-90 transition text-neutral-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-neutral-400 block tracking-wider uppercase">
            Cooking Mode
          </span>
          <span className="text-sm font-bold text-neutral-200">
            {recipe.title}
          </span>
        </div>

        <button
          id="toggle-cooking-ingredients-btn"
          onClick={() => {
            haptics.tap();
            setShowIngredientsDrawer((prev) => !prev);
          }}
          className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition ${
            showIngredientsDrawer
              ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white'
              : 'bg-neutral-900 border-neutral-800 text-neutral-300'
          }`}
          title="Ingredients Quick View"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bars */}
      <div className="px-6 py-2 flex items-center gap-1.5">
        {recipe.steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i === currentStepIdx
                ? 'bg-[#1E3A8A]'
                : i < currentStepIdx
                ? 'bg-neutral-600'
                : 'bg-neutral-800'
            }`}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ios-scroll px-6 py-4 flex flex-col justify-center max-w-lg mx-auto w-full">
        {!isFinished ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-200 key={currentStepIdx}">
            {/* Step Counter */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold tracking-wider text-[#FACC15] uppercase">
                Step {step.stepNumber} of {totalSteps}
              </span>

              {screenLocked && (
                <span className="flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  Screen Awake
                </span>
              )}
            </div>

            {/* Step Title & Instruction */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {step.title}
              </h2>
              <p className="text-lg sm:text-xl text-neutral-200 leading-relaxed font-normal">
                {step.instruction}
              </p>
            </div>

            {/* Chef Tip */}
            {step.tip && (
              <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <strong className="font-semibold block text-amber-300 mb-0.5">Chef's Secret</strong>
                  {step.tip}
                </div>
              </div>
            )}

            {/* Step Timer if available */}
            {timerSeconds !== null && (
              <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isTimerRunning ? 'bg-[#1E3A8A]/20 text-[#5B8DEF]' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    <Clock className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-neutral-400 block font-semibold">
                      Step Timer
                    </span>
                    <span className="text-2xl font-mono font-bold tracking-tight text-white">
                      {formatTime(timerSeconds)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="cooking-timer-toggle-btn"
                    onClick={() => {
                      haptics.tap();
                      setIsTimerRunning((prev) => !prev);
                    }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition ${
                      isTimerRunning
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#1E3A8A] text-white'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  <button
                    id="cooking-timer-reset-btn"
                    onClick={() => {
                      haptics.tap();
                      setIsTimerRunning(false);
                      setTimerSeconds((step.durationMinutes || 0) * 60);
                    }}
                    className="w-11 h-11 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center active:scale-90 transition hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Completion Screen */
          <div className="text-center space-y-5 py-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#1E3A8A] to-[#3B6FD9] rounded-full mx-auto flex items-center justify-center shadow-xl shadow-[#1E3A8A]/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">Bon Appétit!</h2>
              <p className="text-neutral-400 text-base mt-2">
                You've successfully prepared {recipe.title}.
              </p>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xs mx-auto text-sm text-neutral-300">
              <span>{servings} portions ready to serve</span> • <span>{Math.round(recipe.calories * scale)} kcal/serving</span>
            </div>

            <button
              id="finish-cooking-btn"
              onClick={onClose}
              className="px-8 py-3.5 bg-white text-black font-bold rounded-full shadow-lg active:scale-95 transition hover:bg-neutral-200"
            >
              Done & Return to Cookbook
            </button>
          </div>
        )}
      </div>

      {/* Slide-over Quick Ingredients Drawer */}
      {showIngredientsDrawer && (
        <div className="fixed inset-x-0 bottom-0 top-24 z-50 bg-[#141416]/95 backdrop-blur-xl border-t border-neutral-800 p-6 flex flex-col max-w-lg mx-auto rounded-t-3xl shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <h3 className="text-lg font-bold text-white">
              Ingredients ({servings} {servings === 1 ? 'serving' : 'servings'})
            </h3>
            <button
              onClick={() => setShowIngredientsDrawer(false)}
              className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto ios-scroll py-4 space-y-2">
            {recipe.ingredients.map((ing) => {
              const scaledAmt = Math.round((ing.amount * scale) * 10) / 10;
              return (
                <div key={ing.id} className="flex items-center justify-between py-2 border-b border-neutral-800/60 text-sm">
                  <span className="text-neutral-200 font-medium">{ing.name}</span>
                  <span className="text-neutral-400 font-mono text-xs">{scaledAmt} {ing.unit}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Step Navigation Bar */}
      {!isFinished && (
        <div className="p-6 bg-[#0B1220]/90 backdrop-blur-md border-t border-neutral-900 flex items-center justify-between gap-4 max-w-lg mx-auto w-full">
          <button
            id="cooking-prev-step-btn"
            onClick={handlePrevStep}
            disabled={currentStepIdx === 0}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold text-sm disabled:opacity-30 active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <button
            id="cooking-next-step-btn"
            onClick={handleNextStep}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1E3A8A] text-white font-bold text-sm shadow-lg shadow-[#1E3A8A]/30 active:scale-95 transition"
          >
            <span>{currentStepIdx === totalSteps - 1 ? 'Finish Dish' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
