import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, Globe, FileText, Activity, Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import TitleBar from '../../../components/ui/TitleBar';

const AgentMockup = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLogsExpanded, setIsLogsExpanded] = useState(false);

    // Animated stats
    const [jobsFound, setJobsFound] = useState(0);
    const [applied, setApplied] = useState(0);
    const [tasks, setTasks] = useState(0);
    const [successRate, setSuccessRate] = useState(0);

    // Dynamic logs and activities - use refs to avoid stale closures
    const [logs, setLogs] = useState([]);
    const [activities, setActivities] = useState([]);

    // Visibility tracking
    const [isVisible, setIsVisible] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const containerRef = useRef(null);
    const logsContainerRef = useRef(null);
    const intervalRef = useRef(null);
    const appliedRef = useRef(0);

    // Company names for realistic logs
    const companies = ['Stripe', 'Google', 'Meta', 'Netflix', 'Airbnb', 'Uber', 'Spotify', 'Slack', 'Figma', 'Notion', 'Linear', 'Vercel'];
    const roles = ['Frontend Engineer', 'Full Stack Developer', 'Senior SWE', 'React Developer', 'Software Engineer'];

    const getTimestamp = () => {
        const now = new Date();
        return now.toTimeString().slice(0, 8);
    };

    // Auto-scroll logs to bottom (only within the logs container)
    useEffect(() => {
        if (logsContainerRef.current && isLogsExpanded) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [logs, isLogsExpanded]);

    // Keep applied ref in sync
    useEffect(() => {
        appliedRef.current = applied;
    }, [applied]);

    // Intersection Observer - detect when mockup is in viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
                setTimeout(() => {
                    setIsLogsExpanded(true);
                }, 2000);
            },
            { threshold: 0.9 } // 90% of element must be visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Initialize startup logs once when first visible
    useEffect(() => {
        if (isVisible && !hasInitialized) {
            const startupLogs = [
                { time: getTimestamp(), level: 'SUCCESS', msg: 'Agent GUI initialized', id: 1 },
                { time: getTimestamp(), level: 'INFO', msg: 'Agent loop starting...', id: 2 },
                { time: getTimestamp(), level: 'SUCCESS', msg: 'Login Successful!', id: 3 },
            ];
            setLogs(startupLogs);

            const startupActivities = [
                { msg: 'Login Successful!', source: 'AUTH', time: 'JUST NOW', timestamp: getTimestamp(), id: 2 },
                { msg: 'Agent GUI initialized', source: 'SYSTEM', time: 'JUST NOW', timestamp: getTimestamp(), id: 1 },
            ];
            setActivities(startupActivities);
            setHasInitialized(true);
        }
    }, [isVisible, hasInitialized]);

    // Run animation only when visible
    useEffect(() => {
        if (!isVisible || !hasInitialized) {
            // Clear interval when not visible
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Start interval when visible
        intervalRef.current = setInterval(() => {
            const timestamp = getTimestamp();

            // Jobs Found - increases by 1-3
            const jobsIncrease = Math.floor(Math.random() * 3) + 1;
            setJobsFound(prev => Math.min(prev + jobsIncrease, 250));

            // Add jobs found log
            setLogs(prev => [...prev, {
                time: timestamp,
                level: 'INFO',
                msg: `Found ${jobsIncrease} new job${jobsIncrease > 1 ? 's' : ''} on LinkedIn`,
                id: Date.now()
            }].slice(-8));

            // Applied - 40% chance to apply
            if (Math.random() > 0.6 && appliedRef.current < 50) {
                const company = companies[Math.floor(Math.random() * companies.length)];
                const role = roles[Math.floor(Math.random() * roles.length)];

                setApplied(prev => prev + 1);

                // Add application log
                setLogs(prev => [...prev, {
                    time: timestamp,
                    level: 'SUCCESS',
                    msg: `✓ Applied: ${role} @ ${company}`,
                    id: Date.now() + 1
                }].slice(-8));

                // Add activity - ensure only 5 max
                setActivities(prev => [{
                    msg: `Application submitted: ${role} @ ${company}`,
                    source: 'LINKEDIN',
                    time: 'JUST NOW',
                    timestamp: timestamp,
                    id: Date.now() + 2
                }, ...prev.slice(0, 4)]);
            }

            // Tasks - queue management
            setTasks(prev => {
                const change = Math.floor(Math.random() * 3) - 1;
                return Math.max(0, Math.min(prev + change, 15));
            });

            // Success Rate
            setSuccessRate(prev => {
                if (prev < 85) return prev + Math.floor(Math.random() * 5) + 1;
                return Math.min(85 + Math.floor(Math.random() * 13), 98);
            });

        }, 1500);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isVisible, hasInitialized]);

    const navItems = [
        { icon: LayoutGrid, label: 'DASHBOARD', active: true },
        { icon: Globe, label: 'PORTALS', active: false },
        { icon: FileText, label: 'TASKS', active: false },
        { icon: Activity, label: 'ACTIVITY LOG', active: false },
        { icon: Settings, label: 'SETTINGS', active: false },
    ];

    const stats = [
        { value: jobsFound, label: 'JOBS FOUND', sub: 'FOUND ON LINKEDIN', color: 'text-[#1a9f8f]' },
        { value: applied, label: 'APPLIED', sub: 'AUTO-APPLIED', color: 'text-slate-800' },
        { value: tasks, label: 'TASKS', sub: 'IN QUEUE', color: 'text-orange-500' },
        { value: `${successRate}%`, label: 'SUCCESS', sub: 'MATCH RATE', color: 'text-slate-800' },
    ];

    const levelColors = {
        SUCCESS: 'text-green-600',
        ERROR: 'text-red-500',
        INFO: 'text-brand-500',
    };

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-white">

            {/* Window Title Bar */}
            <TitleBar title="Agent Forge" variant="light" />

            <div className="flex flex-1 min-h-0">

                {/* Sidebar - Always visible, collapsed on mobile */}
                <div className={`flex flex-col shrink-0 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${isCollapsed || window.innerWidth < 768 ? 'w-10 md:w-14' : 'md:w-48 lg:w-52'}`}>
                    <nav className="flex-1 py-2 md:py-4 px-1 md:px-2 space-y-0.5 md:space-y-1">
                        {navItems.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-2 md:gap-3 cursor-pointer px-2 md:px-3 py-1.5 md:py-2.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-semibold tracking-wide transition-all duration-200 ${item.active
                                    ? 'bg-[#1e4976] text-white'
                                    : 'text-slate-400 hover:text-[#1e4976] hover:bg-slate-50'
                                    } justify-start md:${isCollapsed ? 'justify-center' : 'justify-start'}`}
                                title={item.label}
                            >
                                <item.icon size={14} className="shrink-0 md:w-4 md:h-4" strokeWidth={2} />
                                <span className={`truncate hidden ${!isCollapsed ? 'md:inline' : ''}`}>{item.label}</span>
                            </div>
                        ))}
                    </nav>
                    <div className="p-1.5 md:p-3 hidden md:block">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`flex items-center gap-2 text-xs text-slate-400 hover:text-[#1e4976] cursor-pointer border-t border-slate-200 pt-3 md:pt-4 w-full transition-colors font-medium ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {isCollapsed ? (
                                <ChevronRight size={14} />
                            ) : (
                                <>
                                    <ChevronLeft size={14} />
                                    <span>COLLAPSE</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">

                    {/* Scrollable Content */}
                    <div className="flex-1 p-3 md:p-5 overflow-y-auto space-y-3 md:space-y-5">

                        {/* Stats Row - 2 cols mobile, 4 cols desktop */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-3">
                            {stats.map((stat, i) => (
                                <div key={i} className="bg-white p-1.5 md:p-4 rounded-md md:rounded-xl border border-slate-200">
                                    <div className={`text-sm md:text-2xl font-bold ${stat.color} transition-all`}>{stat.value}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-slate-700 uppercase tracking-wide mt-0.5">{stat.label}</div>
                                    <div className="text-[7px] md:text-[9px] text-slate-400 font-medium uppercase hidden sm:block">{stat.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Panel */}
                        <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 flex-1">
                            <div className="px-3 md:px-5 py-2 md:py-3 flex justify-between items-center border-b border-slate-100">
                                <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Activity</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase cursor-pointer hover:underline">Expand</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {activities.length === 0 ? (
                                    <div className="px-3 md:px-5 py-3 md:py-4 text-xs md:text-sm text-slate-400">Waiting for activity...</div>
                                ) : (
                                    activities.slice(0, 3).map((item) => (
                                        <div key={item.id} className="px-3 md:px-5 py-2 md:py-3.5 flex items-start gap-2 md:gap-3">
                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mt-1 md:mt-1.5 shrink-0 bg-emerald-500"></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs md:text-sm text-slate-700 font-medium truncate">
                                                    {item.msg}
                                                </div>
                                                <div className="text-[9px] md:text-[10px] text-slate-400 font-medium mt-0.5">
                                                    <span className="uppercase">{item.source}</span>
                                                    <span className="mx-1 md:mx-2">·</span>
                                                    <span className="uppercase">{item.time}</span>
                                                </div>
                                            </div>
                                            <div className="text-[9px] md:text-[10px] text-slate-300 font-mono shrink-0 hidden sm:block">{item.timestamp}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Agent Live Logs - Fixed at Bottom */}
                    <div className="bg-white border-t border-slate-200 shrink-0">
                        <div
                            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                            className="px-3 md:px-5 py-2 md:py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-slate-500 font-mono text-xs md:text-sm">{'>_'}</span>
                                <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-wider">Live Logs</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-emerald-50 border border-emerald-200">
                                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase">Active</span>
                                </span>
                                {isLogsExpanded ? (
                                    <ChevronDown size={12} className="text-slate-400 md:w-3.5 md:h-3.5" />
                                ) : (
                                    <ChevronUp size={12} className="text-slate-400 md:w-3.5 md:h-3.5" />
                                )}
                            </div>
                        </div>
                        {isLogsExpanded && (
                            <div
                                ref={logsContainerRef}
                                className="px-2 md:px-5 py-2 md:py-3 font-mono text-[10px] md:text-xs space-y-1 md:space-y-1.5 bg-white border-t border-slate-100 max-h-24 md:max-h-32 overflow-y-auto"
                            >
                                {logs.slice(-5).map((log) => (
                                    <div key={log.id} className="flex items-center">
                                        <span className="text-slate-400 w-14 md:w-20 shrink-0 text-[9px] md:text-xs">[{log.time}]</span>
                                        <span className="text-slate-300 px-1 md:px-2 hidden sm:inline">|</span>
                                        <span className={`w-12 md:w-16 shrink-0 font-semibold text-[9px] md:text-xs ${levelColors[log.level]}`}>{log.level}</span>
                                        <span className="text-slate-300 px-1 md:px-2 hidden sm:inline">|</span>
                                        <span className="text-slate-600 truncate text-[9px] md:text-xs flex-1">{log.msg}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Status Bar */}
                    <div className="bg-white border-t border-slate-200 px-2 md:px-5 py-1.5 md:py-2 flex justify-between items-center text-[9px] md:text-[10px] font-medium shrink-0">
                        <div className="flex items-center gap-2 md:gap-4">
                            <span className="text-emerald-600 font-bold uppercase">Ready</span>
                            <span className="text-slate-400 hidden sm:inline">CPU: {40 + Math.floor(Math.random() * 30)}%</span>
                            <span className="text-slate-400 hidden sm:inline">MEM: {300 + Math.floor(Math.random() * 100)} MB</span>
                        </div>
                        <span className="text-slate-300 font-mono">v2.0.1</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentMockup;
