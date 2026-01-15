// src/pages/protected/ApplicationsPage.jsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    MapPin,
    Calendar,
    DollarSign,
    ExternalLink,
    Filter,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MessageSquare,
    FileText,
    Building2,
    TrendingUp,
    Eye,
    Loader2,
    Sparkles,
    RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/Input.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { useToast } from "@/hooks/use-toast.js";
import { applicationsAPI } from "@/services/api/applicationsAPI.js";

// ============================================
// STATUS CONFIGURATION
// ============================================
const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: Clock,
    },
    applied: {
        label: "Applied",
        color: "bg-brand-50 text-brand-700 border-brand-200",
        icon: CheckCircle2,
    },
    interview: {
        label: "Interview",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: MessageSquare,
    },
    offer: {
        label: "Offer",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: TrendingUp,
    },
    rejected: {
        label: "Rejected",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
    },
    withdrawn: {
        label: "Withdrawn",
        color: "bg-gray-50 text-gray-500 border-gray-300",
        icon: AlertCircle,
    },
};

// ============================================
// SLEEK APPLICATION ROW COMPONENT
// ============================================
function ApplicationRow({ application }) {
    const { job, status, applied_at, notes, interview_scheduled_at, offer_received_at } = application;
    const statusConfig = STATUS_CONFIG[status];
    const StatusIcon = statusConfig.icon;

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex flex-col md:flex-row md:items-center bg-white border border-gray-100 rounded-xl hover:border-brand-200 hover:shadow-md transition-all duration-200 gap-4 p-4"
        >
            {/* Logo & Basic Info */}
            <div className="flex items-center flex-1 min-w-0 gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 text-gray-600 font-bold text-lg flex items-center justify-center border border-gray-100 flex-shrink-0 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    {job.company_name?.charAt(0) || "C"}
                </div>

                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                        {job.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 gap-2 mt-2">
                        <span className="font-medium text-gray-700">{job.company_name}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="truncate">{job.location_city || 'Remote'}</span>
                    </div>
                </div>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center md:justify-end gap-3">
                {/* Status Badge */}
                <div className={`inline-flex items-center rounded-md border text-xs font-medium shadow-sm ${statusConfig.color} gap-2 px-3 py-1.5`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusConfig.label}
                </div>

                {/* Salary */}
                {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                    <span className="inline-flex items-center rounded-md bg-gray-50 text-xs font-medium text-gray-700 border border-gray-100 px-3 py-1.5">
                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </span>
                )}

                {/* Dates */}
                {applied_at && (
                    <span className="inline-flex items-center rounded-md bg-gray-50 text-xs font-medium text-gray-500 border border-gray-100 gap-2 px-3 py-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(applied_at)}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center md:border-l md:border-gray-100 gap-2 pl-4">
                <button className="text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors p-2" title="View Details">
                    <Eye className="h-4 w-4" />
                </button>
                {job.job_post_url && (
                    <a
                        href={job.job_post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors p-2"
                        title="Open Job"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </a>
                )}
            </div>
        </motion.div>
    );
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ label, value, icon: Icon, colorClass }) {
    return (
        <div className="flex items-center bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow gap-3 p-4">
            <div className={`rounded-lg ${colorClass} bg-opacity-10 p-2`}>
                <Icon className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const { toast } = useToast();

    // Load applications and stats
    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            // Fetch applications and stats in parallel
            const [applicationsData, statsData] = await Promise.all([
                applicationsAPI.getUserApplications(),
                applicationsAPI.getApplicationStats(),
            ]);

            setApplications(applicationsData);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to load applications:", error);
            toast({
                title: "Error",
                description: "Failed to load applications. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [toast]);

    // Filter applications
    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.job.company_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });



    // ============================================
    // LOADING STATE
    // ============================================
    if (isLoading) {
        return (
            <div className="flex-1 p-6">
                <div className="max-w-6xl mx-auto space-y-4">
                    <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-6">
                <div className="mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                My Applications
                            </h1>
                            <p className="text-gray-500 mt-1">Track and manage all your job applications</p>
                        </div>
                        <button
                            onClick={fetchApplications}
                            disabled={isLoading}
                            className="flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors shadow-sm gap-2 px-4 py-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </button>
                    </div>


                    {/* Filters */}
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by job title or company..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white border-gray-200 h-10 focus:ring-gray-900 focus:border-gray-900 rounded-lg text-sm pl-10"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="relative min-w-[180px]">
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="w-full bg-white border-gray-200">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="applied">Applied</SelectItem>
                                        <SelectItem value="interview">Interview</SelectItem>
                                        <SelectItem value="offer">Offer</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Applications List */}
                        <div className="space-y-3">
                            {filteredApplications.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {filteredApplications.map((application) => (
                                        <ApplicationRow key={application.id} application={application} />
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <div className="bg-white border border-gray-100 rounded-xl text-center p-12">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed font-light tracking-widest uppercase">
                                        {searchQuery || statusFilter !== "all"
                                            ? "Adjust your filters to see more results"
                                            : "Start applying to jobs to track your applications here.\nGo to 'Apply' page and start applying.."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Dramatic Footer */}

                </div>
            </div>
        </div>
    );
}
