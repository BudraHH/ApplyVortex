import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { accomplishmentsAPI } from '@/services/api/accomplishmentsAPI.js';
import AccomplishmentCard from '@/features/profile-setup/AccomplishmentCard.jsx';
import isEqual from 'lodash.isequal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { cn } from "@/lib/utils";

// Mappings
const ACCOMPLISHMENT_CATEGORY_MAP = {
    'achievement': 1,
    'award': 2,
    'leadership': 3,
    'volunteering': 4,
    'patent': 5,
    'publication': 6,
    'other': 99
};

const ACCOMPLISHMENT_CATEGORY_REVERSE_MAP = {
    1: 'achievement',
    2: 'award',
    3: 'leadership',
    4: 'volunteering',
    5: 'patent',
    6: 'publication',
    99: 'other'
};

// Schema
const accomplishmentSchema = z.object({
    title: z.string().min(2, 'Title is required').max(200),
    category: z.enum(['achievement', 'award', 'leadership', 'volunteering', 'patent', 'publication', 'other'], {
        errorMap: () => ({ message: 'Please select a category' })
    }),
    description: z.string().min(10, 'Description is required (min 10 chars)').max(1000),
});

const formSchema = z.object({
    accomplishments: z.array(accomplishmentSchema),
});

const INITIAL_ITEM = {
    title: '',
    category: '',
    description: '',
};

// Mock Data Removed

