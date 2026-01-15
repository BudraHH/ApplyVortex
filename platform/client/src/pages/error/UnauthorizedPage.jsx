import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/routes/routes';

const UnauthorizedPage = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 font-sans relative overflow-hidden p-2 md:p-3 lg:p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Abstract Shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-100/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-100/40 rounded-full blur-3xl pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl text-center border border-white/20 p-2 md:p-3 lg:p-4"
            >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center shadow-md shadow-red-500/10 border border-red-100 mb-2 md:mb-3 lg:mb-4">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>

                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                    Access Denied
                </h1>
                <p className="text-slate-500 leading-relaxed max-w-sm mx-auto mb-8">
                    You don't have permission to access this area. Please log in with appropriate credentials to continue.
                </p>

                <div className="space-y-3 w-full max-w-sm">
                    <Link to={ROUTES.LOGIN} className="w-full block">
                        <button className="w-full h-12 flex items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:shadow-brand-500/30 transition-all duration-200">
                            <LogIn className="mr-2 h-4 w-4" />
                            Log In Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    </Link>
                    <Link to={ROUTES.HOME} className="w-full block">
                        <button className="w-full h-12 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                            Go Back Home
                        </button>
                    </Link>
                </div>

                <p className="mt-8 text-xs font-medium text-slate-400 uppercase tracking-widest">
                    Error Code: 401
                </p>
            </motion.div>
        </div>
    );
};

export default UnauthorizedPage;