
export interface BlockData {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

export type PlateType = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

export interface PlateConfig {
  id: PlateType;
  name: string;
  maxHeight: number; // In game units
  cost: number;
  description: string;
  color: string;
}

export const PLATE_STATS: Record<PlateType, PlateConfig> = {
  N1: { id: 'N1', name: 'Standard Foundation', maxHeight: 120, cost: 0, description: 'Basic urban base. Good for starters.', color: '#94a3b8' },
  N2: { id: 'N2', name: 'Reinforced Concrete', maxHeight: 240, cost: 4000, description: 'Steel-reinforced for medium heights.', color: '#facc15' },
  N3: { id: 'N3', name: 'Industrial Rig', maxHeight: 360, cost: 9000, description: 'Heavy machinery base for skyscrapers.', color: '#f97316' },
  N4: { id: 'N4', name: 'Titanium Base', maxHeight: 480, cost: 16000, description: 'Aerospace-grade materials.', color: '#ef4444' },
  N5: { id: 'N5', name: 'Quantum Core', maxHeight: 9999, cost: 26000, description: 'Limitless vertical potential.', color: '#8b5cf6' },
};

export interface Player {
  id: string;
  name: string;
  color: string; // Hex color
  company: string; // "CyberConstruct", "TerraFormers", etc.
  logoId: string; // Icon identifier for the generated logo
  unlockedPlates: PlateType[];
}

export interface BuildingHistory {
  playerId: string;
  playerName: string;
  score: number;
  timestamp: number;
  action: 'BUILT' | 'CONQUERED' | 'DEFENDED';
}

export interface District {
  id: string;
  name: string;
  color: string;
  rows: number[]; // Grid rows belonging to this district
  cols: number[]; // Grid cols belonging to this district
}

export interface Building {
  id: string;
  lotIndex: number;
  score: number;
  height: number;
  blocks: BlockData[]; // Store visual representation
  baseStatus: 'PERFECT' | 'PRE_BUILT'; // Simplified status
  timestamp: number;
  validForLeaderboard: boolean;

  // Persistence & Social
  ownerId: string; // ID of current record holder
  ownerName: string;
  ownerCompany: string;
  ownerColor: string; // The user's profile color applied to the building
  history: BuildingHistory[];
  districtId: string;
  plateType: PlateType;
}

export type GameResult = Omit<Building, 'ownerId' | 'ownerName' | 'ownerCompany' | 'ownerColor' | 'history' | 'districtId'>;

export type LotType = 'EMPTY' | 'PRE_BUILT_BASE' | 'PARK' | 'COMMERCIAL' | 'CIVIC';

export type DecorVariant = 'SHOP_SMALL' | 'SHOP_LARGE' | 'HOSPITAL' | 'SCHOOL' | 'TOWN_HALL';

export interface LotData {
  index: number;
  type: LotType;
  variant?: DecorVariant;
  x: number;
  z: number;
  districtId: string;
}

export enum ViewState {
  CITY = 'CITY',
  GAME = 'GAME',
  BUILDING_INFO = 'BUILDING_INFO',
}

export enum GamePhase {
  SKYSCRAPER = 'SKYSCRAPER',
  GAME_OVER = 'GAME_OVER',
}

export interface GameConfig {
  baseHeight: number; // Height of the pre-built foundation
  blockHeight: number;
  initialSize: number;
  tolerance: number; // For perfect placement
  speed: number;
}

export const CONFIG: GameConfig = {
  baseHeight: 5,
  blockHeight: 0.6, 
  initialSize: 4.5, 
  tolerance: 0.35, 
  speed: 2.2, 
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
