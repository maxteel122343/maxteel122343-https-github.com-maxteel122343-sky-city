
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewState, Building, LotData, LotType, Player, District, BuildingHistory, Achievement, GameResult, PlateType, PLATE_STATS, DecorVariant } from './types';
import CityMap from './components/CityMap';
import Game from './components/Game';
import BuildingInfo from './components/BuildingInfo';
import Sidebar from './components/Sidebar';
import Leaderboard from './components/Leaderboard';
import UserProfile from './components/UserProfile';
import OnboardingModal from './components/OnboardingModal';
import AuthModal from './components/AuthModal';
import { Trophy, Zap, Map as MapIcon, Users, Menu, UserCircle, Globe, Plane, Share2, Lock, Unlock, Hammer, AlertTriangle, LogOut, LogIn, Key, ShieldCheck, Medal, DoorOpen, X, Building2, ArrowUp } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const GRID_SIZE = 6;

export interface WorldNotification {
  id: string;
  lotIndex: number;
  message: string;
  type: 'CONQUER' | 'RECLAIM' | 'BUILD' | 'USURPED';
  playerName: string;
  timestamp: number;
}

const MOCK_COMPANIES = ['CyberConstruct', 'TerraForm', 'NeoBuild', 'SkyHigh'];
const MOCK_RIVALS = [
  { id: 'rival_1', name: 'Vector_X', company: 'CyberConstruct', color: '#ef4444' },
  { id: 'rival_2', name: 'BuildMaster', company: 'TerraForm', color: '#f97316' },
  { id: 'rival_3', name: 'PixelQueen', company: 'NeoBuild', color: '#8b5cf6' },
];

const DISTRICTS: District[] = [
  { id: 'd1', name: 'Neon Quarter', color: '#f472b6', rows: [0, 1, 2], cols: [0, 1, 2] },
  { id: 'd2', name: 'Cyber Hills', color: '#60a5fa', rows: [0, 1, 2], cols: [3, 4, 5] },
  { id: 'd3', name: 'The Grid', color: '#10b981', rows: [3, 4, 5], cols: [0, 1, 2] },
  { id: 'd4', name: 'Azure Bay', color: '#8b5cf6', rows: [3, 4, 5], cols: [3, 4, 5] },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_build', title: 'Pioneer', description: 'Build your first tower', icon: '🏗️', unlocked: false },
  { id: 'conqueror', title: 'Conqueror', description: 'Take over a rival building', icon: '⚔️', unlocked: false },
  { id: 'sky_high', title: 'Sky High', description: 'Reach 30 floors', icon: '☁️', unlocked: false },
  { id: 'district_lord', title: 'District Lord', description: 'Own 3 buildings in one district', icon: '👑', unlocked: false },
];

