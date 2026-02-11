import React, { useState, useEffect } from 'react';
import { User, Dices, ChevronRight, Check, Rocket, Briefcase, Palette, Play, Map as MapIcon, Globe, Plane } from 'lucide-react';
import { Player } from '../types';

interface OnboardingModalProps {
    onComplete: (player: Player) => void;
    isOpen: boolean;
    initialCity?: 'CYBER' | 'ISO';
    onCitySelect?: (city: 'CYBER' | 'ISO') => void;
    cityCounts?: { A: number, B: number };
}

const AVATAR_OPTIONS = [
    'pixel-1', 'pixel-2', 'pixel-3', 'pixel-4', 'pixel-5', 'pixel-6'
];

const COLOR_OPTIONS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

const LOGO_ICONS = ['zap', 'crown', 'star', 'shield', 'sword', 'anchor', 'heart', 'droplet', 'sun', 'moon', 'cloud', 'camera', 'music', 'code'];

export default function OnboardingModal({ onComplete, isOpen, initialCity = 'CYBER', onCitySelect, cityCounts = { A: 0, B: 0 } }: OnboardingModalProps) {
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [avatarId, setAvatarId] = useState('pixel-1');
    const [color, setColor] = useState('#3b82f6');
    const [logoId, setLogoId] = useState('zap');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State for Editing
    const [isEditing, setIsEditing] = useState(false);

    // Generate random initial values
    useEffect(() => {
        if (isOpen) {
            randomizeAll();
        }
    }, [isOpen]);

    const randomizeAll = () => {
        setName(`Architect_${Math.floor(Math.random() * 9999)}`);
        setCompanyName(`Corp_${Math.floor(Math.random() * 999)}`);
        setColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
        setAvatarId(AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]);
        setLogoId(LOGO_ICONS[Math.floor(Math.random() * LOGO_ICONS.length)]);
    };

    const handleRandomLogo = () => {
        const random = LOGO_ICONS[Math.floor(Math.random() * LOGO_ICONS.length)];
        setLogoId(random);
    };

    const handleComplete = () => {
        if (!name || !companyName) return;
        setIsSubmitting(true);
        setTimeout(() => {
            const newPlayer: Player = {
                id: `user_${Date.now()}`,
                name,
                company: companyName,
                color,
                logoId,
                unlockedPlates: ['N1'],
                avatarId
            };
            onComplete(newPlayer);
            setIsSubmitting(false);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
            {/* Main Card */}
            <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300 mb-6">

                <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700 text-center relative">
                    {/* Edit Toggle */}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="absolute top-4 right-4 text-xs text-slate-400 hover:text-white underline"
                    >
                        {isEditing ? "Done" : "Edit Profile"}
                    </button>
                    <button
                        onClick={randomizeAll}
                        className="absolute top-4 left-4 text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                        <Dices size={12} /> Random
                    </button>

                    <div className="w-20 h-20 mx-auto rounded-full p-1 border-4 border-slate-700 shadow-xl mb-3 relative group overflow-hidden" style={{ borderColor: color }}>
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                            {/* Avatar Render */}
                            <div className="w-full h-full" style={{ backgroundColor: color, opacity: 0.8 }} />
                            <div className="absolute inset-0 flex items-center justify-center text-white/20 font-black text-4xl">
                                {name.charAt(0)}
                            </div>
                        </div>
                    </div>

                    {!isEditing ? (
                        <>
                            <h2 className="text-2xl font-black text-white">{name}</h2>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 mt-1">
                                <Briefcase size={12} /> {companyName}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3 mt-4 text-left">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border border-slate-600 rounded px-2 py-1 text-white text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Company</label>
                                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-black/30 border border-slate-600 rounded px-2 py-1 text-white text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Brand Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_OPTIONS.map(c => (
                                        <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full ${color === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 pt-4">
                    <button
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xl uppercase tracking-wider rounded-2xl shadow-lg shadow-green-500/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? "Syncing..." : <>Play Now <Play fill="currentColor" /></>}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-3">Ready to build your legacy?</p>
                </div>
            </div>

            {/* City Selection Cards */}
            <div className="flex gap-4 w-full max-w-md">
                {/* Cyber City Card */}
                <button
                    onClick={() => onCitySelect && onCitySelect('CYBER')}
                    className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group
                        ${initialCity === 'CYBER'
                            ? 'bg-slate-800 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-105 z-10'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-500 opacity-60 hover:opacity-100'}`}
                >
                    <div className="flex flex-col items-center">
                        <div className={`p-3 rounded-full mb-3 ${initialCity === 'CYBER' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <Plane size={24} className="rotate-[-45deg]" />
                        </div>
                        <h3 className="font-bold text-white text-sm uppercase">Cyber City</h3>
                        <div className="text-xs text-indigo-400 font-mono mt-1">Sector A</div>
                        <div className="mt-3 bg-black/40 rounded-full px-3 py-1 text-xs font-bold text-slate-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            {cityCounts.A} Players
                        </div>
                    </div>
                </button>

                {/* Sunnyside Card */}
                <button
                    onClick={() => onCitySelect && onCitySelect('ISO')}
                    className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group
                         ${initialCity === 'ISO'
                            ? 'bg-sky-900 border-emerald-400 shadow-xl shadow-emerald-400/20 scale-105 z-10'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-500 opacity-60 hover:opacity-100'}`}
                >
                    <div className="flex flex-col items-center">
                        <div className={`p-3 rounded-full mb-3 ${initialCity === 'ISO' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <Globe size={24} />
                        </div>
                        <h3 className="font-bold text-white text-sm uppercase">Sunnyside</h3>
                        <div className="text-xs text-emerald-400 font-mono mt-1">Sector B</div>
                        <div className="mt-3 bg-black/40 rounded-full px-3 py-1 text-xs font-bold text-slate-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            {cityCounts.B} Players
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
