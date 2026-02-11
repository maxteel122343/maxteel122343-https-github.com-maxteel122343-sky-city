import React from 'react';
import { Building, Player } from '../types';
import { Crown, Building2, MapPin } from 'lucide-react';

interface SidebarProps {
  user: Player;
  buildings: Building[];
  onFocusBuilding: (lotIndex: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, buildings, onFocusBuilding, isOpen, onToggle }) => {
  const myBuildings = buildings.filter(b => b.ownerId === user.id).sort((a, b) => b.score - a.score);

  return (
    <div 
        className={`absolute top-0 right-0 h-full w-80 bg-slate-900/95 border-l border-slate-800 z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">My Empire</h2>
            <button onClick={onToggle} className="text-slate-500 hover:text-white">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
            {myBuildings.length === 0 && (
                <div className="text-center text-slate-500 py-10">
                    <Building2 className="mx-auto mb-2 opacity-20" size={48} />
                    <p className="text-sm">You haven't built anything yet.</p>
                </div>
            )}
            
            {myBuildings.map(building => (
                <div 
                    key={building.id} 
                    onClick={() => onFocusBuilding(building.lotIndex)}
                    className="bg-slate-800 p-4 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-700 hover:border-slate-500 transition group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-bold text-white group-hover:text-green-400 transition">
                            Lot #{building.lotIndex}
                        </div>
                        <div className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-500/20">
                            Owned
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                         <div>
                             <div className="text-2xl font-black text-white leading-none">{building.score}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Score</div>
                         </div>
                         <div className="text-right">
                            <div className="text-lg font-bold text-slate-300 leading-none">{building.height}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Floors</div>
                         </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;