import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Send,
    Zap,
    Briefcase,
    RefreshCw,
    Bot,
    Compass,
    Building2,
    Star,
    ArrowRight,
    AlertCircle,
    LayoutDashboard,
    User,
    FileText,
    Monitor,
    Bell,
    Settings,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Menu
} from 'lucide-react';
import TitleBar from '../../../components/ui/TitleBar';

const ProductMockup = ({ progress }) => {
    // Sidebar collapse state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    // Track when layout animation is complete
    const [isSidebarReady, setIsSidebarReady] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    // Monitor width/scale changes to auto-collapse/expand sidebar
    // Monitor width/scale changes to auto-collapse/expand sidebar
    React.useEffect(() => {
        if (typeof progress === 'number') {
            // Logic for raw scroll progress (0 -> 1)
            // Expand sidebar when scrolled > 50%
            setIsSidebarCollapsed(progress < 0.5);
        } else if (typeof progress === 'string') {
            // Legacy/Fallback for string widths
            const numValue = parseFloat(progress);
            setIsSidebarCollapsed(numValue < 95);
        }
    }, [progress]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Sidebar navigation items
    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, active: true },
        { label: 'Profile', icon: User },
        { label: 'Apply', icon: Zap },
        { label: 'Jobs', icon: Briefcase },
        { label: 'Applications', icon: FileText },
        { label: 'Agent', icon: Monitor },
        { label: 'Notifications', icon: Bell },
        { label: 'Settings', icon: Settings },
        { label: 'Help', icon: HelpCircle },
    ];

    // Mock data
    const stats = {
        jobsFound24h: 1248,
        autoApplications24h: 857,
        activeAgents: 3
    };

    const heatmapData = [2, 5, 12, 8, 15, 6, 9, 14, 7, 11, 4, 13, 10, 8];

    const highValueTargets = [
        { id: 1, role: 'Senior Frontend Engineer', company: 'Google', location: 'Remote', score: 94 },
        { id: 2, role: 'Full Stack Developer', company: 'Meta', location: 'New York, NY', score: 91 },
    ];

    const activities = [
        { id: 1, type: 'find', title: 'Frontend Developer at Meta', detail: 'Discovered via LinkedIn', time: '2m' },
        { id: 2, type: 'apply', title: 'React Engineer at Stripe', detail: 'Auto-applied with tailored resume', time: '5m' },
        { id: 3, type: 'auto-apply', title: 'Product Designer at Airbnb', detail: 'Shortlisted for interview', time: '12m' },
        { id: 4, type: 'find', title: 'Frontend Developer at Meta', detail: 'Discovered via LinkedIn', time: '2m' },
        { id: 5, type: 'apply', title: 'React Engineer at Stripe', detail: 'Auto-applied with tailored resume', time: '5m' },
    ];

    const sourceData = [
        { label: 'LinkedIn', value: 65, color: 'bg-brand-500' },
        { label: 'Naukri', value: 25, color: 'bg-slate-500' },
        { label: 'Direct', value: 10, color: 'bg-slate-400' },
    ];

    const optimization = {
        score: 78,
        skillGaps: [
            { skill: 'TypeScript Proficiency', impact: '+12%' },
            { skill: 'System Design', impact: '+8%' },
            { skill: 'Cloud Certification', impact: '+5%' },
        ]
    };

    const getIcon = (type) => {
        switch (type) {
            case 'find': return <Search className="w-[0.6em] h-[0.6em] text-brand-500" />;
            case 'apply': return <Send className="w-[0.6em] h-[0.6em] text-emerald-500" />;
            case 'auto-apply': return <Zap className="w-[0.6em] h-[0.6em] text-amber-500" />;
            default: return <Briefcase className="w-[0.6em] h-[0.6em] text-slate-400" />;
        }
    };

    return (
        <div className="relative w-full">
            {/* Main Window */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 overflow-hidden rounded-[0.8em] border border-white/40 bg-slate-50 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] text-[clamp(8px,1.2vw,14px)]"
            >
                {/* Browser Chrome */}
                <TitleBar variant="light" />

                {/* URL Bar */}
                <div className="flex border-y border-slate-200/60 bg-slate-50/80 gap-[0.5em] px-[0.5em] py-[0.3em]">
                    <div className="flex items-center gap-[0.4em]">
                        <ChevronLeft className="h-[0.8em] w-[0.8em] bg-slate-200 rounded-full p-[0.1em]" />
                        <ChevronRight className="h-[0.8em] w-[0.8em] bg-slate-200 rounded-full p-[0.1em]" />
                        <RefreshCw className="h-[0.8em] w-[0.8em] bg-slate-200 rounded-full p-[0.1em]" />
                    </div>
                    <div className="flex items-center rounded-sm w-full bg-white text-[0.7em] font-bold text-slate-400 gap-[0.5em] px-[0.8em] py-[0.3em]">
                        <Search className="w-[0.8em] h-[0.8em] text-brand-500" />
                        <span className="tracking-tight">applyvortex.com/dashboard</span>
                    </div>
                    <div className="flex items-center gap-[0.4em]">
                        <div className="h-[0.6em] w-[0.6em] rounded-full bg-slate-400/80"></div>
                        <Menu className="h-[0.6em] w-[0.6em]" />
                    </div>
                </div>

                {/* App Layout Container */}
                <div className="flex bg-slate-50 p-[0.5em] gap-[0.5em] aspect-[16/8]">

                    {/* Sidebar - Animates in from left */}
                    <motion.aside
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        onAnimationComplete={() => setIsSidebarReady(true)}
                        className={`h-full bg-white border border-slate-100 hover:border-slate-200 rounded-[0.4em] flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[3em]' : 'w-[10em]'}`}
                    >
                        {/* Logo */}
                        <div className={`h-[2.5em] flex items-center border-b border-slate-100 flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-[0.8em]'}`}>
                            <div className="flex items-center gap-[0.5em] overflow-hidden">
                                <div className="rounded-[0.3em] bg-brand-50 text-brand-600 flex-shrink-0 p-[0.4em]">
                                    <Briefcase className="h-[1em] w-[1em]" />
                                </div>
                                {!isSidebarCollapsed && (
                                    <span className="text-[0.8em] font-bold text-brand-600 whitespace-nowrap">ApplyVortex</span>
                                )}
                            </div>
                        </div>

                        {/* Nav Items */}
                        <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-[0.5em] py-[0.5em] space-y-[0.25em]">
                            {navItems.map((item) => (
                                <div
                                    key={item.label}
                                    title={isSidebarCollapsed ? item.label : ''}
                                    className={`flex items-center rounded-[0.3em] transition-all duration-200 cursor-pointer group border ${item.active
                                        ? 'bg-brand-500 text-white border-brand-200 shadow-sm'
                                        : 'border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600'
                                        } ${isSidebarCollapsed ? 'justify-center' : ''} gap-[0.6em] p-[0.5em]`}
                                >
                                    <item.icon className={`h-[0.9em] w-[0.9em] flex-shrink-0 ${item.active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                                    {!isSidebarCollapsed && (
                                        <span className="text-[0.7em] font-semibold whitespace-nowrap overflow-hidden">{item.label}</span>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Collapse Button */}
                        <div className="border-t border-slate-100 flex-shrink-0 p-[0.5em]">
                            <button
                                onClick={toggleSidebar}
                                className={`flex items-center text-slate-400 hover:text-slate-600 w-full transition-all duration-200 cursor-pointer rounded-[0.3em] hover:bg-slate-50 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} gap-[0.5em] p-[0.5em]`}
                            >
                                {isSidebarCollapsed ? (
                                    <ChevronRight className="h-[0.9em] w-[0.9em] flex-shrink-0" />
                                ) : (
                                    <ChevronLeft className="h-[0.9em] w-[0.9em] flex-shrink-0" />
                                )}
                                {!isSidebarCollapsed && (
                                    <span className="text-[0.7em] font-bold whitespace-nowrap">Collapse</span>
                                )}
                            </button>
                        </div>
                    </motion.aside>

                    {/* Main Content Area - Animates in with sidebar, then content loads */}
                    {isSidebarReady && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            onAnimationComplete={() => setIsLayoutReady(true)}
                            className="flex-1 flex flex-col overflow-hidden h-full gap-[0.5em]"
                        >
                            {/* Top Bar */}
                            <div className="bg-white border border-slate-100 rounded-[0.4em] h-[2.5em] shrink-0 flex items-center justify-between px-[0.8em]">
                                <h1 className="text-[0.8em] font-bold text-slate-500">Dashboard</h1>
                                <div className="flex items-center gap-[0.6em]">
                                    <div className="flex items-center gap-[0.4em] px-[0.6em] py-[0.3em] bg-emerald-50 rounded-[0.2em] border border-emerald-100">
                                        <span className="h-[0.4em] w-[0.4em] bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[0.5em] font-bold text-emerald-600 uppercase">Agent Online</span>
                                    </div>
                                    <div className="p-[0.6em] rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-[0.6em] font-bold">
                                        JD
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Container - Empty until layout ready */}
                            <main className="flex-1 overflow-y-auto bg-white border border-slate-100 rounded-[0.4em] p-[0.6em]">
                                {isLayoutReady ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                        className="flex flex-col h-full gap-[0.6em]"
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-center bg-slate-50/50 rounded-[0.4em] border border-slate-100 p-[0.6em]">
                                            <h1 className="text-[0.9em] font-semibold text-brand-500">Progress Overview</h1>
                                            <button className="flex items-center gap-[0.3em] px-[0.6em] py-[0.4em] border border-slate-200 rounded-[0.2em] text-[0.6em] font-semibold text-slate-600">
                                                <RefreshCw className="h-[0.7em] w-[0.7em]" />
                                                Sync
                                            </button>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="grid grid-cols-3 gap-[0.5em]">
                                            <MetricCard title="Total Detections" value={stats.jobsFound24h.toLocaleString()} label="24h" icon={<Compass />} color="brand" />
                                            <MetricCard title="Auto Applied" value={stats.autoApplications24h} label="24h" icon={<Zap />} color="amber" />
                                            <MetricCard title="Parallel Agents" value={stats.activeAgents} label="Live" icon={<Bot />} color="slate" />
                                        </div>

                                        {/* Main Grid */}
                                        <div className="grid grid-cols-12 gap-[0.6em] flex-1 min-h-0">
                                            {/* Primary Column */}
                                            <div className="col-span-8 flex flex-col gap-[0.6em] overflow-hidden">
                                                {/* Heatmap */}
                                                <div className="bg-slate-50/30 rounded-[0.4em] border border-slate-100 p-[0.6em]">
                                                    <div className="flex items-center justify-between mb-[0.5em]">
                                                        <span className="text-[0.55em] font-black text-slate-400 uppercase tracking-widest">Efficiency Pulse</span>
                                                        <span className="text-[0.5em] font-bold text-slate-500 border border-slate-200 rounded-[0.3em] px-[0.4em] py-[0.15em]">14D</span>
                                                    </div>
                                                    <div className="flex justify-between gap-[0.15em]">
                                                        {heatmapData.map((val, idx) => {
                                                            const opacity = val === 0 ? 0.05 : val < 5 ? 0.3 : val < 10 ? 0.6 : 1;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="flex-1 h-[1.2em] rounded-[0.2em] bg-brand-500"
                                                                    style={{ opacity }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Priority Discoveries */}
                                                <div className="flex flex-col gap-[0.5em]">
                                                    <div className="flex justify-between items-center px-[0.3em]">
                                                        <span className="text-[0.55em] font-black text-slate-400 uppercase tracking-widest">Priority Discoveries</span>
                                                        <span className="text-[0.5em] font-black text-brand-600 uppercase cursor-pointer">See More</span>
                                                    </div>
                                                    <div className="flex gap-[0.5em]">
                                                        {highValueTargets.map((job) => (
                                                            <div
                                                                key={job.id}
                                                                className="flex-1 bg-white border border-slate-100 rounded-[0.4em] p-[0.6em] hover:border-slate-200 transition-all cursor-pointer group"
                                                            >
                                                                <div className="flex justify-between items-start mb-[0.4em]">
                                                                    <div className="bg-slate-50 rounded-[0.3em] p-[0.4em] group-hover:bg-brand-50 transition-colors">
                                                                        <Building2 className="h-[0.8em] w-[0.8em] text-slate-400 group-hover:text-brand-500" />
                                                                    </div>
                                                                    <span className="bg-emerald-50 text-emerald-600 flex items-center font-bold text-[0.55em] rounded-[0.2em] gap-[0.25em] px-[0.4em] py-[0.15em]">
                                                                        <Star className="h-[0.6em] w-[0.6em] fill-emerald-600" />
                                                                        {job.score}%
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-bold text-black text-[0.7em]">{job.role}</h4>
                                                                <p className="text-[0.55em] text-slate-500 mt-[0.15em]">{job.company}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Activity Feed */}
                                                <div className="bg-white border border-slate-100 rounded-[0.4em] flex-1 flex flex-col overflow-hidden">
                                                    <div className="border-b border-slate-50 flex items-center justify-between p-[0.6em]">
                                                        <span className="text-[0.55em] font-black text-slate-400 uppercase tracking-widest">Operational Feed</span>
                                                        <span className="text-[0.5em] font-bold text-slate-500 uppercase cursor-pointer">View Logs</span>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden divide-y divide-slate-50">
                                                        {activities.map((activity) => (
                                                            <div
                                                                key={activity.id}
                                                                className="flex items-start hover:bg-slate-50/50 transition-all p-[0.5em] gap-[0.4em]"
                                                            >
                                                                <div className="bg-slate-50 rounded-[0.3em] border border-slate-100 p-[0.4em]">
                                                                    {getIcon(activity.type)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start">
                                                                        <p className="font-bold text-black text-[0.65em] truncate">{activity.title}</p>
                                                                        <span className="text-[0.5em] text-slate-400 font-bold ml-auto">{activity.time}</span>
                                                                    </div>
                                                                    <p className="text-[0.55em] text-slate-500 truncate">{activity.detail}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Secondary Column */}
                                            <div className="col-span-4 flex flex-col gap-[0.6em] overflow-hidden">
                                                {/* Market Share */}
                                                <div className="bg-white border border-slate-100 rounded-[0.4em] overflow-hidden">
                                                    <div className="border-b border-slate-50 p-[0.6em]">
                                                        <span className="text-[0.55em] font-black text-slate-400 uppercase tracking-widest">Market Share</span>
                                                    </div>
                                                    <div className="p-[0.6em]">
                                                        <div className="flex flex-col gap-[0.4em]">
                                                            {sourceData.map((item) => (
                                                                <div key={item.label} className="flex justify-between items-center bg-slate-50/50 rounded-[0.3em] p-[0.4em]">
                                                                    <div className="flex items-center gap-[0.4em]">
                                                                        <div className={`h-[0.4em] w-[0.4em] rounded-full ${item.color}`} />
                                                                        <span className="text-[0.5em] font-bold text-slate-500 uppercase">{item.label}</span>
                                                                    </div>
                                                                    <span className="text-[0.55em] font-black text-black">{item.value}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Optimization */}
                                                <div className="bg-white border border-slate-100 rounded-[0.4em] flex-1 p-[0.6em]">
                                                    <div className="flex flex-col h-full gap-[0.5em]">
                                                        <div>
                                                            <span className="text-[0.55em] font-black text-brand-600 uppercase tracking-widest block">Intelligence Engine</span>
                                                            <h3 className="text-[0.6em] font-bold text-slate-900">Optimization</h3>
                                                        </div>

                                                        <div className="bg-slate-50/50 rounded-[0.4em] border border-slate-100 p-[0.5em]">
                                                            <div className="flex justify-between items-end mb-[0.4em]">
                                                                <div>
                                                                    <span className="text-[0.5em] font-bold text-slate-400 uppercase block">Match</span>
                                                                    <div className="text-[1.5em] font-bold text-slate-900">
                                                                        {optimization.score}<span className="text-brand-600 text-[0.6em]">%</span>
                                                                    </div>
                                                                </div>
                                                                <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[0.4em] font-black rounded-[0.3em] px-[0.4em] py-[0.15em]">ACTION</span>
                                                            </div>
                                                            <div className="h-[0.3em] w-full bg-slate-200/50 rounded-full overflow-hidden">
                                                                <div className="h-full bg-brand-500" style={{ width: `${optimization.score}%` }} />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-[0.4em] flex-1">
                                                            <span className="text-[0.5em] font-bold text-slate-400 uppercase flex items-center gap-[0.3em]">
                                                                <AlertCircle className="h-[0.6em] w-[0.6em] text-red-500" />
                                                                Gaps
                                                            </span>
                                                            <div className="space-y-[0.3em]">
                                                                {optimization.skillGaps.slice(0, 2).map((gap, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="bg-slate-50/50 border border-slate-100 rounded-[0.3em] flex justify-between items-center p-[0.4em]"
                                                                    >
                                                                        <span className="text-[0.5em] text-slate-600 font-bold">{gap.skill}</span>
                                                                        <span className="text-[0.5em] text-emerald-600 font-black">{gap.impact}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <button className="w-full flex items-center justify-center gap-[0.3em] bg-brand-600 hover:bg-brand-700 text-white text-[0.55em] font-bold rounded-[0.3em] py-[0.6em] transition-colors">
                                                            OPTIMIZE
                                                            <ArrowRight className="h-[0.7em] w-[0.7em]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* Loading state while layout animates */
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-[1.5em] h-[1.5em] border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                                    </div>
                                )}
                            </main>
                        </motion.div>)}
                </div>
            </motion.div>

            {/* Background Glow */}
            <div className="absolute -inset-10 -z-10 bg-brand-500/15 blur-[100px] rounded-full opacity-40"></div>
        </div>
    );
};

// Metric Card Component
function MetricCard({ title, value, label, icon, color }) {
    const variants = {
        brand: 'text-brand-600 bg-brand-50 border-brand-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        slate: 'text-slate-600 bg-slate-50 border-slate-100',
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[0.4em] flex items-center p-[0.6em] gap-[0.5em]">
            <div className={`rounded-[0.3em] ${variants[color]} border shrink-0 p-[0.4em]`}>
                {React.cloneElement(icon, { className: 'h-[0.9em] w-[0.9em]' })}
            </div>
            <div className="min-w-0">
                <span className="text-[0.5em] font-black text-slate-400 uppercase tracking-widest block leading-none mb-[0.15em]">{title}</span>
                <div className="flex items-baseline gap-[0.25em]">
                    <h3 className="text-[1em] font-bold text-black leading-none">{value}</h3>
                    <span className="text-[0.4em] font-bold text-slate-400 uppercase">{label}</span>
                </div>
            </div>
        </div>
    );
}

export default ProductMockup;
