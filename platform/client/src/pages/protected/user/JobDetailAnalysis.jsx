import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI } from '@/services/api/jobsAPI';
import { Portal, WorkMode } from '@/constants/constants';
import { useToast } from '@/hooks/use-toast';
import {
    ChevronLeft, ExternalLink, FileText, Building2, MapPin, DollarSign,
    Sparkles, CheckCircle2, XCircle, LinkIcon, Briefcase, Clock,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";

export default function JobDetailAnalysis() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // Track refreshing separately so we don't show the full Skeleton on manual refresh
    const [isRefreshing, setIsRefreshing] = useState(false);

    // FIX: Wrapped in useCallback to prevent infinite loop in useEffect
    const fetchJob = useCallback(async (showSkeleton = true) => {
        if (showSkeleton) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const response = await jobsAPI.getJob(jobId);
            setJob(response.data || response);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Could not load job details.",
                variant: "destructive"
            });
            // Only navigate back if this was the initial load
            if (showSkeleton) navigate('/jobs');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [jobId, navigate, toast]);

    useEffect(() => {
        if (jobId) fetchJob(true);
    }, [jobId, fetchJob]);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-5xl p-6 space-y-6">
                <div className="flex justify-between w-full">
                    <div className="space-y-4 w-2/3">
                        <Skeleton className="h-10 w-3/4 rounded-xl" />
                        <Skeleton className="h-5 w-1/2 rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-20 rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <div className="space-y-4 pt-4">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
            </div>
        );
    }

    if (!job) return null;

    const formatSalary = (min, max, currency) => {
        // Strict check: if min is 0, it should render, not return 'Not Disclosed'
        if ((min === null || min === undefined) && (max === null || max === undefined)) return 'Not Disclosed';

        const format = (val) => new Intl.NumberFormat('en-US', {
            style: 'currency', currency: currency || 'USD', maximumSignificantDigits: 3
        }).format(val);

        return min && max ? `${format(min)} - ${format(max)}` : format(min || max);
    };

    const getPortalName = (portalId) => {
        if (!portalId || !Portal) return 'Portal';
        const entry = Object.entries(Portal).find(([key, value]) => value === portalId);
        return entry ? entry[0].charAt(0) + entry[0].slice(1).toLowerCase() : 'Portal';
    };

    const handleBack = () => navigate('/jobs');

    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Recently'; // Invalid date safety

        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        const parts = [];
        if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        if (minutes > 0 && days === 0) parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);

        return parts.length > 0 ? parts.join(' ') + ' ago' : 'Recently';
    };

    const handleRefresh = () => {
        // Pass false to avoid triggering the full Skeleton screen
        fetchJob(false);
    };

    return (
        <div className="bg-white mx-auto overflow-y-auto h-full max-h-full custom-scrollbar p-6 space-y-6">

            {/* Header Section */}
            <div className="flex flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                    <h1 className="text-3xl font-bold text-brand-500 tracking-tight leading-tight">
                        {job.title}
                    </h1>
                    <div className="flex items-center text-gray-500 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-black">{job.company_name || <Skeleton className="h-4 w-20 inline-block" />}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{job.posted_at ? formatTimeAgo(job.posted_at) : 'Recently'}</span>
                        </div>
                        {job.salary_min && (
                            <>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-brand-500" />
                                    <span className="text-sm font-bold text-gray-700">
                                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-row gap-3">
                    {job.external_apply_url && (
                        <Button
                            onClick={() => window.open(job.external_apply_url, '_blank')}
                            className="bg-brand-700 hover:bg-brand-600 text-white gap-2"
                        >
                            <ExternalLink className="w-4 h-4 " />
                            Direct Apply
                        </Button>
                    )}
                    {job.job_post_url && (
                        <Button
                            onClick={() => window.open(job.job_post_url, '_blank')}
                            className="bg-brand-500 hover:bg-brand-600 text-white gap-2"
                        >
                            <LinkIcon className="w-4 h-4 " />
                            {getPortalName(job.portal)}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Intel'}
                    </Button>
                    <Button onClick={handleBack} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 bg-white gap-1.5" >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                </div>
            </div>

            {/* Job Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-y border-gray-100/50 bg-gray-50 rounded-xl">
                <div className="space-y-1 border-r border-gray-200 py-4 px-6 md:col-span-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Job Type</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                        {job.job_type ? job.job_type.replace(/_/g, ' ') : '-'}
                    </p>
                </div>

                <div className="space-y-1 border-r border-gray-200 py-4 px-6 md:col-span-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Experience</p>
                    <p className="text-sm font-semibold text-gray-900">
                        {job.experience_level || '-'}
                    </p>
                </div>

                <div className="space-y-1 border-r border-gray-200 py-4 px-6 md:col-span-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Work Mode</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                        {job.work_mode || 'N/A'}
                    </p>
                </div>

                <div className="space-y-1 col-span-1 md:col-span-1 py-4 px-6">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                        {job.work_mode === WorkMode.REMOTE
                            ? 'Anywhere'
                            : job.location_city || job.location_raw || 'N/A'}
                    </p>
                </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center border-b border-gray-100 pb-4 mb-4">
                    <h2 className=" font-semibold text-gray-800">Job Description</h2>
                </div>
                <article className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-brand-600 prose-strong:text-gray-900 text-gray-600 leading-relaxed font-normal">
                    {job.description ? (
                        <div className="whitespace-pre-wrap">{job.description}</div>
                    ) : (
                        <div className="text-gray-400 italic">No description available.</div>
                    )}
                </article>
            </div>

            {/* AI Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Match Score Card */}
                <div className="bg-white rounded-xl border border-gray-100 flex flex-col justify-between p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">Analysis</h3>
                        </div>
                        <span className="text-xl font-semibold text-brand-600">
                            {Math.round(job.overall_match * 100)}%
                        </span>
                    </div>

                    <Progress value={job.overall_match * 100} className="h-2 bg-gray-100 mb-8" indicatorClassName="bg-brand-500 rounded-full" />

                    {job.match_score && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center bg-gray-50 rounded-lg border border-gray-100/50 p-3">
                                <div className="text-lg font-bold text-gray-900">
                                    {Math.round(job.match_score.skill_match * 100)}%
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Skills</div>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg border border-gray-100/50 p-3">
                                <div className="text-lg font-bold text-gray-900">
                                    {Math.round(job.match_score.experience_match * 100)}%
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Experience</div>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg border border-gray-100/50 p-3">
                                <div className="text-lg font-bold text-gray-900">
                                    {Math.round(job.match_score.location_match * 100)}%
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Location</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 flex flex-col p-6 space-y-6">
                    <div className="flex items-center border-b border-gray-100 pb-3">
                        <h2 className="font-semibold text-gray-900">Recommendation Basis <span className="ml-1 text-slate-500 font-light text-xs ">( Fit Reasoning )</span></h2>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                        "{job.match_score.analysis_notes}"
                    </p>
                </div>
            </div>

            <div className="space-y-6 border border-gray-100 rounded-xl p-6">
                <div>
                    <div className="flex items-center mb-3">
                        <h4 className="font-bold text-emerald-800 text-sm">Matched Proficiencies</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {job.matched_skills?.length > 0 ? (
                            job.matched_skills.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 border-green-100">
                                    {skill}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-gray-400 text-sm italic">No direct skill matches found.</span>
                        )}
                    </div>
                </div>

                <hr className="border border-slate-100" />

                {/* Matched Skills */}
                <div>
                    <div className="flex items-center mb-3">
                        <h4 className="font-bold text-red-800 text-sm">Missing Capabilities</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {job.missing_skills?.length > 0 ? (
                            job.missing_skills.map((skill, i) => (
                                <Badge key={i} variant="outline" className="border-red-100 text-red-600 bg-red-50/30">
                                    {skill}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-gray-400 text-sm italic">No critical gaps identified.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}