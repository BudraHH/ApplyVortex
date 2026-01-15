import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Cpu,
    Zap,
    Target,
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    ArrowRight,
    Brain,
    LineChart,
    BarChart3,
    Layers,
    Wand2,
    RefreshCw,
    CheckCircle2,
    Info,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/routes/routes';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function OptimizationPage() {
    const navigate = useNavigate();
    const { optimization, fetchOptimization } = useDashboardStore();

    useEffect(() => {
        fetchOptimization();
    }, [fetchOptimization]);

    const profileGaps = optimization.skillGaps.length > 0 ? optimization.skillGaps : [];

    const handleAddSkills = () => {
        navigate(ROUTES.PROFILE_SETUP.SKILLS);
    };

    return (
        <div className="flex flex-col min-h-full bg-white border border-slate-100 hover:border-slate-200 rounded-xl overflow-y-auto custom-scrollbar gap-6 p-6">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-xl border border-slate-100 gap-6 p-6">
                <div className="flex flex-col items-start">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Engine</h1>
                    <p className="text-slate-500 text-xs font-medium mt-2">AI-driven profile optimization and market positioning analysis</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleAddSkills}
                        variant="primary"

                    >
                        Add Skills
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ScoreCard
                    title="Overall Market Fit"
                    value={optimization.score || "0"}
                    unit="%"
                    icon={<Target className="text-brand-500 h-4 w-4" />}
                    trend="+12% from last week"
                    desc="Your profile is currently outperforming a significant portion of competing candidates in your target sector."
                />
                <ScoreCard
                    title="Estimated Salary Boost"
                    value={optimization.salaryBoost?.replace('K', '').replace('+', '') || "0"}
                    unit="K"
                    icon={<TrendingUp className="text-emerald-500 h-4 w-4" />}
                    trend="Potential Value"
                    desc={`Closing the identified skill gaps could increase your market value by approximately ${optimization.salaryBoost || '$0k'}.`}
                />
                <ScoreCard
                    title="Agent Confidence"
                    value="94"
                    unit="%"
                    icon={<ShieldCheck className="text-blue-500 h-4 w-4" />}
                    trend="High Precision"
                    desc="Our AI confidence score in the provided recommendations based on current market data."
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Detailed Gap Analysis */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <Card className="border-slate-100 bg-white rounded-xl shadow-none">
                        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30 p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Recommended Actions</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">PRIORITIZED BY IMPACT</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {profileGaps.map((gap, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="hover:bg-slate-50/50 transition-all group p-4"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-md font-bold text-slate-900">{gap.skill}</h3>
                                                    <Badge className={`${gap.bg} ${gap.color} border-0 rounded-xl h-5 font-black text-[8px] tracking-tighter shadow-none px-2`}>
                                                        {gap.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium leading-normal max-w-2xl">{gap.detail}</p>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex flex-col items-center justify-center shrink-0 min-w-[100px] px-3 py-2">
                                                <span className="text-xl font-black">{gap.impact}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-tight">Boost</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats/Tips */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <Card className="border-slate-100 bg-white rounded-xl shadow-none">
                        <CardHeader className="border-b border-slate-50 p-4">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Industry Trends</span>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start bg-slate-50/50 rounded-xl border border-slate-100 gap-3 p-3">
                                <div className="bg-white rounded-xl border border-slate-100 shrink-0 p-2">
                                    <LineChart className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-900 leading-tight">Increased Demand: Kubernetes</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Remote engineering roles requiring K8s have grown by 24% this quarter.</p>
                                </div>
                            </div>
                            <div className="flex items-start bg-slate-50/50 rounded-xl border border-slate-100 gap-3 p-3">
                                <div className="bg-white rounded-xl border border-slate-100 shrink-0 p-2">
                                    <Layers className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-900 leading-tight">Hybrid Work Resurgence</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight">NYC & SF based hubs are seeing a shift toward 3-day hybrid schedules.</p>
                                </div>
                            </div>
                            <div className="flex items-start bg-slate-50/50 rounded-xl border border-slate-100 gap-3 p-3">
                                <div className="bg-white rounded-xl border border-slate-100 shrink-0 p-2">
                                    <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-900 leading-tight">Salary Benchmarks Updated</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight">New compensation data for Backend Engineers is now available via our API.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-slate-100/50 rounded-xl border border-slate-100 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">About This Score</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Calculated daily based on millions of active job postings and thousands of successful placements in our ecosystem.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScoreCard({ title, value, unit, icon, trend, desc }) {
    return (
        <Card className="bg-white border border-slate-100 rounded-xl shadow-none flex flex-col p-6 gap-4">
            <div className="flex justify-between items-start">
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
                    <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl font-black text-slate-900">{value}</span>
                        <span className="text-xs font-bold text-slate-500 underline decoration-brand-500/30">{unit}</span>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{trend}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-snug">{desc}</p>
            </div>
        </Card>
    );
}
