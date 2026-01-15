import { Activity, Bell, Shield, MousePointer2, Globe, History, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

export const ActivityStream = ({ isOpen, onToggle }) => {
    const events = [
        { id: 1, type: 'stealth', icon: Shield, title: 'Fingerprint Rotated', desc: 'New canvas fingerprint applied.', time: '1m ago', status: 'success' },
        { id: 2, type: 'nav', icon: Globe, title: 'Naukri.com Loaded', desc: 'Waiting for dynamic elements...', time: '3m ago', status: 'info' },
        { id: 3, type: 'human', icon: MousePointer2, title: 'Human Interaction', desc: 'Simulated jitter on "Apply" button.', time: '5m ago', status: 'warning' },
        { id: 4, type: 'status', icon: Activity, title: 'High Match Found', desc: 'Python Engineer at Google (92%)', time: '12m ago', status: 'success' },
        { id: 5, type: 'history', icon: History, title: 'Auto-Apply Triggered', desc: 'Processing 12 cached blueprints.', time: '15m ago', status: 'info' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-amber-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <div
            className={`bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ease-in-out relative ${isOpen ? 'w-80' : 'w-0'
                }`}
        >
            {/* Toggle Button (Floating) */}
            <button
                onClick={onToggle}
                className="absolute -left-8 top-1/2 -translate-y-1/2 bg-white border border-slate-200 border-r-0 p-2 rounded-l-lg shadow-[-4px_0_10px_rgba(0,0,0,0.05)] text-slate-400 hover:text-blue-500 transition-colors z-10"
            >
                {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {isOpen && (
                <>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Live Stream</h3>
                        </div>
                        <div className="relative">
                            <Bell size={16} className="text-slate-400" />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                        </div>
                    </div>

                    {/* Stream Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {events.map((event) => {
                            const Icon = event.icon;
                            return (
                                <div key={event.id} className="relative pl-6 pb-2 border-l border-slate-100 last:border-0">
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-1.5 top-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(event.status)}`}></div>

                                    <div className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bgColor-slate-100 rounded bg-slate-50 text-slate-500">
                                                    <Icon size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{event.title}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium">{event.time}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                                            {event.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Info */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Status: Processing</span>
                            <span className="text-blue-500">Alive</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
