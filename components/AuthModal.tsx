
import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, X, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Player } from '../types';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthenticated: (player: Player) => void;
    currentGuest?: Player; // To merge data if needed
}

export default function AuthModal({ isOpen, onClose, onAuthenticated, currentGuest }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // LOGIN
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;
                if (data.user) {
                    // Fetch existing player data
                    const { data: playerData, error: fetchError } = await supabase
                        .from('players')
                        .select('*')
                        .eq('id', data.user.id) // Ensure ID matches Auth ID
                        .single();

                    if (!fetchError && playerData) {
                        const loadedPlayer: Player = {
                            id: playerData.id,
                            name: playerData.name,
                            company: playerData.company,
                            color: playerData.color,
                            logoId: playerData.logo_id,
                            unlockedPlates: playerData.unlocked_plates,
                            avatarId: playerData.avatar_id // Assuming consistent casing in DB eventually, using snake_case DB mapping
                        };
                        onAuthenticated(loadedPlayer);
                        onClose();
                    } else {
                        // If auth exists but no player record (rare edge case), maybe prompt setup?
                        // For now just close or show error.
                        setError("Account exists but no Architect License found. Please contact support.");
                    }
                }

            } else {
                // SIGN UP
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                });

                if (error) throw error;

                if (data.user) {
                    // Create new player record using current Guest data if available, or defaults
                    const newId = data.user.id;

                    const playerDataToSave = {
                        id: newId,
                        name: currentGuest?.name || `Architect_${newId.slice(0, 4)}`,
                        company: currentGuest?.company || 'Startup Inc',
                        color: currentGuest?.color || '#3b82f6',
                        logo_id: currentGuest?.logoId || 'zap',
                        unlocked_plates: currentGuest?.unlockedPlates || ['N1'],
                        // If we are migrating Guest Buildings, we would update them here or via a server function.
                        // Ideally we update buildings where owner_id = guestID to newID.
                        // But client-side update with Row Level Security might fail if not careful.
                        // Let's just create the user for now.
                        last_seen: new Date().toISOString()
                    };

                    const { error: insertError } = await supabase
                        .from('players')
                        .insert(playerDataToSave);

                    if (insertError) throw insertError;

                    // Construct local player object
                    const newPlayer: Player = {
                        id: newId,
                        name: playerDataToSave.name,
                        company: playerDataToSave.company,
                        color: playerDataToSave.color,
                        logoId: playerDataToSave.logo_id,
                        unlockedPlates: playerDataToSave.unlocked_plates as any,
                        avatarId: currentGuest?.avatarId
                    };

                    onAuthenticated(newPlayer);
                    onClose();
                }
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400">
                            {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
                        </div>
                        <h2 className="text-2xl font-black text-white">{isLogin ? 'Access Terminal' : 'New License'}</h2>
                        <p className="text-slate-400 text-sm">{isLogin ? 'Retrieve your digital empire.' : 'Register to save your legacy.'}</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email Protocol</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/30 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="agent@stackcity.net"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Security Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/30 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-500">
                            {isLogin ? "No access key?" : "Already licensed?"}{' '}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-blue-400 hover:text-white font-bold underline transition"
                            >
                                {isLogin ? "Register Now" : "Login"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
