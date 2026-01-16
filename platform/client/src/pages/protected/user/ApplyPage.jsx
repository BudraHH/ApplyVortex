import { useState, useEffect } from 'react';
import { BlueprintEditor } from '@/components/agent/BlueprintEditor.jsx';
import { AgentStatusIndicator } from '@/components/agent/AgentStatusIndicator.jsx';
import targetingAPI from '@/services/api/targetingAPI';
import scrapersAPI from '@/services/api/scrapersAPI';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { ChevronDown, Plus, RefreshCw, Search, Zap } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentStore } from '@/stores/agentStore';
import { Portal, ExperienceLevel, JobType, WorkMode, BlueprintStatus } from '@/constants/constants';
import { Label } from '@/components/ui/Label';
import { cn } from "@/lib/utils";

const PORTAL_LABELS = {
    [Portal.LINKEDIN]: 'LinkedIn',
    [Portal.NAUKRI]: 'Naukri',
    [Portal.INDEED]: 'Indeed',
}

const EXPERIENCE_MAPPING = {
    [ExperienceLevel.INTERN]: 'internship',
    [ExperienceLevel.ENTRY_LEVEL]: 'entry_level',
    [ExperienceLevel.JUNIOR]: 'associate',
    [ExperienceLevel.MID_LEVEL]: 'mid_senior',
    [ExperienceLevel.SENIOR]: 'mid_senior',
    [ExperienceLevel.LEAD]: 'director',
    [ExperienceLevel.ARCHITECT]: 'executive',
    [ExperienceLevel.EXECUTIVE]: 'executive',
};

const JOB_TYPE_MAPPING = {
    [JobType.FULL_TIME]: 'full_time',
    [JobType.PART_TIME]: 'part_time',
    [JobType.CONTRACT]: 'contract',
    [JobType.INTERNSHIP]: 'internship',
    [JobType.FREELANCE]: 'contract',
};

const WORK_MODE_MAPPING = {
    [WorkMode.ONSITE]: 'on_site',
    [WorkMode.REMOTE]: 'remote',
    [WorkMode.HYBRID]: 'hybrid',
};

