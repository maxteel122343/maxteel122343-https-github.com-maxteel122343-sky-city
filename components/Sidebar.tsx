import React from 'react';
import { Building, Player } from '../types';
import { Crown, Building2, MapPin, LogOut, LogIn, X } from 'lucide-react';

interface SidebarProps {
    user: Player;
    buildings: Building[];
    onFocusBuilding: (lotIndex: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    onLogout: () => void;
    onLogin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, buildings, onFocusBuilding, isOpen, onToggle, onLogout, onLogin }) => {
    const myBuildings = buildings.filter(b => b.ownerId === user.id).sort((a, b) => b.score - a.score);

    return (
        <div
            className={`absolute top - 0 right - 0 h - full w - 80 bg - slate - 900 / 95 border - l border - slate - 800 z - 30 transform transition - transform duration - 300 ease -in -out ${isOpen ? 'translate-x-0' : 'translate-x-full'} `}
        >
            <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">My Empire</h2>
                    <button onClick={onToggle} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
                        <X size={20} />
                    </button>
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

                {/* Auth Footer */}
                <div className="mt-auto pt-6 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-xl">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg" style={{ backgroundColor: user.color }}>
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{user.name}</div>
                            <div className="text-xs text-slate-400 truncate">{user.company}</div>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-2 transition"
                    >
                        <LogOut size={16} /> Logout / Reset
                    </button>

                    {/* Note: In a real app we might distinguish Guest vs Auth user here to show "Login" or "Register" instead of Logout if they are guest. 
                But for this request, we are treating guests as logged-in users who can just "Logout" to reset. 
                Wait, user asked to "Login / Register" so we should show that option if they are temporary. 
                Since we don't track 'isGuest' efficiently yet (id format check?), let's add a "Link Account" button if ID starts with 'user_' (guest) or just show Logout.
                Actually, simpler: Just show "Sync/Login" button always if we want, OR replace Logout with Login if guest.
                Lets assume everyone can "Logout" (clear local storage).
                But lets ADD a Login/Register button too if they want to switch accounts or save this one. */}

                    <button
                        onClick={onLogin}
                        className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
                    >
                        <LogIn size={16} /> Login / Register
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;