// --- Plate Selection Modal ---
const PlateSelectionModal = ({
  user,
  credits,
  onClose,
  onSelect,
  onPurchase
}: {
  user: Player,
  credits: number,
  onClose: () => void,
  onSelect: (plate: PlateType) => void,
  onPurchase: (plate: PlateType, cost: number) => void
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Foundation selection</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select your structural base</p>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
            <Zap className="text-yellow-400" size={14} fill="currentColor" />
            <span className="text-sm font-mono font-bold text-yellow-500">{credits.toLocaleString()} CR</span>
          </div>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {(Object.keys(PLATE_STATS) as PlateType[]).map(id => {
            const config = PLATE_STATS[id];
            const isUnlocked = user.unlockedPlates.includes(id);

            return (
              <div
                key={id}
                className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4
                  ${isUnlocked
                    ? 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/50 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-80'}`}
                onClick={() => isUnlocked && onSelect(id)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{ backgroundColor: config.color }}
                >
                  <Building2 className="text-white" size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-black text-white uppercase">{config.name}</h3>
                    {isUnlocked ? (
                      <div className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase">Licensed</div>
                    ) : (
                      <div className="text-[10px] font-bold text-yellow-500 font-mono">{config.cost.toLocaleString()} CR</div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{config.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <ArrowUp size={10} /> Max Height: {config.maxHeight === 9999 ? '∞' : config.maxHeight}
                    </span>
                  </div>
                </div>

                {!isUnlocked && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPurchase(id, config.cost); }}
                    disabled={credits < config.cost}
                    className={`ml-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                      ${credits >= config.cost
                        ? 'bg-yellow-500 text-slate-900 hover:scale-105 active:scale-95'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                  >
                    Buy License
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AchievementsModal = ({ achievements, onClose }: { achievements: Achievement[], onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Medal className="text-yellow-500" /> Career Milestones
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {achievements.map(ach => (
            <div key={ach.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${ach.unlocked ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-slate-800'}`}>
              <div className={`text-3xl ${ach.unlocked ? '' : 'grayscale opacity-30 blur-[1px]'}`}>{ach.icon}</div>
              <div>
                <h3 className={`text-sm font-bold ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</h3>
                <p className="text-[10px] text-slate-400">{ach.description}</p>
              </div>
              {ach.unlocked && <div className="ml-auto text-indigo-400"><Trophy size={16} /></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.CITY);
  const [user, setUser] = useState<Player | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [cityLayout, setCityLayout] = useState<LotData[]>([]);
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<PlateType>('N1');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [credits, setCredits] = useState<number>(1000);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [showPlateSelection, setShowPlateSelection] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [cityCounts, setCityCounts] = useState<{ A: number, B: number }>({ A: 0, B: 0 });

  // New State for City Theme
  const [cityTheme, setCityTheme] = useState<'CYBER' | 'ISO'>('CYBER');

  // UI Overlays
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [focusedLotIndex, setFocusedLotIndex] = useState<number | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [cityFull, setCityFull] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);
  const [worldNotifications, setWorldNotifications] = useState<WorldNotification[]>([]);

  // Initialize User
  useEffect(() => {
    const savedUser = localStorage.getItem('stack_city_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (!parsedUser.unlockedPlates) parsedUser.unlockedPlates = ['N1'];
      if (!parsedUser.logoId) parsedUser.logoId = 'zap';
      setUser(parsedUser);
    } else {
      setShowOnboarding(true);
    }

    const savedAch = localStorage.getItem('stack_city_achievements');
    if (savedAch) setAchievements(JSON.parse(savedAch));

    const savedCredits = localStorage.getItem('stack_city_credits');
    if (savedCredits) setCredits(parseInt(savedCredits, 10));

    initializeCity();
  }, []);

  // Sync state to local storage
  useEffect(() => {
    if (user) localStorage.setItem('stack_city_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('stack_city_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('stack_city_credits', credits.toString());
  }, [credits]);

  // Handle URL Challenge Params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeLot = params.get('lot');
    const challengeScore = params.get('score');
    const challengerName = params.get('challenger');
    const challengerColor = params.get('color');

    if (challengeLot && challengeScore && buildings.length > 0) {
      const index = parseInt(challengeLot);
      const score = parseInt(challengeScore);

      setBuildings(prev => {
        const newBuildings = [...prev];
        const existingIdx = newBuildings.findIndex(b => b.lotIndex === index);

        const challengeBuilding: Building = {
          id: `challenge_${Date.now()}`,
          lotIndex: index,
          score: score,
          height: Math.floor(score / 10),
          blocks: Array.from({ length: Math.floor(score / 10) }).map((_, i) => ({
            position: [0, i * 0.6, 0],
            size: [4.5, 0.6, 4.5],
            color: '#64748b'
          })),
          baseStatus: 'PERFECT',
          timestamp: Date.now(),
          validForLeaderboard: true,
          ownerId: 'challenger_external',
          ownerName: challengerName || 'Unknown Rival',
          ownerCompany: 'External Corp',
          ownerColor: challengerColor || '#ef4444',
          districtId: cityLayout.find(l => l.index === index)?.districtId || 'd1',
          history: [],
          plateType: 'N5'
        };

        if (existingIdx >= 0) {
          if (newBuildings[existingIdx].score < score) {
            newBuildings[existingIdx] = challengeBuilding;
          }
        } else {
          newBuildings.push(challengeBuilding);
        }
        return newBuildings;
      });

      showNotification(`⚔️ CHALLENGE: Beat ${challengerName}'s score of ${score} on Lot #${index}!`);
      setFocusedLotIndex(index);
      window.history.replaceState({}, document.title, "/");
    }
  }, [cityLayout]);

  // Reload city when theme changes
  useEffect(() => {
    initializeCity();
  }, [cityTheme]);

  // Supabase Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:buildings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buildings' }, (payload) => {
        const currentCityId = cityTheme === 'CYBER' ? 'A' : 'B';

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newBuilding = payload.new as any;

          if (newBuilding.city_id !== currentCityId) return;

          const transformedBuilding: Building = {
            id: newBuilding.id,
            lotIndex: newBuilding.lot_index,
            score: newBuilding.score,
            height: newBuilding.height,
            blocks: newBuilding.blocks,
            baseStatus: newBuilding.base_status as 'PERFECT' | 'PRE_BUILT',
            timestamp: newBuilding.timestamp,
            validForLeaderboard: newBuilding.valid_for_leaderboard,
            ownerId: newBuilding.owner_id,
            ownerName: newBuilding.owner_name,
            ownerCompany: newBuilding.owner_company,
            ownerColor: newBuilding.owner_color,
            history: newBuilding.history || [],
            districtId: cityLayout.find(l => l.index === newBuilding.lot_index)?.districtId || 'd1',
            plateType: newBuilding.plate_type as PlateType || 'N1',
            customName: newBuilding.custom_name
          };

          setBuildings(prev => {
            const filtered = prev.filter(b => b.lotIndex !== transformedBuilding.lotIndex);

            // CHECK FOR USURPATION (Local user specific)
            const wasOwner = prev.find(b => b.lotIndex === transformedBuilding.lotIndex)?.ownerId === user?.id;
            const isOwnerNow = transformedBuilding.ownerId === user?.id;

            if (wasOwner && !isOwnerNow) {
              showNotification(`⚠️ USURPED! ${transformedBuilding.ownerName} took Lot #${transformedBuilding.lotIndex}!`);
            } else if (!wasOwner && isOwnerNow) {
              showNotification(`🏢 Lot #${transformedBuilding.lotIndex} is now yours!`);
            }

            // WORLD EVENT NOTIFICATION
            const oldBuilding = prev.find(b => b.lotIndex === transformedBuilding.lotIndex);
            if (oldBuilding && oldBuilding.ownerId !== transformedBuilding.ownerId) {
              const type = transformedBuilding.history[0]?.action === 'RECLAIMED' ? 'RECLAIM' : 'CONQUER';
              const worldEvent: WorldNotification = {
                id: `world_ev_${Date.now()}_${transformedBuilding.lotIndex}`,
                lotIndex: transformedBuilding.lotIndex,
                message: type === 'RECLAIM' ? "claimed back their property!" : "has conquered this lot!",
                playerName: transformedBuilding.ownerName,
                type: type as any,
                timestamp: Date.now()
              };
              setWorldNotifications(w => [...w, worldEvent]);

              setTimeout(() => {
                setWorldNotifications(current => current.filter(n => n.id !== worldEvent.id));
              }, 8000);
            } else if (!oldBuilding) {
              const buildEvent: WorldNotification = {
                id: `world_ev_${Date.now()}_${transformedBuilding.lotIndex}`,
                lotIndex: transformedBuilding.lotIndex,
                message: "started a new construction!",
                playerName: transformedBuilding.ownerName,
                type: 'BUILD',
                timestamp: Date.now()
              };
              setWorldNotifications(w => [...w, buildEvent]);
              setTimeout(() => {
                setWorldNotifications(current => current.filter(n => n.id !== buildEvent.id));
              }, 8000);
            }

            return [...filtered, transformedBuilding];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cityLayout, cityTheme, user]);

  // Fetch Online Counts
  useEffect(() => {
    const fetchCounts = async () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: total } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('last_seen', fiveMinsAgo);

      if (total !== null) setOnlineCount(total);

      const { data: cityData } = await supabase
        .from('players')
        .select('current_city')
        .gt('last_seen', fiveMinsAgo);

      if (cityData) {
        const counts = cityData.reduce((acc: any, p: any) => {
          if (p.current_city === 'A') acc.A++;
          if (p.current_city === 'B') acc.B++;
          return acc;
        }, { A: 0, B: 0 });
        setCityCounts(counts);

        const currentSector = cityTheme === 'CYBER' ? 'A' : 'B';
        setCityFull(counts[currentSector] >= 6);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [cityTheme]);

  // Initialization & Data Loading
  const initializeCity = async () => {
    const layout: LotData[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const layoutIdx = r * GRID_SIZE + c;
        const districtId = DISTRICTS.find(d => d.rows.includes(r) && d.cols.includes(c))?.id || 'd1';

        let type: LotType = 'EMPTY';
        let variant: DecorVariant | undefined;

        if (layoutIdx === 14) { type = 'CIVIC'; variant = 'TOWN_HALL'; }
        else if (layoutIdx === 2) { type = 'COMMERCIAL'; variant = 'SHOP_LARGE'; }
        else if (layoutIdx === 33) { type = 'PARK'; }
        else if (layoutIdx === 18) { type = 'CIVIC'; variant = 'HOSPITAL'; }
        else if (layoutIdx === 5 || layoutIdx === 20 || layoutIdx === 25) { type = 'PRE_BUILT_BASE'; }

        layout.push({ index: layoutIdx, type, variant, x: c, z: r, districtId });
      }
    }
    setCityLayout(layout);

    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('city_id', cityTheme === 'CYBER' ? 'A' : 'B');

    if (error) {
      console.error("Fetch buildings failed:", error);
      return;
    }

    if (data) {
      const transformed = data.map((b: any) => ({
        id: b.id,
        lotIndex: b.lot_index,
        score: b.score,
        height: b.height,
        blocks: b.blocks,
        baseStatus: b.base_status as 'PERFECT' | 'PRE_BUILT',
        timestamp: b.timestamp,
        validForLeaderboard: b.valid_for_leaderboard,
        ownerId: b.owner_id,
        ownerName: b.owner_name,
        ownerCompany: b.owner_company,
        ownerColor: b.owner_color,
        history: b.history || [],
        districtId: layout.find(l => l.index === b.lot_index)?.districtId || 'd1',
        plateType: b.plate_type as PlateType || 'N1',
        customName: b.custom_name
      }));
      setBuildings(transformed);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
  };

  const unlockAchievement = (id: string) => {
    setAchievements(prev => {
      const idx = prev.findIndex(a => a.id === id);
      if (idx !== -1 && !prev[idx].unlocked) {
        const newArr = [...prev];
        newArr[idx] = { ...newArr[idx], unlocked: true };
        showNotification(`🏆 Achievement Unlocked: ${newArr[idx].title}`);
        return newArr;
      }
      return prev;
    });
  };

  const handleLotSelect = (index: number) => {
    const existing = buildings.find(b => b.lotIndex === index);
    const lotDef = cityLayout.find(l => l.index === index);

    if (lotDef && (lotDef.type === 'PARK' || lotDef.type === 'CIVIC' || lotDef.type === 'COMMERCIAL')) {
      return;
    }

    if (existing) {
      setSelectedBuilding(existing);
      setView(ViewState.BUILDING_INFO);
    } else if (lotDef && lotDef.type !== 'PARK') {
      setSelectedLot(index);
      setShowPlateSelection(true);
    }
  };

  const handlePlatePurchase = (plateId: PlateType, cost: number) => {
    if (credits >= cost && user) {
      setCredits(prev => prev - cost);
      const updatedUser = { ...user, unlockedPlates: [...user.unlockedPlates, plateId] };
      setUser(updatedUser);
      showNotification(`Construct Permit ${plateId} Acquired!`);
    }
  };

  const handlePlateSelect = (plateId: PlateType) => {
    setSelectedPlate(plateId);
    setShowPlateSelection(false);
    setView(ViewState.GAME);
  };

  const handleGameEnd = (result: GameResult) => {
    if (!user) return;

    const existing = buildings.find(b => b.lotIndex === result.lotIndex);
    const isTakeBack = existing && existing.history.some(h => h.playerId === user.id) && existing.ownerId !== user.id;
    const isNewRecord = !existing || result.score > existing.score;
    const canClaim = isNewRecord || isTakeBack;

    if (canClaim) {
      const action = existing
        ? (existing.ownerId !== user.id ? (isTakeBack ? 'RECLAIMED' : 'CONQUERED') : 'DEFENDED')
        : 'BUILT';

      const newHistoryEntry: BuildingHistory = {
        playerId: user.id,
        playerName: user.name,
        score: result.score,
        timestamp: Date.now(),
        action: action
      };

      const prevHistory = existing ? existing.history : [];
      const newBuildingData: Building = {
        ...result,
        ownerId: user.id,
        ownerName: user.name,
        ownerCompany: user.company,
        ownerColor: user.color,
        districtId: cityLayout.find(l => l.index === result.lotIndex)?.districtId || 'd1',
        history: [newHistoryEntry, ...prevHistory],
        plateType: selectedPlate
      };

      setBuildings(prev => {
        const filtered = prev.filter(b => b.lotIndex !== result.lotIndex);
        return [...filtered, newBuildingData];
      });

      supabase.from('buildings').upsert({
        lot_index: result.lotIndex,
        city_id: cityTheme === 'CYBER' ? 'A' : 'B',
        owner_id: user.id,
        owner_name: user.name,
        owner_company: user.company,
        owner_color: user.color,
        score: result.score,
        height: result.height,
        blocks: result.blocks,
        base_status: result.baseStatus,
        plate_type: selectedPlate,
        history: [newHistoryEntry, ...prevHistory],
        timestamp: Date.now(),
        valid_for_leaderboard: true
      }, { onConflict: 'lot_index, city_id' }).then(res => {
        if (res.error) console.error("Save failed:", res.error);
        else showNotification(isTakeBack && !isNewRecord ? "Property Reclaimed!" : "Progress Saved to Cloud!");
      });

      unlockAchievement('first_build');
      if (result.height >= 30) unlockAchievement('sky_high');
      if (action === 'CONQUERED' || action === 'RECLAIMED') unlockAchievement('conqueror');

      const myBuildingsInDistrict = buildings.filter(b =>
        b.districtId === newBuildingData.districtId && b.ownerId === user.id
      ).length + 1;
      if (myBuildingsInDistrict >= 3) unlockAchievement('district_lord');

    } else {
      showNotification("Score too low to claim lot.");
    }

    setView(ViewState.CITY);
    setSelectedLot(null);
  };

  const handleReplayFromInfo = () => {
    if (selectedBuilding) {
      setSelectedLot(selectedBuilding.lotIndex);
      setSelectedBuilding(null);
      setShowPlateSelection(true);
      setView(ViewState.CITY);
    }
  };

  const handleFocusBuilding = (lotIndex: number) => {
    setFocusedLotIndex(lotIndex);
    setShowSidebar(false);
  };

  const toggleCityTheme = () => {
    setCityTheme(prev => prev === 'CYBER' ? 'ISO' : 'CYBER');
  };

  const shareEmpire = () => {
    if (!user) return;
    const bestBuilding = buildings
      .filter(b => b.ownerId === user.id)
      .sort((a, b) => b.score - a.score)[0];

    if (!bestBuilding) {
      showNotification("Build something first to share!");
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('lot', bestBuilding.lotIndex.toString());
    url.searchParams.set('score', bestBuilding.score.toString());
    url.searchParams.set('challenger', user.name);
    url.searchParams.set('color', user.color.replace('#', ''));

    navigator.clipboard.writeText(url.toString());
    showNotification("Challenge Link Copied! Send it to a friend.");
  };

  const handleOnboardingComplete = (newPlayer: Player) => {
    setUser(newPlayer);
    setShowOnboarding(false);
    supabase.from('players').upsert({
      id: newPlayer.id,
      name: newPlayer.name,
      company: newPlayer.company,
      color: newPlayer.color,
      logo_id: newPlayer.logoId,
      last_seen: new Date().toISOString()
    });
  };

  const handleTravelCity = () => {
    toggleCityTheme();
    showNotification(`Traveling to ${cityTheme === 'CYBER' ? 'Sunnyside' : 'Cyber City'}...`);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('stack_city_user');
    showNotification("Logged Out Successfully");
  };

  const handleAuthenticated = async (player: Player) => {
    setUser(player);
    setShowAuth(false);

    const { data: remoteBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('owner_id', player.id);

    if (remoteBuildings && remoteBuildings.length > 0) {
      showNotification(`Welcome back, ${player.name}! Cloud data synced.`);
    }
  };

  const handleExitGame = () => {
    window.close();
    showNotification("Exiting game...");
  };

  const handleRenameBuilding = async (lotIndex: number, newName: string) => {
    setBuildings(prev => {
      return prev.map(b => b.lotIndex === lotIndex ? { ...b, customName: newName } : b);
    });

    const { error } = await supabase
      .from('buildings')
      .update({ custom_name: newName })
      .eq('lot_index', lotIndex)
      .eq('city_id', cityTheme === 'CYBER' ? 'A' : 'B');

    if (error) console.error("Rename failed:", error);
    else showNotification("Building renamed!");
  };

  const handleRebuildLot = (lotIndex: number) => {
    const existing = buildings.find(b => b.lotIndex === lotIndex);
    if (existing) {
      setSelectedLot(lotIndex);
      setShowPlateSelection(true);
      setShowSidebar(false);
    }
  };

  const isGuest = user?.id.startsWith('guest_');

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans select-none">
      {/* City Status Bar & Main Overlays */}
      {view === ViewState.CITY && (
        <>
          <CityMap
            buildings={buildings}
            cityLayout={cityLayout}
            gridSize={GRID_SIZE}
            onLotSelect={handleLotSelect}
            user={user || { id: 'spectator', name: 'Spectator', color: '#64748b', company: 'Observer', logoId: 'zap', unlockedPlates: [] }}
            districts={DISTRICTS}
            focusedLotIndex={focusedLotIndex}
            theme={cityTheme}
            onlineCount={onlineCount}
            showMinimap={showMinimap}
            setShowMinimap={setShowMinimap}
            worldNotifications={worldNotifications}
          />

          <div className="absolute top-6 right-6 z-40 flex flex-col gap-3">
            <button onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl group">
              <UserCircle size={24} className="group-hover:scale-110 transition-transform" />
            </button>

            <button onClick={() => setShowLeaderboard(!showLeaderboard)} className={`w-12 h-12 rounded-2xl backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-xl group ${showLeaderboard ? 'bg-indigo-500 text-white' : 'bg-slate-900/80 text-white hover:bg-slate-800'}`}>
              <Trophy size={22} className="group-hover:rotate-12 transition-transform" />
            </button>

            <button onClick={() => setShowAchievements(!showAchievements)} className={`w-12 h-12 rounded-2xl backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-xl group ${showAchievements ? 'bg-indigo-500 text-white' : 'bg-slate-900/80 text-white hover:bg-slate-800'}`}>
              <Medal size={22} className="group-hover:scale-110 transition-transform" />
            </button>

            <button onClick={() => setShowMinimap(!showMinimap)} className={`w-12 h-12 rounded-2xl backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-xl group ${showMinimap ? 'bg-indigo-500 text-white' : 'bg-slate-900/80 text-white hover:bg-slate-800'}`}>
              <MapIcon size={22} className="group-hover:scale-110 transition-transform" />
            </button>

            <button onClick={handleTravelCity} className="w-12 h-12 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl group">
              <Globe size={22} className="group-hover:animate-spin-slow" />
            </button>

            <button onClick={shareEmpire} className="w-12 h-12 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl group">
              <Share2 size={20} />
            </button>

            <div className="h-px w-8 bg-white/10 mx-auto my-1" />

            {isGuest ? (
              <button onClick={() => setShowAuth(true)} className="w-12 h-12 rounded-2xl bg-indigo-600 backdrop-blur-xl border border-indigo-400/50 flex items-center justify-center text-white hover:bg-indigo-500 transition-all shadow-xl group">
                <LogIn size={20} />
              </button>
            ) : (
              <button onClick={handleLogout} className="w-12 h-12 rounded-2xl bg-red-500/80 backdrop-blur-xl border border-red-400/50 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-xl group">
                <LogOut size={20} />
              </button>
            )}

            <button onClick={handleExitGame} className="w-12 h-12 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl group">
              <DoorOpen size={20} className="text-red-400" />
            </button>
          </div>

          <button
            onClick={() => setShowSidebar(true)}
            className="absolute bottom-8 right-8 z-40 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider shadow-[0_15px_30px_-10px_rgba(79,70,229,0.5)] flex items-center gap-3 active:scale-95 transition-all"
          >
            <Menu size={20} /> My Empire
          </button>

          <Leaderboard isOpen={showLeaderboard} buildings={buildings} onToggle={() => setShowLeaderboard(!showLeaderboard)} />

          <Sidebar
            user={user || { id: 'spectator', name: 'Spectator', color: '#64748b', company: 'Observer', logoId: 'zap', unlockedPlates: [] }}
            buildings={buildings}
            onFocusBuilding={handleFocusBuilding}
            onRenameBuilding={handleRenameBuilding}
            onRebuildLot={handleRebuildLot}
            isOpen={showSidebar}
            onToggle={() => setShowSidebar(!showSidebar)}
          />

          {showProfile && user && (
            <UserProfile user={user} onClose={() => setShowProfile(false)} onUpdate={handleOnboardingComplete} />
          )}

          {showAchievements && (
            <AchievementsModal achievements={achievements} onClose={() => setShowAchievements(false)} />
          )}

          {showPlateSelection && user && (
            <PlateSelectionModal
              user={user}
              credits={credits}
              onClose={() => setShowPlateSelection(false)}
              onSelect={handlePlateSelect}
              onPurchase={handlePlatePurchase}
            />
          )}

          {showAuth && (
            <AuthModal isOpen={showAuth} onAuthenticated={handleAuthenticated} onClose={() => setShowAuth(false)} currentGuest={user!} />
          )}
        </>
      )}

      {view === ViewState.GAME && selectedLot !== null && user && (
        <Game
          lotIndex={selectedLot}
          bestScore={buildings.find(b => b.lotIndex === selectedLot)?.score || 0}
          credits={credits}
          setCredits={setCredits}
          onExit={() => setView(ViewState.CITY)}
          onComplete={handleGameEnd}
          userColor={user.color}
          userName={user.name}
          theme={cityTheme}
          plateType={selectedPlate}
        />
      )}

      {view === ViewState.BUILDING_INFO && selectedBuilding && user && (
        <BuildingInfo
          building={selectedBuilding}
          currentUser={user}
          onBack={() => { setView(ViewState.CITY); setSelectedBuilding(null); }}
          onReplay={handleReplayFromInfo}
        />
      )}

      {/* Persistence Notifications */}
      {notification && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/90 backdrop-blur-md border border-white/10 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-6 fade-in duration-300">
          <Zap className="text-yellow-400" size={18} fill="currentColor" />
          <span className="text-sm font-bold tracking-tight uppercase">{notification}</span>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} cityCounts={cityCounts} />
      )}

      {cityFull && view === ViewState.CITY && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="max-w-md text-center bg-slate-900 p-8 rounded-3xl border border-red-500/30 shadow-2xl">
            <AlertTriangle className="mx-auto mb-6 text-red-500" size={64} />
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">SECTOR OVERLOAD</h2>
            <p className="text-slate-400 mb-8 font-medium">This city sector is currently at maximum capacity (6 players). Travel to an alternate dimension or wait for a slot to open.</p>
            <button onClick={handleTravelCity} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-3">
              <Globe size={20} /> TELEPORT TO ALTERNATE SECTOR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
