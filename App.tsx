import React, { useState, useEffect, useRef } from 'react';
import { GameType, LevelHistory } from './types';
import { getEncouragingMessage } from './services/geminiService';
import { audioService } from './services/audioService';
import { languageService } from './services/languageService';
// import Tutorial from './components/Tutorial';
import BalloonPop from './components/games/10game-release/BalloonPop';
import ToySorter from './components/games/10game-release/ToySorter';
import MagicalColors from './components/games/10game-release/MagicalColors';
import { DeepSeaScroll } from './components/games/10game-release/DeepSeaScroll';
import { WhackMole } from './components/games/10game-release/WhackMole';
import { StarCatcher } from './components/games/10game-release/StarCatcher';
import { NumberPop } from './components/games/10game-release/NumberPop';
import { TraceShape } from './components/games/10game-release/TraceShape';
import { Flashlight } from './components/games/10game-release/Flashlight';
import { MarketShop } from './components/games/10game-release/MarketShop';

import InstallPwa from './components/InstallPwa';
import { AccountPage } from './components/pages/AccountPage';
import { RankingPage } from './components/pages/RankingPage';
import { AboutPage } from './components/pages/AboutPage';

const LEVELS_PER_CHAPTER = 30;
const TOTAL_LEVELS = 30;

const CHAPTER_THEMES = [
  {
    nameKey: "game.click",
    objectiveKey: "game.click_objective",
    descriptionKey: "game.click_description",
    description: "game.description",
    how_to_play: "game.how_to_play",
    guideKey: "game.click_guide",
    color: "bg-[#58cc02]",
    border: "border-[#46a302]",
    accent: "bg-[#46a302]",
    text: "text-[#58cc02]"
  },
];

const ACTIVE_GAME_TYPES = [
  GameType.CLICK,
  GameType.DRAG,
  GameType.WHACK,
  GameType.RIGHT_CLICK,
  GameType.NUMBER_POP,
  GameType.TRACE,
  GameType.SCROLL,
  GameType.FLASHLIGHT,
  GameType.STAR_CATCH,
  GameType.MARKET_SHOP
];

