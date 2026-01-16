import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast.js';
import { ROUTES } from '@/routes/routes.js';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Plus,
    Edit3,
    Save,
    X,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { projectsAPI } from '@/services/api/projectsAPI.js';
import { skillsAPI } from '@/services/api/skillsAPI.js';
import ProjectCard from '@/features/profile-setup/ProjectCard.jsx';
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import isEqual from 'lodash.isequal';

const PROJECT_SCHEMA = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title too long'),
    githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
    liveUrl: z.string().url('Invalid Live URL').optional().or(z.literal('')),
    otherUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    projectType: z.number().min(1, 'Project type is required'),
    projectStatus: z.number().min(1, 'Project status is required'),
    techStack: z.array(z.object({ id: z.string(), name: z.string() })).min(1, 'At least one tech stack item required'),
    startDate: z.string().min(4, 'Start date is required'),
    endDate: z.string().optional().or(z.literal('')),
    isOngoing: z.boolean().optional(),
    shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(200, 'Short description too long'),
    detailedDescription: z.string().optional().or(z.literal('')),
    keyFeatures: z.string().optional().or(z.literal('')),
    challenges: z.string().optional().or(z.literal('')),
});

const FORM_SCHEMA = z.object({
    projects: z.array(PROJECT_SCHEMA),
});

const INITIAL_PROJECT = {
    title: '',
    githubUrl: '',
    liveUrl: '',
    otherUrl: '',
    projectType: 1, // Personal
    projectStatus: 2, // In Progress
    techStack: [],
    startDate: '',
    endDate: '',
    isOngoing: false,
    shortDescription: '',
    detailedDescription: '',
    keyFeatures: '',
    challenges: '',
};

