import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast.js';
import { ROUTES } from '@/routes/routes.js';
import isEqual from 'lodash.isequal';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
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
import { experienceAPI } from '@/services/api/experienceAPI.js';
import { skillsAPI } from '@/services/api/skillsAPI.js';
import ExperienceCard from '@/features/profile-setup/ExperienceCard.jsx';
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const EXPERIENCE_SCHEMA = z.object({
    company: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name must not exceed 100 characters'),
    jobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100, 'Job title must not exceed 100 characters'),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().min(2, 'Country is required'),
    workMode: z.number().optional(),
    employmentType: z.number().min(1, 'Employment type is required'),
    startDate: z.string().min(4, 'Start date is required'),
    endDate: z.string().optional().or(z.literal('')),
    isCurrent: z.boolean().optional(),
    skillsUsed: z.array(z.object({ id: z.string(), name: z.string() })).optional().default([]),
    summary: z.string().min(10, 'Summary should be at least 10 characters').max(700, 'Summary must not exceed 700 characters'),
    keyResponsibilities: z.string().optional().or(z.literal('')),
    achievements: z.string().optional().or(z.literal('')),
});

const FORM_SCHEMA = z.object({
    experiences: z.array(EXPERIENCE_SCHEMA),
});

const INITIAL_EXPERIENCE = {
    company: '',
    jobTitle: '',
    city: '',
    state: '',
    country: '',
    workMode: 1, // Default ONSITE
    employmentType: 1, // Default FULL_TIME
    startDate: '',
    endDate: '',
    isCurrent: false,
    skillsUsed: [],
    summary: '',
    keyResponsibilities: '',
    achievements: '',
};

