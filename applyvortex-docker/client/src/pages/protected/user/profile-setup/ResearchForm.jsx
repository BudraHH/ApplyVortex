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
import ResearchCard from '@/features/profile-setup/ResearchCard.jsx';
import { Button } from "@/components/ui/Button";
import { researchAPI } from '@/services/api/researchAPI.js';
import isEqual from 'lodash.isequal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";

// Mappings
const RESEARCH_TYPE_MAP = {
    'journal': 1,
    'conference': 2,
    'thesis': 3,
    'patent': 4,
    'preprint': 5,
    'book-chapter': 6
};

const RESEARCH_TYPE_REVERSE_MAP = {
    1: 'journal',
    2: 'conference',
    3: 'thesis',
    4: 'patent',
    5: 'preprint',
    6: 'book-chapter'
};

const RESEARCH_SCHEMA = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    researchType: z.enum(['journal', 'conference', 'thesis', 'patent', 'preprint', 'book-chapter'], {
        errorMap: () => ({ message: 'Please select a research type' })
    }),
    authors: z.string().min(2, 'Authors required').max(300, 'Authors list too long'),
    publisher: z.string().min(2, 'Publisher/Venue required').max(200, 'Publisher name too long'),
    publicationDate: z.string().min(4, 'Publication date required').regex(/^\d{4}-\d{2}$/, 'Invalid date format'),
    url: z.string().url('Valid URL required').optional().or(z.literal('')),
    abstract: z.string().min(20, 'Abstract must be at least 20 characters').max(500, 'Abstract too long'),
});

const FORM_SCHEMA = z.object({
    research: z.array(RESEARCH_SCHEMA),
});

const INITIAL_RESEARCH = {
    title: '',
    researchType: '',
    authors: '',
    publisher: '',
    publicationDate: '',
    url: '',
    abstract: '',
};

// Mock Data
const MOCK_RESEARCH = [
    {
        title: 'Deep Learning for Automated Resume Parsing',
        researchType: 'journal',
        authors: 'John Doe, Jane Smith',
        publisher: 'International Journal of AI Research',
        publicationDate: '2024-02',
        url: 'https://example.com/research/resume-parsing',
        abstract: 'This paper explores the application of transformer-based models in extracting structured information from unstructured resume documents. We propose a novel architecture that achieves state-of-the-art performance on the ResumeEntities dataset.',
    },
    {
        title: 'Optimizing React Applications for Performance',
        researchType: 'conference',
        authors: 'Jane Smith',
        publisher: 'ReactCon 2023',
        publicationDate: '2023-11',
        url: 'https://example.com/talks/react-optimization',
        abstract: 'A comprehensive study on rendering behaviors in large-scale React applications. We discuss memoization strategies, virtualization techniques, and state management patterns that significantly reduce Time to Interactive (TTI).',
    }
];

