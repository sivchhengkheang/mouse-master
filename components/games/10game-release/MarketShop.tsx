import React, { useState, useEffect, useRef } from "react";
import { audioService } from "../../../services/audioService";
import { languageService } from "../../../services/languageService";
import { GameHUD } from "../../GameHUD";

interface MarketItem {
  id: number;
  emoji: string;
  name: string;
  x: number;
  y: number;
  inBasket: boolean;
  rotation?: number;
  category: "fruits" | "vegetables" | "proteins" | "basics";
}

interface MarketItemBase {
  emoji: string;
  name: string;
  category: "fruits" | "vegetables" | "proteins" | "basics";
}

const MARKET_ITEMS: MarketItemBase[] = [
  // Fruits
  {
    emoji: "🥭",
    name: languageService.t("game.stuff.mango"),
    category: "fruits",
  },
  {
    emoji: "🍌",
    name: languageService.t("game.stuff.banana"),
    category: "fruits",
  },
  {
    emoji: "🥥",
    name: languageService.t("game.stuff.coconut"),
    category: "fruits",
  },
  {
    emoji: "🍊",
    name: languageService.t("game.stuff.orange"),
    category: "fruits",
  },

  // Vegetables
  {
    emoji: "🥬",
    name: languageService.t("game.stuff.cabbage"),
    category: "vegetables",
  },
  {
    emoji: "🌶️",
    name: languageService.t("game.stuff.chili"),
    category: "vegetables",
  },
  {
    emoji: "🧅",
    name: languageService.t("game.stuff.garlic"),
    category: "vegetables",
  },
  {
    emoji: "🥕",
    name: languageService.t("game.stuff.carrot"),
    category: "vegetables",
  },
  {
    emoji: "🍆",
    name: languageService.t("game.stuff.eggplant"),
    category: "vegetables",
  },
  {
    emoji: "🌽",
    name: languageService.t("game.stuff.corn"),
    category: "vegetables",
  },
  {
    emoji: "🍅",
    name: languageService.t("game.stuff.tomato"),
    category: "vegetables",
  },

  // Proteins
  {
    emoji: "🐟",
    name: languageService.t("game.stuff.fish"),
    category: "proteins",
  },
  {
    emoji: "🥚",
    name: languageService.t("game.stuff.egg"),
    category: "proteins",
  },
  {
    emoji: "🥩",
    name: languageService.t("game.stuff.beef"),
    category: "proteins",
  },
  {
    emoji: "🦀",
    name: languageService.t("game.stuff.crab"),
    category: "proteins",
  },

  // Basics
  {
    emoji: "🍚",
    name: languageService.t("game.stuff.rice"),
    category: "basics",
  },
];

