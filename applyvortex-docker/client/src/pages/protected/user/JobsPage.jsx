import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Portal, ApplicationStatus } from "@/constants/constants";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    MapPin,
    Search,
    RefreshCw,
    ExternalLink,
    Building2,
    Sparkles,
    Globe,
    Filter,
    Play,
    Loader2,
    TrendingUp,
    CheckSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast.js";
import jobsAPI from "@/services/api/jobsAPI.js";
import { resumeAPI } from "@/services/api/resumeAPI.js";
import { applicationsAPI } from "@/services/api/applicationsAPI.js";
import { Input } from "@/components/ui/Input.jsx";
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
import { JobMatchBadge } from "@/components/jobs/JobMatchBadge.jsx";
import { FileText } from "lucide-react";

// ============================================
// SLEEK JOB ROW COMPONENT
// ============================================
function JobRow({ job, onApply, onTailor, isApplying, isTailoring, isSelected, onSelect, onClick }) {
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
        if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);

        return parts.join(' ') + ' ago';
    };

    const getApplicationStatusBadge = (status) => {
        const statusConfig = {
            0: { // NOT_APPLIED
                label: 'Not Applied',
                className: 'bg-slate-100 text-slate-600'
            },
            1: { // APPLIED
                label: 'Applied',
                className: 'bg-emerald-100 text-emerald-700'
            },
            2: { // IN_PROGRESS
                label: 'In Progress',
                className: 'bg-blue-100 text-blue-700 animate-pulse'
            },
            3: { // FAILED
                label: 'Failed',
                className: 'bg-red-100 text-red-700'
            }
        };

        const config = statusConfig[status] || statusConfig[0];
        return (
            <span className={`rounded-md text-[10px] font-bold uppercase tracking-wider ${config.className} px-3 py-1`}>
                {config.label}
            </span>
        );
    };

    const getMatchBadge = () => {
        const score = job.match_score;

        // 1. Pending State
        if (score === undefined || score === null) {
            return (
                <div className="flex items-center bg-blue-50 text-blue-600 rounded-full border border-blue-100 animate-pulse gap-2 px-3 py-1">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Analysis Pending</span>
                </div>
            );
        }

        // 2. Tier Logic
        let tierLabel = "Good Match";
        let tierColor = "text-amber-700 bg-amber-50 border-amber-200";

        if (score >= 90) {
            tierLabel = "Perfect Match";
            tierColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
        } else if (score >= 80) {
            tierLabel = "Strong Match";
            tierColor = "text-indigo-700 bg-indigo-50 border-indigo-200";
        } else if (score < 70) {
            tierLabel = "Low Match";
            tierColor = "text-slate-600 bg-slate-50 border-slate-200";
        }

        return (
            <div className={`flex items-center rounded-full border ${tierColor} gap-2 px-3 py-1`}>
                <div className="flex flex-col items-end leading-none">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{tierLabel}</span>
                    <span className="text-sm font-bold">{score}%</span>
                </div>
                {/* Visual Ring Indicator could go here */}
            </div>
        );
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onClick(job.id)}
            className={`bg-white group relative border rounded-xl cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/40' : 'border-slate-200 hover:border-slate-300'} p-4`}
        >
            <div className="flex justify-between items-start gap-4">
                {/* Selection Checkbox */}
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect(job.id, checked)}
                    />
                </div>

                {/* LEFT: Main Info */}
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors">
                            {job.title}
                        </h3>
                        {/* Application Status Badge (Inline) */}
                        {job.application_status !== undefined && getApplicationStatusBadge(job.application_status)}
                    </div>

                    <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700 font-medium">
                            {job.company_name}
                        </span>

                        {job.location && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3.5 text-slate-400" />
                                    {job.location}
                                </span>
                            </>
                        )}

                        {/* Salary (If available) */}
                        {(job.salary_min || job.salary_max) && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600 font-medium font-mono text-xs bg-slate-50 rounded border border-slate-200 px-2 py-0.5">
                                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT: Match Intelligence */}
                <div className="flex flex-col items-end shrink-0 gap-3">
                    {getMatchBadge()}

                    <div className="flex items-center text-xs text-slate-400 gap-3">
                        <span className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3" />
                            {Object.keys(Portal)
                                .find(key => Portal[key] === job.portal)
                                ?.toLowerCase()
                                .replace(/^\w/, c => c.toUpperCase()) || 'Portal'}
                        </span>
                        {job.posted_at && (
                            <>
                                <span>•</span>
                                <span>{formatTimeAgo(job.posted_at)}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Quick Actions / Tags */}
            <div className="border-t border-slate-50 flex justify-between items-center mt-4 pt-4">
                <div className="flex gap-2">
                    {job.job_type && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 rounded border border-slate-200 px-2 py-1">
                            {job.job_type.replace(/_/g, ' ')}
                        </span>
                    )}
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTailor(job.id, job.description)}
                        disabled={isTailoring}
                        className="h-8 text-xs font-medium"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Tailor Resume
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApply(job.id)}
                        disabled={isApplying || job.application_status === 1}
                        isLoading={isApplying}
                        className="h-8 text-xs border-slate-200 font-medium"
                    >
                        Quick Apply
                    </Button>
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
    const [applyingJobId, setApplyingJobId] = useState(null);
    const [tailoringJobId, setTailoringJobId] = useState(null);
    const [selectedJobIds, setSelectedJobIds] = useState(new Set());
    const [isBulkApplying, setIsBulkApplying] = useState(false);

    const [defaultResumeId, setDefaultResumeId] = useState(null);
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

    const fetchDefaultResumeId = async () => {
        if (defaultResumeId) return defaultResumeId;

        try {
            const resumesData = await resumeAPI.getResumes();
            const resumes = resumesData.resumes || [];
            let defId = null;

            const defResume = resumes.find(r => r.is_default);
            if (defResume) defId = defResume.id;
            else if (resumes.length > 0) defId = resumes[0].id; // Fallback to first

            if (defId) {
                setDefaultResumeId(defId);
                return defId;
            } else {
                toast({
                    title: "No Resume Found",
                    description: "Please upload a resume in your profile first.",
                    variant: "destructive"
                });
                return null;
            }
        } catch (error) {
            console.error('Error fetching resumes:', error);
            toast({
                title: 'Error',
                description: 'Failed to check for resume.',
                variant: 'destructive',
            });
            return null;
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleTailor = async (jobId, jobDescription) => {
        const resumeId = await fetchDefaultResumeId();
        if (!resumeId) return;

        setTailoringJobId(jobId);
        try {
            await resumeAPI.tailorResume(resumeId, jobDescription, jobId);
            toast({
                title: "Resume Tailored",
                description: "A specialized PDF has been generated for this role.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Tailoring Failed",
                description: "AI optimization encountered an error.",
                variant: "destructive"
            });
        } finally {
            setTailoringJobId(null);
        }
    };

    const handleApply = async (jobId) => {
        setApplyingJobId(jobId);
        try {
            await jobsAPI.applyToJob(jobId);
            toast({
                title: 'Application Started',
                description: 'The automated application process has been triggered.',
            });
        } catch (error) {
            toast({
                title: 'Application Failed',
                description: 'Failed to trigger automation.',
                variant: 'destructive',
            });
        } finally {
            setApplyingJobId(null);
        }
    };

    const handleSelectJob = (jobId, isSelected) => {
        const newSelected = new Set(selectedJobIds);
        if (isSelected) newSelected.add(jobId);
        else newSelected.delete(jobId);
        setSelectedJobIds(newSelected);
    };

    const handleBulkApply = async () => {
        const resumeId = await fetchDefaultResumeId();
        if (!resumeId) return;

        setIsBulkApplying(true);
        try {
            const jobIds = Array.from(selectedJobIds);
            await applicationsAPI.bulkAutoApply(jobIds, resumeId);

            toast({
                title: "Bulk Application Started",
                description: `queued ${jobIds.length} applications for autonomous processing.`,
            });
            setSelectedJobIds(new Set()); // Clear selection
        } catch (error) {
            console.error(error);
            toast({
                title: "Bulk Apply Failed",
                description: "Could not queue applications.",
                variant: "destructive"
            });
        } finally {
            setIsBulkApplying(false);
        }
    };

    // Filter jobs
    const filteredJobs = jobs.filter(job => {
        // Hide corrupted data (asterisks)
        if (job.title && job.title.startsWith('*')) return false;

        const matchesSearch =
            job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPortal = portalFilter === 'all' || String(job.portal) === String(portalFilter);

        const matchesStatus = statusFilter === 'all' || job.application_status === Number(statusFilter);

        const matchesJobType = jobTypeFilter === 'all' || job.job_type === jobTypeFilter;

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
        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl h-full flex flex-col flex-1 overflow-y-auto min-h-0 custom-scrollbar p-6 space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discovered Jobs</h1>
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search roles or companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border-slate-200 h-10 focus:ring-slate-900 focus:border-slate-900 rounded-lg text-sm pl-10"
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="relative">
                            <Select
                                value={portalFilter}
                                onValueChange={setPortalFilter}
                            >
                                <SelectTrigger className="w-full bg-white border-slate-200">
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
                                <SelectTrigger className="w-full bg-white border-slate-200">
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
                                <SelectTrigger className="w-full bg-white border-slate-200">
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
                                <SelectTrigger className="w-full bg-white border-slate-200">
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
                                <SelectTrigger className="w-full bg-white border-slate-200">
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
                                <SelectTrigger className={`w-full bg-white border-slate-200 ${recencyFilter !== 'all' ? 'ring-1 ring-brand-500 border-brand-500' : ''}`}>
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
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        {/* Title */}
                                        <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse" />
                                        {/* Company & Location */}
                                        <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" />
                                    </div>
                                    {/* Time */}
                                    <div className="h-3 bg-slate-100 rounded w-16 animate-pulse" />
                                </div>
                                <div className="flex mt-4 gap-3">
                                    {/* Badges */}
                                    <div className="h-6 w-24 bg-slate-100 rounded-md animate-pulse" />
                                    <div className="h-6 w-20 bg-slate-100 rounded-md animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {filteredJobs.map((job) => (
                                    <JobRow
                                        key={job.id}
                                        job={job}
                                        onApply={handleApply}
                                        onTailor={handleTailor}
                                        isApplying={applyingJobId === job.id}
                                        isTailoring={tailoringJobId === job.id}
                                        isSelected={selectedJobIds.has(job.id)}
                                        onSelect={handleSelectJob}
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


            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedJobIds.size > 0 && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="sticky bottom-6 mx-auto w-fit z-10"
                    >
                        <div className="bg-slate-900/95 backdrop-blur-sm text-white rounded-full shadow-xl flex items-center border border-slate-700 ring-1 ring-black/5 px-4 py-2 gap-4">
                            <span className="text-sm font-medium whitespace-nowrap pl-2">
                                {selectedJobIds.size} selected
                            </span>
                            <div className="h-4 w-[1px] bg-slate-700" />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-slate-300 hover:text-white hover:bg-slate-800"
                                onClick={() => setSelectedJobIds(new Set())}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleBulkApply}
                                isLoading={isBulkApplying}
                                className="h-7 bg-white text-slate-900 hover:bg-slate-100 border-none font-semibold"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-brand-600 mr-2" />
                                Auto-Apply
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