export default function ResearchForm() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [hasData, setHasData] = useState(false);

    const form = useForm({
        resolver: zodResolver(FORM_SCHEMA),
        mode: 'onChange',
        defaultValues: { research: [] },
    });

    const { fields: researchFields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'research',
    });

    const fetchResearch = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const data = await researchAPI.getResearch();
            const rawResearch = Array.isArray(data) ? data : (data?.research || []);

            if (rawResearch.length > 0) {
                const mappedResearch = rawResearch.map(r => ({
                    title: r.title || '',
                    researchType: RESEARCH_TYPE_REVERSE_MAP[r.research_type] || 'journal',
                    authors: r.authors || '',
                    publisher: r.publisher || '',
                    publicationDate: (r.publication_year && r.publication_month)
                        ? `${r.publication_year}-${String(r.publication_month).padStart(2, '0')}`
                        : '',
                    url: r.url || '',
                    abstract: r.abstract || '',
                }));

                replace(mappedResearch);
                setOriginalData(mappedResearch);
                setHasData(true);
                setIsEdit(false);
            } else {
                // Use Mock Data if API is empty
                console.log("Using Mock Research Data");
                replace(MOCK_RESEARCH);
                setOriginalData(MOCK_RESEARCH);
                setHasData(true);
                setIsEdit(false);
            }
        } catch (error) {
            console.error("Fetch Research Error:", error);
            if (isRefreshCall) {
                toast({
                    title: 'Refresh Failed',
                    description: 'Failed to refresh research data.',
                    variant: 'destructive',
                });
            } else {
                // Fallback to Mock Data on Error too
                console.log("Falling back to Mock Research Data");
                replace(MOCK_RESEARCH);
                setOriginalData(MOCK_RESEARCH);
                setHasData(true);
                setIsEdit(false);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [replace, toast]);

    useEffect(() => {
        fetchResearch();
    }, [fetchResearch]);

    const preparePayload = (researchItems) => {
        return {
            research: researchItems.map(r => {
                const [year, month] = (r.publicationDate || '').split('-');
                return {
                    title: r.title,
                    research_type: RESEARCH_TYPE_MAP[r.researchType] || 1,
                    authors: r.authors,
                    publisher: r.publisher,
                    publication_month: month ? parseInt(month) : null,
                    publication_year: year ? parseInt(year) : null,
                    url: r.url || null,
                    abstract: r.abstract,
                };
            })
        };
    };

    const onSubmit = async (data) => {
        const payload = preparePayload(data.research);

        // 1. Normalize Original Data for comparison
        // We need to compare Apples to Apples. OriginalData is in 'Frontend Format'.
        // So we can convert OriginalData to Payload Format OR compare Payload to (Original -> Payload).
        // Let's convert Original to Payload.
        const normalizedOriginal = preparePayload(originalData || []);

        // 2. Guard Clause
        if (isEdit && isEqual(payload.research, normalizedOriginal.research)) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            await researchAPI.saveResearch(payload);

            toast({
                title: 'Success!',
                description: 'Research publications saved successfully.'
            });

            // Update originalData with the current frontend state
            // But be careful: data.research corresponds to current fields
            setOriginalData(data.research);
            setIsEdit(false);
            setHasData(true);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save research publications.',
                variant: 'destructive',
            });
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

    const handleAddResearch = () => {
        append(INITIAL_RESEARCH);
    };

    const handleClickEdit = () => {
        setIsEdit(true);
        // If empty, append one
        if (researchFields.length === 0) {
            append(INITIAL_RESEARCH);
        }
    };

    const handleClickCancel = () => {
        setIsEdit(false);
        if (originalData && originalData.length > 0) {
            replace(originalData);
            setHasData(true);
        } else {
            form.reset({ research: [] });
            setHasData(false);
        }
    };

    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.PROJECTS);
    };

    const handleNext = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.CERTIFICATIONS);
    };

    const handleRefresh = () => {
        fetchResearch(true);
    };

    return (
        <div className="w-full mx-auto bg-white p-4">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
                <section className="space-y-4">
                    <div className='flex items-center justify-between'>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                Research & Publications
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Add your research papers, publications, and academic contributions
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleRefresh} disabled={isLoading || isSaving || isRefreshing} className="gap-4">
                            <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
                            {isLoading ? "Loading..." : isRefreshing ? 'Refreshing...' : isSaving ? 'Saving...' : 'Refresh Intel'}
                        </Button>
                    </div>

                    {isLoading || isRefreshing ? (
                        <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
                            {/* Header */}
                            <div className="w-full bg-slate-50 rounded-xl flex items-center justify-between">
                                <div className="gap-1 flex flex-col items-start justify-start">
                                    <h3 className="text-lg text-slate-900 font-medium leading-none tracking-tight">
                                        {`Research`}
                                    </h3>
                                    <Skeleton className="h-6 w-96 bg-slate-100/90" />
                                </div>
                            </div>
                            {/* Body */}
                            <div className="p-4 space-y-4">
                                {/* Title */}
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                {/* Research Type + Publication Date */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                                {/* Authors + Publisher */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                                {/* DOI / URL */}
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                {/* Abstract */}
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-24 w-full" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-48" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        (!hasData && !isEdit) ? (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg text-center">
                                <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                    No research publications added yet
                                </h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    Showcase your academic contributions and research work
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {researchFields.map((field, index) => (
                                    <ResearchCard
                                        key={field.id}
                                        form={form}
                                        index={index}
                                        onRemove={() => remove(index)}
                                        canRemove={isEdit}
                                        isReadOnly={!isEdit}
                                    />
                                ))}
                                {isEdit && (
                                    <Button type="button" onClick={handleAddResearch} disabled={isSaving} variant="outline" className="gap-4">
                                        <Plus className="h-4 w-4" /> Add Research Publication
                                    </Button>
                                )}
                            </div>
                        )
                    )}
                </section>

                <div className="flex justify-between items-center border-t border-slate-200">
                    <Button type="button" onClick={handlePrevious} disabled={isSaving} variant="outline" className="gap-4">
                        <ArrowRight className="h-4 w-4 rotate-180" /> Previous
                    </Button>
                    <div className="flex items-center">
                        {isEdit ? (
                            <div className="flex items-center gap-4">
                                <Button type="button" onClick={handleClickCancel} disabled={isSaving} variant="outline" className="gap-4">
                                    <X className="h-4 w-4" /> Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving} variant="primary" className="gap-4">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" /> Save
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button type="button" onClick={handleClickEdit} disabled={isSaving} variant={`${isLoading ? "disabled" : "primary"}`} className="gap-4">
                                    {isLoading || hasData ? (
                                        <>
                                            <Edit3 className="h-4 w-4" /> Edit
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" /> Add
                                        </>
                                    )}
                                </Button>
                                <Button type="button" disabled={isSaving} onClick={handleNext} variant="outline" className="gap-4">
                                    Next <ArrowRight className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}