export default function AccomplishmentForm() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [originalData, setOriginalData] = useState([]);

    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: {
            accomplishments: [],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'accomplishments',
    });

    const { isValid } = form.formState;

    // Fetch Data
    const loadData = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const response = await accomplishmentsAPI.getAccomplishments();
            const data = response?.accomplishments || response || [];

            if (Array.isArray(data) && data.length > 0) {
                // Filter out empty entries from API to prevent "empty cards"
                const validItems = data.filter(item => item.title && item.title.trim().length > 0);

                if (validItems.length > 0) {
                    const formattedData = validItems.map(item => ({
                        title: item.title || '',
                        category: ACCOMPLISHMENT_CATEGORY_REVERSE_MAP[item.category] || 'other',
                        description: item.description || '',
                    }));

                    replace(formattedData);
                    setOriginalData(formattedData);
                    setHasData(true);
                    setIsEdit(false);
                } else {
                    setHasData(false);
                    setOriginalData([]);
                    replace([]);
                    setIsEdit(false);
                }
            } else {
                setHasData(false);
                setOriginalData([]);
                replace([]);
                setIsEdit(false);
            }
        } catch (error) {
            console.error("Failed to load accomplishments:", error);
            if (isRefreshCall) {
                toast({
                    title: 'Refresh Failed',
                    description: 'Failed to refresh accomplishment data.',
                    variant: 'destructive',
                });
            } else {
                setHasData(false);
                setOriginalData([]);
                replace([]);
                setIsEdit(false);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [replace, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onError = (errors) => {
        console.error("Form Validation Errors:", errors);
        toast({
            title: 'Validation Error',
            description: 'Please fix the errors highlighted in the form.',
            variant: 'destructive',
        });
    };

    const onSubmit = async (data) => {
        // 1. Prepare the Payload
        const payload = {
            accomplishments: data.accomplishments.map(item => ({
                title: item.title,
                category: ACCOMPLISHMENT_CATEGORY_MAP[item.category] || 99,
                description: item.description || null,
            }))
        };

        // 2. Normalize Original Data (convert category string -> int) for accurate comparison
        // We need to compare "Payload against Payload" effectively, or "Form State against Form State".
        // Let's compare payloads.
        const originalPayload = {
            accomplishments: originalData.map(item => ({
                title: item.title,
                category: ACCOMPLISHMENT_CATEGORY_MAP[item.category] || 99,
                description: item.description || null,
            }))
        };

        if (isEdit && isEqual(payload.accomplishments, originalPayload.accomplishments)) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            await accomplishmentsAPI.saveAccomplishments(payload);
            toast({ title: 'Success', description: 'Saved successfully.' });

            // Update original data with current form data (strings)
            setOriginalData(data.accomplishments);
            setHasData(true);
            setIsEdit(false);
        } catch (error) {
            console.error("Save error:", error);
            toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        form.handleSubmit(onSubmit, (errors) => {
            if (errors.accomplishments) {
                const errorIndices = Object.keys(errors.accomplishments);
                if (errorIndices.length > 0) {
                    const firstIndex = errorIndices[0];
                    const errorFields = errors.accomplishments[firstIndex];
                    let targetId = '';
                    if (errorFields?.title) targetId = `accomplishment-title-${firstIndex}`;
                    else if (errorFields?.description) targetId = `accomplishment-description-${firstIndex}`;
                    else if (errorFields?.category) targetId = `accomplishment-category-${firstIndex}`;

                    if (targetId) {
                        const element = document.getElementById(targetId);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element?.focus();
                    }
                }
            }
        })();
    };

    const handleClickCancel = () => {
        // Reset to original data (strings)
        if (originalData.length > 0) {
            replace(originalData);
            setHasData(true);
        } else {
            form.reset({ accomplishments: [] });
            replace([]);
            setHasData(false);
        }
        setIsEdit(false);
    };

    const handleClickEdit = () => {
        setIsEdit(true);
        if (fields.length === 0) append(INITIAL_ITEM);
    };

    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.CERTIFICATIONS);
    };

    const handleNext = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.SKILLS);
    };

    const handleRefresh = () => {
        loadData(true);
    };

    return (
        <div className="h-full w-full mx-auto bg-white p-3 pb-24 md:pb-3 lg:p-4 flex flex-col justify-between gap-4">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="h-full flex flex-col justify-between gap-4">
                {/* Header */}
                <section className="space-y-3 lg:space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 ">
                        <div className="flex-1">
                            <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-slate-900">
                                Leadership & Accomplishments
                            </h2>
                            <p className="text-slate-500 text-xs lg:text-sm">
                                Highlight awards, volunteering, and other achievements
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
                            <div className="w-full bg-slate-50 rounded-xl flex items-center justify-between p-3 lg:p-4">
                                <div className="flex flex-col items-start justify-start gap-3 lg:gap-4">
                                    <h3 className="text-lg font-medium leading-none tracking-tight">
                                        {`Accomplishment `}
                                    </h3>
                                    <Skeleton className="h-6 w-96 bg-slate-100/90" />
                                </div>
                            </div>
                            {/* Body */}
                            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
                                {/* Title + Category */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-3 lg:space-y-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 lg:h-10 w-full" />
                                    </div>
                                    <div className="space-y-3 lg:space-y-4">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-8 lg:h-10 w-full" />
                                    </div>
                                </div>
                                {/* Description */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-24 w-full" />
                                    <div className="flex justify-end">
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        !hasData && !isEdit ? (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg text-center p-3 lg:p-4 gap-4 min-h-[300px] lg:min-h-[500px] flex flex-col items-center justify-center">
                                <AlertCircle className="h-12 w-12 text-slate-500 mx-auto" />
                                <h3 className="text-lg font-semibold text-slate-900">Oops, seems like your accomplishments are not updated</h3>
                                <p className="text-slate-500 text-sm">Add your key achievements</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <AccomplishmentCard
                                        key={field.id}
                                        form={form}
                                        index={index}
                                        onRemove={() => remove(index)}
                                        canRemove={isEdit}
                                        isReadOnly={!isEdit}
                                    />
                                ))}
                                {isEdit && (
                                    <Button
                                        type="button"
                                        onClick={() => append(INITIAL_ITEM)}
                                        variant="outline"
                                        className="gap-4"
                                        disabled={isSaving}
                                    >
                                        <Plus className="h-4 w-4" /> Add Another
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