export default function ApplyPage() {
    const { toast } = useToast();
    const [refreshTasks, setRefreshTasks] = useState(0);
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const loadProfiles = async (isRefreshCall = false) => {
        if (isRefreshCall) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const data = await targetingAPI.getTargetingProfiles();
            let profilesData = [];
            if (Array.isArray(data)) {
                // Sort by name ascending
                profilesData = data.sort((a, b) => (a.name || 'Untitled').localeCompare(b.name || 'Untitled'));
            } else if (data && typeof data === 'object') {
                profilesData = [data];
            }

            setProfiles(profilesData);
        } catch (error) {
            console.error("Failed to load profiles:", error);
            try {
                const active = await targetingAPI.getActiveProfile();
                if (active) {
                    setProfiles([active]);
                }
            } catch (e) {
                setProfiles([]);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const handleRefreshTasks = () => {
        setRefreshTasks(prev => prev + 1);
    };

    const handleUpdate = async (id, data) => {
        try {
            await targetingAPI.updateProfile(id, data);
            toast({ title: "Blueprint Updated", variant: "success", description: "Your targeting preferences have been updated." });
            loadProfiles();
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({ title: "Error", description: "Failed to update blueprint.", variant: "destructive" });
        }
    };

    const handleCreate = async (data) => {
        try {
            await targetingAPI.createProfile(data);
            toast({ title: "Blueprint Created", description: "New targeting blueprint added." });
            setIsAdding(false);
            loadProfiles();
        } catch (error) {
            console.error("Failed to create profile:", error);
            toast({ title: "Error", description: "Failed to create blueprint.", variant: "destructive" });
        }
    };

    const handleDeleteProfile = async (id) => {
        if (!confirm("Are you sure you want to delete this blueprint?")) return;
        try {
            await targetingAPI.deleteProfile(id);
            toast({ title: "Blueprint Deleted", description: "Targeting blueprint removed." });
            loadProfiles();
        } catch (error) {
            console.error("Failed to delete profile:", error);
            toast({ title: "Error", description: "Failed to delete blueprint.", variant: "destructive" });
        }
    };

    const handleRunScraper = async (profile, taskType = 1) => {
        try {
            const keywordString = (profile.keywords || []).join(', ');
            const locationString = (profile.locations || []).join(', ');

            // Map Integer Enum -> String Slug
            // Use != null to allow 0 (e.g. INTERN)
            const experience = profile.experience_level != null ? EXPERIENCE_MAPPING[profile.experience_level] : '';
            const employmentType = profile.job_type != null ? JOB_TYPE_MAPPING[profile.job_type] : '';
            const workMode = profile.work_mode != null ? WORK_MODE_MAPPING[profile.work_mode] : '';

            const datePosted = profile.date_posted || '';
            const checkInterval = profile.frequency || '24h';

            const portalKey = Object.keys(Portal).find(key => Portal[key] === profile.portal) || 'LINKEDIN';
            const portalName = portalKey.toLowerCase();

            let response;
            if (portalName === 'linkedin') {
                response = await scrapersAPI.scrapeLinkedIn(keywordString, locationString, experience, employmentType, workMode, checkInterval, datePosted, profile.id, taskType);
            } else if (portalName === 'naukri') {
                response = await scrapersAPI.scrapeNaukri(keywordString, locationString, experience, employmentType, workMode, checkInterval, datePosted, profile.id, null, taskType);
            } else {
                throw new Error(`Scraping not supported for ${portalName}`);
            }

            const opName = taskType === 2 ? 'Autonomous Run' : 'Discovery';
            toast({
                title: `${opName} Initiated`,
                description: `${portalKey} ${opName.toLowerCase()} started for ${profile.keywords[0]}...`,
                className: taskType === 2
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-green-50 border-green-500 text-green-700'
            });
            handleRefreshTasks();

            // Reload profiles to pick up new "active_task_status"
            setTimeout(() => {
                loadProfiles(true);
            }, 500); // Small delay to allow task creation

            // Refresh agent status globally to reflect "Busy" state
            useAgentStore.getState().refreshAgents();
        } catch (error) {
            console.error('Scraping error:', error);
            const isConflict = error.response?.status === 409;
            toast({
                title: isConflict ? 'Already Active' : 'Operation Failed',
                description: isConflict
                    ? 'A discovery task is already running for this blueprint.'
                    : 'Unable to launch scraper.',
                variant: isConflict ? 'default' : 'destructive',
                className: isConflict ? 'bg-amber-50 border-amber-500 text-amber-700' : undefined
            });
        }
    };

    // Quick Fix for initial render if no profiles but user has agent
    // (Optional UI improvement could go here)
    const handleRefresh = () => {
        loadProfiles(true);
    };
    return (
        <div className="h-full flex flex-col bg-white border border-slate-100 rounded-xl hover:border-slate-200 flex-1 overflow-y-auto min-h-0 custom-scrollbar animate-in fade-in duration-500 p-3 space-y-4 lg:p-6 lg:space-y-6">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
                <div className="space-y-1 lg:space-y-2">
                    <h1 className="text-xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
                        Launch Your Search
                    </h1>
                    <p className="text-slate-500 max-w-xl text-xs lg:text-sm leading-relaxed">
                        Define your targets and let ApplyVortex handle the rest.
                        Create one or more targeting blueprints to guide the AI agent.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <AgentStatusIndicator variant="full" />

                <div className="border border-slate-100 rounded-xl space-y-4 p-3 lg:space-y-6 lg:p-6">
                    {/* Header Section - Always visible unless standard empty state logic prevails, 
                        but here we show it if we have content OR if we are adding */}
                    <div className="flex flex-col lg:flex-row items-center justify-between border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-3">
                                Preference Blueprints
                            </h2>
                            <p className="text-sm text-slate-500 ">
                                Manage your job targeting criteria and automation settings.
                            </p>
                        </div>
                        <div className="mt-2 lg:mt-0 flex items-center gap-3 w-full lg:w-auto justify-between">
                            {profiles.length > 0 && (
                                <Button
                                    disabled={isLoading || isAdding}
                                    onClick={() => {
                                        if (profiles.length >= 3) {
                                            toast({
                                                title: "Limit Reached",
                                                description: "You can create a maximum of 3 blueprints.",
                                                variant: "destructive"
                                            });
                                            return;
                                        }
                                        setIsAdding(true);
                                    }}
                                    variant="primary">
                                    <Plus className="h-4 w-4" /> Add
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                {isLoading ? 'Loading...' : isRefreshing ? 'Refreshing...' : 'Refresh Intel'}
                            </Button>
                        </div>
                    </div>


                    {isLoading || isRefreshing ? (
                        <>
                            <div
                                className="bg-white/50 border border-slate-200 rounded-xl overflow-hidden "
                            >
                                {/* Trigger */}
                                <div className="p-2 lg:p-4">
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
                                        {/* Left: name + portal badge */}
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <Skeleton className="h-4 w-24 lg:w-32" />
                                            <Skeleton className="h-4 w-12 lg:w-14 rounded-sm" />
                                        </div>

                                        {/* Right: action buttons */}
                                        <div className="w-full lg:w-auto grid grid-cols-2 lg:flex items-center gap-2 lg:gap-3">
                                            <Skeleton className="h-8 w-full lg:w-24 bg-brand-50 text-brand-700 text-xs lg:text-sm flex justify-center items-center border border-brand-50 opacity-40">Find Jobs</Skeleton>
                                            <Skeleton className="h-8 w-full lg:w-24 bg-amber-50 text-amber-700 text-xs lg:text-sm flex justify-center items-center border border-amber-50 opacity-40">Auto Apply</Skeleton>

                                            <ChevronDown className={`hidden lg:block h-5 w-5 text-slate-400 opacity-40 rotate-180`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="border-t border-slate-100 p-2 lg:p-6 space-y-4 lg:space-y-6">
                                    {/* Blueprint summary skeleton */}
                                    <div className="flex flex-col md:flex-row justify-between gap-4 lg:gap-6 pt-0">
                                        {/* Left section */}
                                        <div className="flex-1 space-y-4 lg:space-y-6">
                                            {/* Target Roles */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                                    Target Roles
                                                </Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <Skeleton key={i} className="h-6 w-24 rounded-md" />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Locations */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                                    Locations
                                                </Label><div className="flex flex-wrap gap-2">
                                                    {Array.from({ length: 3 }).map((_, i) => (
                                                        <Skeleton key={i} className="h-7 w-20 rounded-md" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right section */}
                                        <div className="md:w-1/2 border-l-0 md:border-l border-slate-100 space-y-4 lg:space-y-6 pl-0 md:pl-6">
                                            {/* Filters */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                                    Filters
                                                </Label><div className="flex flex-row gap-2">
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <Skeleton key={i} className="h-6 w-28 rounded-md" />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Config */}
                                            <div className="border-t border-slate-100 pt-4 lg:pt-6 space-y-4">
                                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                                    Config
                                                </Label>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-300">Portal</span>
                                                        <Skeleton className="h-4 w-20" />
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-300">Frequency</span>
                                                        <Skeleton className="h-4 w-28" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer actions */}
                                    <div className="flex justify-end border-t border-slate-50 gap-3 pt-4 lg:pt-6">
                                        <Skeleton className="bg-red-50 text-red-700 text-sm flex justify-center items-center border border-red-50 opacity-40 px-4 py-2">Delete</Skeleton>
                                        <Skeleton className="bg-brand-50 text-brand-700 text-sm flex justify-center items-center border border-brand-50 opacity-40 px-4 py-2">Edit Blueprint</Skeleton>

                                    </div>
                                </div>
                            </div>
                            <div
                                className="bg-white/50 border border-slate-200 rounded-xl overflow-hidden "
                            >
                                {/* Trigger */}
                                <div className="opacity-40 p-4">
                                    <div className="flex items-center justify-between">
                                        {/* Left: name + portal badge */}
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-14 rounded-sm" />
                                        </div>

                                        {/* Right: action buttons */}
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-24 bg-brand-50 text-brand-700 text-sm flex justify-center items-center border border-brand-50 opacity-40">Find Jobs</Skeleton>
                                            <Skeleton className="h-8 w-24 bg-amber-50 text-amber-700 text-sm flex justify-center items-center border border-amber-50 opacity-40">Auto Apply</Skeleton>

                                            <ChevronDown className={`h-5 w-5 text-slate-400 opacity-40 `} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {profiles.length === 0 && !isAdding && (
                                <div className="text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors py-12 px-4">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Blueprints Configured</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto text-sm mb-6">
                                        Create your first targeting blueprint to tell our AI agent exactly what kind of jobs to search for.
                                    </p>
                                    <Button onClick={() => setIsAdding(true)} variant="primary" className="px-6">
                                        <Plus className="h-4 w-4 mr-2" /> Create First Blueprint
                                    </Button>
                                </div>
                            )}

                            {/* Content List */}
                            <div className="space-y-4">
                                <Accordion type="single" collapsible defaultValue={profiles[0]?.id} className="w-full space-y-4">
                                    {profiles.map((profile) => (
                                        <AccordionItem
                                            key={profile.id}
                                            value={profile.id}
                                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                                        >
                                            <AccordionTrigger className="hover:no-underline group p-2 md:p-3 lg:p-4">
                                                <div className="flex flex-col lg:flex-row flex-1 items-stretch lg:items-center justify-between mr-2 lg:mr-4 gap-3 lg:gap-0">
                                                    <div className="flex items-center gap-3 lg:gap-4">
                                                        <span className="font-bold text-sm text-slate-900 ">
                                                            {profile.name || 'Untitled'}
                                                        </span>
                                                        {/* Portal Badge */}
                                                        <span className={`text-[9px] lg:text-[10px] uppercase font-bold rounded border ${profile.portal === Portal.LINKEDIN ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-orange-50 text-orange-700 border-orange-100'} px-1.5 py-0.5 lg:px-2 lg:py-1`}>
                                                            {PORTAL_LABELS[profile.portal]}
                                                        </span>
                                                    </div>

                                                    <div className="w-full lg:w-auto grid grid-cols-2 lg:flex items-center gap-2 lg:gap-3">
                                                        {/* Find Jobs Button */}
                                                        <button
                                                            type="button"
                                                            disabled={profile.status === BlueprintStatus.AUTO_APPLY}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const isScraping = profile.status === BlueprintStatus.AUTO_SCRAPE || profile.active_task_status === 'SCRAPING';
                                                                if (isScraping) {
                                                                    await handleUpdate(profile.id, { status: BlueprintStatus.IDLE });
                                                                } else {
                                                                    // Set status to SCRAPE
                                                                    await handleUpdate(profile.id, { status: BlueprintStatus.AUTO_SCRAPE });
                                                                    handleRunScraper(profile);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "h-7 lg:h-8 font-bold uppercase tracking-wider text-[9px] lg:text-[10px] items-center justify-center lg:justify-start inline-flex transition-all duration-300 rounded-md px-2 lg:px-3 gap-2 w-full lg:w-auto",
                                                                (profile.status === BlueprintStatus.AUTO_SCRAPE || profile.active_task_status === 'SCRAPING')
                                                                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                                                                    : 'bg-brand-50 hover:bg-brand-500 text-brand-500 hover:text-white border border-brand-500',
                                                                profile.status === BlueprintStatus.AUTO_APPLY && 'opacity-50 cursor-not-allowed'
                                                            )}
                                                        >
                                                            {(profile.status === BlueprintStatus.AUTO_SCRAPE || profile.active_task_status === 'SCRAPING') ? (
                                                                <>
                                                                    <Search className="h-3 w-3 animate-pulse" />
                                                                    Stop...
                                                                </>
                                                            ) : (
                                                                <><Search className="h-3 w-3 font-bold" /> Find Jobs</>
                                                            )}
                                                        </button>

                                                        {/* Auto Apply Button */}
                                                        <button
                                                            type="button"
                                                            disabled={profile.status === BlueprintStatus.AUTO_SCRAPE || profile.active_task_status === 'SCRAPING'}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (profile.status === BlueprintStatus.AUTO_SCRAPE || profile.active_task_status === 'SCRAPING') return;

                                                                if (profile.status === BlueprintStatus.AUTO_APPLY) {
                                                                    await handleUpdate(profile.id, { status: BlueprintStatus.IDLE });
                                                                } else {
                                                                    await handleUpdate(profile.id, { status: BlueprintStatus.AUTO_APPLY });
                                                                    handleRunScraper(profile, 2);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "h-7 lg:h-8 font-bold uppercase tracking-wider text-[9px] lg:text-[10px] items-center justify-center lg:justify-start inline-flex transition-all duration-300 rounded-md px-2 lg:px-3 gap-2 w-full lg:w-auto",
                                                                profile.status === BlueprintStatus.AUTO_APPLY
                                                                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                                                                    : 'bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 border border-orange-200',
                                                                (profile.status === BlueprintStatus.AUTO_SCRAPE || profile.active_task_status === 'SCRAPING') && 'opacity-50 cursor-not-allowed grayscale'
                                                            )}
                                                        >
                                                            {profile.status === BlueprintStatus.AUTO_APPLY ? (
                                                                <>
                                                                    <Zap className="h-3 w-3 animate-pulse text-white" />
                                                                    Stop...
                                                                </>
                                                            ) : (
                                                                <><Zap className="h-3 w-3" /> Auto Apply</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0 pb-0 pt-0 border-t border-slate-100 ">
                                                <BlueprintEditor
                                                    profile={profile}
                                                    onSave={(data) => handleUpdate(profile.id, data)}
                                                    onDelete={() => handleDeleteProfile(profile.id)} // Pass delete handler
                                                    isEditing={false} // Default to View Mode
                                                    disabled={profile.status !== BlueprintStatus.IDLE || profile.active_task_status === 'SCRAPING'}
                                                />
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>

                                {/* Add New Form */}
                                {isAdding && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white ">
                                        <div className="bg-slate-50 border-b border-slate-200 flex items-center justify-between p-3 lg:p-4">
                                            <h3 className="font-semibold text-xs lg:text-sm">Create New Blueprint</h3>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 lg:h-8 lg:w-8 p-0" onClick={() => setIsAdding(false)}>
                                                <span className="sr-only">Close</span>
                                                <Plus className="h-4 w-4 rotate-45" />
                                            </Button>
                                        </div>
                                        <BlueprintEditor
                                            onSave={handleCreate}
                                            onCancel={() => setIsAdding(false)}
                                            isEditing={true} // Force Edit Mode for new
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}
