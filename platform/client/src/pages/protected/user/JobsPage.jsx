import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Portal, ApplicationStatus, JobType } from "@/constants/constants";

// Helper for Job Type Label
const getJobTypeLabel = (value) => {
    const key = Object.keys(JobType).find(k => JobType[k] === value);
    return key ? key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
};


import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    MapPin,
    Search,
    RefreshCw,
    ExternalLink,
    Building2,
    Globe,
    Filter,
    Play,
    Loader2,
    TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast.js";
import jobsAPI from "@/services/api/jobsAPI.js";

import { Input } from "@/components/ui/Input.jsx";
import { SearchBar } from "@/components/ui/SearchBar.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { JobMatchBadge } from "@/components/jobs/JobMatchBadge.jsx";
import { FileText } from "lucide-react";

// ============================================
// SLEEK JOB ROW COMPONENT
// ============================================
// ============================================
// SLEEK JOB CARD COMPONENT
// ============================================
function JobCard({ job, onClick }) {
    const formatSalary = (min, max, currency) => {
        if (!min && !max) return null;
        const formatAmount = (amount) => {
            if (currency === "INR") {
                return `₹${(amount / 100000).toFixed(1)}L`;
            }
            return `$${(amount / 1000).toFixed(0)}K`;
        };
        if (min && max) {
            return `${formatAmount(min)} - ${formatAmount(max)}`;
        }
        return formatAmount(min || max);
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);

        return parts.length > 0 ? parts.join(' ') + ' ago' : 'Just now';
    };

    const getMatchColor = (score) => {
        if (!score && score !== 0) return "text-slate-300";
        if (score >= 90) return "text-emerald-600";
        if (score >= 80) return "text-indigo-600";
        if (score >= 70) return "text-amber-600";
        return "text-slate-500";
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onClick(job.id)}
            className={`group relative bg-white border border-slate-100 rounded-xl p-3 lg:p-4 cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm`}
        >
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-start lg:gap-4">
                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-2 lg:space-y-1">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base lg:text-sm lg:font-semibold text-slate-900 truncate group-hover:text-brand-600 transition-colors flex-1">
                            {job.title}
                        </h3>

                        {/* Mobile Match Score */}
                        <div className="lg:hidden flex items-center gap-1 shrink-0">
                            <span className={`text-base font-bold ${getMatchColor(job.match_score)}`}>
                                {job.match_score ? `${job.match_score}%` : '--'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs lg:text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{job.company_name}</span>

                        {job.job_type && (
                            <span className="flex items-center gap-1">
                                <span className="hidden lg:inline text-slate-300">•</span>
                                <span className="lowercase first-letter:uppercase">{getJobTypeLabel(job.job_type)}</span>
                            </span>
                        )}

                        <span className="lg:hidden text-slate-300">•</span>
                        <span className="lg:hidden">{formatTimeAgo(job.posted_at)}</span>

                        {job.location && (
                            <span className="flex items-center gap-1">
                                <span className="hidden lg:inline text-slate-300">•</span>
                                <span>{job.location}</span>
                            </span>
                        )}

                        {(job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1">
                                <span className="hidden lg:inline text-slate-300">•</span>
                                <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 lg:bg-transparent lg:border-0 lg:p-0">
                                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                                </span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Desktop Match Score */}
                <div className="hidden lg:flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${getMatchColor(job.match_score)}`}>
                            {job.match_score ? `${job.match_score}%` : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            Match
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Meta */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400 border-t border-slate-50 pt-3 lg:pt-2">
                <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                    {/* Status Badge */}
                    <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
                        job.application_status === ApplicationStatus.APPLIED ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            job.application_status === ApplicationStatus.IN_PROGRESS ? "bg-blue-50 text-blue-600 border-blue-100 animate-pulse" :
                                job.application_status === ApplicationStatus.FAILED ? "bg-red-50 text-red-600 border-red-100" :
                                    "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                        {job.application_status === ApplicationStatus.APPLIED ? "Applied" :
                            job.application_status === ApplicationStatus.IN_PROGRESS ? "In Progress" :
                                job.application_status === ApplicationStatus.FAILED ? "Failed" :
                                    "Not Applied"}
                    </span>

                    {/* Analysis Badge */}
                    <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
                        job.match_score !== null && job.match_score !== undefined ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                            "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                        {job.match_score !== null && job.match_score !== undefined ? "Analyzed" : "Pending Analysis"}
                    </span>

                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border">
                        {Object.keys(Portal).find(key => Portal[key] === job.portal)?.toLowerCase()}
                    </span>
                </div>
                <div className="hidden lg:block self-end sm:self-auto">
                    <span>{formatTimeAgo(job.posted_at)}</span>
                </div>
            </div>
        </motion.div>
    );
}