export const MarketShop: React.FC<{
  onComplete: () => void;
  count?: number;
}> = ({ onComplete, count = 5 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [items, setItems] = useState<MarketItem[]>([]);
  const [targetItems, setTargetItems] = useState<string[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [collected, setCollected] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [language, setLanguage] = useState<"km" | "en">(
    (languageService.getLanguage() as "km" | "en") || "km",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const cabinetRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLDivElement>(null);

  const currentCount = count + (round - 1);

  // Grid Configuration
  const GRID_ROWS = 3;
  const GRID_COLS = 4;

  // Get cabinet boundaries for constraining items
  const getCabinetBounds = () => {
    if (!cabinetRef.current || !containerRef.current) {
      return {
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
      };
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const cabinetRect = cabinetRef.current.getBoundingClientRect();

    return {
      left:
        ((cabinetRect.left - containerRect.left) / containerRect.width) * 100,
      top: ((cabinetRect.top - containerRect.top) / containerRect.height) * 100,
      right:
        ((cabinetRect.right - containerRect.left) / containerRect.width) * 100,
      bottom:
        ((cabinetRect.bottom - containerRect.top) / containerRect.height) * 100,
      width: (cabinetRect.width / containerRect.width) * 100,
      height: (cabinetRect.height / containerRect.height) * 100,
    };
  };

  // Constrain position to stay within cabinet
  const constrainToCabinet = (x: number, y: number) => {
    const bounds = getCabinetBounds();
    const itemSize = 5; // Approximate item size as percentage

    return {
      x: Math.max(bounds.left + 2, Math.min(x, bounds.right - 2)),
      y: Math.max(bounds.top + 8, Math.min(y, bounds.bottom - 2)),
    };
  };

  // Calculate precise position for a slot index
  const getSlotPosition = (index: number) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;

    // Cabinet boundaries (responsive layout)
    // Left ~5-10%, Right ~95%+, Top ~20%, Bottom ~95%
    const cabinetLeft = 5;
    const cabinetWidth = 90;
    const cabinetTop = 20;
    const cabinetHeight = 75;

    // Position within cabinet
    const colWidth = cabinetWidth / GRID_COLS;
    const rowHeight = cabinetHeight / GRID_ROWS;

    const x = cabinetLeft + col * colWidth + colWidth / 2;
    const y = cabinetTop + row * rowHeight + rowHeight / 2;

    return { x, y };
  };

  const initRound = (r: number) => {
    const numItems = count + (r - 1);
    const shuffled = [...MARKET_ITEMS].sort(() => Math.random() - 0.5);

    // Items to collect (shown in shopping list)
    // Select the first 'numItems' from shuffle as targets
    const targetObjects = shuffled.slice(0, numItems);
    const targets = targetObjects.map((i) => i.emoji);
    setTargetItems(targets);

    // Fill the cabinet with items (max 12 slots)
    // 1. Ensure all targets are in the cabinet
    // 2. Fill remainder with other items
    const totalSlots = GRID_ROWS * GRID_COLS;
    const fillerItems = shuffled.slice(numItems); // Items not selected as targets

    // Combine targets + fillers up to totalSlots
    // Note: shuffled already has them in order, simply slicing totalSlots works for content,
    // BUT we want to randomize their POSITION on the shelf.
    // If we just take shuffled.slice(0, totalSlots), the targets (index 0 to numItems)
    // will always be in the first few slots.

    let cabinetItems = shuffled.slice(0, totalSlots);

    // Shuffle the cabinet items so targets are scattered
    cabinetItems = cabinetItems.sort(() => Math.random() - 0.5);

    const allItems: MarketItem[] = cabinetItems.map((item, i) => {
      const pos = getSlotPosition(i);
      return {
        id: i,
        ...item,
        x: pos.x,
        y: pos.y,
        inBasket: false,
        rotation: Math.random() * 10 - 5,
      };
    });

    setItems(allItems);
    setCollected(0);
  };

  useEffect(() => {
    if (!showLevelUp) initRound(round);
  }, [round, count, showLevelUp]);

  // Subscribe to language changes
  useEffect(() => {
    const unsubscribe = languageService.subscribe(() => {
      setLanguage(languageService.getLanguage() as "km" | "en");
    });
    return unsubscribe;
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    setDragPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];

    setDragPos({
      x: ((touch.clientX - rect.left) / rect.width) * 100,
      y: ((touch.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseUp = () => {
    if (dragging === null) return;

    const item = items.find((i) => i.id === dragging);
    if (!item) {
      setDragging(null);
      return;
    }

    // Dynamically calculate drop zone based on actual basket position
    let inBasket = false;
    if (basketRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = (dragPos.x / 100) * containerRect.width + containerRect.left;
      const mouseY = (dragPos.y / 100) * containerRect.height + containerRect.top;
      
      const basketRect = basketRef.current.getBoundingClientRect();
      // Add a generous 20px padding to the hit zone for easier dropping
      inBasket = 
        mouseX >= basketRect.left - 20 && 
        mouseX <= basketRect.right + 20 &&
        mouseY >= basketRect.top - 20 &&
        mouseY <= basketRect.bottom + 20;
    } else {
      inBasket = dragPos.x < 25 && dragPos.y > 70; // Fallback
    }

    if (inBasket && targetItems.includes(item.emoji) && !item.inBasket) {
      audioService.playPop();
      setItems((prev) =>
        prev.map((i) => (i.id === dragging ? { ...i, inBasket: true } : i)),
      );

      const newCollected = collected + 1;
      setCollected(newCollected);

      if (newCollected === currentCount) {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setTimeout(() => {
            audioService.playSuccess();
            onComplete();
          }, 800);
        }
      }
    } else if (inBasket && !targetItems.includes(item.emoji)) {
      audioService.playError();
    }

    setDragging(null);
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setTimeout(() => {
      setShowLevelUp(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setRound((r) => r + 1);
      }, 2000);
    }, 2000);
  };

  // Responsive state - detect screen size
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSmallMobile = windowSize.width < 480;
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none font-sans bg-gray-50 touch-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="./market_bg.png"
          alt="Market Background"
          className="w-full h-full object-cover filter blur-[2px] scale-105 opacity-80"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
      </div>

      {/* Header / Awning - Responsive */}
      {/* <div className="absolute top-0 left-0 right-0 h-auto sm:h-auto z-10 flex items-center px-2 sm:px-4 md:px-8 py-2 sm:py-3 md:py-4 z-1">
        <div className="flex-1 flex items-center gap-2 sm:gap-3 md:gap-5">
          <div className="text-3xl sm:text-4xl md:text-5xl icon-3d">🏪</div>
          <div className="space-y-0.5 sm:space-y-1 md:space-y-2">
            <h1 className="text-white font-black text-base sm:text-lg md:text-2xl lg:text-3xl tracking-wide flex items-baseline gap-1 sm:gap-2 md:gap-3 flex-wrap">
              <span className="text-3d">
                {languageService.t("game.market_shop")}
              </span>
              <span className="text-yellow-300 text-3d-yellow text-sm sm:text-base md:text-lg">
                24h
              </span>
            </h1>
            <p className="text-red-100 text-xs sm:text-sm font-black opacity-90 drop-shadow-md">
              {languageService.t("game.market_subtitle")}
            </p>
          </div>
        </div>
      </div> */}

      {/* Game HUD - Positioned at root level */}
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={languageService.t("game.market_instruction")}
        score={collected}
        goal={currentCount}
        actionType={languageService.t("game.hud.action_type.drag")}
      />

      {/* Main Content Area - Clean Flex Layout */}
      <div
        className="absolute inset-0 z-10 flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6 lg:gap-8 p-2 sm:p-3 md:p-4 lg:p-6"
        style={{
          top: isSmallMobile ? "100px" : isMobile ? "120px" : "140px",
          overflow: "hidden",
        }}
      >
        {/* LEFT PANEL: Shopping List + Basket */}
        <div
          className={`
          relative z-20 pointer-events-none
          ${isMobile
            ? "w-full flex-shrink-0 flex flex-row gap-2 h-28"
            : isTablet
              ? "w-1/4 flex-1 min-h-0 flex flex-col gap-2 sm:gap-3"
              : "w-1/5 flex-1 min-h-0 flex flex-col gap-2 sm:gap-3"
          }
        `}
        >
          {/* Shopping List */}
          <div className={`
            order-2 md:order-1
            bg-yellow-50 rounded-lg shadow-lg border-2 border-gray-300 relative overflow-hidden pointer-events-auto flex
            ${isMobile
              ? "flex-1 h-full flex-col"
              : "flex-col flex-1 min-h-0 transform -rotate-1"
            }
          `}>
            {/* Header */}
            <div className={`
              bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md
              ${isMobile ? "h-6 w-full" : "h-7 sm:h-8 md:h-10 w-full"}
            `}>
              <span className={`text-white font-black tracking-widest drop-shadow-lg
                ${isMobile ? "text-[10px]" : "text-[9px] sm:text-[10px] md:text-sm"}
              `}>
                📝 {languageService.t("game.list")}
              </span>
            </div>

            {/* Items */}
            <div className={`
              flex-1 custom-scrollbar
              ${isMobile
                ? "overflow-x-auto overflow-y-hidden flex flex-row items-center gap-2 px-2"
                : "overflow-y-auto bg-[linear-gradient(transparent_16px,#e5e7eb_17px)] sm:bg-[linear-gradient(transparent_18px,#e5e7eb_19px)] md:bg-[linear-gradient(transparent_20px,#e5e7eb_21px)] bg-[size:100%_16px] sm:bg-[size:100%_18px] md:bg-[size:100%_21px]"
              }
            `}>
              {isMobile ? (
                // Mobile: horizontal scrollable chips
                <div className="flex flex-row gap-2 px-1 py-2 flex-nowrap">
                  {targetItems.map((emoji, i) => {
                    const isCollected = items.find(
                      (item) => item.emoji === emoji && item.inBasket,
                    );
                    return (
                      <div
                        key={i}
                        className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border-2 transition-all
                          ${isCollected
                            ? "border-green-400 bg-green-50 opacity-60"
                            : "border-gray-300 bg-white"
                          }`}
                      >
                        <span className={`text-xl ${isCollected ? "grayscale opacity-50" : ""}`}>{emoji}</span>
                        {isCollected && (
                          <span className="text-green-500 font-bold text-[10px]">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Desktop/Tablet: vertical list
                <div className="p-1 sm:p-2 md:p-3 space-y-1 sm:space-y-2 md:space-y-2.5 font-handwriting text-[8px] sm:text-xs md:text-sm text-slate-800 pt-0.5 sm:pt-1">
                  {targetItems.map((emoji, i) => {
                    const isCollected = items.find(
                      (item) => item.emoji === emoji && item.inBasket,
                    );
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1 sm:gap-2 md:gap-2.5 h-[17px] sm:h-[18px] md:h-[20px]"
                      >
                        <div
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 border-2 rounded flex-shrink-0 flex items-center justify-center transition-all ${isCollected
                            ? "border-green-500 bg-green-500 shadow-lg shadow-green-400/60 scale-110"
                            : "border-gray-400 bg-white hover:border-gray-500"
                            }`}
                        >
                          {isCollected && (
                            <span className="font-bold text-white text-[6px] sm:text-[7px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          className={`${isCollected ? "line-through opacity-40 text-gray-400" : ""} flex items-center gap-0.5 transition-all`}
                        >
                          <span className="text-sm sm:text-base md:text-lg drop-shadow-sm flex-shrink-0">
                            {emoji}
                          </span>
                          <span className="font-bold text-[7px] sm:text-[8px] md:text-xs hidden sm:inline flex-shrink-0 truncate">
                            {items.find((it) => it.emoji === emoji)?.name}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {!isMobile && (
              <div className="absolute top-9 md:top-10 bottom-0 left-6 w-px bg-red-300 pointer-events-none"></div>
            )}
          </div>

          {/* Basket - on mobile: left side, on desktop: bottom */}
          <div
            ref={basketRef}
            className={`
              order-1 md:order-2
              relative flex-shrink-0 flex flex-col items-center justify-end gap-1
              bg-gradient-to-br from-amber-100/30 to-orange-100/20
              rounded-lg sm:rounded-xl p-2 border-2 border-amber-200/50 shadow-lg pointer-events-auto
              ${isMobile ? "h-full w-20 sm:w-24 justify-center" : "h-24 md:h-32"}
            `}
          >
            <div className={`${isMobile ? "text-3xl" : "text-4xl sm:text-5xl md:text-6xl"} drop-shadow-xl`}>
              🧺
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="text-[10px] sm:text-xs font-bold text-amber-900 drop-shadow">
                {collected}/{currentCount}
              </div>
              <div className="text-[7px] sm:text-[8px] font-bold text-white bg-gradient-to-r from-green-600 to-green-700 px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
                {languageService.t("game.basket")}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Fridge Cabinet with Items */}
        <div
          className={`flex-3 min-h-0 relative ${isSmallMobile || isMobile ? "w-full" : "w-4/5"}`}
          ref={cabinetRef}
        >
          {/* Cabinet Frame */}
          <div className="w-full h-full bg-slate-700 rounded-lg shadow-lg md:shadow-xl border-4 md:border-x-6 md:border-t-6 border-slate-600 relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-7 sm:h-9 md:h-11 bg-slate-800 border-b-2 border-slate-600 flex items-center justify-between px-2 sm:px-3 md:px-5 z-20 shadow-md flex-shrink-0">
              <div className="text-slate-400 text-[8px] sm:text-[10px] md:text-xs font-mono tracking-widest">
                TEMP: 4°C
              </div>
              <div className="text-green-400 text-[8px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">FRESH</span>
              </div>
            </div>

            {/* Items Container - Organized by Category */}
            <div className="flex-1 bg-slate-600 relative overflow-y-auto overflow-x-hidden">
              {/* Gradient Lighting */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none z-5"></div>

              {/* Categories */}
              <div className="relative z-10 p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 md:space-y-5">
                {["fruits", "vegetables", "proteins", "basics"].map(
                  (category) => {
                    const categoryItems = items.filter(
                      (i) =>
                        i.category ===
                        (category as
                          | "fruits"
                          | "vegetables"
                          | "proteins"
                          | "basics"),
                    );

                    const getCategoryEmoji = (cat: string) => {
                      switch (cat) {
                        case "fruits":
                          return "🍎";
                        case "vegetables":
                          return "🥬";
                        case "proteins":
                          return "🍗";
                        default:
                          return "🍚";
                      }
                    };

                    const getCategoryLabel = (cat: string) => {
                      switch (cat) {
                        case "fruits":
                          return languageService.t("game.fruits");
                        case "vegetables":
                          return languageService.t("game.vegetables");
                        case "proteins":
                          return languageService.t("game.proteins");
                        default:
                          return languageService.t("game.basics");
                      }
                    };

                    if (categoryItems.length === 0) return null;

                    return (
                      <div
                        key={category}
                        className="bg-slate-700/70 rounded-lg p-2 sm:p-3 md:p-4 border-2 border-slate-600 shadow-lg backdrop-blur-sm"
                      >
                        {/* Category Label */}
                        <div className="text-white font-bold text-xs sm:text-sm md:text-base mb-2 sm:mb-3 drop-shadow-lg flex items-center gap-1.5">
                          <span className="text-lg sm:text-xl md:text-2xl">
                            {getCategoryEmoji(category)}
                          </span>
                          <span className="uppercase tracking-widest">
                            {getCategoryLabel(category)}
                          </span>
                        </div>

                        {/* Category Items Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                          {categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${item.inBasket
                                ? "bg-slate-800/50 opacity-40 cursor-not-allowed"
                                : "bg-slate-700 cursor-grab active:cursor-grabbing hover:bg-slate-600 hover:scale-105"
                                } ${dragging === item.id ? "scale-125 z-50 drop-shadow-2xl bg-slate-600" : "z-10"}`}
                              onMouseDown={(e) => {
                                if (item.inBasket || !containerRef.current) return; // Don't allow dragging collected items
                                e.preventDefault();
                                setDragging(item.id);
                                const rect = containerRef.current.getBoundingClientRect();
                                setDragPos({
                                  x: ((e.clientX - rect.left) / rect.width) * 100,
                                  y: ((e.clientY - rect.top) / rect.height) * 100,
                                });
                                audioService.playHover();
                              }}
                              onTouchStart={(e) => {
                                if (item.inBasket || !containerRef.current) return;
                                // Can't preventDefault here if using passive listeners, but React's synthetic events default to non-passive for touch events.
                                // touch-none on container handles the scroll prevention.
                                setDragging(item.id);
                                const rect = containerRef.current.getBoundingClientRect();
                                const touch = e.touches[0];
                                setDragPos({
                                  x: ((touch.clientX - rect.left) / rect.width) * 100,
                                  y: ((touch.clientY - rect.top) / rect.height) * 100,
                                });
                                audioService.playHover();
                              }}
                              style={{
                                opacity: item.inBasket
                                  ? 0.4
                                  : dragging === item.id
                                    ? 1
                                    : 1,
                                pointerEvents: item.inBasket ? "none" : "auto",
                              }}
                            >
                              {/* Label */}
                              <div className="bg-white/90 px-1 sm:px-2 md:px-2.5 py-0.5 rounded shadow-md text-[7px] sm:text-[8px] md:text-xs font-bold text-slate-800 text-center min-w-fit mb-0.5 sm:mb-1 border border-slate-200 whitespace-nowrap">
                                {item.name}
                              </div>
                              {/* Emoji */}
                              <div
                                className={`${isSmallMobile
                                  ? "text-2xl"
                                  : isMobile
                                    ? "text-3xl"
                                    : "text-4xl md:text-5xl"
                                  } drop-shadow-lg filter select-none ${item.inBasket ? "grayscale opacity-60" : ""
                                  }`}
                              >
                                {item.emoji}
                              </div>
                              {/* Checkmark for collected items */}
                              {item.inBasket && (
                                <div className="absolute text-green-400 text-lg sm:text-xl md:text-2xl drop-shadow-lg">
                                  ✓
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Draggable Item During Drag (appears on top) */}
        {dragging !== null &&
          items.find((i) => i.id === dragging && !i.inBasket) && (
            <div
              className="fixed cursor-grabbing z-[9999] pointer-events-none"
              style={{
                left: `${dragPos.x}%`,
                top: `${dragPos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={`${isSmallMobile ? "text-3xl" : isMobile ? "text-4xl" : "text-5xl md:text-6xl"} drop-shadow-2xl filter animate-bounce`}
              >
                {items.find((i) => i.id === dragging)?.emoji}
              </div>
            </div>
          )}

        <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;700&family=Patrick+Hand&display=swap');
                .font-handwriting {
                    font-family: 'Patrick Hand', 'Kantumruy Pro', cursive;
                }
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.3);
                }
                .text-3d {
                    text-shadow: 
                        0 1px 0 #ccc,
                        0 2px 0 #c9c9c9,
                        0 3px 0 #bbb,
                        0 4px 0 #b9b9b9,
                        0 5px 0 #aaa,
                        0 6px 1px rgba(0,0,0,.1),
                        0 0 5px rgba(0,0,0,.1),
                        0 1px 3px rgba(0,0,0,.3),
                        0 3px 5px rgba(0,0,0,.2),
                        0 5px 10px rgba(0,0,0,.25),
                        0 10px 10px rgba(0,0,0,.2),
                        0 20px 20px rgba(0,0,0,.15);
                }
                .text-3d-yellow {
                    text-shadow: 
                        0 1px 0 #fbbf24,
                        0 2px 0 #f59e0b,
                        0 3px 0 #d97706,
                        0 4px 0 #b45309,
                        0 5px 0 #78350f,
                        0 6px 1px rgba(0,0,0,.1),
                        0 0 5px rgba(0,0,0,.1),
                        0 1px 3px rgba(0,0,0,.3),
                        0 3px 5px rgba(0,0,0,.2);
                }
                .icon-3d {
                    filter: 
                        drop-shadow(0 1px 0 #ccc)
                        drop-shadow(0 2px 0 #bbb)
                        drop-shadow(0 3px 0 #aaa)
                        drop-shadow(0 4px 0 #999)
                        drop-shadow(0 5px 0 #888)
                        drop-shadow(0 10px 5px rgba(0,0,0,0.4));
                    transform: rotate(-5deg);
                }
                @media (max-width: 768px) {
                    .responsive-hidden-mobile { display: none; }
                }
                @media (max-width: 480px) {
                    .responsive-hidden-small { display: none; }
                }
            `}</style>
      </div>
      {/* Level up modal - Responsive */}
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

      {/* Completion Modal - Responsive */}
      {/* {round === totalRounds && collected === currentCount && !showLevelUp && ( */}
      {/* <div className="absolute inset-0 top-0 flex items-center justify-center bg-black/40 backdrop-blur-lg z-50 animate-in fade-in zoom-in duration-500 p-4">
        <h1
          className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-white 
                 drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] 
                 animate-pulse tracking-wide text-center"
        >
          {languageService.t("completion.level_up")}
        </h1>
      </div> */}
      {/* )} */}
    </div>
  );
};
