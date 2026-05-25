import React, { useState, useRef, useEffect } from "react";
import { audioService } from "../../../services/audioService";
import { languageService } from "../../../services/languageService";
import { GameHUD } from "./../../GameHUD";

interface DeepSeaScrollProps {
  onComplete: () => void;
  count?: number;
}

const POOL_ITEMS = [
  {
    emoji: "🐚",
    name: languageService.t("game.deep_sea_scroll_pull_items.satisfies"),
  },
  {
    emoji: "🦀",
    name: languageService.t("game.deep_sea_scroll_pull_items.sea_crab"),
  },
  {
    emoji: "👑",
    name: languageService.t("game.deep_sea_scroll_pull_items.golden_crown"),
  },
  {
    emoji: "⚓",
    name: languageService.t("game.deep_sea_scroll_pull_items.anchor"),
  },
  {
    emoji: "🐙",
    name: languageService.t("game.deep_sea_scroll_pull_items.giant_octopus"),
  },
  {
    emoji: "🪸",
    name: languageService.t("game.deep_sea_scroll_pull_items.coral_reef"),
  },
  {
    emoji: "🔱",
    name: languageService.t("game.deep_sea_scroll_pull_items.trident"),
  },
  {
    emoji: "💎",
    name: languageService.t("game.deep_sea_scroll_pull_items.gemstone"),
  },
  {
    emoji: "🐬",
    name: languageService.t("game.deep_sea_scroll_pull_items.dolphin"),
  },
  {
    emoji: "🦈",
    name: languageService.t("game.deep_sea_scroll_pull_items.shark"),
  },
  {
    emoji: "🐠",
    name: languageService.t("game.deep_sea_scroll_pull_items.colorful_fish"),
  },
  {
    emoji: "🐡",
    name: languageService.t("game.deep_sea_scroll_pull_items.pufferfish"),
  },
  {
    emoji: "🦞",
    name: languageService.t("game.deep_sea_scroll_pull_items.lobster"),
  },
  {
    emoji: "🦐",
    name: languageService.t("game.deep_sea_scroll_pull_items.lobster"),
  },
  {
    emoji: "🦑",
    name: languageService.t("game.deep_sea_scroll_pull_items.squid"),
  },
  {
    emoji: "🧜‍♀️",
    name: languageService.t("game.deep_sea_scroll_pull_items.mermaid"),
  },
];

