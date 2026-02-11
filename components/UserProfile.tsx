
import React from 'react';
import { Player } from '../types';
import { X, User, Briefcase, Zap, Hexagon, Triangle, Circle, Square, Activity, Globe, Crown, Skull, Lock } from 'lucide-react';

interface UserProfileProps {
  user: Player;
  onUpdate: (user: Player) => void;
  onClose: () => void;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export const LOGO_ICONS: Record<string, React.ElementType> = {
    'zap': Zap,
    'hexagon': Hexagon,
    'triangle': Triangle,
    'circle': Circle,
    'square': Square,
    'activity': Activity,
    'globe': Globe,
    'crown': Crown
};

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onClose }) => {
  const [name, setName] = React.useState(user.name);
  const [color, setColor] = React.useState(user.color);
  const [confirmRebrand, setConfirmRebrand] = React.useState(false);

  // Logo derivation based on ID or fallback
  const logoId = user.logoId || 'zap';
  const LogoIcon = LOGO_ICONS[logoId] || Zap;

  // Generate a consistent avatar URL based on user ID
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const handleSave = () => {
    onUpdate({ ...user, name, color });
    onClose();
  };

  const handleRebrand = () => {
      // Logic: Pick a new random logo, reset company name.
      const iconKeys = Object.keys(LOGO_ICONS);
      const randomIcon = iconKeys[Math.floor(Math.random() * iconKeys.length)];
      const prefixes = ['Neo', 'Cyber', 'Terra', 'Meta', 'Omni', 'Star', 'Iron', 'Flux'];
      const suffixes = ['Corp', 'Systems', 'Builds', 'Dynamics', 'Industries', 'Construct'];
      const newName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;

      onUpdate({
          ...user,
          company: newName,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          logoId: randomIcon
      });
      setConfirmRebrand(false);
      onClose(); 
  };

  if (confirmRebrand) {
      return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in zoom-in-95">
              <div className="bg-red-900/20 border border-red-500/50 w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl shadow-red-500/10">
                  <Skull className="mx-auto text-red-500 mb-4" size={48} />
                  <h2 className="text-2xl font-black text-white mb-2 uppercase">Bankrupt & Rebrand?</h2>
                  <p className="text-red-200 mb-6 text-sm">
                      This will dissolve <strong>{user.company}</strong>. A new corporate identity, logo, and color will be assigned to you. Your buildings will remain.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setConfirmRebrand(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700">Cancel</button>
                      <button onClick={handleRebrand} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-600/20">CONFIRM</button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><User size={20}/> CEO Profile</h2>
            
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Character & Logo Section */}
                <div className="flex gap-4">
                    {/* Character Avatar */}
                    <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 p-2 flex flex-col items-center justify-center">
                        <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-xl bg-slate-700 mb-2" />
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Operator</div>
                    </div>

                    {/* Logo Preview */}
                    <div className="flex-1 flex flex-col items-center justify-center p-2 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }}></div>
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg mb-2 z-10" style={{ backgroundColor: color }}>
                            <LogoIcon size={32} className="text-slate-900" strokeWidth={2.5} />
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest z-10">Logo</div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-2">CEO Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition font-bold"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="block text-xs uppercase font-bold text-slate-500">Company Name</label>
                        <span className="text-[10px] text-red-400 flex items-center gap-1"><Lock size={10} /> Read Only</span>
                    </div>
                    <div className="relative opacity-75">
                        <input 
                            type="text" 
                            value={user.company} 
                            readOnly
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed font-mono uppercase tracking-wide"
                        />
                        <Briefcase className="absolute left-3 top-3.5 text-slate-600" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Brand Color</label>
                    <div className="flex flex-wrap gap-3">
                        {COLORS.map(c => (
                            <button 
                                key={c} 
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button 
                        onClick={() => setConfirmRebrand(true)}
                        className="flex-1 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 font-bold py-3 rounded-xl transition border border-transparent hover:border-red-900/50 text-xs uppercase tracking-wide flex flex-col items-center justify-center gap-1 leading-none"
                    >
                        <span>Close Company</span>
                        <span className="text-[9px] opacity-60 font-normal">Rebrand</span>
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-600/20"
                    >
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserProfile;
