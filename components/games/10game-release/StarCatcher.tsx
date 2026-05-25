import React, { useState, useRef, useEffect } from "react";
import { audioService } from "../../../services/audioService";
import { languageService } from "../../../services/languageService";
import { GameHUD } from "../../GameHUD";

export const StarCatcher: React.FC<{
  onComplete: () => void;
  count?: number;
}> = ({ onComplete, count = 8 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [stars, setStars] = useState<
    { id: number; x: number; y: number; caught: boolean }[]
  >([]);
  const [selection, setSelection] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [language, setLanguage] = useState<"km" | "en">(
    (languageService.getLanguage() as "km" | "en") || "km",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 6;
    const newStars = Array.from({ length: rc }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 70 + 15,
      caught: false,
    }));
    setStars(newStars);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  useEffect(() => {
    const unsubscribe = languageService.subscribe(() => {
      setLanguage(languageService.getLanguage() as "km" | "en");
    });
    return unsubscribe;
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    if (showLevelUp) return;
    audioService.playHover();
    const rect = containerRef.current!.getBoundingClientRect();
    setSelection({
      x1: clientX - rect.left,
      y1: clientY - rect.top,
      x2: clientX - rect.left,
      y2: clientY - rect.top,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) handleStart(touch.clientX, touch.clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (selection && !showLevelUp) {
      const rect = containerRef.current!.getBoundingClientRect();
      setSelection({
        ...selection,
        x2: clientX - rect.left,
        y2: clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) handleMove(touch.clientX, touch.clientY);
  };

  const handleMouseUp = () => {
    if (selection && !showLevelUp) {
      const rect = containerRef.current!.getBoundingClientRect();
      const xMin = Math.min(selection.x1, selection.x2);
      const xMax = Math.max(selection.x1, selection.x2);
      const yMin = Math.min(selection.y1, selection.y2);
      const yMax = Math.max(selection.y1, selection.y2);

      let anyCaught = false;
      const nextStars = stars.map((s) => {
        const sx = (s.x / 100) * rect.width;
        const sy = (s.y / 100) * rect.height;
        if (sx >= xMin && sx <= xMax && sy >= yMin && sy <= yMax && !s.caught) {
          anyCaught = true;
          return { ...s, caught: true };
        }
        return s;
      });

      if (anyCaught) {
        audioService.playCollect();
      } else {
        audioService.playDragEnd();
      }

      setStars(nextStars);
      if (nextStars.length > 0 && nextStars.every((s) => s.caught)) {
        if (round < totalRounds) {
          handleRoundComplete(false);
        } else {
          handleRoundComplete(true);
        }
      }
      setSelection(null);
    }
  };

  const handleRoundComplete = (isLast: boolean) => {
    audioService.playSuccess();

    if (isLast) {
      setIsGameComplete(true);
      setTimeout(onComplete, 2500);
    } else {
      setTimeout(() => {
        setShowLevelUp(true);
        setTimeout(() => {
          setShowLevelUp(false);
          setRound((r) => r + 1);
        }, 2500);
      }, 2000);
    }
  };

  const caughtCount = stars.filter((s) => s.caught).length;
  const currentCount = count + (round - 1) * 6;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className="relative w-full h-full bg-indigo-950 overflow-hidden cursor-crosshair select-none touch-none"
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={languageService.t("game.star_catcher_instruction")}
        score={caughtCount}
        goal={currentCount}
        actionType={languageService.t("game.hud.action_type.drag")}
      />

      {stars.map((s) => (
        <div
          key={`${round}-${s.id}`}
          className={`absolute text-xl sm:text-2xl md:text-3xl lg:text-4xl transition-all duration-700 pointer-events-none ${s.caught ? "scale-0 rotate-[360deg] opacity-0 blur-sm" : "scale-100 opacity-100 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"}`}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          ⭐
        </div>
      ))}

      {selection && (
        <div
          className="absolute border-2 sm:border-3 md:border-4 border-yellow-400 bg-yellow-400/20 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.3)] pointer-events-none"
          style={{
            left: Math.min(selection.x1, selection.x2),
            top: Math.min(selection.y1, selection.y2),
            width: Math.abs(selection.x1 - selection.x2),
            height: Math.abs(selection.y1 - selection.y2),
          }}
        />
      )}

      {showLevelUp && (
        <div className="absolute inset-0 top-0 flex items-center justify-center bg-black/40 backdrop-blur-lg z-50 animate-in fade-in zoom-in duration-500 p-4">
                <h1
                  className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-white 
                         drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] 
                         animate-pulse tracking-wide text-center"
                >
                  {languageService.t("completion.level_up")}
                </h1>
              </div>
      )}

      {/* {isGameComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500 p-4">
          <div className="bg-white p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3rem] lg:rounded-[3.5rem] shadow-2xl border-4 sm:border-6 md:border-8 border-indigo-200 text-center transform max-w-sm">
            <h2 className="title-font text-3xl sm:text-4xl md:text-5xl text-indigo-600 animate-bounce mb-2 sm:mb-3 md:mb-4 uppercase">
              ចាប់បានអស់ហើយ! 🎉
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-black text-indigo-900">
              ពូកែណាស់កូន! 🌟
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
};
