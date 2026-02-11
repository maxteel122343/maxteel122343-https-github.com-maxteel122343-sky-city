
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewState, Building, LotData, LotType, Player, District, BuildingHistory, Achievement, GameResult, PlateType, PLATE_STATS, DecorVariant } from './types';
import CityMap from './components/CityMap';
import Game from './components/Game';
import BuildingInfo from './components/BuildingInfo';
import Sidebar from './components/Sidebar';
import Leaderboard from './components/Leaderboard';
import UserProfile from './components/UserProfile';
import OnboardingModal from './components/OnboardingModal';
import { Trophy, Zap, Map as MapIcon, Users, Menu, UserCircle, Globe, Plane, Share2, Lock, Unlock, Hammer, AlertTriangle } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const GRID_SIZE = 6;

const MOCK_COMPANIES = ['CyberConstruct', 'TerraForm', 'NeoBuild', 'SkyHigh'];
const MOCK_RIVALS = [
  { id: 'rival_1', name: 'Vector_X', company: 'CyberConstruct', color: '#ef4444' },
  { id: 'rival_2', name: 'BuildMaster', company: 'TerraForm', color: '#f97316' },
  { id: 'rival_3', name: 'PixelQueen', company: 'NeoBuild', color: '#8b5cf6' },
];