export const DeepSeaScroll: React.FC<DeepSeaScrollProps> = ({
  onComplete,
  count = 3,
}) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [foundItems, setFoundItems] = useState<number[]>([]);
  const [items, setItems] = useState<
    { id: number; emoji: string; name: string; depth: number }[]
  >([]);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initRound = (r: number) => {
    // Round 1: 5 items. Round 2+: Increase by 2.
    const rc = r === 1 ? 5 : 5 + (r - 1) * 2;
    const spacing = 1000;

    // Randomize pool
    const shuffledPool = [...POOL_ITEMS].sort(() => Math.random() - 0.5);

    const newItems = Array.from({ length: rc }).map((_, i) => ({
      id: Math.random(),
      emoji: shuffledPool[i % shuffledPool.length].emoji,
      name: shuffledPool[i % shuffledPool.length].name,
      depth: i * spacing + 800 + Math.random() * 300,
    }));
    setItems(newItems);
    setFoundItems([]);
    setCurrentDepth(0);
    setHasScrolled(false);
  };

  useEffect(() => {
    initRound(round);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [round]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setCurrentDepth(Math.floor(scrollTop));
    if (scrollTop > 50) setHasScrolled(true);
  };

  const handleFind = (id: number) => {
    if (!foundItems.includes(id) && !showLevelUp) {
      audioService.playCollect();
      const next = [...foundItems, id];
      setFoundItems(next);
      if (next.length === items.length) {
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
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none bg-gradient-to-b from-[#1e3a8a] via-[#0a192f] to-[#020617]">
      <div className="absolute inset-0 z-30 pointer-events-none">
        <GameHUD
          round={round}
          totalRounds={totalRounds}
          instruction={languageService.t("game.deep_sea_scroll_instruction")}
          score={foundItems.length}
          goal={items.length}
          actionType={languageService.t("game.hud.action_type.scroll")}
        />

        <div className="pt-16 sm:pt-20 md:pt-24 px-2 sm:px-4 w-full flex flex-col items-center">
          <div className="bg-blue-950/80 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-2xl md:rounded-3xl border border-blue-400/30 shadow-xl max-w-xs sm:max-w-md md:max-w-xl w-full backdrop-blur-sm pointer-events-auto">
            <div className="flex justify-between items-center mb-2 sm:mb-3 px-1">
              <span className="text-xs sm:text-sm md:text-base font-bold text-blue-300">
                {languageService.t("game.deep_sea_scroll_instruction_find")}
              </span>
              <span className="bg-sky-600/80 px-2 sm:px-3 py-0.5 rounded-full text-[8px] sm:text-[10px] md:text-xs text-white border border-white/20 shadow-inner">
                {languageService.t("game.deep_sea_scroll_depth")}:{" "}
                {currentDepth}m
              </span>
            </div>
            <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
              {items.map((it) => (
                <span
                  key={it.id}
                  className={`text-sm sm:text-lg md:text-xl transition-all duration-500 ${foundItems.includes(it.id) ? "grayscale-0 scale-125 animate-pop-in" : "grayscale opacity-40 scale-100"}`}
                >
                  {it.emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto custom-scrollbar z-20 scroll-smooth pt-60"
        onScroll={handleScroll}
      >
        <div
          className="relative w-full"
          style={{ height: `${items.length * 1000 + 1200}px` }}
        >
          {/* Start Marker */}

          {/* {!hasScrolled && (
            <div className="absolute inset-0 top-10 item-center justify-center text-center  text-white font-black text-3xl sm:text-4xl md:text-6xl lg:text-8xl uppercase tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.5em] pointer-events-none animate-start-shine opacity-20">
              {languageService.t("game.deep_sea_scroll_start")}
            </div>
          )} */}

          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleFind(item.id)}
              className={`absolute left-1/2 -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-2 sm:border-3 md:border-4 border-white/20 transition-all ${foundItems.includes(item.id) ? "bg-yellow-400/40 border-yellow-300 scale-110 shadow-[0_0_30px_rgba(253,224,71,0.5)]" : "hover:bg-white/10 hover:border-white/40 active:scale-95"}`}
              style={{ top: `${item.depth}px` }}
            >
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-2xl">
                {item.emoji}
              </span>
              {!foundItems.includes(item.id) && (
                <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2 w-max text-white font-bold text-[8px] sm:text-xs md:text-sm uppercase tracking-widest bg-sky-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-2 border-white/50 shadow-lg animate-bounce">
                  {languageService.t("game.deep_sea_scroll_click")} {item.name}
                </div>
              )}
              {foundItems.includes(item.id) && (
                <div className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 bg-green-500 text-white w-7 sm:w-9 md:w-10 h-7 sm:h-9 md:h-10 rounded-full flex items-center justify-center text-sm sm:text-lg md:text-xl shadow-lg border-3 sm:border-4 border-white animate-pop-in">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Scroll Down Indicator */}
        {!hasScrolled && (
          <div className="fixed bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 sm:gap-2 text-white/80 animate-scroll-down pointer-events-none">
            <span className="font-black uppercase tracking-widest text-xs sm:text-sm md:text-base">
              {languageService.t("game.deep_sea_scroll_instruction")}
            </span>
            <div className="w-7 sm:w-8 md:w-10 h-7 sm:h-8 md:h-10 border-b-2 sm:border-b-3 md:border-b-4 border-r-2 sm:border-r-3 md:border-r-4 border-white rotate-45 rounded-sm" />
          </div>
        )}
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
        <div className="absolute inset-0 flex items-center justify-center bg-blue-950/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500 p-4">
          <div className="bg-white p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3rem] lg:rounded-[3.5rem] shadow-2xl border-4 sm:border-6 md:border-8 border-blue-200 text-center transform max-w-sm">
            <h2 className="title-font text-3xl sm:text-4xl md:text-5xl text-blue-600 animate-bounce mb-2 sm:mb-3 md:mb-4 uppercase">
              ដល់គោលដៅហើយ! 🎉
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-black text-blue-900">
              ពូកែណាស់កូន! 🌟
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
};
