import React, { useState } from 'react';
import { Building, Player } from '../types';
import { Trophy, Users, Globe } from 'lucide-react';

interface LeaderboardProps {
  buildings: Building[];
  isOpen: boolean;
  onToggle: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ buildings, isOpen, onToggle }) => {
  const [tab, setTab] = useState<'PLAYERS' | 'COMPANIES'>('PLAYERS');

  // Calculate Rankings
  const playerRankings = React.useMemo(() => {
    const map = new Map<string, { name: string, score: number, count: number }>();
    buildings.forEach(b => {
        if (!map.has(b.ownerName)) map.set(b.ownerName, { name: b.ownerName, score: 0, count: 0 });
        const p = map.get(b.ownerName)!;
        p.score += b.score;
        p.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, 10);
  }, [buildings]);

  const companyRankings = React.useMemo(() => {
    const map = new Map<string, { name: string, score: number, count: number }>();
    buildings.forEach(b => {
        if (!b.ownerCompany) return;
        if (!map.has(b.ownerCompany)) map.set(b.ownerCompany, { name: b.ownerCompany, score: 0, count: 0 });
        const c = map.get(b.ownerCompany)!;
        c.score += b.score;
        c.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [buildings]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 left-6 w-72 bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md z-30 animate-in slide-in-from-left-4 overflow-hidden">
        <div className="flex border-b border-slate-800">
            <button 
                onClick={() => setTab('PLAYERS')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${tab === 'PLAYERS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                <Users size={14} /> Architects
            </button>
            <button 
                onClick={() => setTab('COMPANIES')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${tab === 'COMPANIES' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                <Globe size={14} /> Corporations
            </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
            {tab === 'PLAYERS' ? (
                <div className="space-y-3">
                    {playerRankings.map((p, i) => (
                        <div key={p.name} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
                                {i + 1}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white leading-none">{p.name}</div>
                                <div className="text-[10px] text-slate-500">{p.count} Buildings</div>
                            </div>
                            <div className="text-right text-xs font-mono font-bold text-slate-300">
                                {p.score.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                     {companyRankings.map((c, i) => (
                        <div key={c.name} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                {i + 1}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white leading-none">{c.name}</div>
                                <div className="text-[10px] text-slate-500">{c.score.toLocaleString()} pts</div>
                            </div>
                            <div className="text-right text-xs font-mono font-bold text-slate-300">
                                {c.count} Lots
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="bg-slate-800 p-2 text-center">
            <button onClick={onToggle} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white">Hide Leaderboard</button>
        </div>
    </div>
  );
};

export default Leaderboard;