export default function ProjectForm() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [hasData, setHasData] = useState(false);
    const [skillsBase, setSkillsBase] = useState([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(false);


    const form = useForm({
        resolver: zodResolver(FORM_SCHEMA),
        mode: 'onChange',
        defaultValues: {
            projects: [INITIAL_PROJECT],
        },
    });

    const { fields: projectFields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'projects',
    });

    const fetchProjects = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const data = await projectsAPI.getProjects();
            let projects = [];
            if (Array.isArray(data)) {
                projects = data;
            } else if (Array.isArray(data?.projects)) {
                projects = data.projects;
            }

            // Transform backend -> frontend
            if (projects.length > 0) {
                const mappedProjects = projects.map(p => ({
                    title: p.title || '',
                    githubUrl: p.github_url || '',
                    liveUrl: p.live_url || '',
                    otherUrl: p.other_url || '',
                    projectType: p.project_type || 1,
                    projectStatus: p.project_status || 1,
                    techStack: Array.isArray(p.tech_stack) ? p.tech_stack.map(s => ({ id: s.id || s.name, name: s.name })) : [],
                    startDate: (p.start_year && p.start_month) ? `${p.start_year}-${String(p.start_month).padStart(2, '0')}` : '',
                    endDate: (p.end_year && p.end_month) ? `${p.end_year}-${String(p.end_month).padStart(2, '0')}` : '',
                    isOngoing: !!p.is_ongoing,
                    shortDescription: p.short_description || '',
                    detailedDescription: p.detailed_description || '',
                    keyFeatures: Array.isArray(p.key_features) ? p.key_features.join('\n') : (p.key_features || ''),
                    challenges: p.challenges || '',
                }));

                replace(mappedProjects);
                setOriginalData(mappedProjects);
                setHasData(true);
            } else {
                setHasData(false);
                setIsEdit(false);
            }
        } catch (error) {
            console.error("Failed to load projects:", error);
            if (isRefreshCall) {
                toast({
                    title: 'Refresh Failed',
                    description: 'Failed to refresh projects.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load projects.',
                    variant: 'destructive',
                });
            }
            setHasData(false);
            setIsEdit(false);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [replace, toast]);


    const fetchSkills = useCallback(async () => {
        if (skillsBase.length > 0) return;
        setIsLoadingSkills(true);
        try {
            const response = await skillsAPI.searchSkills("", 1000);
            const skills = Array.isArray(response) ? response : response?.skills || [];
            setSkillsBase(skills);
        } catch (error) {
            console.error("Failed to load skills:", error);
        } finally {
            setIsLoadingSkills(false);
        }
    }, [skillsBase.length]);


    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (isEdit && skillsBase.length === 0) {
            fetchSkills();
        }
    }, [isEdit, skillsBase.length, fetchSkills]);

    const preparePayload = (projects) => {
        return {
            projects: projects.map(p => {
                const [startYear, startMonth] = (p.startDate || '').split('-');
                const [endYear, endMonth] = (p.endDate || '').split('-');

                return {
                    title: p.title,
                    project_type: p.projectType,
                    project_status: p.projectStatus,
                    github_url: p.githubUrl || null,
                    live_url: p.liveUrl || null,
                    other_url: p.otherUrl || null,
                    start_month: startMonth ? parseInt(startMonth) : null,
                    start_year: startYear ? parseInt(startYear) : null,
                    end_month: endMonth ? parseInt(endMonth) : null,
                    end_year: endYear ? parseInt(endYear) : null,
                    is_ongoing: !!p.isOngoing,
                    short_description: p.shortDescription || null,
                    detailed_description: p.detailedDescription || null,
                    key_features: p.keyFeatures ? p.keyFeatures.split('\n').filter(f => f.trim()) : [],
                    challenges: p.challenges || null,
                    tech_stack: p.techStack.map(s => ({ id: s.id, name: s.name })),
                };
            })
        };
    };

    const onSubmit = async (data) => {
        const payload = preparePayload(data.projects);

        // Normalize original data
        const normalizedOriginal = originalData ? preparePayload(originalData).projects : [];
        const payloadToCheck = payload.projects;

        // Compare logic
        // We use isEqual from lodash
        // But tech_stack sorting might differ, so be careful.
        // For now, straightforward comparison.

        if (isEdit && isEqual(payloadToCheck, normalizedOriginal)) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            await projectsAPI.saveProjects(payload);
            toast({ title: 'Success!', description: 'Projects saved successfully.' });
            setOriginalData(data.projects);
            setIsEdit(false);
            setHasData(true);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save projects.',
                variant: 'destructive',
            });
            console.log(error.response.data);
        } finally {
            setIsSaving(false);
        }
    };

    const onError = (errors) => {
        console.error("Form Validation Errors:", errors);
        toast({
            title: 'Validation Error',
            description: 'Please fix the errors highlighted in the form.',
            variant: 'destructive',
        });
    };

    const handleAddProject = () => {
        append(INITIAL_PROJECT);
    };

    const handleClickEdit = () => {
        setIsEdit(true);
    };

    const handleClickCancel = () => {
        setIsEdit(false);
        if (originalData) {
            replace(originalData);
        }
    };

    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.EXPERIENCE);
    };

    const handleNext = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.RESEARCH);
    };

    const isFormValid = form.formState.isValid && !isSaving;
    const isNextButtonEnabled = isFormValid && (!isEdit || isSaving);

    const handleRefresh = () => {
        fetchProjects(true);
    };

    return (
        <div className="h-full w-full mx-auto bg-white p-3 pb-24 md:pb-3 lg:p-4">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="h-full flex flex-col justify-between gap-4">
                <section className="space-y-3 lg:space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                        <div className="flex-1">
                            <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-slate-900">Projects</h2>
                            <p className="text-slate-500 text-xs lg:text-sm">
                                Showcase your best projects (GitHub repos, live demos)
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            size="responsive"
                            disabled={isLoading || isSaving || isRefreshing}
                            className="gap-2  w-full md:w-auto "
                        >
                            <RefreshCw className={cn("h-3 w-3 lg:h-4 lg:w-4", (isLoading || isRefreshing) && "animate-spin")} />
                            {isLoading ? "Loading..." : isRefreshing ? 'Refreshing...' : isSaving ? 'Saving...' : 'Refresh Intel'}
                        </Button>
                    </div>

                    {isLoading || isRefreshing ? (
                        <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="p-4 bg-slate-50 flex flex-col items-start justify-start gap-3 lg:gap-4">
                                    <h3 className="text-lg text-slate-500 font-medium leading-none tracking-tight">
                                        {`Project`}
                                    </h3>
                                    <Skeleton className="h-6 w-96" />
                                </div>
                            </div>
                            <div className="p-4 space-y-3 lg:space-y-4">
                                {/* Project Title */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                {/* URLs */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                </div>
                                {/* Project Type + Status */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ))}
                                </div>
                                {/* Tech Stack */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex flex-wrap gap-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <Skeleton key={i} className="h-7 w-24 rounded-lg" />
                                        ))}
                                    </div>
                                    <Skeleton className="h-8 lg:h-10 w-full" />
                                    <Skeleton className="h-3 w-96" />
                                </div>
                                {/* Dates */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                    <div className="flex items-end">
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                </div>
                                {/* Short Description */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-24 w-full" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-48" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                {/* Detailed Description */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-44" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                                {/* Key Features */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-3 w-56" />
                                </div>
                                {/* Challenges */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        !hasData && !isEdit ? (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg text-center p-3 lg:p-4 gap-4 min-h-[300px] lg:min-h-[500px] flex flex-col items-center justify-center">
                                <AlertCircle className="h-12 w-12 text-slate-500 mx-auto" />
                                <h3 className="text-lg font-semibold text-slate-900 ">Oops, seems like your projects are not updated</h3>
                                <p className="text-slate-500 text-sm ">Add your projects to showcase your work</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {projectFields.map((field, index) => (
                                    <ProjectCard
                                        key={field.id}
                                        form={form}
                                        index={index}
                                        onRemove={() => remove(index)}
                                        canRemove={isEdit}
                                        isReadOnly={!isEdit}
                                        skillsBase={skillsBase}
                                    />
                                ))}
                                {isEdit && (
                                    <Button type="button" onClick={handleAddProject} disabled={isSaving} variant="outline" className="gap-4">
                                        <Plus className="h-4 w-4" /> Add Project
                                    </Button>
                                )}
                            </div>
                        )
                    )}
                </section>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 md:flex md:flex-row md:justify-between md:items-center md:pt-4">
                    <Button
                        type="button"
                        onClick={handlePrevious}
                        disabled={isSaving}
                        variant="outline"
                        className="col-start-1 row-start-2 w-full gap-2 md:w-auto md:gap-4"
                    >
                        <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                        Previous
                    </Button>

                    <div className="contents md:flex md:items-center md:gap-2">
                        {!isLoading && isEdit ? (
                            <div className="col-span-2 row-start-1 grid grid-cols-2 gap-3 w-full md:flex md:items-center md:w-auto md:gap-2">
                                <Button
                                    type="button"
                                    onClick={handleClickCancel}
                                    disabled={isSaving}
                                    variant="outline"
                                    className="w-full gap-2 md:w-auto md:gap-4"
                                >
                                    <X className="h-3 w-3 md:h-4 md:w-4" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    variant="primary"
                                    className="w-full gap-2 md:w-auto md:gap-4"
                                    aria-label="Save profile"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-3 w-3 md:h-4 md:w-4" />
                                            Save
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    onClick={handleClickEdit}
                                    disabled={isSaving}
                                    variant={`${isLoading ? "disabled" : "primary"}`}
                                    className="col-span-2 row-start-1 w-full gap-2 md:w-auto md:gap-4"
                                >
                                    {isLoading || hasData ? (
                                        <>
                                            <Edit3 className="h-3 w-3 md:h-4 md:w-4" />
                                            Edit
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                            Add
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={handleNext}
                                    variant="outline"
                                    className="col-start-2 row-start-2 w-full gap-2 md:w-auto md:gap-4"
                                >
                                    Next
                                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}