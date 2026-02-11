import React from 'react';
import { Building, Player } from '../types';
import { Share2, X, Download } from 'lucide-react';

interface ShareModalProps {
  event: { type: 'CONQUEST' | 'NEW_RECORD', building: Building };
  user: Player;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ event, user, onClose }) => {
  const isConquest = event.type === 'CONQUEST';

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 p-4">
        <div className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-black/20 p-1 rounded-full">
                <X size={20} />
            </button>

            {/* Simulated Share Image Card */}
            <div className={`relative w-full aspect-[4/5] p-8 flex flex-col justify-between ${isConquest ? 'bg-gradient-to-br from-red-900 to-slate-900' : 'bg-gradient-to-br from-blue-900 to-slate-900'}`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" 
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} 
                />

                <div className="relative z-10">
                    <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase text-white/80 border border-white/20 mb-4">
                        stack city • {new Date().toLocaleDateString()}
                    </div>
                    <h2 className={`text-4xl font-black italic leading-tight ${isConquest ? 'text-red-400' : 'text-blue-400'}`}>
                        {isConquest ? 'BUILDING CONQUERED!' : 'NEW RECORD SET!'}
                    </h2>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                     {/* Big Score */}
                     <div className="text-[80px] font-black text-white leading-none drop-shadow-xl tracking-tighter">
                        {event.building.score}
                     </div>
                     <div className="text-white/60 font-mono text-sm tracking-widest uppercase mb-8">
                        Height: {event.building.height} Floors
                     </div>

                     {/* User Badge */}
                     <div className="bg-white text-slate-900 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg w-full">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg">
                            {user.name[0]}
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Player</div>
                            <div className="font-bold leading-none">{user.name}</div>
                        </div>
                        <div className="ml-auto font-black text-slate-300">#{user.id.slice(-4)}</div>
                     </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-800">
                <p className="text-center text-slate-400 text-sm mb-4">Share this moment with friends</p>
                <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition">
                        <Share2 size={18} /> Share
                    </button>
                    <button className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-600 transition">
                        <Download size={18} /> Save
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ShareModal;