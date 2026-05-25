import React, { useState, useEffect } from "react";
import { audioService } from "../../../services/audioService";
import { languageService } from "../../../services/languageService";
import { GameHUD } from "../../GameHUD";

interface MagicalColorsProps {
  onComplete: () => void;
  count?: number;
}

const EMOJIS = ["💎", "⭐", "🍀", "🍎", "🦋", "🍭", "🌈", "🌸", "🍕", "🛸"];

const MagicalColors: React.FC<MagicalColorsProps> = ({
  onComplete,
  count = 4,
}) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [colored, setColored] = useState<number[]>([]);
  const [shapes, setShapes] = useState<
    { id: number; x: number; y: number; emoji: string }[]
  >([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  const currentRoundCount = count + (round - 1) * 3;

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 3;
    const newShapes = Array.from({ length: rc }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      emoji: EMOJIS[(i + r * 3) % EMOJIS.length],
    }));
    setShapes(newShapes);
    setColored([]);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handleRightClick = (e: React.MouseEvent | React.TouchEvent, id: number) => {
    e.preventDefault();
    if (!colored.includes(id) && !showLevelUp) {
      audioService.playCollect();
      const next = [...colored, id];
      setColored(next);
      if (next.length === shapes.length) {
        if (round < totalRounds) {
          handleRoundComplete(false);
        } else {
          handleRoundComplete(true);
        }
      }
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

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden shadow-inner flex flex-col">
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={languageService.t("game.magical_colors_instruction")}
        score={colored.length}
        goal={shapes.length}
        actionType={languageService.t("game.hud.action_type.click")}
      />

      <div className="relative flex-1">
        {shapes.map((shape) => (
          <div
            key={`${round}-${shape.id}`}
            onContextMenu={(e) => handleRightClick(e, shape.id)}
            onTouchStart={(e) => handleRightClick(e, shape.id)}
            className={`absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl rounded-2xl sm:rounded-3xl md:rounded-full transition-all duration-500 cursor-help border-2 sm:border-3 md:border-4 ${
              colored.includes(shape.id)
                ? "bg-white border-yellow-400 shadow-lg md:shadow-xl scale-110 rotate-12"
                : "bg-slate-300 border-slate-400 grayscale opacity-60 scale-100"
            }`}
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {colored.includes(shape.id) ? shape.emoji : "⚪"}
          </div>
        ))}
      </div>

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
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500 p-4">
          <div className="bg-white p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3rem] lg:rounded-[3.5rem] shadow-2xl border-4 sm:border-6 md:border-8 border-slate-200 text-center transform max-w-sm">
            <h2 className="title-font text-3xl sm:text-4xl md:text-5xl text-indigo-600 animate-bounce mb-2 sm:mb-3 md:mb-4 uppercase">
              ពណ៌ត្រឹមត្រូវ! 🎉
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-black text-slate-900">
              ពូកែណាស់កូន! 🌟
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
};
export default MagicalColors;