export default function JobsPage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);




    const [portalFilter, setPortalFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState(location.state?.status || 'all');
    const [jobTypeFilter, setJobTypeFilter] = useState('all');
    const [workModeFilter, setWorkModeFilter] = useState('all');
    const [recencyFilter, setRecencyFilter] = useState(location.state?.recency || 'all');
    const [matchSort, setMatchSort] = useState(location.state?.sort || '');
    const [searchQuery, setSearchQuery] = useState("");

    const fetchJobs = async (silent = false) => {
        if (silent) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const data = await jobsAPI.getJobs(50);
            setJobs(data.jobs || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load jobs.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };



    useEffect(() => {
        fetchJobs();
    }, []);







    // Filter jobs
    const filteredJobs = jobs.filter(job => {
        // Hide corrupted data (asterisks)
        if (job.title && job.title.startsWith('*')) return false;

        const matchesSearch =
            job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPortal = portalFilter === 'all' || String(job.portal) === String(portalFilter);

        const matchesStatus = statusFilter === 'all' || job.application_status === Number(statusFilter);

        const matchesJobType = jobTypeFilter === 'all' || job.job_type === JobType[jobTypeFilter];

        const matchesWorkMode = workModeFilter === 'all' ||
            job.location?.toLowerCase().includes(workModeFilter.toLowerCase());

        const matchesRecency = recencyFilter === 'all' || (
            job.posted_at && (new Date() - new Date(job.posted_at)) <= 24 * 60 * 60 * 1000
        );

        return matchesSearch && matchesPortal && matchesStatus && matchesJobType && matchesWorkMode && matchesRecency;
    }).sort((a, b) => {
        if (matchSort === 'high-to-low') {
            return (b.match_score || 0) - (a.match_score || 0);
        }
        if (matchSort === 'low-to-high') {
            return (a.match_score || 0) - (b.match_score || 0);
        }
        if (matchSort === 'latest-first') {
            return new Date(b.posted_at || 0) - new Date(a.posted_at || 0);
        }
        if (matchSort === 'latest-last') {
            return new Date(a.posted_at || 0) - new Date(b.posted_at || 0);
        }
        return 0;
    });




    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl h-full flex flex-col flex-1 overflow-y-auto min-h-0 custom-scrollbar p-3 space-y-4 lg:p-6 lg:space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 lg:gap-6">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Discovered Jobs</h1>
                    <p className="text-slate-500 mt-1">Review intelligence and authorize engagement</p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => fetchJobs(true)}
                    disabled={isLoading || isRefreshing}
                    className="gap-2"
                >
                    <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
                    {isLoading ? 'Loading' : isRefreshing ? 'Refreshing...' : 'Refresh Intel'}
                </Button>
            </div>


            {/* Filters & Content */}
            <div className="space-y-6">
                {/* Filter Bar */}
                <div className="flex flex-col gap-4">
                    <div className="flex-1 relative">
                        <SearchBar
                            placeholder="Search roles or companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="relative">
                            <Select
                                value={portalFilter}
                                onValueChange={setPortalFilter}
                            >
                                <SelectTrigger className="w-full h-8 lg:h-10 bg-white border-slate-200 text-xs lg:text-sm">
                                    <SelectValue placeholder="Select Portal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Portals</SelectItem>
                                    {Object.entries(Portal).filter(([key]) => key !== 'OTHER').map(([key, value]) => (
                                        <SelectItem key={value} value={String(value)}>
                                            {key.charAt(0) + key.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full h-8 lg:h-10 bg-white border-slate-200 text-xs lg:text-sm">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value={String(ApplicationStatus.NOT_APPLIED)}>Not Applied</SelectItem>
                                    <SelectItem value={String(ApplicationStatus.APPLIED)}>Applied</SelectItem>
                                    <SelectItem value={String(ApplicationStatus.IN_PROGRESS)}>In Progress</SelectItem>
                                    <SelectItem value={String(ApplicationStatus.FAILED)}>Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative">
                            <Select
                                value={jobTypeFilter}
                                onValueChange={setJobTypeFilter}
                            >
                                <SelectTrigger className="w-full h-8 lg:h-10 bg-white border-slate-200 text-xs lg:text-sm">
                                    <SelectValue placeholder="Job Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Job Types</SelectItem>
                                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                    <SelectItem value="CONTRACT">Contract</SelectItem>
                                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                                    <SelectItem value="FREELANCE">Freelance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative">
                            <Select
                                value={matchSort}
                                onValueChange={setMatchSort}
                            >
                                <SelectTrigger className="w-full h-8 lg:h-10 bg-white border-slate-200 text-xs lg:text-sm">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Sort by</SelectItem>
                                    <SelectItem value="high-to-low">High to Low (Match)</SelectItem>
                                    <SelectItem value="low-to-high">Low to High (Match)</SelectItem>
                                    <SelectItem value="latest-first">Latest First</SelectItem>
                                    <SelectItem value="latest-last">Latest Last</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative">
                            <Select
                                value={workModeFilter}
                                onValueChange={setWorkModeFilter}
                            >
                                <SelectTrigger className="w-full h-8 lg:h-10 bg-white border-slate-200 text-xs lg:text-sm">
                                    <SelectValue placeholder="Work Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Work Modes</SelectItem>
                                    <SelectItem value="remote">Remote</SelectItem>
                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                    <SelectItem value="site">On-site</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative">
                            <Select
                                value={recencyFilter}
                                onValueChange={setRecencyFilter}
                            >
                                <SelectTrigger className={`w-full h-8 lg:h-10 bg-white border-slate-200 text-xs lg:text-sm ${recencyFilter !== 'all' ? 'ring-1 ring-brand-500 border-brand-500' : ''}`}>
                                    <SelectValue placeholder="Timeframe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Jobs List */}
                {isLoading || isRefreshing ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 relative">
                                <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-start lg:gap-4">
                                    {/* Main Content Skeleton */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start gap-2">
                                            {/* Title */}
                                            <Skeleton className="h-4 lg:h-5 w-3/4 lg:w-1/3" />
                                            {/* Mobile Match Score */}
                                            <Skeleton className="lg:hidden h-6 w-10" />
                                        </div>

                                        {/* Company & Meta */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <Skeleton className="h-3 w-20" /> {/* Company */}
                                            <Skeleton className="h-3 w-16" /> {/* Job Type */}
                                            <Skeleton className="lg:hidden h-3 w-12" /> {/* Time (Mobile) */}
                                            <Skeleton className="h-3 w-24 hidden lg:block" /> {/* Location/Salary (Desktop mostly) */}
                                        </div>
                                    </div>

                                    {/* Desktop Match Score Skeleton */}
                                    <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-1">
                                        <Skeleton className="h-6 w-10" />
                                        <Skeleton className="h-2 w-8 mt-1" />
                                    </div>
                                </div>

                                {/* Footer Skeleton */}
                                <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-14" />
                                    </div>
                                    <Skeleton className="hidden lg:block self-end sm:self-auto h-3 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {filteredJobs.map((job) => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onClick={(id) => navigate(`/jobs/${id}`)}
                                    />
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-xl text-center py-12 px-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-light tracking-widest uppercase">
                                    {searchQuery || portalFilter !== "all" || statusFilter !== "all"
                                        ? "Adjust your filters to see more results"
                                        : "No jobs identified yet. Check back later."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

            </div>



        </div>
    );
}