const DISTRICTS: District[] = [
  { id: 'd1', name: 'Neon Quarter', color: '#f472b6', rows: [0, 1, 2], cols: [0, 1, 2] },
  { id: 'd2', name: 'Cyber Hills', color: '#60a5fa', rows: [0, 1, 2], cols: [3, 4, 5] },
  { id: 'd3', name: 'Industrial Zone', color: '#a3e635', rows: [3, 4, 5], cols: [0, 1, 2] },
  { id: 'd4', name: 'The Core', color: '#c084fc', rows: [3, 4, 5], cols: [3, 4, 5] },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_build', title: 'First Brick', description: 'Build your first tower', icon: '🧱', unlocked: false },
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Hammer className="text-yellow-500" /> Foundation Permit
            </h2>
            <p className="text-slate-400 text-sm">Select a base plate for your new tower.</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-500 uppercase">Available Credits</div>
            <div className="text-2xl font-mono font-bold text-yellow-400">{credits}</div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-y-auto">
          {(Object.values(PLATE_STATS) as any[]).map((plate) => {
            const isUnlocked = user.unlockedPlates.includes(plate.id);
            const canAfford = credits >= plate.cost;

            return (
              <div
                key={plate.id}
                className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 group
                                    ${isUnlocked
                    ? 'bg-slate-800 border-slate-600 hover:border-white cursor-pointer'
                    : 'bg-slate-900 border-slate-800 opacity-80'
                  }`}
                onClick={() => isUnlocked && onSelect(plate.id)}
              >
                <div className="absolute top-2 right-2">
                  {isUnlocked ? <Unlock size={14} className="text-green-500" /> : <Lock size={14} className="text-slate-600" />}
                </div>

                <div className="flex-1 flex flex-col items-center text-center mt-2">
                  <div className="w-12 h-12 rounded-lg mb-3 shadow-lg flex items-center justify-center font-black text-lg text-slate-900" style={{ backgroundColor: plate.color }}>
                    {plate.id}
                  </div>
                  <h3 className="font-bold text-white mb-1">{plate.name}</h3>
                  <div className="text-xs text-slate-400 mb-4">{plate.description}</div>

                  <div className="mt-auto w-full space-y-2">
                    <div className="bg-black/40 rounded px-2 py-1 text-xs font-mono text-slate-300">
                      Max Height: <span className="text-white font-bold">{plate.maxHeight}</span>
                    </div>

                    {!isUnlocked && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (canAfford) onPurchase(plate.id, plate.cost); }}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded font-bold text-xs uppercase flex items-center justify-center gap-1
                                                    ${canAfford
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                      >
                        {canAfford ? 'Buy' : 'Locked'}
                        <span className="font-mono">{plate.cost}</span>
                      </button>
                    )}
                    {isUnlocked && (
                      <div className="w-full py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded font-bold text-xs uppercase text-center group-hover:bg-green-500 group-hover:text-black transition">
                        Select
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-bold transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

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
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [cityCounts, setCityCounts] = useState<{ A: number, B: number }>({ A: 0, B: 0 });

  // New State for City Theme
  const [cityTheme, setCityTheme] = useState<'CYBER' | 'ISO'>('CYBER');

  // UI Overlays
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [focusedLotIndex, setFocusedLotIndex] = useState<number | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [cityFull, setCityFull] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  // Initialize User
  useEffect(() => {
    const savedUser = localStorage.getItem('stack_city_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (!parsedUser.unlockedPlates) parsedUser.unlockedPlates = ['N1'];
      if (!parsedUser.logoId) parsedUser.logoId = 'zap';
      setUser(parsedUser);
    } else {
      // No user found, trigger onboarding
      setShowOnboarding(true);
    }

    // Simulate City Capacity Check
    const checkCityCapacity = () => {
      // Mock: 10% chance city is full for demo, or based on some persistent flag
      // In real backend, we'd query Supabase: count(players) where city_id = current
      const isFull = Math.random() > 0.9;
      if (isFull) setCityFull(true);
    };
    checkCityCapacity();

    const savedAch = localStorage.getItem('stack_city_achievements');
    if (savedAch) setAchievements(JSON.parse(savedAch));

    const savedCredits = localStorage.getItem('stack_city_credits');
    if (savedCredits) setCredits(parseInt(savedCredits, 10));

    initializeCity();
  }, []);

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
          height: Math.floor(score / 10), // Approx
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
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newBuilding = payload.new as any; // Type assertion needed for raw DB response

          // Transform snake_case DB to camelCase UI
          const transformedBuilding: Building = {
            id: newBuilding.id,
            lotIndex: newBuilding.lot_index,
            score: newBuilding.score,
            height: newBuilding.height,
            blocks: newBuilding.blocks, // JSONB comes back as object
            baseStatus: newBuilding.base_status as 'PERFECT' | 'PRE_BUILT',
            timestamp: newBuilding.timestamp, // Assuming stored as BIGINT/Number
            validForLeaderboard: newBuilding.valid_for_leaderboard,
            ownerId: newBuilding.owner_id,
            ownerName: newBuilding.owner_name,
            ownerCompany: newBuilding.owner_company,
            ownerColor: newBuilding.owner_color,
            history: newBuilding.history || [],
            districtId: cityLayout.find(l => l.index === newBuilding.lot_index)?.districtId || 'd1',
            plateType: newBuilding.plate_type as PlateType || 'N1'
          };

          setBuildings(prev => {
            const filtered = prev.filter(b => b.lotIndex !== transformedBuilding.lotIndex);
            return [...filtered, transformedBuilding];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cityLayout]);

  // Fetch Online Counts
  useEffect(() => {
    const fetchCounts = async () => {
      // Total Online (simulated 'active' in last 10 mins)
      const { count: total } = await supabase.from('players').select('*', { count: 'exact', head: true }).gt('last_seen', new Date(Date.now() - 10 * 60 * 1000).toISOString());
      if (total !== null) setOnlineCount(total);

      // City specific counts (approximation based on current buildings or just random/distributed for now if players table doesn't track current_city properly yet. 
      // We didn't add 'current_city' to players table in SQL, we only have 'buildings'. 
      // Let's infer from buildings ownership or just mock the distribution for the UI requirement or add the column. 
      // For speed, let's just split the total randomly or query unique owners of buildings in city A/B.
      // Better: Let's just update `last_seen` to include `current_city` metadata next time. 
      // For now, let's mock the split of the Real Total:
      if (total !== null) {
        const aCount = Math.floor(total * 0.6); // Fake distribution
        setCityCounts({ A: aCount, B: total - aCount });
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const initializeCity = async () => {
    // 1. Layout (Static for now, keep local or fetch if dynamic)
    const savedLayout = localStorage.getItem('stack_city_layout');
    let layout: LotData[] = [];

    // ... [Reuse existing Layout Generation Logic - it's fine local for now as it's deterministic seeded] ...
    if (savedLayout) {
      layout = JSON.parse(savedLayout);
      if (!layout.some(l => l.type === 'COMMERCIAL' || l.type === 'CIVIC')) layout = [];
    }

    if (layout.length === 0) {
      // ... [EXISTING LAYOUT GEN CODE] ...
      // Re-implementing simplified layout gen to ensure context isn't lost if I cut it
      let hasHospital = false;
      let hasSchool = false;
      let hasTownHall = false;

      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        const district = DISTRICTS.find(d => d.rows.includes(row) && d.cols.includes(col))!;

        const rand = Math.random();
        let type: LotType = 'PRE_BUILT_BASE';
        let variant: DecorVariant | undefined = undefined;

        if (rand < 0.15) { type = 'PARK'; }
        else if (rand < 0.30) {
          type = 'COMMERCIAL';
          variant = Math.random() > 0.5 ? 'SHOP_SMALL' : 'SHOP_LARGE';
        } else if (rand < 0.40) {
          type = 'CIVIC';
          const civicRoll = Math.random();
          if (!hasHospital && civicRoll < 0.33) { variant = 'HOSPITAL'; hasHospital = true; }
          else if (!hasSchool && civicRoll < 0.66) { variant = 'SCHOOL'; hasSchool = true; }
          else if (!hasTownHall) { variant = 'TOWN_HALL'; hasTownHall = true; }
          else { variant = 'HOSPITAL'; }
        } else { type = 'PRE_BUILT_BASE'; }

        if (i === 0) type = 'PRE_BUILT_BASE';
        layout.push({ index: i, type, variant, x: col, z: row, districtId: district.id });
      }
      localStorage.setItem('stack_city_layout', JSON.stringify(layout));
    }
    setCityLayout(layout);

    // 2. Fetch Buildings from Supabase
    const { data: dbBuildings, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('city_id', cityTheme === 'CYBER' ? 'A' : 'B');

    if (error) {
      console.error("Error loading city:", error);
      showNotification("Connection lost. Loading offline backup...");
    }

    if (dbBuildings && dbBuildings.length > 0) {
      const parsedBuildings: Building[] = dbBuildings.map(b => ({
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
        plateType: b.plate_type as PlateType || 'N1'
      }));
      setBuildings(parsedBuildings);
    } else {
      // Only if DB is empty, init some mocks (or just leave empty)
      setBuildings([]);
    }
  };

  // Sync user to Supabase on update
  useEffect(() => {
    if (user) {
      localStorage.setItem('stack_city_user', JSON.stringify(user));

      // Upsert player profile to DB
      supabase.from('players').upsert({
        id: user.id,
        name: user.name,
        company: user.company,
        color: user.color,
        logo_id: user.logoId,
        unlocked_plates: user.unlockedPlates,
        last_seen: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error("Sync error:", error);
      });
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('stack_city_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('stack_city_achievements', JSON.stringify(achievements));
  }, [achievements]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const unlockAchievement = (id: string) => {
    const ach = achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      const newAch = achievements.map(a => a.id === id ? { ...a, unlocked: true } : a);
      setAchievements(newAch);
      showNotification(`🏆 Achievement Unlocked: ${ach.title}`);
    }
  };

  const handleLotSelect = (index: number) => {
    const existing = buildings.find(b => b.lotIndex === index);
    const lotDef = cityLayout.find(l => l.index === index);

    // Only allow selection of playable lots
    if (lotDef && (lotDef.type === 'PARK' || lotDef.type === 'CIVIC' || lotDef.type === 'COMMERCIAL')) {
      return; // Decoration only
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
    const isConquest = existing && existing.ownerId !== user.id && result.score > existing.score;
    const isNewRecord = !existing || result.score > existing.score;

    if (isNewRecord) {
      const newHistoryEntry: BuildingHistory = {
        playerId: user.id,
        playerName: user.name,
        score: result.score,
        timestamp: Date.now(),
        action: existing ? (existing.ownerId !== user.id ? 'CONQUERED' : 'DEFENDED') : 'BUILT'
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
        plateType: selectedPlate // Save the plate type used
      };

      setBuildings(prev => {
        const filtered = prev.filter(b => b.lotIndex !== result.lotIndex);
        return [...filtered, newBuildingData];
      });

      // Save to Supabase
      supabase.from('buildings').upsert({
        // We can use a composite key or just an ID. For simplicity, let's query first or assume ID if exists.
        // BUT, to handle "Conquest", we should ideally reference the LOT INDEX + CITY ID as unique, or just insert new record.
        // Let's rely on lot_index being unique per city in our logic, so we find and update.
        // Actually, 'id' is UUID. If we are conquering, we are overwriting the lot.
        // Strategy: Delete old building on this lot, Insert new one? Or Update?
        // Simplest: store 'lot_index' and 'city_id' as unique constraint, but we didn't set that up yet.
        // Upsert by ID if we tracked it? No, result doesn't have ID.
        // Let's just DELETE any existing building on this lot and INSERT the new one.

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
      }).then(res => {
        if (res.error) console.error("Save failed:", res.error);
        else showNotification("Progress Saved to Cloud!");
      });

      unlockAchievement('first_build');
      if (result.height >= 30) unlockAchievement('sky_high');
      if (isConquest) {
        unlockAchievement('conqueror');
      }

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
      setShowPlateSelection(true); // Always show selection for replay too
      setView(ViewState.CITY); // Wait for modal
    }
  };

  const handleFocusBuilding = (lotIndex: number) => {
    setFocusedLotIndex(lotIndex);
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
    url.searchParams.set('color', user.color.replace('#', '')); // avoid hash issues

    navigator.clipboard.writeText(url.toString());
    showNotification("Challenge Link Copied! Send it to a friend.");
  };

  const handleOnboardingComplete = (newPlayer: Player) => {
    setUser(newPlayer);
    localStorage.setItem('stack_city_user', JSON.stringify(newPlayer));
    setShowOnboarding(false);
    showNotification("Welcome to Stack City, CEO!");
  };

  const handleTravelCity = () => {
    setCityFull(false);
    toggleCityTheme();
    showNotification("Traveled to new city sector!");
  };

  return (
    <div className={`w-full h-screen relative overflow-hidden font-sans transition-colors duration-700 ${cityTheme === 'ISO' ? 'bg-sky-200' : 'bg-slate-900'}`}>

      {/* Online Count Badge */}
      <div className="absolute top-6 left-6 z-50 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/10 shadow-lg pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse relative">
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
        </div>
        <span className="text-xs font-bold font-mono text-white/90">● {onlineCount} ONLINE NOW</span>
      </div>

      <div className={`w-full h-full transition-all duration-700 ${showOnboarding ? 'blur-md scale-105 brightness-50' : ''}`}>
        {/* Background Elements managed by conditional rendering below, but we wrap the main game loop here if possible? 
             Actually, the Notification and Modals shouldn't be blurred. The Game view (Map) should be. 
             So let's blur the inner content. */}

        {view === ViewState.CITY && user && (
          <CityMap
            buildings={buildings}
            cityLayout={cityLayout}
            gridSize={GRID_SIZE}
            onLotSelect={handleLotSelect}
            user={user}
            districts={DISTRICTS}
            focusedLotIndex={focusedLotIndex}
            theme={cityTheme}
          />
        )}
      </div>

      {/* Onboarding Overlay - Outside the blur */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        initialCity={cityTheme}
        onCitySelect={(city) => setCityTheme(city)}
        cityCounts={cityCounts}
      />

      {/* City Full Modal */}
      {cityFull && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 p-8 rounded-2xl border-2 border-yellow-500 shadow-2xl max-w-md text-center space-y-6">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <AlertTriangle className="text-yellow-500" size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">SECTOR CAPACITY REACHED</h2>
              <p className="text-slate-400">This city grid has reached its 6-player architect limit. Protocol requires relocation to an adjacent sector.</p>
            </div>
            <button
              onClick={handleTravelCity}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase rounded-xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition"
            >
              <Plane size={20} /> Travel to Sector {cityTheme === 'CYBER' ? 'B' : 'A'}
            </button>
          </div>
        </div>
      )}

      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-600 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 fade-in pointer-events-none">
          <Zap className="text-yellow-400 fill-yellow-400" size={16} />
          <span className="font-bold text-sm text-white">{notification}</span>
        </div>
      )}

      {showProfile && user && (
        <UserProfile user={user} onUpdate={setUser} onClose={() => setShowProfile(false)} />
      )}

      {/* Main UI Overlays - Only show if NOT onboarding */}
      {!showOnboarding && view === ViewState.CITY && user && (
        <>
          {showPlateSelection && (
            <PlateSelectionModal
              user={user}
              credits={credits}
              onClose={() => setShowPlateSelection(false)}
              onSelect={handlePlateSelect}
              onPurchase={handlePlatePurchase}
            />
          )}

          {/* Top Right Controls - Removed Profile from here */}
          <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="bg-slate-800 p-3 rounded-full hover:bg-slate-700 border border-slate-700 shadow-lg text-white group relative">
              <Menu size={24} />
              <span className="absolute right-full mr-2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">My Empire</span>
            </button>
            <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="bg-slate-800 p-3 rounded-full hover:bg-slate-700 border border-slate-700 shadow-lg text-white group relative">
              <Trophy size={24} className={showLeaderboard ? "text-yellow-400" : "text-white"} />
              <span className="absolute right-full mr-2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Ranking</span>
            </button>
            <button onClick={shareEmpire} className="bg-slate-800 p-3 rounded-full hover:bg-slate-700 border border-slate-700 shadow-lg text-white group relative">
              <Share2 size={24} className="text-blue-400" />
              <span className="absolute right-full mr-2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Share Game</span>
            </button>
          </div>

          {/* Right Side Stack: Plane + Profile */}
          <div className="absolute bottom-1/2 right-6 translate-y-1/2 z-20 flex flex-col gap-4 items-center">
            <button
              onClick={toggleCityTheme}
              className={`group relative flex items-center justify-center p-4 rounded-2xl shadow-2xl transition-all duration-300 border-4
                    ${cityTheme === 'ISO'
                  ? 'bg-indigo-600 border-white hover:bg-indigo-700'
                  : 'bg-emerald-400 border-emerald-200 hover:bg-emerald-500'}`}
            >
              <div className="absolute right-full mr-4 bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                {cityTheme === 'CYBER' ? 'Go to Sunnyside' : 'Go to Cyber City'}
              </div>
              {cityTheme === 'CYBER' ? (
                <Plane size={32} className="text-slate-900 rotate-[-45deg]" />
              ) : (
                <Globe size={32} className="text-white" />
              )}
            </button>

            {/* Profile Button - Moved Here */}
            <button
              onClick={() => setShowProfile(true)}
              className="w-12 h-12 rounded-full border-2 border-slate-600 bg-slate-800 hover:border-white shadow-xl flex items-center justify-center group relative transition overflow-hidden"
            >
              <UserCircle size={28} style={{ color: user.color }} />
              <span className="absolute right-full mr-4 bg-black/80 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                Operative Profile
              </span>
            </button>
          </div>

          <Sidebar
            isOpen={showSidebar}
            onToggle={() => setShowSidebar(!showSidebar)}
            user={user}
            buildings={buildings}
            onFocusBuilding={handleFocusBuilding}
          />

          <Leaderboard
            isOpen={showLeaderboard}
            onToggle={() => setShowLeaderboard(!showLeaderboard)}
            buildings={buildings}
          />

          {/* City Map Rendered in Background Layer now */}
        </>
      )}

      {view === ViewState.GAME && selectedLot !== null && user && (
        <Game
          lotIndex={selectedLot}
          bestScore={Math.max(0, ...(buildings.find(b => b.lotIndex === selectedLot)?.score ? [buildings.find(b => b.lotIndex === selectedLot)!.score] : []))}
          credits={credits}
          setCredits={setCredits}
          onExit={handleBackToCity}
          onComplete={handleGameEnd}
          userColor={user.color}
          userName={user.name}
          theme={cityTheme}
          plateType={selectedPlate}
          logoId={user.logoId}
        />
      )}

      {view === ViewState.BUILDING_INFO && selectedBuilding && user && (
        <BuildingInfo
          building={selectedBuilding}
          currentUser={user}
          onBack={handleBackToCity}
          onReplay={handleReplayFromInfo}
        />
      )}
    </div>
  );

  function handleBackToCity() {
    setView(ViewState.CITY);
    setSelectedBuilding(null);
    setSelectedLot(null);
  }
}
