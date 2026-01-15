import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, ShieldCheck, XCircle, Loader2, Zap, Shield, ChevronRight } from 'lucide-react';
import { agentKeysAPI } from '@/services/api/agentKeysAPI.js';
import { ROUTES } from '@/routes/routes.js';
import { cn } from '@/lib/utils.js';
import { Button } from '@/components/ui/Button';

export default function PairingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle'); // idle, authorizing, success, error, standby
    const [error, setError] = useState(null);

    const port = searchParams.get('port');
    const state = searchParams.get('state');

    useEffect(() => {
        if (!port || !state) {
            setStatus('standby');
        }
    }, [port, state]);

    const handleAuthorize = async () => {
        if (!port || !state) return;
        setStatus('authorizing');
        setError(null);

        try {
            const keyName = `Agent-${new Date().toLocaleDateString()}-${Math.floor(Math.random() * 1000)}`;
            const keyResponse = await agentKeysAPI.generateKey(keyName);
            const apiKey = keyResponse.api_key;

            // Critical: The callback to the local agent server
            const callbackUrl = `http://localhost:${port}/callback?api_key=${apiKey}&state=${state}`;

            // We use no-cors because the local agent might not have CORS headers 
            // for the web app's domain, and we just need the request to fire.
            await fetch(callbackUrl, { mode: 'no-cors' });

            setStatus('success');
            setTimeout(() => {
                navigate(ROUTES.DASHBOARD);
            }, 3000);

        } catch (err) {
            console.error('Pairing failed:', err);
            setStatus('error');
            setError('Handshake failed. Ensure the Agent CLI is active and Port ' + (port || 'unknown') + ' is open.');
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center relative">
            {/* Minimalist Ambient Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden z-10"
            >
                <div className="p-10 text-center">
                    {/* Visual Anchor */}
                    <div className="mb-10 flex justify-center">
                        <div className={cn(
                            "relative w-28 h-28 rounded-[2rem] flex items-center justify-center transition-all duration-700 shadow-inner",
                            status === 'success' ? "bg-emerald-50 text-emerald-500" :
                                status === 'error' ? "bg-red-50 text-red-500" :
                                    status === 'standby' ? "bg-slate-50 text-slate-300" :
                                        "bg-brand-50 text-brand-600"
                        )}>
                            <Monitor size={48} strokeWidth={1.25} />

                            <AnimatePresence>
                                {status === 'success' && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/30 p-2"
                                    >
                                        <ShieldCheck size={24} />
                                    </motion.div>
                                )}
                                {status === 'authorizing' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 rounded-[2rem] border-2 border-brand-500/30 border-t-brand-500 animate-spin"
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Link Secured</h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                        Handshake successful. Your local tactical unit is now synchronized with ApplyVortex Core.
                                    </p>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-2xl border border-slate-100 inline-flex items-center gap-3">
                                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">Redirecting...</span>
                                    <Loader2 className="animate-spin h-3.5 w-3.5 text-brand-500" />
                                </div>
                            </motion.div>
                        ) : status === 'error' ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black text-red-600 tracking-tighter uppercase">Link Failed</h2>
                                    <p className="text-slate-500 text-sm font-medium italic px-4">
                                        "{error}"
                                    </p>
                                </div>
                                <Button
                                    onClick={() => navigate(ROUTES.DASHBOARD)}
                                    variant="outline"
                                    className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest border-slate-200"
                                >
                                    Return to Command Center
                                </Button>
                            </motion.div>
                        ) : status === 'standby' ? (
                            <motion.div
                                key="standby"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <div className="inline-flex items-center bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest px-3 py-1 gap-2">
                                        <Shield size={12} strokeWidth={2.5} /> Standby Mode
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                        Awaiting Agent
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                                        No active handshake sequence detected. To link a new worker, please initiate the login flow from your terminal.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                                        <p className="text-[11px] text-slate-600 font-medium">Open your local terminal or command prompt.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                                        <code className="text-[11px] bg-white rounded border border-slate-200 px-2 py-0.5 font-bold text-brand-600">applyvortex login</code>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                                        <p className="text-[11px] text-slate-600 font-medium font-bold">Follow the unique link generated in the CLI.</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => navigate(ROUTES.MY_AGENTS)}
                                    variant="ghost"
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                >
                                    Cancel & Return to Control Panel
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <div className="inline-flex items-center bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest px-3 py-1 gap-2">
                                        <Shield size={12} strokeWidth={2.5} /> Secure Handshake
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                        Authorize<br />Agent Link
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                        Local agent detected on Port <span className="text-slate-900 font-bold">{port}</span>.<br />
                                        Grant permission to access your profile?
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <Button
                                        onClick={handleAuthorize}
                                        disabled={status === 'authorizing'}
                                        className="w-full h-16 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white shadow-[0_20px_40px_-12px_rgba(var(--brand-600-rgb),0.3)] font-black text-sm uppercase tracking-widest flex items-center justify-center active:scale-[0.97] transition-all gap-3"
                                    >
                                        {status === 'authorizing' ? (
                                            <>
                                                <Loader2 className="animate-spin h-5 w-5" />
                                                Sequencing...
                                            </>
                                        ) : (
                                            <>
                                                Establish Link <ChevronRight size={18} strokeWidth={3} />
                                            </>
                                        )}
                                    </Button>
                                    <div className="flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest gap-2">
                                        <Zap size={10} className="fill-current" />
                                        One-time RSA Token Handshake
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}