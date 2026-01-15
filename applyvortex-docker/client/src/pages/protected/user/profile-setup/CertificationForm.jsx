// src/pages/protected/profile-setup/CertificationForm.jsx
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
    Award,
    RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { cn } from "@/lib/utils";
import { certificationsAPI } from '@/services/api/certificationsAPI.js';
import CertificationCard from '@/features/profile-setup/CertificationCard.jsx';
import isEqual from 'lodash.isequal';

// Schema for a single certification
const certificationSchema = z.object({
    name: z.string().min(2, 'Certification name must be at least 2 characters').max(200, 'Name too long'),
    issuingOrganization: z.string().min(2, 'Organization name is required').max(200, 'Organization name too long'),
    issueDate: z.string().optional().or(z.literal('')),
    expiryDate: z.string().optional().or(z.literal('')),
    doesNotExpire: z.boolean().optional(),
    credentialId: z.string().max(200, 'ID too long').optional().or(z.literal('')),
    credentialUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
}).refine(data => {
    if (data.doesNotExpire) return true;
    // If not lifetime validity, and both dates are present, expiry must be after issue date
    if (data.issueDate && data.expiryDate) {
        return new Date(data.expiryDate) > new Date(data.issueDate);
    }
    return true;
}, {
    message: "Expiry date must be after issue date",
    path: ["expiryDate"],
});

const formSchema = z.object({
    certifications: z.array(certificationSchema).min(0), // Can be empty initially
});

const INITIAL_CERTIFICATION = {
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    doesNotExpire: false,
    credentialId: '',
    credentialUrl: '',
};

// Mock Data
const MOCK_CERTIFICATIONS = [
    {
        name: 'Certified AWS Solutions Architect - Associate',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2023-05',
        expiryDate: '2026-05',
        doesNotExpire: false,
        credentialId: 'AWS-12345678',
        credentialUrl: 'https://aws.amazon.com/verification',
    },
    {
        name: 'Google Project Management Professional',
        issuingOrganization: 'Coursera',
        issueDate: '2022-11',
        expiryDate: '',
        doesNotExpire: true,
        credentialId: 'COURSERA-PM-99',
        credentialUrl: 'https://coursera.org/verify/PM99',
    }
];

