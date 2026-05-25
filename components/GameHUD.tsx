import { languageService } from "@/services/languageService";
import React from "react";

interface GameHUDProps {
  round?: number;
  totalRounds?: number;
  instruction?: string;
  progress?: number; // 0-100
  score?: number;
  goal?: number;
  customContent?: React.ReactNode;
  actionType?: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  round,
  totalRounds,
  instruction,
  progress,
  score,
  goal,
  customContent,
  actionType,
}) => {
  return (
    <>
      {/* Instruction / Title - Top Center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-31 text-center w-full px-2 sm:px-4 pointer-events-none flex justify-center">
        <div className="inline-block bg-black/40 backdrop-blur-md px-3 sm:px-6 py-1.5 sm:py-2 rounded-2xl sm:rounded-full border border-white/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 max-w-[95vw]">
          <h2 className="text-xs sm:text-base md:text-xl font-bold text-white drop-shadow-md flex flex-wrap items-center gap-1.5 sm:gap-3 justify-center min-w-[120px] sm:min-w-[200px]">
            <span>{instruction}</span>
            {(score !== undefined || goal !== undefined) && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-md sm:rounded-lg text-[10px] sm:text-sm md:text-base whitespace-nowrap">
                {score}
                {goal !== undefined ? ` / ${goal}` : ""}
              </span>
            )}
            {progress !== undefined && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-md sm:rounded-lg text-[10px] sm:text-sm md:text-base whitespace-nowrap">
                {Math.floor(progress)}%
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Round Indicator - Top Right */}
      {round !== undefined && totalRounds !== undefined && (
        <div className="hidden md:block absolute top-4 right-2 md:right-8 z-40 animate-in fade-in slide-in-from-right-4 duration-700 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full border border-white/20 shadow-lg">
            <span className="text-white font-bold text-[10px] sm:text-sm md:text-lg tracking-wider drop-shadow-md whitespace-nowrap">
              {languageService.t("game.hud.round")} {round}/{totalRounds}
            </span>
          </div>
        </div>
      )}

      {/* Action Badge - Bottom Right */}
      {actionType && (
        <div className="absolute bottom-4 right-2 md:right-8 z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="bg-black/40 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full border border-white/20 shadow-lg">
            <span className="text-white text-xs md:text-lg tracking-wider drop-shadow-md uppercase ">
              {actionType}
            </span>
          </div>
        </div>
      )}

      {/* Custom Content (if absolutely needed) */}
      {customContent}
    </>
  );
};