export default function ExperienceForm() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [hasData, setHasData] = useState(false);
    const [hasMultipleCurrentJobs, setHasMultipleCurrentJobs] = useState(false);
    const [currentJobsCount, setCurrentJobsCount] = useState(0);
    const [skillsBase, setSkillsBase] = useState([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(false);

    const form = useForm({
        resolver: zodResolver(FORM_SCHEMA),
        mode: 'onChange',
        defaultValues: {
            experiences: [INITIAL_EXPERIENCE],
        },
    });

    const { fields: experienceFields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'experiences',
    });

    const fetchExperiences = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const data = await experienceAPI.getExperiences();

            // Extract experiences array from response
            let experiences = [];
            if (Array.isArray(data)) {
                experiences = data;
            } else if (Array.isArray(data?.experiences)) {
                experiences = data.experiences;
            }

            // Transform backend response to frontend form format
            experiences = experiences.map((exp) => {
                // Build startDate from start_month and start_year
                const startDate = exp.start_year && exp.start_month
                    ? `${exp.start_year}-${String(exp.start_month).padStart(2, '0')}`
                    : exp.start_date || '';

                // Build endDate from end_month and end_year (or use end_date)
                const endDate = !exp.is_current && exp.end_year && exp.end_month
                    ? `${exp.end_year}-${String(exp.end_month).padStart(2, '0')}`
                    : exp.end_date || '';

                return {
                    company: exp.company_name || '',
                    jobTitle: exp.job_title || '',
                    city: exp.city || '',
                    state: exp.state || '',
                    country: exp.country || '',
                    workMode: exp.work_mode || 1,
                    employmentType: exp.employment_type || 1,
                    startDate: startDate,
                    endDate: endDate,
                    isCurrent: exp.is_current || exp.is_ongoing || false,
                    skillsUsed: Array.isArray(exp.skills)
                        ? exp.skills.map(s => ({ id: s.id || s.name, name: s.name }))
                        : [],
                    summary: exp.job_summary || '',
                    keyResponsibilities: Array.isArray(exp.key_responsibilities)
                        ? exp.key_responsibilities.join('\n')
                        : exp.key_responsibilities || '',
                    achievements: Array.isArray(exp.achievements)
                        ? exp.achievements.join('\n')
                        : exp.achievements || '',
                };
            });

            if (experiences.length > 0) {
                replace(experiences);
                setOriginalData(experiences);
                setHasData(true);
            } else {
                setHasData(false);
                setIsEdit(false);
            }
        } catch (error) {
            console.error("Failed to load experiences:", error);
            if (isRefreshCall) {
                toast({
                    title: 'Refresh Failed',
                    description: 'Failed to refresh experience data.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load experience data. Starting fresh.',
                    variant: 'destructive',
                });
            }
            setHasData(false);
            setIsEdit(false);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [form, toast]);

    const fetchSkills = useCallback(async () => {
        if (skillsBase.length > 0) return;

        setIsLoadingSkills(true);
        try {
            const response = await skillsAPI.searchSkills("", 1000);
            const skills = Array.isArray(response) ? response : response?.skills || [];
            setSkillsBase(skills);
        } catch (error) {
            toast({
                title: 'Warning',
                description: 'Could not load skills library.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingSkills(false);
        }
    }, [skillsBase.length, toast]);

    useEffect(() => {
        fetchExperiences();
    }, [fetchExperiences]);

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (!name || name.includes('isCurrent')) {
                const count = value.experiences?.filter(exp => exp?.isCurrent === true).length || 0;
                setCurrentJobsCount(count);
                setHasMultipleCurrentJobs(count > 1);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    useEffect(() => {
        if (isEdit && skillsBase.length === 0) {
            fetchSkills();
        }
    }, [isEdit, skillsBase.length, fetchSkills]);



    const onError = (errors) => {
        console.error("Form Validation Errors:", errors);
        toast({
            title: 'Validation Error',
            description: 'Please fix the errors highlighted in the form.',
            variant: 'destructive',
        });
    };
    const onSubmit = async (data) => {
        // 1. Transform frontend format to backend format
        const backendExperiences = data.experiences.map(({ id, ...exp }) => {
            const [startYear, startMonth] = exp.startDate.split('-');
            const endDateParts = exp.endDate ? exp.endDate.split('-') : [];

            return {
                job_title: exp.jobTitle,
                company_name: exp.company,
                work_mode: exp.workMode,
                city: exp.city,
                state: exp.state,
                country: exp.country,
                start_month: parseInt(startMonth),
                start_year: parseInt(startYear),
                end_month: endDateParts.length > 0 ? parseInt(endDateParts[1]) : null,
                end_year: endDateParts.length > 0 ? parseInt(endDateParts[0]) : null,
                is_current: !!exp.isCurrent,
                employment_type: exp.employmentType,
                job_summary: exp.summary,
                key_responsibilities: exp.keyResponsibilities
                    ? exp.keyResponsibilities.split('\n').filter(r => r.trim())
                    : [],
                achievements: exp.achievements
                    ? exp.achievements.split('\n').filter(r => r.trim())
                    : [],
                skills: exp.skillsUsed.map(s => ({ id: s.id, name: s.name })),
            };
        });

        // 2. Normalize Original for comparison
        const normalizedOriginal = originalData.map(exp => {
            const [startYear, startMonth] = exp.startDate.split('-');
            const endDateParts = exp.endDate ? exp.endDate.split('-') : [];
            return {
                job_title: exp.jobTitle,
                company_name: exp.company,
                work_mode: exp.workMode,
                city: exp.city,
                state: exp.state,
                country: exp.country,
                start_month: parseInt(startMonth),
                start_year: parseInt(startYear),
                end_month: endDateParts.length > 0 ? parseInt(endDateParts[1]) : null,
                end_year: endDateParts.length > 0 ? parseInt(endDateParts[0]) : null,
                is_current: !!exp.isCurrent,
                employment_type: exp.employmentType,
                job_summary: exp.summary,
                key_responsibilities: exp.keyResponsibilities
                    ? exp.keyResponsibilities.split('\n').filter(r => r.trim())
                    : [],
                achievements: exp.achievements
                    ? exp.achievements.split('\n').filter(r => r.trim())
                    : [],
                skills: exp.skillsUsed.map(s => ({ id: s.id, name: s.name })),
            };
        });

        // 3. Guard Clause
        if (isEdit && isEqual(backendExperiences, normalizedOriginal)) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            await experienceAPI.saveExperiences({ experiences: backendExperiences });
            toast({ title: 'Success!', description: 'Work experience updated successfully.' });
            setOriginalData(data.experiences);
            setIsEdit(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save work experience.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };



    const handleAddExperience = () => {
        append(INITIAL_EXPERIENCE);
    };

    const handleClickEdit = async () => {
        if (skillsBase.length === 0) {
            await fetchSkills();
        }
        setIsEdit(true);
    };

    const handleClickCancel = () => {
        setIsEdit(false);
        setHasMultipleCurrentJobs(false);
        if (originalData) {
            replace(originalData);
        }
    };

    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.EDUCATION);
    };

    const handleNext = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.PROJECTS);
    };


    const handleRefresh = () => {
        fetchExperiences(true);
    };

    return (
        <div className="h-full w-full mx-auto bg-white space-y-3 lg:space-y-4 p-3 lg:p-4">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="h-full flex flex-col justify-between gap-4">

                {/* Experience Section */}
                <section className="space-y-3 lg:space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                        <div className="flex-1">
                            <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-slate-900 ">
                                Work Experiences
                            </h2>
                            <p className="text-slate-500 text-xs lg:text-sm">
                                Add your professional experiences (full-time, internships, etc.)
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
                                <div className="w-full bg-slate-50 flex flex-col items-start justify-start p-3 lg:p-4">
                                    <h3 className="text-lg text-slate-500 font-medium leading-none tracking-tight mb-4">
                                        {`Experience`}
                                    </h3>
                                    <Skeleton className="h-6 w-full lg:w-96 " />
                                    <Skeleton className="h-6 w-full lg:hidden block mt-1" />
                                </div>
                            </div>

                            <div className="p-3 lg:p-4 space-y-4">
                                {/* Company + Job Title */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Employment Type + Work Mode */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Location */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Dates */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                    <div className="flex items-end">
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                </div>

                                {/* Skills */}
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

                                {/* Summary */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-24 w-full" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-48" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>

                                {/* Responsibilities */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-24 w-full" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-48" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-20 w-full" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-48" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (!hasData && !isEdit) ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg text-center p-3 lg:p-4 gap-4 min-h-[300px] lg:min-h-[500px] flex flex-col items-center justify-center">
                            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto" />
                            <h3 className="text-lg font-semibold text-slate-900 ">
                                Oops, seems like your experiences are not updated
                            </h3>
                            <p className="text-slate-500 text-sm ">
                                Add your professional experiences to complete your profile
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {experienceFields.map((field, index) => (
                                <ExperienceCard
                                    key={field.id}
                                    form={form}
                                    index={index}
                                    onRemove={() => remove(index)}
                                    canRemove={isEdit}
                                    isReadOnly={!isEdit}
                                    hasMultipleCurrentJobs={hasMultipleCurrentJobs}
                                    currentJobsCount={currentJobsCount}
                                    skillsBase={skillsBase}
                                />
                            ))}

                            {isEdit && (
                                <Button
                                    type="button"
                                    onClick={handleAddExperience}
                                    disabled={isSaving}
                                    variant="outline"
                                    className="gap-4"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Experience
                                </Button>
                            )}
                        </div>
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
    )
}



