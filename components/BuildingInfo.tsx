import React from 'react';
import { Building, Player } from '../types';
import { ArrowLeft, Video, Building2, AlertTriangle, Crown, History } from 'lucide-react';

interface BuildingInfoProps {
  building: Building;
  currentUser: Player;
  onBack: () => void;
  onReplay: () => void;
}

const BuildingInfo: React.FC<BuildingInfoProps> = ({ building, currentUser, onBack, onReplay }) => {
  const isOwner = building.ownerId === currentUser.id;

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col p-6 overflow-y-auto">
      <button onClick={onBack} className="text-white/70 hover:text-white mb-6 flex items-center gap-2 shrink-0">
        <ArrowLeft size={20} /> Back to City
      </button>

      <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-4xl font-black text-white">{building.score}</h1>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Current Record</p>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${isOwner ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1">{isOwner ? 'Your Building' : 'Enemy Territory'}</div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Crown size={14} />
                    {building.ownerName}
                </div>
            </div>
        </div>

        {/* Visual Preview */}
        <div className="w-full aspect-[4/3] bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl mb-8 flex items-center justify-center relative overflow-hidden shadow-2xl border border-slate-700/50 shrink-0">
           <div className="flex flex-col-reverse items-center gap-[1px]">
              {building.blocks.slice(0, 12).map((b, i) => (
                  <div 
                    key={i} 
                    style={{ 
                        width: `${b.size[0] * 20}px`, 
                        height: '10px', 
                        backgroundColor: b.color 
                    }} 
                    className="opacity-90 shadow-sm"
                  />
              ))}
              {building.height > 12 && <div className="text-slate-500 text-xs mt-2 font-mono">+{building.height - 12} more floors</div>}
           </div>
           
           <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10">
              Company: {building.ownerCompany}
           </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8 shrink-0">
            <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                <div className="text-2xl font-bold text-white">{building.height}</div>
                <div className="text-xs text-slate-500 uppercase">Floors</div>
            </div>
             <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                <div className="text-2xl font-bold text-white">{building.history.length}</div>
                <div className="text-xs text-slate-500 uppercase">Battles Fought</div>
            </div>
        </div>

        {/* Action Button */}
        <button 
            onClick={onReplay}
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-3 mb-8 shrink-0
                ${isOwner 
                    ? 'bg-white text-slate-900 hover:bg-slate-200' 
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}
        >
            {isOwner ? (
                <> <Building2 /> Improve Defense </>
            ) : (
                <> <Crown /> CONQUER BUILDING </>
            )}
        </button>

        {/* History Log */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
                <History size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">History Log</span>
            </div>
            <div className="space-y-4">
                {building.history.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${entry.action === 'CONQUERED' ? 'bg-red-500' : 'bg-green-500'}`} />
                            <div>
                                <div className="font-bold text-white">{entry.playerName}</div>
                                <div className="text-xs text-slate-500">
                                    {entry.action === 'BUILT' ? 'Established base' : entry.action === 'CONQUERED' ? 'Conquered the lot' : 'Defended successfully'}
                                </div>
                            </div>
                        </div>
                        <div className="font-mono text-slate-300">{entry.score} pts</div>
                    </div>
                ))}
                {building.history.length === 0 && (
                    <div className="text-center text-slate-600 italic text-sm py-4">No history recorded yet.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingInfo;