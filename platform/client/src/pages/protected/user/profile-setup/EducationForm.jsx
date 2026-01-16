import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast.js';
import { ROUTES } from '@/routes/routes.js';
import {
    GraduationCap,
    ArrowLeft,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Plus,
    Edit3,
    Save,
    X,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { educationAPI } from '@/services/api/educationAPI.js';
import EducationCard from '@/features/profile-setup/EducationCard.jsx';
import { Button } from "@/components/ui/Button";
import isEqual from 'lodash.isequal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { is, tr } from 'zod/v4/locales';

const DEGREE_TYPE_MAPPING = {
    'diploma': 4,           // EducationLevel.DIPLOMA
    'undergraduate': 5,     // EducationLevel.UNDERGRADUATE
    'bachelors': 5,         // EducationLevel.UNDERGRADUATE
    'postgraduate': 6,      // EducationLevel.GRADUATE
    'masters': 6,           // EducationLevel.GRADUATE
    'doctorate': 7,         // EducationLevel.DOCTORAL
    'phd': 7,               // EducationLevel.DOCTORAL
    'certificate': 9,       // EducationLevel.CERTIFICATION
    'certification': 9      // EducationLevel.CERTIFICATION
};

const DEGREE_TYPE_REVERSE_MAPPING = {
    4: 'diploma',
    5: 'bachelors',
    6: 'masters',
    7: 'phd',
    9: 'certification'
};

const GRADE_SYSTEM_MAPPING = {
    'percentage': 1,  // GradeType.PERCENTAGE
    'cgpa': 2,        // GradeType.CGPA
    'gpa': 3,         // GradeType.GPA
    'grade': 4        // GradeType.GRADE
};

const GRADE_SYSTEM_REVERSE_MAPPING = {
    1: 'Percentage',
    2: 'CGPA',
    3: 'GPA',
    4: 'Grade'
};

const EDUCATION_STATUS_MAP = {
    'completed': 1,
    'in-progress': 2,
    'on-hold': 3,
    'dropped-out': 4
};

const EDUCATION_STATUS_REVERSE_MAP = {
    1: 'completed',
    2: 'in-progress',
    3: 'on-hold',
    4: 'dropped-out'
};

const singleEducationSchema = z.object({
    institution: z.string().min(2, 'Institution name must be at least 2 characters').max(150),
    universityName: z.string().optional().or(z.literal('')),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().min(2, 'Country is required'),

    degreeType: z.string().min(1, 'Degree type is required'),
    degreeName: z.string().min(2, 'Degree name is required').max(100),
    fieldOfStudy: z.string().min(2, 'Field of study required').max(100),

    startDate: z.string().min(7, 'Start date is required').regex(/^(\d{4}-\d{2})$/, 'Format YYYY-MM'),
    endDate: z.string().regex(/^(\d{4}-\d{2})$/, 'Format YYYY-MM').optional().or(z.literal('')),
    isCurrent: z.boolean().optional(),

    status: z.string().min(1, 'Status is required'),

    grade: z.string().optional().or(z.literal('')),
    gradeSystem: z.string().optional().or(z.literal('')),

    description: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
    relevantCoursework: z.string().optional().or(z.literal('')),

    thesisTitle: z.string().optional().or(z.literal('')),
    thesisDescription: z.string().optional().or(z.literal('')),
    researchAreas: z.string().optional().or(z.literal('')),
    publications: z.string().optional().or(z.literal('')),

    activities: z.string().optional().or(z.literal('')),
    societies: z.string().optional().or(z.literal('')),

    honorsAwards: z.string().optional().or(z.literal('')),
    achievements: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
}).refine(
    (data) => {
        const hasEndDate = data.endDate && data.endDate.trim() !== '';
        const isCurrent = data.isCurrent === true;
        // Logic: if not current, end date is usually required unless status is dropped out or on hold? 
        // For now enforcing same rule: Provide End Date OR Check Currently Studying.
        return (hasEndDate && !isCurrent) || (!hasEndDate && isCurrent) || (!hasEndDate && !isCurrent);
        // Allowing both empty if status implies it? Actually let's stick to strict:
        // If isCurrent is true -> endDate empty.
        // If isCurrent is false -> endDate required?
        // Let's keep it flexible: If isCurrent, endDate must be empty. If not isCurrent, endDate *matches logic*?
        // The previous logic was: return (hasEndDate && !isCurrent) || (!hasEndDate && isCurrent);
        // This enforces that if you are not currently studying, you MUST have an end date.
    },
    {
        message: 'Either provide an end date OR check "Currently Studying"',
        path: ['endDate'],
    }
);

const educationSchema = z.object({
    education: z.array(singleEducationSchema),
}).refine(
    (data) => {
        const currentEducations = data.education.filter(edu => edu.isCurrent === true);
        return currentEducations.length <= 1;
    },
    {
        message: 'Only one education can be marked as "Currently Studying"',
        path: ['education'],
    }
);

const INITIAL_EDUCATION = {
    institution: '',
    universityName: '',
    city: '',
    state: '',
    country: '',
    degreeType: '',
    degreeName: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    status: 'completed',
    grade: '',
    gradeSystem: '',
    description: '',
    relevantCoursework: '',
    thesisTitle: '',
    thesisDescription: '',
    researchAreas: '',
    publications: '',
    activities: '',
    societies: '',
    honorsAwards: '',
    achievements: '',
};

export default function EducationForm() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [educationComplete, setEducationComplete] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [hasData, setHasData] = useState(false);

    const form = useForm({
        resolver: zodResolver(educationSchema),
        mode: 'onChange',
        defaultValues: {
            education: [INITIAL_EDUCATION],
        },
    });

    const { fields: educationFields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'education',
    });

    const fetchData = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const response = await educationAPI.getEducation();
            console.log("Raw API response:", response);

            const data = response?.data || response;

            if (data?.educations && Array.isArray(data.educations) && data.educations.length > 0) {
                const formData = data.educations.map(edu => {
                    const pad = (n) => String(n).padStart(2, '0');
                    const startStr = (edu.start_year && edu.start_month)
                        ? `${edu.start_year}-${pad(edu.start_month)}`
                        : (edu.startDate || '');
                    const endStr = (edu.end_year && edu.end_month)
                        ? `${edu.end_year}-${pad(edu.end_month)}`
                        : (edu.endDate || '');

                    const degreeVal = DEGREE_TYPE_REVERSE_MAPPING[edu.degree_type] || '';

                    const gradeSys = GRADE_SYSTEM_REVERSE_MAPPING[edu.grade_type] || '';

                    // Map Text Lists (Arrays -> Newline Strings)
                    const mapList = (list) => Array.isArray(list) ? list.join('\n') : (list || '');

                    return {
                        institution: edu.institution_name || '',
                        universityName: edu.university_name || '',
                        city: edu.city || '',
                        state: edu.state || '',
                        country: edu.country || '',

                        degreeType: degreeVal,
                        degreeName: edu.degree_name || '',
                        fieldOfStudy: edu.field_of_study || '',

                        startDate: startStr,
                        endDate: endStr,
                        isCurrent: !!edu.is_current,
                        status: EDUCATION_STATUS_REVERSE_MAP[edu.status] || 'completed',

                        grade: edu.grade_value || '',
                        gradeSystem: gradeSys,

                        description: edu.description || '',
                        relevantCoursework: mapList(edu.relevant_coursework),

                        thesisTitle: edu.thesis_title || '',
                        thesisDescription: edu.thesis_description || '',
                        researchAreas: mapList(edu.research_areas),
                        publications: mapList(edu.publications),

                        activities: mapList(edu.activities),
                        societies: mapList(edu.societies),

                        honorsAwards: mapList(edu.honors_awards),
                        achievements: edu.achievements || '',
                    };
                });

                form.reset({ education: formData });
                setOriginalData(formData);
                setHasData(true);
                setIsEdit(false);
            } else {
                setHasData(false);
                setIsEdit(false);
            }
        } catch (error) {
            console.error('Failed to fetch education:', error);
            if (isRefreshCall) {
                toast({
                    title: 'Refresh Failed',
                    description: 'Failed to refresh education data.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load education data. Starting fresh.',
                    variant: 'destructive',
                });
            }
            setHasData(false);
            setIsEdit(false);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [form, toast, replace]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const subscription = form.watch((value) => {
            const educationErrors = form.formState.errors?.education;
            const hasValidEducation =
                !educationErrors &&
                value.education?.length > 0 &&
                value.education.every(
                    (edu) =>
                        edu.degreeType &&
                        edu.fieldOfStudy &&
                        edu.institution &&
                        edu.country &&
                        edu.startDate
                );
            setEducationComplete(hasValidEducation);
        });
        return () => subscription.unsubscribe();
    }, [form]);

    const onError = (errors) => {
        console.error("Form Validation Errors:", errors);
        if (errors.education && typeof errors.education.message === 'string') {
            toast({
                title: 'Validation Error',
                description: errors.education.message,
                variant: 'destructive',
            });
        } else if (errors.education && Array.isArray(errors.education)) {
            const firstErrorIndex = errors.education.findIndex(edu => edu !== undefined);
            if (firstErrorIndex !== -1) {
                toast({
                    title: 'Validation Error',
                    description: 'Please fix the errors in your education entries.',
                    variant: 'destructive',
                });
            }
        } else {
            toast({
                title: 'Validation Error',
                description: 'Please fix the errors highlighted in the form.',
                variant: 'destructive',
            });
        }
    };

    const preparePayload = (educations) => {
        return educations.map(edu => {
            const [startYear, startMonth] = (edu.startDate || '').split('-');
            const [endYear, endMonth] = (edu.endDate || '').split('-');

            // Map frontend degree type string to backend integer
            const degreeTypeInt = DEGREE_TYPE_MAPPING[edu.degreeType] || 5; // Default to UNDERGRADUATE

            // Helper to split newline string to array
            const toList = (str) => str ? str.split('\n').filter(s => s.trim() !== '') : [];

            return {
                institution_name: edu.institution,
                university_name: edu.universityName || null,

                city: edu.city || null,
                state: edu.state || null,
                country: edu.country || 'India',

                degree_type: degreeTypeInt,
                degree_name: edu.degreeName,
                field_of_study: edu.fieldOfStudy,

                start_month: startMonth ? parseInt(startMonth) : undefined,
                start_year: startYear ? parseInt(startYear) : undefined,
                end_month: endMonth ? parseInt(endMonth) : undefined,
                end_year: endYear ? parseInt(endYear) : undefined,
                is_current: !!edu.isCurrent,
                status: EDUCATION_STATUS_MAP[edu.status] || 1, // Default Completed

                grade_value: edu.grade || null,
                grade_type: edu.gradeSystem ? GRADE_SYSTEM_MAPPING[edu.gradeSystem.toLowerCase()] : null,

                description: edu.description || null,
                achievements: edu.achievements || null,

                relevant_coursework: toList(edu.relevantCoursework),
                honors_awards: toList(edu.honorsAwards),
                research_areas: toList(edu.researchAreas),
                publications: toList(edu.publications),
                activities: toList(edu.activities),
                societies: toList(edu.societies),

                thesis_title: edu.thesisTitle || null,
                thesis_description: edu.thesisDescription || null,

                display_order: 0
            };
        });
    };

    const onSubmit = async (data) => {
        const apiPayload = preparePayload(data.education);

        let shouldSave = true;
        if (originalData && isEdit) {
            const originalPayload = preparePayload(originalData); // Normalize original data through same transformer
            if (isEqual(apiPayload, originalPayload)) {
                shouldSave = false;
            }
        }

        if (isEdit && !shouldSave) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            await educationAPI.saveEducation({ educations: apiPayload });
            toast({
                title: '✨ Success!',
                description: 'Education saved successfully.',
            });
            setOriginalData(data.education);
            setHasData(true);
            setIsEdit(false);
            // Optional: navigate if flow requires
            // setTimeout(() => { navigate(ROUTES.PROFILE_SETUP.CERTIFICATIONS); }, 500);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save education.',
                variant: 'destructive',
            });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.PERSONAL); // Or whatever previous route is
    };

    const handleNext = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.EXPERIENCE); // Or next route
    };

    const handleAddEducation = () => {
        append(INITIAL_EDUCATION);
    };

    const handleCurrentlyStudyingChange = (currentIndex, isChecked) => {
        if (isChecked) {
            const educationValues = form.getValues('education');
            const alreadyCurrentIndex = educationValues.findIndex((edu, idx) =>
                idx !== currentIndex && edu.isCurrent === true
            );

            if (alreadyCurrentIndex !== -1) {
                toast({
                    title: 'Already Selected',
                    description: `Education #${alreadyCurrentIndex + 1} is already marked as "Currently Studying".`,
                    variant: 'destructive',
                });
                return false;
            }
        }
        return true;
    };

    const handleClickEdit = () => setIsEdit(true);

    const handleClickCancel = () => {
        if (originalData) {
            replace(originalData);
        }
        setIsEdit(false);
    };

    const handleRefresh = () => {
        fetchData(true);
    };

    return (
        <div className="h-full w-full mx-auto bg-white space-y-3 lg:space-y-4 p-3 pb-24 md:pb-3 lg:p-8">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="h-full flex flex-col justify-between gap-4">
                <section className="space-y-3 lg:space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                        <div className="flex-1">
                            <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-slate-900">Your Educations</h2>
                            <p className="text-slate-500 text-xs lg:text-sm">
                                Add all your degrees and certifications (UG, PG, Ph.D., etc.)
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
                            <div className="bg-slate-50 flex items-center justify-between p-4">
                                <h3 className="text-lg font-medium leading-none tracking-tight text-slate-500">Education</h3>
                            </div>

                            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
                                {/* Row 1: Degree Type + Degree Name */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Field of Study */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-8 lg:h-10 w-full" />
                                </div>

                                {/* Institution + University */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Country */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 lg:h-10 w-full" />
                                </div>

                                {/* Start Date + End Date + Currently Studying */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                    <div className="flex items-end">
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-3 lg:space-y-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 lg:h-10 w-full" />
                                    </div>
                                </div>

                                {/* Grade + Grade System */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-8 lg:h-10 w-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-24 w-full" />
                                </div>

                                {/* Relevant Coursework */}
                                <div className="space-y-3 lg:space-y-4">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-24 w-full" />
                                </div>

                            </div>
                        </div>

                    ) : (!hasData && !isEdit) ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg text-center p-3 lg:p-4 gap-4 min-h-[300px] lg:min-h-[500px] flex flex-col items-center justify-center">
                            <AlertCircle className="h-12 w-12 text-slate-500 mx-auto" />
                            <h3 className="text-lg font-semibold text-slate-900 ">Oops, seems like your education details are not updated</h3>
                            <p className="text-slate-500 text-sm">Add your education history.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {educationFields.map((field, index) => (
                                <EducationCard
                                    key={field.id}
                                    form={form}
                                    index={index}
                                    onRemove={() => remove(index)}
                                    onCurrentlyStudyingChange={handleCurrentlyStudyingChange}
                                    canRemove={isEdit}
                                    isReadOnly={!isEdit}
                                />
                            ))}
                            {isEdit && (
                                <Button
                                    type="button"
                                    onClick={handleAddEducation}
                                    disabled={isSaving}
                                    variant="outline"
                                    className="gap-4"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Education
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
    );
}