const SidebarItem = ({ icon, label, active = false, onClick, colorClass = "" }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 border-2 ${active
      ? 'bg-[#ddf4ff] border-[#84d8ff] text-[#1899d6]'
      : `bg-transparent border-transparent text-[#777] hover:bg-[#f7f7f7] ${colorClass}`
      }`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="block md:hidden lg:block text-sm">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<LevelHistory[]>([]);
  const [levelMap, setLevelMap] = useState<GameType[]>([]);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("Are you ready?");
  const [loading, setLoading] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const progressCardRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<"km" | "en">(
    (languageService.getLanguage() as "km" | "en") || "km",
  );
  const [lang, setLang] = useState(languageService.getLanguage());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Force re-render on language change
  const [, setTick] = useState(0);

  const [gameResetKey, setGameResetKey] = useState<number>(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (progressCardRef.current && !progressCardRef.current.contains(event.target as Node)) {
        setShowLeaderboard(false);
      }
    }

    if (showLeaderboard) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Subscribe to language changes
    const unsubscribe = languageService.subscribe(() => {
      setTick(t => t + 1);
      const newLang = languageService.getLanguage();
      setLanguage(newLang as "km" | "en");
      setLang(newLang);
      setMessage(languageService.t('dialog.ready_msg'));
    });

    setMessage(languageService.t('dialog.ready_msg'));

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      unsubscribe();
    };
  }, [showLeaderboard]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompleted = localStorage.getItem('mouse_master_completed_v2');
    const tutorialDone = localStorage.getItem('mouse_master_tutorial_v2');
    const savedLevelMap = localStorage.getItem('mouse_master_level_map_v2');

    if (savedCompleted) {
      try { setCompletedLevels(new Set(JSON.parse(savedCompleted))); } catch (e) { console.error(e); }
    }

    const savedHistory = localStorage.getItem('mouse_master_history_v1');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }

    if (savedLevelMap) {
      try { setLevelMap(JSON.parse(savedLevelMap)); } catch (e) { generateAndSaveLevelMap(); }
    } else {
      generateAndSaveLevelMap();
    }

    if (!tutorialDone) setShowTutorial(true);
  }, []);

  useEffect(() => {
    if (completedLevels.size > 0) {
      localStorage.setItem('mouse_master_completed_v2', JSON.stringify(Array.from(completedLevels)));
    }
    if (history.length > 0) {
      localStorage.setItem('mouse_master_history_v1', JSON.stringify(history));
    }
  }, [completedLevels, history]);

  // Handle automatic scrolling to next lesson
  useEffect(() => {
    if (currentLevel === 0 && !loading && !showTutorial) {
      // Find the first uncompleted level that is accessible
      let nextLevel = 1;
      for (let i = 1; i <= TOTAL_LEVELS; i++) {
        if (!completedLevels.has(i)) {
          nextLevel = i;
          break;
        }
      }

      // Small delay to ensure the layout is fully ready
      const scrollTimer = setTimeout(() => {
        scrollToLevel(nextLevel);
      }, 150);

      return () => clearTimeout(scrollTimer);
    }
  }, [currentLevel, loading, showTutorial, completedLevels]);

  const scrollToLevel = (lvl: number) => {
    const targetElement = document.getElementById(`level-button-${lvl}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const generateAndSaveLevelMap = () => {
    const newMap: GameType[] = [];
    let lastType: GameType | null = null;

    // Generate enough batches to cover all levels
    while (newMap.length < TOTAL_LEVELS) {
      // Shuffle active games
      let shuffled = [...ACTIVE_GAME_TYPES].sort(() => Math.random() - 0.5);

      // Prevent consecutive duplicates across batches
      if (lastType && shuffled[0] === lastType) {
        // Swap first element with the last to break the chain
        [shuffled[0], shuffled[shuffled.length - 1]] = [shuffled[shuffled.length - 1], shuffled[0]];
      }

      newMap.push(...shuffled);
      lastType = shuffled[shuffled.length - 1];
    }

    // Trim to exact size if needed
    const finalMap = newMap.slice(0, TOTAL_LEVELS);

    setLevelMap(finalMap);
    localStorage.setItem('mouse_master_level_map_v2', JSON.stringify(finalMap));
  };

  const handleLevelComplete = () => {
    const nextCompleted = new Set(completedLevels);
    nextCompleted.add(currentLevel);
    setCompletedLevels(nextCompleted);

    setHistory(prev => {
      return [...prev, { level: currentLevel, completedAt: new Date().toISOString() }];
    });

    setLoading(true);
    audioService.playSuccess();

    getEncouragingMessage(`${languageService.t('ranking.lesson_prefix')} ${currentLevel}`).then(msg => {
      setMessage(msg);
      // Wait for 3 seconds before clearing loading and resetting
      setTimeout(() => {
        setLoading(false);
        setCurrentLevel(0);
        setGameResetKey(0); // Reset key when leaving level
      }, 3000);
    });
  };

  const handleResetProgress = () => {
    localStorage.removeItem('mouse_master_completed_v2');
    localStorage.removeItem('mouse_master_tutorial_v2');
    localStorage.removeItem('mouse_master_level_map_v2'); // Clear the old map!
    localStorage.removeItem('mouse_master_history_v1');

    setCompletedLevels(new Set());
    setHistory([]);
    setShowTutorial(true);
    setShowResetConfirm(false);
    setCurrentLevel(0);

    // Regenerate map immediately so the reload isn't needed
    generateAndSaveLevelMap();
  };

  const isLevelLocked = (lvl: number) => {
    // Rule: First lesson of ANY chapter is ALWAYS unlocked so kids can jump themes
    if (lvl === 1) return false;
    if ((lvl - 1) % LEVELS_PER_CHAPTER === 0) return false;

    // Rule: Lessons within a chapter require the previous one to be completed
    return !completedLevels.has(lvl - 1);
  };

  const handleLanguageClick = () => {
    audioService.playHover();
    languageService.toggleLanguage();
  };

  const renderGame = () => {
    // if (showTutorial) return (
    //   <Tutorial
    //     onComplete={() => {
    //       setShowTutorial(false);
    //       localStorage.setItem('mouse_master_tutorial_v2', 'true');
    //     }}
    //     onSkip={() => setShowTutorial(false)}
    //   />
    // );

    if (loading) return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="w-32 h-32 bg-[#ddf4ff] rounded-full flex items-center justify-center text-7xl animate-bounce mb-8 border-4 border-[#84d8ff]">🐭</div>
        <h2 className="text-4xl font-black text-[#4b4b4b] mb-4">{languageService.t('chapter.bravo')}</h2>
        <p className="text-[#afafaf] font-bold uppercase tracking-[0.2em]">{languageService.t('chapter.next_lesson')}</p>
      </div>
    );

    const type = levelMap[currentLevel - 1];
    if (!type) return null;

    const factor = 1 + (currentLevel / TOTAL_LEVELS);

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
        <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentLevel(0);
                setGameResetKey(0);
              }}
              className="text-white/60 hover:text-white transition-all hover:scale-110 active:scale-90"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <button
              onClick={() => {
                audioService.playPop();
                setGameResetKey(prev => prev + 1);
              }}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 active:scale-90 active:rotate-180 duration-500 border border-white/10"
              title="Play Again"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>

          <div className="flex-1 px-8 md:px-24">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-[#58cc02] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(88,204,2,0.5)]"
                style={{ width: `${(currentLevel / TOTAL_LEVELS) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 shadow-xl">
            <span className="text-xl">💎</span>
            <span className="text-white font-black text-lg">{completedLevels.size * 50}</span>
          </div>
        </nav>
        <div className="flex-1 relative min-h-0">
          {(() => {
            const props = { onComplete: handleLevelComplete, key: `game-${currentLevel}-${gameResetKey}` };
            switch (type) {
              case GameType.CLICK: return <BalloonPop {...props} count={Math.floor(5 * factor)} />;
              case GameType.DRAG: return <ToySorter {...props} count={Math.floor(3 * factor)} />;
              case GameType.WHACK: return <WhackMole {...props} goal={Math.floor(5 * factor)} />;
              case GameType.RIGHT_CLICK: return <MagicalColors {...props} count={Math.floor(4 * factor)} />;
              case GameType.NUMBER_POP: return <NumberPop {...props} total={Math.floor(8 * factor)} />;
              case GameType.TRACE: return <TraceShape {...props} count={Math.floor(12 * factor)} />;
              case GameType.SCROLL: return <DeepSeaScroll {...props} count={Math.floor(3 * factor)} />;
              case GameType.FLASHLIGHT: return <Flashlight {...props} count={Math.floor(3 * factor)} />;
              case GameType.STAR_CATCH: return <StarCatcher {...props} count={Math.floor(8 * factor)} />;
              case GameType.MARKET_SHOP: return <MarketShop {...props} count={Math.floor(5 * factor)} />;
              default: return <BalloonPop {...props} />;
            }
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-screen bg-white overflow-hidden selection:bg-[#84d8ff] ${languageService.getLanguage() === 'km' ? 'font-km' : 'font-en'}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`${isSidebarOpen ? 'flex absolute inset-y-0 left-0 z-50 bg-white shadow-2xl animate-in slide-in-from-left duration-300' : 'hidden md:flex'} w-64 md:w-20 lg:w-64 border-r-2 border-[#e5e5e5] flex-col p-4 shrink-0 overflow-y-auto`}>
        <div className="mb-10 px-4 flex justify-between items-center">
          <h1
            onClick={() => window.location.reload()}
            className="title-font text-[#58cc02] text-2xl lg:text-3xl tracking-tighter hover:scale-105 transition-transform cursor-pointer"
          >
            {languageService.t('app_title')}
          </h1>
          {isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon="🏠" label={languageService.t('sidebar.home')} active={currentLevel === 0 && !showAccount && !showRanking && !showAbout} onClick={() => { setCurrentLevel(0); setShowAccount(false); setShowRanking(false); setShowAbout(false); setIsSidebarOpen(false); }} />
          <SidebarItem icon="📜" label={languageService.t('sidebar.history')} active={showRanking} onClick={() => { setShowRanking(true); setShowAccount(false); setShowAbout(false); setIsSidebarOpen(false); }} />
          <SidebarItem icon="👤" label={languageService.t('sidebar.account')} active={showAccount} onClick={() => { setShowAccount(true); setShowRanking(false); setShowAbout(false); setIsSidebarOpen(false); }} />
          <SidebarItem icon="ℹ️" label={languageService.t('sidebar.about')} active={showAbout} onClick={() => { setShowAbout(true); setShowAccount(false); setShowRanking(false); setIsSidebarOpen(false); }} />
          <SidebarItem icon="⚙️" label={languageService.t('sidebar.settings')} onClick={() => { setShowResetConfirm(true); setIsSidebarOpen(false); }} />
          {/* Language Switch Button */}
          {/* <button
            onClick={() => languageService.toggleLanguage()}
            className="pointer-events-auto self-start ml-2 sm:ml-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-full text-xs sm:text-sm shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
            title={language === "km" ? "Switch to English" : "ប្តូរទៅខ្មែរ"}
          >
            {language === "km" ? "🇬🇧 EN" : "🇰🇭 KM"}
          </button> */}
          <button
            onClick={handleLanguageClick}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold uppercase transition-all duration-200 border-2 bg-transparent border-transparent text-[#777] hover:bg-[#f7f7f7] group active:scale-95"
          >
            <span className="text-2xl transition-transform group-hover:scale-110">{lang === 'km' ? '🇰🇭' : '🇺🇸'}</span>
            <div className="flex md:hidden lg:flex items-center gap-3">
              <span className="text-sm tracking-wider">{lang === 'km' ? 'ភាសាខ្មែរ' : 'ENGLISH'}</span>
              <div className="w-[1px] h-3 bg-slate-300" />
              <span className="text-[10px] opacity-60 font-black">{lang === 'km' ? 'KM' : 'EN'}</span>
            </div>
          </button>
        </nav>
        <div className="mt-auto border-t-2 border-[#e5e5e5] pt-3 px-1">
          <div className="flex items-center gap-3 bg-[#f7f7f7] px-3 py-2 rounded-2xl border-2 border-[#e5e5e5] group cursor-default">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border-2 border-slate-200 group-hover:scale-110 transition-transform overflow-hidden bg-slate-700">
              <img src="./koompi.png" alt="Koompi" className="w-6 h-6 object-contain filter brightness-0 invert" />
            </div>
            <div className="block md:hidden lg:block overflow-hidden">
              <p className="text-[15px] font-black text-gray-600 uppercase tracking-widest leading-none border-l-2 p-2 border-[#C0C0C0]">KOOMPI-APP</p>
            </div>
          </div>
        </div>
      </aside>

      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col items-center scroll-smooth relative">
        {/* Mobile Header */}
        {currentLevel === 0 && (
          <div className="md:hidden w-full flex items-center justify-between p-4 border-b-2 border-[#e5e5e5] bg-white sticky top-0 z-30 shadow-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-[#f7f7f7] rounded-xl shadow-sm border-2 border-[#e5e5e5] text-gray-600 active:scale-95 transition-transform"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="title-font text-[#58cc02] text-xl tracking-tighter">
              {languageService.t('app_title')}
            </h1>
            <div className="w-10"></div>
          </div>
        )}

        {currentLevel === 0 ? (
          <div className="w-full max-w-2xl py-6 md:py-12 px-4 animate-in fade-in duration-700">
            {CHAPTER_THEMES.map((chapter, chapterIdx) => (
              <section key={chapterIdx} className="mb-20 ">
                <div className={`hidden md:block sticky top-4 md:top-6 z-40 w-full rounded-2xl md:rounded-[1.5rem] p-3 md:p-4 mb-8 text-white shadow-xl transition-all duration-300 ${chapter.color} border-b-[4px] md:border-b-6 ${chapter.border} overflow-hidden group`}>
                  <div className="relative flex items-center gap-3 md:gap-6 z-20">
                    {/* Left: Chapter & Title */}
                    <div className="shrink-0 flex flex-col justify-center md:border-r-2 border-white/20 pr-2 md:pr-6 min-w-[100px] md:min-w-[120px]">
                      {/* <h3 className="font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80 leading-none mb-1 drop-shadow-sm">
                        {languageService.t('chapter.chapter_prefix')} {chapterIdx + 1}
                      </h3> */}
                      <h2 className="title-font text-xl sm:text-2xl md:text-3xl font-black leading-none tracking-tighter drop-shadow-md">
                        {languageService.t(chapter.nameKey)}
                      </h2>
                      {/* <span className="text-6xl">🐭</span> */}
                    </div>

                    {/* Middle: Content (Hidden on small screens) */}
                    <div className="flex-1 lex flex-col justify-center">
                      <p className="text-xs md:text-sm font-bold leading-relaxed text-white drop-shadow-sm opacity-95">
                        {languageService.t(chapter.descriptionKey)}
                      </p>
                    </div>

                    {/* Right: Icon */}
                    {/* <div className="ml-auto w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl md:text-4xl shadow-lg group-hover:rotate-12 transition-transform duration-300 grow-0 shrink-0 self-center">
                      {chapterIdx === 0 ? '🖱️' : '🐭'}
                    </div>
                    */}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  {Array.from({ length: LEVELS_PER_CHAPTER }).map((_, i) => {
                    const lvlNum = chapterIdx * LEVELS_PER_CHAPTER + i + 1;
                    const isCompleted = completedLevels.has(lvlNum);
                    const isLocked = isLevelLocked(lvlNum);
                    const isActive = !isLocked && !isCompleted;
                    const windingOffset = Math.sin(i * 0.7) * 200;

                    return (
                      <div
                        key={lvlNum}
                        id={`level-button-${lvlNum}`}
                        className="relative flex flex-col items-center group"
                        style={{ marginLeft: `${windingOffset}px` }}
                      >
                        {/* Tooltip */}
                        <div className={`absolute bottom-full mb-4 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 z-30 ${isActive ? 'opacity-100 scale-100 animate-float-level-tiny z-41' : 'opacity-0 group-hover:opacity-100'}`}>
                          <div className="bg-[#4b4b4b] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase whitespace-nowrap shadow-2xl border-2 border-white/10">
                            {languageService.t('ranking.lesson_prefix')} {lvlNum}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[10px] border-x-transparent border-t-[10px] border-t-[#4b4b4b]" />
                          </div>
                        </div>

                        <button
                          disabled={isLocked}
                          onClick={() => {
                            audioService.playGameStart();
                            setCurrentLevel(lvlNum);
                          }}
                          className={`relative w-18 h-18 md:w-22 md:h-22 rounded-full flex items-center justify-center transition-all duration-300 border-b-[6px] active:border-b-0 active:translate-y-2 focus:outline-none ${isCompleted
                            ? 'bg-[#ffc800] border-[#e38600] text-white shadow-xl'
                            : isActive
                              ? `${chapter.color} ${chapter.border} text-white animate-bounce-active shadow-2xl ring-4 ring-offset-4 ring-sky-100`
                              : 'bg-[#e5e5e5] border-[#afafaf] text-[#afafaf] cursor-default'
                            }`}
                        >
                          <span className="text-2xl md:text-3xl drop-shadow-md">
                            {isCompleted ? '⭐' : isActive ? '🎯' : '🔒'}
                          </span>

                          {/* {isActive && (
                            <div className="absolute -left-24 top-0 bot-float-side hidden sm:block pointer-events-none">
                              <div className="bg-white px-4 py-2 rounded-2xl border-2 border-[#e5e5e5] shadow-lg relative mb-1">
                                <p className="text-[10px] font-black text-[#58cc02] uppercase tracking-wider">{languageService.t('chapter.lets_play')}</p>
                                <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-l-8 border-l-[#e5e5e5]" />
                              </div>
                              <div className="w-14 h-14 bg-[#ddf4ff] rounded-full border-2 border-[#84d8ff] flex items-center justify-center text-3xl shadow-md ml-auto animate-pulse">🐭</div>
                            </div>
                          )} */}
                        </button>

                        <div className="mt-4 text-center">
                          <span className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isLocked ? 'text-[#afafaf]' : chapter.text}`}>
                            {isCompleted ? languageService.t('chapter.success') : isActive ? languageService.t('chapter.start') : languageService.t('chapter.locked')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {renderGame()}
      </main>

      <aside className="hidden xl:flex w-80 border-l-2 border-[#e5e5e5] flex-col p-6 gap-6 shrink-0 overflow-y-auto bg-[#fafafa]/50">
        <div className="flex flex-col gap-6 bg-white border-2 border-[#e5e5e5] p-5 rounded-3xl shadow-sm">
          {/* User Account Block */}
          <div className="flex items-center gap-4 rounded-2xl p-4 bg-[#ddf4ff] border-2 border-[#84d8ff] shadow-sm">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-[#84d8ff] text-2xl shadow-sm">
              <span className="text-[#1cb0f6] drop-shadow-sm">👤</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-[#4b4b4b] text-ml leading-tight">{languageService.t('ranking.you')}</h3>
              <p className="text-xs font-bold text-[#1899d6] uppercase tracking-wider opacity-80">{languageService.t('sidebar.account').toUpperCase()}</p>
            </div>
          </div>

          {/* Stats Block */}
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-3xl filter drop-shadow-sm">⚡</span>
              <div className="text-center">
                <span className="block font-black text-[#ff9600] text-xl leading-none">{completedLevels.size * 100}</span>
                <span className="text-[10px] font-bold text-[#afafaf] uppercase tracking-wider">{languageService.t('ranking.xp').toUpperCase()}</span>
              </div>
            </div>
            <div className="w-0.5 bg-[#f0f0f0] h-12 rounded-full" />
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-3xl filter drop-shadow-sm">💎</span>
              <div className="text-center">
                <span className="block font-black text-[#1cb0f6] text-xl leading-none">{completedLevels.size * 50}</span>
                <span className="text-[10px] font-bold text-[#afafaf] uppercase tracking-wider">{languageService.t('ranking.gems')}</span>
              </div>
            </div>
            <div className="w-0.5 bg-[#f0f0f0] h-12 rounded-full" />
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-3xl filter drop-shadow-sm">❤️</span>
              <div className="text-center">
                <span className="block font-black text-[#ff4b4b] text-xl leading-none">5</span>
                <span className="text-[10px] font-bold text-[#afafaf] uppercase tracking-wider">{languageService.t('ranking.hearts').toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>


        <div
          ref={progressCardRef}
          className="bg-white border-2 border-[#e5e5e5] p-6 rounded-3xl shadow-sm transition-all duration-300"
        >
          <h4 className="font-black text-[#4b4b4b] uppercase text-xs tracking-widest mb-5">{languageService.t('ranking.total_points')}</h4>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-xs font-black text-[#afafaf] uppercase">
              <span>{languageService.t('ranking.lessons')}</span>
              <span className="text-[#4b4b4b]">{completedLevels.size}/{TOTAL_LEVELS}</span>
            </div>
            <div className="h-5 bg-[#e5e5e5] rounded-full overflow-hidden border-2 border-[#e5e5e5]">
              <div
                className="h-full bg-[#58cc02] transition-all duration-1000"
                style={{ width: `${(completedLevels.size / TOTAL_LEVELS) * 100}%` }}
              />
            </div>
            {/* <p className="text-[10px] font-bold text-[#afafaf] italic text-center">{languageService.t('chapter.bravo')}</p> */}
          </div>

          {showLeaderboard && (
            <div className="mt-8 pt-6 border-t-2 border-[#e5e5e5] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-[#4b4b4b] uppercase text-xs tracking-widest">{languageService.t('sidebar.ranking')}</h4>
              </div>
              <div className="flex flex-col gap-5">
                {[
                  { name: languageService.t('ranking.tiger'), xp: 5250, icon: "🐯", me: false },
                  { name: languageService.t('ranking.dragon'), xp: 4850, icon: "🐲", me: false },
                  { name: languageService.t('ranking.you'), xp: completedLevels.size * 100, icon: "👤", me: true }
                ].sort((a, b) => b.xp - a.xp).map((user, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${user.me ? 'bg-[#ddf4ff] border-2 border-[#84d8ff]' : 'border-2 border-transparent hover:bg-gray-50'}`}>
                    <span className={`font-black w-5 text-center ${i === 0 ? 'text-[#ffc800]' : 'text-[#afafaf]'}`}>{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-[#e5e5e5] text-xl shadow-sm">{user.icon}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`text-xs  font-black truncate leading-none pb-1 ${user.me ? 'text-[#1899d6]' : 'text-[#4b4b4b]'}`}>{user.name}</p>
                      <p className="text-[10px] text-[#afafaf] font-black uppercase tracking-wider">{user.xp} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full mt-6 py-2 text-[#1cb0f6] font-black text-xs uppercase tracking-widest hover:bg-[#1cb0f6]/10 rounded-xl transition-colors"
          >
            {showLeaderboard ? languageService.t('ranking.hide').toUpperCase() : languageService.t('ranking.show_more').toUpperCase()}
          </button>
        </div>
      </aside>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 text-center shadow-2xl border-b-8 border-[#e5e5e5] animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="text-7xl mb-6">⚙️</div>
            <h2 className="title-font text-3xl text-[#4b4b4b] mb-4">{languageService.t('dialog.reset_title')}</h2>
            <p className="font-bold text-[#777] mb-8 leading-relaxed">{languageService.t('dialog.reset_confirm')}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResetProgress}
                className="w-full bg-[#ff4b4b] hover:bg-[#d33131] text-white font-black py-4 rounded-2xl border-b-4 border-black/20 transition-all uppercase tracking-widest text-sm"
              >
                {languageService.t('dialog.yes_delete')}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full bg-white hover:bg-gray-100 text-[#afafaf] font-black py-4 rounded-2xl border-2 border-[#e5e5e5] border-b-4 transition-all uppercase tracking-widest text-sm"
              >
                {languageService.t('dialog.no_keep')}
              </button>
            </div>
          </div>
        </div>
      )}


      <InstallPwa />

      {/* Pages Overlays */}
      {showAccount && <AccountPage onBack={() => setShowAccount(false)} />}
      {showRanking && <RankingPage onBack={() => setShowRanking(false)} xp={completedLevels.size * 100} completedCount={completedLevels.size} history={history} />}
      {showAbout && <AboutPage onBack={() => setShowAbout(false)} />}
    </div>
  );
};
export default App;