export default function CertificationForm() {
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
            certifications: [INITIAL_CERTIFICATION],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'certifications',
    });

    const { isValid } = form.formState;

    const loadCertifications = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const response = await certificationsAPI.getCertifications();
            const data = response?.certifications || response || [];

            if (Array.isArray(data) && data.length > 0) {
                // Map API data to form structure
                const formattedData = data.map(cert => ({
                    name: cert.name || '',
                    issuingOrganization: cert.issuing_organization || '',
                    issueDate: cert.issue_date || '',
                    expiryDate: cert.expiry_date || '',
                    doesNotExpire: cert.does_not_expire || false,
                    credentialId: cert.credential_id || '',
                    credentialUrl: cert.credential_url || '',
                }));

                replace(formattedData);
                setOriginalData(formattedData);
                setHasData(true);
                setIsEdit(false);
            } else {
                // Fallback to Mock Data
                console.log("Using Mock Certification Data");
                replace(MOCK_CERTIFICATIONS);
                setOriginalData(MOCK_CERTIFICATIONS);
                setHasData(true);
                setIsEdit(false);
            }
        } catch (error) {
            console.error("Failed to load certifications:", error);
            if (isRefreshCall) {
                toast({
                    title: 'Refresh Failed',
                    description: 'Failed to refresh certifications data.',
                    variant: 'destructive',
                });
            } else {
                // Fallback on Error
                console.log("Falling back to Mock Certification Data");
                replace(MOCK_CERTIFICATIONS);
                setOriginalData(MOCK_CERTIFICATIONS);
                setHasData(true);
                setIsEdit(false);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [replace, toast]);

    // Fetch Certifications
    useEffect(() => {
        loadCertifications();
    }, [loadCertifications]);

    // Save Handlers
    const onSubmit = async (data) => {
        // 1. Prepare Payload
        const payload = {
            certifications: data.certifications.map(cert => ({
                name: cert.name,
                issuing_organization: cert.issuingOrganization,
                issue_date: cert.issueDate || null,
                expiry_date: cert.doesNotExpire ? null : (cert.expiryDate || null),
                does_not_expire: !!cert.doesNotExpire,
                credential_id: cert.credentialId || null,
                credential_url: cert.credentialUrl || null,
            }))
        };

        // 2. Normalize Original Data for comparison (snake_case)
        const normalizedOriginal = originalData.map(cert => ({
            name: cert.name,
            issuing_organization: cert.issuingOrganization,
            issue_date: cert.issueDate || null,
            expiry_date: cert.doesNotExpire ? null : (cert.expiryDate || null),
            does_not_expire: !!cert.doesNotExpire,
            credential_id: cert.credentialId || null,
            credential_url: cert.credentialUrl || null,
        }));

        // 3. Guard Clause
        if (isEdit && isEqual(payload.certifications, normalizedOriginal)) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            await certificationsAPI.saveCertifications(payload);

            toast({
                title: 'Success!',
                description: 'Certifications saved successfully.',
            });

            // 4. Update state
            setOriginalData(data.certifications);
            setHasData(true);
            setIsEdit(false);

            // Navigate to next step or stay (logic can be adjusted)
            setTimeout(() => navigate(ROUTES.PROFILE_SETUP.PROJECTS), 500);

        } catch (error) {
            console.error("Save error:", error);
            toast({
                title: 'Error',
                description: 'Failed to save certifications.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        form.handleSubmit(onSubmit, (errors) => {
            if (errors.certifications) {
                // Find first error index, sorted numerically
                const errorIndices = Object.keys(errors.certifications).sort((a, b) => Number(a) - Number(b));
                if (errorIndices.length > 0) {
                    const firstIndex = errorIndices[0];
                    const errorFields = errors.certifications[firstIndex];

                    // Prioritize Name then Issuing Organization
                    let targetId = '';
                    if (errorFields.name) targetId = `certification-name-${firstIndex}`;
                    else if (errorFields.issuingOrganization) targetId = `certification-issuer-${firstIndex}`;

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
        if (hasData) {
            replace(originalData);
            setIsEdit(false);
        } else {
            // If fetching failed or no data was there, maybe reset to empty or initial
            setIsEdit(false);
            form.reset();
        }
    };

    const handleClickEdit = () => {
        setIsEdit(true);
    };

    const handleAddCertification = () => {
        append(INITIAL_CERTIFICATION);
        setIsEdit(true); // Ensure we are in edit mode when adding
    };

    const handleNext = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.ACCOMPLISHMENTS);
    };
    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.RESEARCH);
    };


    const handleRefresh = () => {
        loadCertifications(true);
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="w-full mx-auto bg-white space-y-4 p-4">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-row items-center justify-between">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Certifications
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Add your licenses and professional certifications
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isLoading || isSaving || isRefreshing}
                        className="gap-4"
                    >
                        <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
                        {isLoading ? "Loading..." : isRefreshing ? 'Refreshing...' : isSaving ? 'Saving...' : 'Refresh Intel'}
                    </Button>
                </div>

                {isLoading || isRefreshing ? (
                    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
                        {/* Header skeleton */}
                        <div className="w-full bg-slate-50 rounded-xl flex items-center justify-between p-4">
                            <div className="flex flex-col items-start justify-start gap-4">
                                <h3 className="text-lg font-medium leading-none tracking-tight">
                                    {`Certification`}
                                </h3>
                                <Skeleton className="h-6 w-96 bg-slate-100/90" />

                            </div>
                        </div>
                        {/* Body skeleton */}
                        <div className="p-4 space-y-4">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-44" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    !hasData && !isEdit ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg text-center p-4">
                            <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                Oops, seems like your certifications are not updated
                            </h3>
                            <p className="text-slate-500 text-sm mb-4">
                                Showcase your professional achievements
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <CertificationCard
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
                                    onClick={handleAddCertification}
                                    disabled={isSaving}
                                    variant="outline"
                                    className="gap-4"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Certification
                                </Button>
                            )}
                        </div>
                    )
                )}
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                <Button
                    type="button"
                    onClick={handlePrevious}
                    disabled={isSaving}
                    variant="outline"
                    className="gap-4"
                >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Previous
                </Button>

                <div className="flex items-center gap-4">
                    {isEdit ? (
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                onClick={handleClickCancel}
                                disabled={isSaving}
                                variant="outline"
                                className="gap-4"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={isSaving}
                                variant="primary"
                                className="gap-4"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
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
                                disabled={isSaving || isEdit}
                                variant={`${isLoading ? "disabled" : "primary"}`}
                                className="gap-4"
                            >
                                {isLoading || hasData ? (
                                    <>
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Add
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                disabled={isSaving}
                                onClick={handleNext}
                                variant="outline"
                                className="gap-4"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
}
