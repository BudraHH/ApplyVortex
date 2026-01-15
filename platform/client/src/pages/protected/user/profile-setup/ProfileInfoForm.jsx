// src/pages/protected/profile-setup/ProfileInfoForm.jsx
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toTitleCase, cn } from '@/lib/utils';
import { ROUTES } from '@/routes/routes.js';
import {
    ArrowRight,
    User,
    Loader2,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    AlertCircle,
    CheckCircle2,
    Edit3,
    Github,
    Linkedin,
    AlertTriangle,
    LinkIcon,
    ChevronDown,
    Building2,
    Globe2,
    Navigation,
    Code2,
    Banknote,
    Clock,
    FileText,
    Languages,
    Plus,
    Trash2,
    Save,
    X, ArrowLeft,
    RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState, memo } from 'react';
import { useToast } from '@/hooks/use-toast.js';
import profileAPI from '@/services/api/profileAPI.js';
import locationAPI from '@/services/api/locationAPI.js';
import { Input } from '@/components/ui/Input.jsx';
import { Label } from '@/components/ui/Label.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import ISO6391 from 'iso-639-1';
import isEqual from 'lodash.isequal';
const COUNTRY_CODES = [
    { code: "1", country: "US/CA" },
    { code: "44", country: "UK" },
    { code: "91", country: "IN" },
    { code: "61", country: "AU" },
    { code: "49", country: "DE" },
    { code: "33", country: "FR" },
    { code: "81", country: "JP" },
];
import {
    Gender,
    JobSearchStatus,
    WorkMode,
    LanguageProficiency,
    LanguageAbility,
    Availability
} from '@/constants/constants';

const LANGUAGE_OPTIONS = ISO6391.getAllCodes()
    .map(code => ({ code, name: ISO6391.getName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));

// Validation Schema
const personalSchema = z.object({
    firstName: z.string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s.-]+$/, 'First name should only contain letters, spaces, dots or hyphens'),
    middleName: z.string()
        .max(50, 'Middle name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s.-]*$/, 'Middle name should only contain letters, spaces, dots or hyphens')
        .optional()
        .or(z.literal('')),
    lastName: z.string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s.-]+$/, 'Last name should only contain letters, spaces, dots or hyphens'),
    gender: z.number({
        errorMap: () => ({ message: 'Please select your gender' })
    }),
    email: z.string()
        .email('Please enter a valid email address')
        .toLowerCase(),
    phone: z.string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must not exceed 20 digits')
        .regex(/^[+]?[\d\s\-().]+$/, 'Please enter a valid phone number'),
    alternatePhone: z.string()
        .regex(/^[+]?[\d\s-()]*$/, 'Please enter a valid phone number')
        .optional()
        .or(z.literal('')),
    address: z.string()
        .min(5, 'Address is required')
        .max(200, 'Address is too long'),
    city: z.string()
        .min(2, 'City is required')
        .max(50, 'City name is too long'),
    state: z.string()
        .min(2, 'State name is required')
        .max(50, 'State name is too long'),
    country: z.string()
        .min(2, 'Country is required')
        .max(50, 'Country name is too long'),
    postalCode: z.string()
        .min(4, 'Postal code is required')
        .max(10, 'Postal code is too long'),
    // Permanent Address
    permanentAddress: z.string().max(300, 'Address is too long').optional().or(z.literal('')),
    permanentCity: z.string().max(50, 'City is too long').optional().or(z.literal('')),
    permanentState: z.string().max(50, 'State is too long').optional().or(z.literal('')),
    permanentCountry: z.string().max(50, 'Country is too long').optional().or(z.literal('')),
    permanentPostalCode: z.string().max(20, 'Postal Code is too long').optional().or(z.literal('')),
    willingToRelocate: z.boolean().optional().default(false),
    status: z.number({
        errorMap: () => ({ message: 'Please select your job search status' })
    }),
    github: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    linkedin: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    leetcode: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    naukri: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    portfolio: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    stackoverflow: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    medium: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    personalWebsite: z.string().trim().regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL').optional().or(z.literal('')).or(z.null()),
    // Professional Overview fields
    headline: z.string().max(200, 'Headline must not exceed 200 characters').optional().or(z.literal('')),
    professional_summary: z.string().max(500, 'Summary must not exceed 500 characters').optional().or(z.literal('')),
    current_role: z.string().max(200, 'Role must not exceed 200 characters').optional().or(z.literal('')),
    current_company: z.string().max(200, 'Company name must not exceed 200 characters').optional().or(z.literal('')),
    years_of_experience: z.preprocess((val) => (val === '' || val === null || isNaN(val) ? 0 : val), z.number().min(0).max(50).optional()),
    availability: z.coerce.number().optional().or(z.literal('')),
    notice_period_days: z.preprocess((val) => (val === '' || val === null || isNaN(val) ? 0 : val), z.number().min(0).optional()),
    preferred_job_type: z.coerce.number().optional().or(z.literal('')),
    salary_currency: z.string().optional().or(z.literal('')),
    expected_salary_min: z.preprocess((val) => (val === '' || val === null || isNaN(val) ? 0 : val), z.number().min(0).optional()),
    expected_salary_max: z.preprocess((val) => (val === '' || val === null || isNaN(val) ? 0 : val), z.number().min(0).optional()),
    // Languages
    languages: z.array(z.object({
        id: z.any().optional(),
        name: z.string().min(1, 'Language name required'),
        proficiency: z.number(),
        ability: z.number()
    })).optional().default([]),
});

const GENDER_OPTIONS = [
    { value: Gender.MALE, label: 'Male' },
    { value: Gender.FEMALE, label: 'Female' },
    { value: Gender.OTHER, label: 'Other' },
    { value: Gender.PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

const JOB_TYPE_OPTIONS = [
    { value: WorkMode.REMOTE, label: 'Remote' },
    { value: WorkMode.HYBRID, label: 'Hybrid' },
    { value: WorkMode.ONSITE, label: 'On-site' },
];

const STATUS_OPTIONS = [
    { value: JobSearchStatus.ACTIVELY_LOOKING, label: 'Actively Looking' },
    { value: JobSearchStatus.OPEN_TO_OFFERS, label: 'Casually Searching' },
    { value: JobSearchStatus.NOT_LOOKING, label: 'Not Available' },
];

const LANGUAGE_PROFICIENCY_OPTIONS = [
    { value: LanguageProficiency.NATIVE, label: 'Native' },
    { value: LanguageProficiency.FLUENT, label: 'Fluent' },
    { value: LanguageProficiency.PROFESSIONAL, label: 'Professional' },
    { value: LanguageProficiency.INTERMEDIATE, label: 'Intermediate' },
    { value: LanguageProficiency.BASIC, label: 'Basic' },
];

const LANGUAGE_ABILITY_OPTIONS = [
    { value: LanguageAbility.READ_WRITE, label: 'Read & Write' },
    { value: LanguageAbility.SPOKEN, label: 'Spoken' },
    { value: LanguageAbility.BOTH, label: 'Both' },
];

const AVAILABILITY_OPTIONS = [
    { value: Availability.IMMEDIATE, label: 'Immediate' },
    { value: Availability.WITHIN_2_WEEKS, label: 'Within 2 Weeks' },
    { value: Availability.WITHIN_1_MONTH, label: 'Within 1 Month' },
    { value: Availability.WITHIN_2_MONTHS, label: 'Within 2 Months' },
    { value: Availability.SERVING_NOTICE, label: 'Serving Notice' },
];

const BasicDetailsSection = memo(({ form, isEdit, isLoading, isRefreshing, toTitleCase }) => {
    if (isLoading || isRefreshing) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 p-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 animate-in slide-in-from-top-2 duration-200 p-4 gap-4">
            <div className="space-y-4">
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input {...form.register('firstName')} disabled={!isEdit} placeholder="First Name" error={form.formState.errors.firstName} onChange={(e) => {
                    const val = toTitleCase(e.target.value);
                    e.target.value = val;
                    form.register('firstName').onChange(e);
                }} />
                {form.formState.errors.firstName && <p className="text-xs text-red-500 mt-4">{form.formState.errors.firstName.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Middle Name</Label>
                <Input {...form.register('middleName')} disabled={!isEdit} placeholder="Optional" error={form.formState.errors.middleName} onChange={(e) => {
                    const val = toTitleCase(e.target.value);
                    e.target.value = val;
                    form.register('middleName').onChange(e);
                }} />
                {form.formState.errors.middleName && <p className="text-xs text-red-500 mt-4">{form.formState.errors.middleName.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input {...form.register('lastName')} disabled={!isEdit} placeholder="Last Name" error={form.formState.errors.lastName} onChange={(e) => {
                    const val = toTitleCase(e.target.value);
                    e.target.value = val;
                    form.register('lastName').onChange(e);
                }} />
                {form.formState.errors.lastName && <p className="text-xs text-red-500 mt-4">{form.formState.errors.lastName.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Gender <span className="text-red-500">*</span></Label>
                <Controller name="gender" control={form.control} render={({ field }) => (
                    <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)} disabled={!isEdit}>
                        <SelectTrigger className={form.formState.errors.gender ? "border-red-500" : ""}><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>{GENDER_OPTIONS.map(opt => (<SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>))}</SelectContent>
                    </Select>
                )} />
                {form.formState.errors.gender && <p className="text-xs text-red-500 mt-4">{form.formState.errors.gender.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input {...form.register('email')} disabled />
                {form.formState.errors.email && <p className="text-xs text-red-500 mt-4">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Phone <span className="text-red-500">*</span></Label>
                <div className="flex gap-4">
                    <Controller name="phoneCode" control={form.control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isEdit}>
                            <SelectTrigger className="w-[100px]"><SelectValue placeholder="Code" /></SelectTrigger>
                            <SelectContent>{COUNTRY_CODES.map((item) => (<SelectItem key={item.code} value={item.code}>+{item.code} ({item.country})</SelectItem>))}</SelectContent>
                        </Select>
                    )} />
                    <Input {...form.register('phone')} disabled={!isEdit} placeholder="Phone Number" className="flex-1" error={form.formState.errors.phone} />
                </div>
                {form.formState.errors.phone && <p className="text-xs text-red-500 mt-4">{form.formState.errors.phone.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Alternate Phone</Label>
                <div className="flex gap-4">
                    <Controller name="alternatePhoneCode" control={form.control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isEdit}>
                            <SelectTrigger className="w-[100px]"><SelectValue placeholder="Code" /></SelectTrigger>
                            <SelectContent>{COUNTRY_CODES.map((item) => (<SelectItem key={item.code} value={item.code}>+{item.code} ({item.country})</SelectItem>))}</SelectContent>
                        </Select>
                    )} />
                    <Input {...form.register('alternatePhone')} disabled={!isEdit} placeholder="Alternate Phone" className="flex-1" error={form.formState.errors.alternatePhone} />
                </div>
                {form.formState.errors.alternatePhone && <p className="text-xs text-red-500 mt-4">{form.formState.errors.alternatePhone.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-4">
                <Label>Search Status <span className="text-red-500">*</span></Label>
                <Controller name="status" control={form.control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!isEdit}>
                        <SelectTrigger className={form.formState.errors.status ? "border-red-500" : ""}><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                    </Select>
                )} />
                {form.formState.errors.status && <p className="text-xs text-red-500 mt-4">{form.formState.errors.status.message}</p>}
            </div>
        </div>
    );
});

const LocationSection = memo(({ form, isEdit, countries, currentStates, currentCities, permStates, permCities, watchedCountry, watchedState, watchedPermCountry, watchedPermState }) => (
    <div className="animate-in slide-in-from-top-2 duration-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-4">
                <Label>Current Address <span className="text-red-500">*</span></Label>
                <Input {...form.register('address')} disabled={!isEdit} placeholder="House/Flat No, Street, Area" error={form.formState.errors.address} />
                {form.formState.errors.address && <p className="text-xs text-red-500 mt-4">{form.formState.errors.address.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Country <span className="text-red-500">*</span></Label>
                <Controller name="country" control={form.control} render={({ field }) => (
                    <Select onValueChange={(val) => { field.onChange(val); form.setValue('state', ''); form.setValue('city', ''); }} defaultValue={field.value} value={field.value} disabled={!isEdit}>
                        <SelectTrigger className={form.formState.errors.country ? "border-red-500" : ""}><SelectValue placeholder="Select Country" /></SelectTrigger>
                        <SelectContent>{countries.map(country => (<SelectItem key={country.id} value={country.iso2}>{country.name}</SelectItem>))}</SelectContent>
                    </Select>
                )} />
                {form.formState.errors.country && <p className="text-xs text-red-500 mt-4">{form.formState.errors.country.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>State <span className="text-red-500">*</span></Label>
                <Controller name="state" control={form.control} render={({ field }) => (
                    <Select onValueChange={(val) => { field.onChange(val); form.setValue('city', ''); }} defaultValue={field.value} value={field.value} disabled={!isEdit || !watchedCountry}>
                        <SelectTrigger className={form.formState.errors.state ? "border-red-500" : ""}><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>{currentStates.map(state => (<SelectItem key={state.id} value={state.name}>{state.name}</SelectItem>))}</SelectContent>
                    </Select>
                )} />
                {form.formState.errors.state && <p className="text-xs text-red-500 mt-4">{form.formState.errors.state.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>City <span className="text-red-500">*</span></Label>
                <Controller name="city" control={form.control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!isEdit || !watchedState}>
                        <SelectTrigger className={form.formState.errors.city ? "border-red-500" : ""}><SelectValue placeholder="Select City" /></SelectTrigger>
                        <SelectContent>{currentCities.map(city => (<SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>))}</SelectContent>
                    </Select>
                )} />
                {form.formState.errors.city && <p className="text-xs text-red-500 mt-4">{form.formState.errors.city.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Postal Code <span className="text-red-500">*</span></Label>
                <Input {...form.register('postalCode')} disabled={!isEdit} error={form.formState.errors.postalCode} />
                {form.formState.errors.postalCode && <p className="text-xs text-red-500 mt-4">{form.formState.errors.postalCode.message}</p>}
            </div>
        </div>
        <div className="border-t border-slate-200 space-y-4 pt-4">
            <h4 className="font-semibold text-slate-900">Permanent Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-4">
                    <Label>Permanent Address</Label>
                    <Input {...form.register('permanentAddress')} disabled={!isEdit} error={form.formState.errors.permanentAddress} />
                    {form.formState.errors.permanentAddress && <p className="text-xs text-red-500 mt-4">{form.formState.errors.permanentAddress.message}</p>}
                </div>
                <div className="space-y-4">
                    <Label>Country </Label>
                    <Controller name="permanentCountry" control={form.control} render={({ field }) => (
                        <Select onValueChange={(val) => { field.onChange(val); form.setValue('permanentState', ''); form.setValue('permanentCity', ''); }} defaultValue={field.value} value={field.value} disabled={!isEdit}>
                            <SelectTrigger className={form.formState.errors.permanentCountry ? "border-red-500" : ""}><SelectValue placeholder="Select Country" /></SelectTrigger>
                            <SelectContent>{countries.map(country => (<SelectItem key={country.id} value={country.iso2}>{country.name}</SelectItem>))}</SelectContent>
                        </Select>
                    )} />
                    {form.formState.errors.permanentCountry && <p className="text-xs text-red-500 mt-4">{form.formState.errors.permanentCountry.message}</p>}
                </div>
                <div className="space-y-4">
                    <Label>State </Label>
                    <Controller name="permanentState" control={form.control} render={({ field }) => (
                        <Select onValueChange={(val) => { field.onChange(val); form.setValue('permanentCity', ''); }} defaultValue={field.value} value={field.value} disabled={!isEdit || !watchedPermCountry}>
                            <SelectTrigger className={form.formState.errors.permanentState ? "border-red-500" : ""}><SelectValue placeholder="Select State" /></SelectTrigger>
                            <SelectContent>{permStates.map(state => (<SelectItem key={state.id} value={state.name}>{state.name}</SelectItem>))}</SelectContent>
                        </Select>
                    )} />
                    {form.formState.errors.permanentState && <p className="text-xs text-red-500 mt-4">{form.formState.errors.permanentState.message}</p>}
                </div>
                <div className="space-y-4">
                    <Label>City </Label>
                    <Controller name="permanentCity" control={form.control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!isEdit || !watchedPermState}>
                            <SelectTrigger className={form.formState.errors.permanentCity ? "border-red-500" : ""}><SelectValue placeholder="Select City" /></SelectTrigger>
                            <SelectContent>{permCities.map(city => (<SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>))}</SelectContent>
                        </Select>
                    )} />
                    {form.formState.errors.permanentCity && <p className="text-xs text-red-500 mt-4">{form.formState.errors.permanentCity.message}</p>}
                </div>
                <div className="space-y-4">
                    <Label>Postal Code </Label>
                    <Input {...form.register('permanentPostalCode')} disabled={!isEdit} error={form.formState.errors.permanentPostalCode} />
                    {form.formState.errors.permanentPostalCode && <p className="text-xs text-red-500 mt-4">{form.formState.errors.permanentPostalCode.message}</p>}
                </div>
            </div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 flex items-center p-4 gap-4">
            <input type="checkbox" id="relocate" {...form.register('willingToRelocate')} disabled={!isEdit} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            <Label htmlFor="relocate" className="cursor-pointer">I am willing to relocate for the right opportunity</Label>
        </div>
    </div>
));

const LinksSection = memo(({ form, isEdit }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 animate-in slide-in-from-top-2 duration-200 p-4 gap-4">
        {[
            { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
            { id: 'github', label: 'GitHub', icon: Github },
            { id: 'portfolio', label: 'Portfolio', icon: Globe2 },
            { id: 'leetcode', label: 'LeetCode', icon: Code2 },
            { id: 'naukri', label: 'Naukri Profile', icon: Navigation },
            { id: 'stackoverflow', label: 'StackOverflow', icon: Code2 },
            { id: 'medium', label: 'Medium', icon: FileText },
            { id: 'personalWebsite', label: 'Other Website', icon: Globe2 }
        ].map(link => (
            <div key={link.id} className="space-y-4">
                <Label className="flex items-center gap-4">
                    <link.icon className="h-4 w-4 text-slate-500" />
                    {link.label}
                </Label>
                <Input
                    {...form.register(link.id)}
                    placeholder="https://..."
                    disabled={!isEdit}
                    className={form.formState.errors[link.id] ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {form.formState.errors[link.id] && (
                    <p className="text-xs text-red-500 mt-4">{form.formState.errors[link.id].message}</p>
                )}
            </div>
        ))}
    </div>
));

const ProfessionalSection = memo(({ form, isEdit, languageFields, appendLanguage, removeLanguage }) => (
    <div className="animate-in slide-in-from-top-2 duration-200 p-4 space-y-4">
        <div className="space-y-4">
            <div className="space-y-4">
                <Label>Headline</Label>
                <Input {...form.register('headline')} placeholder="e.g. Senior Full Stack Engineer with 5+ years of experience" disabled={!isEdit} />
                {form.formState.errors.headline && <p className="text-xs text-red-500 mt-4">{form.formState.errors.headline.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Professional Summary</Label>
                <Textarea {...form.register('professional_summary')} placeholder="Describe your career highlights and expertise..." rows={4} disabled={!isEdit} />
                {form.formState.errors.professional_summary && <p className="text-xs text-red-500 mt-4">{form.formState.errors.professional_summary.message}</p>}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <Label>Current Role</Label>
                <Input {...form.register('current_role')} disabled={!isEdit} />
                {form.formState.errors.current_role && <p className="text-xs text-red-500 mt-4">{form.formState.errors.current_role.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Current Company</Label>
                <Input {...form.register('current_company')} disabled={!isEdit} />
                {form.formState.errors.current_company && <p className="text-xs text-red-500 mt-4">{form.formState.errors.current_company.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Years of Experience (Only of full-time roles)</Label>
                <Input type="number" {...form.register('years_of_experience', { valueAsNumber: true })} disabled={!isEdit} />
                {form.formState.errors.years_of_experience && <p className="text-xs text-red-500 mt-4">{form.formState.errors.years_of_experience.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Notice Period (Days)</Label>
                <Input type="number" {...form.register('notice_period_days', { valueAsNumber: true })} disabled={!isEdit} />
                {form.formState.errors.notice_period_days && <p className="text-xs text-red-500 mt-4">{form.formState.errors.notice_period_days.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Availability</Label>
                <Controller name="availability" control={form.control} render={({ field }) => (
                    <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)} disabled={!isEdit}>
                        <SelectTrigger><SelectValue placeholder="Select Availability" /></SelectTrigger>
                        <SelectContent>{AVAILABILITY_OPTIONS.map(opt => (<SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>))}</SelectContent>
                    </Select>
                )} />
                {form.formState.errors.availability && <p className="text-xs text-red-500 mt-4">{form.formState.errors.availability.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Preferred Job Type</Label>
                <Controller name="preferred_job_type" control={form.control} render={({ field }) => (
                    <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)} disabled={!isEdit}>
                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                        <SelectContent>{JOB_TYPE_OPTIONS.map(opt => (<SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>))}</SelectContent>
                    </Select>
                )} />
                {form.formState.errors.preferred_job_type && <p className="text-xs text-red-500 mt-4">{form.formState.errors.preferred_job_type.message}</p>}
            </div>
            <div className="space-y-4">
                <Label>Salary Capacity</Label>
                <div className="grid grid-cols-3 gap-4">
                    <Input {...form.register('salary_currency')} placeholder="INR" disabled={!isEdit} />
                    <Input type="number" {...form.register('expected_salary_min', { valueAsNumber: true })} placeholder="Min" disabled={!isEdit} />
                    <Input type="number" {...form.register('expected_salary_max', { valueAsNumber: true })} placeholder="Max" disabled={!isEdit} />
                </div>
            </div>
        </div>
        <div className="border-t border-slate-200 space-y-4 pt-4">
            <div className="flex items-center justify-between"><h4 className="font-semibold text-slate-900 flex items-center gap-4"><Languages className="h-5 w-5 text-brand-600" />Languages</h4> {isEdit && (<Button type="button" onClick={() => appendLanguage({ name: '', proficiency: LanguageProficiency.INTERMEDIATE, ability: LanguageAbility.BOTH })} variant="outline" size="sm" className="gap-4"><Plus className="h-4 w-4" /> Add Language</Button>)}</div>
            <div className="grid grid-cols-1 gap-4">
                {languageFields.map((field, index) => (
                    <div key={field.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language #{index + 1}</span> {isEdit && (<Button type="button" variant="ghost" size="sm" onClick={() => removeLanguage(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>)}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-4"><Label>Name</Label><Controller name={`languages.${index}.name`} control={form.control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!isEdit}>
                                    <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
                                    <SelectContent>{ISO6391.getAllNames().sort().map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent>
                                </Select>
                            )} /></div>
                            <div className="space-y-4"><Label>Proficiency</Label><Controller name={`languages.${index}.proficiency`} control={form.control} render={({ field }) => (
                                <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)} disabled={!isEdit}>
                                    <SelectTrigger><SelectValue placeholder="Select Proficiency" /></SelectTrigger>
                                    <SelectContent>{LANGUAGE_PROFICIENCY_OPTIONS.map(opt => (<SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>))}</SelectContent>
                                </Select>
                            )} /></div>
                            <div className="space-y-4"><Label>Ability</Label><Controller name={`languages.${index}.ability`} control={form.control} render={({ field }) => (
                                <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)} disabled={!isEdit}>
                                    <SelectTrigger><SelectValue placeholder="Select Ability" /></SelectTrigger>
                                    <SelectContent>{LANGUAGE_ABILITY_OPTIONS.map(opt => (<SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>))}</SelectContent>
                                </Select>
                            )} /></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
));

export default function ProfileInfoForm() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isEdit, setIsEdit] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [hasData, setHasData] = useState(false);
    const [activeSection, setActiveSection] = useState('basic');

    // Location Data Cache
    const locationCache = useRef({
        countries: null,
        states: {}, // key: countryIso2
        cities: {}  // key: countryIso2_stateIso2
    });

    // In-flight Promise Cache to prevent double fetching
    const promiseCache = useRef({
        countries: null,
        states: {},
        cities: {}
    });

    // Cascading Location State: Current Address
    const [countries, setCountries] = useState([]);
    const [currentStates, setCurrentStates] = useState([]);
    const [currentCities, setCurrentCities] = useState([]);
    const [isLoadingCurrentLoc, setIsLoadingCurrentLoc] = useState(false);

    // Cascading Location State: Permanent Address
    const [permStates, setPermStates] = useState([]);
    const [permCities, setPermCities] = useState([]);
    const [isLoadingPermLoc, setIsLoadingPermLoc] = useState(false);

    // Helper for fetching Countries
    const fetchCountries = useCallback(async (signal) => {
        // Return cached data if available
        if (locationCache.current.countries) {
            return locationCache.current.countries;
        }

        // Return existing promise if in-flight
        if (promiseCache.current.countries) {
            return promiseCache.current.countries;
        }

        // Create new fetch promise
        const promise = (async () => {
            try {
                const data = await locationAPI.getCountries();
                locationCache.current.countries = data;
                return data;
            } catch (error) {
                console.error("Failed to fetch countries:", error);
                return [];
            } finally {
                promiseCache.current.countries = null;
            }
        })();

        promiseCache.current.countries = promise;
        return promise;
    }, []);

    // Helper for fetching States
    const fetchStates = useCallback(async (countryIso2, signal) => {
        if (!countryIso2) return [];

        // Return cached data if available
        if (locationCache.current.states[countryIso2]) {
            return locationCache.current.states[countryIso2];
        }

        // Return existing promise if in-flight
        if (promiseCache.current.states[countryIso2]) {
            return promiseCache.current.states[countryIso2];
        }

        const promise = (async () => {
            try {
                const data = await locationAPI.getStates(countryIso2);
                locationCache.current.states[countryIso2] = data;
                return data;
            } catch (error) {
                console.error(`Failed to fetch states for ${countryIso2}:`, error);
                return [];
            } finally {
                promiseCache.current.states[countryIso2] = null;
            }
        })();

        promiseCache.current.states[countryIso2] = promise;
        return promise;
    }, []);

    // Helper for fetching Cities
    const fetchCities = useCallback(async (countryIso2, stateIso2, signal) => {
        if (!countryIso2 || !stateIso2) return [];
        const cacheKey = `${countryIso2}_${stateIso2}`;

        if (locationCache.current.cities[cacheKey]) {
            return locationCache.current.cities[cacheKey];
        }

        if (promiseCache.current.cities[cacheKey]) {
            return promiseCache.current.cities[cacheKey];
        }

        const promise = (async () => {
            try {
                const data = await locationAPI.getCities(countryIso2, stateIso2);
                locationCache.current.cities[cacheKey] = data;
                return data;
            } catch (error) {
                console.error(`Failed to fetch cities for ${stateIso2}, ${countryIso2}:`, error);
                return [];
            } finally {
                promiseCache.current.cities[cacheKey] = null;
            }
        })();

        promiseCache.current.cities[cacheKey] = promise;
        return promise;
    }, []);


    // Initial Fetch for Countries - Runs once on mount
    useEffect(() => {
        const controller = new AbortController();
        const loadCountries = async () => {
            const data = await fetchCountries(controller.signal);
            if (!controller.signal.aborted) {
                setCountries(data);
            }
        };
        loadCountries();
        return () => controller.abort();
    }, [fetchCountries]);

    const form = useForm({
        resolver: zodResolver(personalSchema),
        mode: 'onChange',
        defaultValues: {
            firstName: '',
            middleName: '',
            lastName: '',
            gender: Gender.MALE,
            email: '',
            phone: '',
            phoneCode: '91',
            alternatePhone: '',
            alternatePhoneCode: '91',
            address: '',
            city: '',
            state: '',
            country: 'India',
            postalCode: '',
            permanentAddress: '',
            permanentCity: '',
            permanentState: '',
            permanentCountry: 'India',
            permanentPostalCode: '',
            willingToRelocate: true,
            status: JobSearchStatus.ACTIVELY_LOOKING,
            github: '',
            linkedin: '',
            leetcode: '',
            naukri: '',
            portfolio: '',
            stackoverflow: '',
            medium: '',
            personalWebsite: '',
            headline: '',
            professional_summary: '',
            current_role: '',
            current_company: '',
            years_of_experience: 0,
            availability: '',
            notice_period_days: 0,
            preferred_job_type: WorkMode.ONSITE,
            salary_currency: 'INR',
            expected_salary_min: 0,
            expected_salary_max: 0,
            languages: [],
        },
    });

    const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
        control: form.control,
        name: "languages"
    });

    // --- Cascading Location Logic (Current Address) ---
    const watchedCurrentCountry = form.watch('country');
    const watchedCurrentState = form.watch('state');

    useEffect(() => {
        if (!watchedCurrentCountry || countries.length === 0) {
            setCurrentStates([]);
            setCurrentCities([]);
            return;
        }

        const controller = new AbortController();
        const loadStates = async () => {
            setIsLoadingCurrentLoc(true);
            try {
                const country = countries.find(c => c.name === watchedCurrentCountry || c.iso2 === watchedCurrentCountry);
                if (country) {
                    const data = await fetchStates(country.iso2, controller.signal);
                    if (!controller.signal.aborted) {
                        setCurrentStates(data);
                    }
                }
            } finally {
                if (!controller.signal.aborted) setIsLoadingCurrentLoc(false);
            }
        };

        loadStates();
        return () => controller.abort();
    }, [watchedCurrentCountry, countries, fetchStates]);

    useEffect(() => {
        if (!watchedCurrentCountry || !watchedCurrentState || currentStates.length === 0) {
            setCurrentCities([]);
            return;
        }

        const controller = new AbortController();
        const loadCities = async () => {
            setIsLoadingCurrentLoc(true);
            try {
                const country = countries.find(c => c.name === watchedCurrentCountry || c.iso2 === watchedCurrentCountry);
                const state = currentStates.find(s => s.name === watchedCurrentState || s.iso2 === watchedCurrentState);
                if (country && state) {
                    const data = await fetchCities(country.iso2, state.iso2, controller.signal);
                    if (!controller.signal.aborted) {
                        setCurrentCities(data);
                    }
                }
            } finally {
                if (!controller.signal.aborted) setIsLoadingCurrentLoc(false);
            }
        };

        loadCities();
        return () => controller.abort();
    }, [watchedCurrentState, watchedCurrentCountry, countries, currentStates, fetchCities]);

    // --- Cascading Location Logic (Permanent Address) ---
    const watchedPermCountry = form.watch('permanentCountry');
    const watchedPermState = form.watch('permanentState');

    useEffect(() => {
        if (!watchedPermCountry || countries.length === 0) {
            setPermStates([]);
            setPermCities([]);
            return;
        }

        const controller = new AbortController();
        const loadStates = async () => {
            setIsLoadingPermLoc(true);
            try {
                const country = countries.find(c => c.name === watchedPermCountry || c.iso2 === watchedPermCountry);
                if (country) {
                    const data = await fetchStates(country.iso2, controller.signal);
                    if (!controller.signal.aborted) {
                        setPermStates(data);
                    }
                }
            } finally {
                if (!controller.signal.aborted) setIsLoadingPermLoc(false);
            }
        };

        loadStates();
        return () => controller.abort();
    }, [watchedPermCountry, countries, fetchStates]);

    useEffect(() => {
        if (!watchedPermCountry || !watchedPermState || permStates.length === 0) {
            setPermCities([]);
            return;
        }

        const controller = new AbortController();
        const loadCities = async () => {
            setIsLoadingPermLoc(true);
            try {
                const country = countries.find(c => c.name === watchedPermCountry || c.iso2 === watchedPermCountry);
                const state = permStates.find(s => s.name === watchedPermState || s.iso2 === watchedPermState);
                if (country && state) {
                    const data = await fetchCities(country.iso2, state.iso2, controller.signal);
                    if (!controller.signal.aborted) {
                        setPermCities(data);
                    }
                }
            } finally {
                if (!controller.signal.aborted) setIsLoadingPermLoc(false);
            }
        };

        loadCities();
        return () => controller.abort();
    }, [watchedPermState, watchedPermCountry, countries, permStates, fetchCities]);

    const fetchData = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const response = await profileAPI.getProfile();
            const data = response?.data || response;

            if (data && data.first_name) {
                const formData = {
                    firstName: data.first_name || '',
                    middleName: data.middle_name || '',
                    lastName: data.last_name || '',
                    gender: data.gender || Gender.MALE,
                    email: data.email || '',
                    phone: data.phone_number || '',
                    phoneCode: data.phone_country_code ? data.phone_country_code.replace('+', '') : '91',
                    alternatePhone: data.alternate_phone || '',
                    alternatePhoneCode: data.alternate_phone_country_code ? data.alternate_phone_country_code.replace('+', '') : '91',
                    address: data.current_address || '',
                    city: data.current_city || '',
                    state: data.current_state || '',
                    country: data.current_country || 'India',
                    postalCode: data.current_postal_code || '',
                    permanentAddress: data.permanent_address || '',
                    permanentCity: data.permanent_city || '',
                    permanentState: data.permanent_state || '',
                    permanentCountry: data.permanent_country || 'India',
                    permanentPostalCode: data.permanent_postal_code || '',
                    willingToRelocate: data.willing_to_relocate !== undefined ? data.willing_to_relocate : true,
                    status: data.job_search_status || JobSearchStatus.ACTIVELY_LOOKING,
                    github: data.github_url || '',
                    linkedin: data.linkedin_url || '',
                    leetcode: data.leetcode_url || '',
                    naukri: data.naukri_url || '',
                    portfolio: data.portfolio_url || '',
                    stackoverflow: data.stackoverflow_url || '',
                    medium: data.medium_url || '',
                    personalWebsite: data.personal_website || '',
                    headline: data.headline || '',
                    professional_summary: data.professional_summary || '',
                    current_role: data.current_role || '',
                    current_company: data.current_company || '',
                    years_of_experience: data.years_of_experience || 0,
                    availability: data.availability || '',
                    notice_period_days: data.notice_period_days || 0,
                    preferred_job_type: data.preferred_work_mode || WorkMode.ONSITE,
                    salary_currency: data.salary_currency || 'INR',
                    expected_salary_min: Number(data.expected_salary_min) || 0,
                    expected_salary_max: Number(data.expected_salary_max) || 0,
                    languages: (data.languages || [])
                        .filter(l => l.name && l.name.trim() !== '')
                        .map(l => ({
                            id: l.id || undefined,
                            name: ISO6391.validate(l.name) ? l.name : (ISO6391.getCode(l.name) || l.name),
                            proficiency: l.proficiency || LanguageProficiency.INTERMEDIATE,
                            ability: l.ability || LanguageAbility.BOTH
                        })),
                };
                form.reset(formData);
                setOriginalData(formData);
                setHasData(true);
                setIsEdit(false);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            if (isRefreshCall) {
                toast({
                    title: 'Refresh Failed',
                    description: 'Failed to refresh profile data.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [form, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Debug: Log form errors whenever they change
    useEffect(() => {
        if (Object.keys(form.formState.errors).length > 0) {
            console.log('>>> Form Validation Errors:', form.formState.errors);
        }
    }, [form.formState.errors]);

    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.RESUME);
    };

    const handleClickCancel = () => {
        if (originalData) {
            form.reset(originalData);
        }
        setIsEdit(false);
    };

    const handleNext = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.EDUCATION);
    };

    const handleClickEdit = () => setIsEdit(true);


    const preparePayload = (data) => {
        if (!data) return null;
        return {
            first_name: data.firstName,
            middle_name: data.middleName || null,
            last_name: data.lastName,
            gender: data.gender,
            phone_number: data.phone || null,
            phone_country_code: data.phone ? `+${data.phoneCode || '91'}` : null,
            alternate_phone: data.alternatePhone || null,
            alternate_phone_country_code: data.alternatePhone ? `+${data.alternatePhoneCode || '91'}` : null,
            current_address: data.address || null,
            current_city: data.city,
            current_state: data.state || null,
            current_country: data.country,
            current_postal_code: data.postalCode || null,
            permanent_address: data.permanentAddress || null,
            permanent_city: data.permanentCity || null,
            permanent_state: data.permanentState || null,
            permanent_country: data.permanentCountry || null,
            permanent_postal_code: data.permanentPostalCode || null,
            willing_to_relocate: data.willingToRelocate || false,
            github_url: data.github || null,
            linkedin_url: data.linkedin || null,
            leetcode_url: data.leetcode || null,
            naukri_url: data.naukri || null,
            portfolio_url: data.portfolio || null,
            stackoverflow_url: data.stackoverflow || null,
            medium_url: data.medium || null,
            personal_website: data.personalWebsite || null,
            job_search_status: data.status || JobSearchStatus.ACTIVELY_LOOKING,
            headline: data.headline || null,
            professional_summary: data.professional_summary || null,
            current_role: data.current_role || null,
            current_company: data.current_company || null,
            years_of_experience: data.years_of_experience || 0,
            availability: data.availability || null,
            notice_period_days: data.notice_period_days || 0,
            preferred_work_mode: data.preferred_job_type || WorkMode.ONSITE,
            salary_currency: data.salary_currency || 'INR',
            expected_salary_min: data.expected_salary_min || 0,
            expected_salary_max: data.expected_salary_max || 0,
            languages: (data.languages || [])
                .filter(l => l.name && String(l.name).trim() !== '')
                .map(l => ({
                    name: l.name,
                    proficiency: l.proficiency || LanguageProficiency.INTERMEDIATE,
                    ability: l.ability || LanguageAbility.BOTH
                })),
        };
    };

    const onError = (errors) => {
        console.error("Form Validation Errors:", errors);

        // Define field groups in DOM order
        const basicFields = ['firstName', 'middleName', 'lastName', 'gender', 'email', 'phone', 'alternatePhone', 'status'];
        const locationFields = ['address', 'country', 'state', 'city', 'postalCode', 'permanentAddress', 'permanentCountry', 'permanentState', 'permanentCity', 'permanentPostalCode', 'willingToRelocate'];
        const linksFields = ['github', 'linkedin', 'leetcode', 'naukri', 'portfolio', 'stackoverflow', 'medium', 'personalWebsite'];
        const professionalFields = ['headline', 'professional_summary', 'current_role', 'current_company', 'years_of_experience', 'notice_period_days', 'preferred_job_type', 'salary_currency', 'expected_salary_min', 'expected_salary_max', 'languages', 'availability'];

        const allFields = [...basicFields, ...locationFields, ...linksFields, ...professionalFields];
        const firstErrorField = allFields.find(field => errors[field]);

        if (firstErrorField) {
            // Open the relevant section
            if (basicFields.includes(firstErrorField)) setActiveSection('basic');
            else if (locationFields.includes(firstErrorField)) setActiveSection('location');
            else if (linksFields.includes(firstErrorField)) setActiveSection('links');
            else if (professionalFields.includes(firstErrorField)) setActiveSection('professional');

            // Wait for accordion animation/render then scroll
            setTimeout(() => {
                const element = document.querySelector(`[name="${firstErrorField}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus({ preventScroll: true });
                }
            }, 100);
        }

        toast({
            title: 'Validation Error',
            description: 'Please fix the errors highlighted in the form.',
            variant: 'destructive',
        });
    };

    const onSubmit = async (data) => {
        const payload = preparePayload(data);

        // 1. Guard Clause - Deep compare current payload with original data
        const normalizedOriginal = preparePayload(originalData);
        if (isEdit && isEqual(payload, normalizedOriginal)) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            await profileAPI.updateProfile(payload);

            // 5. Success Flow
            toast({ title: 'Success', description: 'Profile updated successfully' });
            await fetchData(); // Re-fetch all data to ensure sync
            setIsEdit(false);
        } catch (error) {
            console.error('Save error:', error);
            const errMsg = error.response?.data?.detail || error.message || 'Failed to update profile';
            toast({ title: 'Error', description: errMsg, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const handleRefresh = () => {
        fetchData(true);
    };

    return (
        <div className="w-full mx-auto bg-white p-4 space-y-4">


            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">

                <section className="space-y-4">
                    <div className="flex flex-row items-center justify-between">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Personal Information</h2>
                            <p className="text-slate-500 text-sm">
                                Manage your contact information and personal preferences
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

                    {/* Accordion 1: Basic Details */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            type="button"
                            onClick={() => toggleSection('basic')}
                            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-100 rounded-lg p-4">
                                    <User className="h-5 w-5 text-brand-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900">Basic Details</h3>
                                    <p className="text-xs text-slate-500">Contact information and personal identifiers</p>
                                </div>
                            </div>
                            {!isLoading && !isRefreshing && <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${activeSection === 'basic' ? 'rotate-180' : ''}`} />}
                        </button>

                        {activeSection === 'basic' && (
                            isLoading || isRefreshing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 p-4 gap-4">
                                    {/* First Name */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>

                                    {/* Middle Name */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-20" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-10 w-[100px]" />
                                            <Skeleton className="h-10 flex-1" />
                                        </div>
                                    </div>

                                    {/* Alternate Phone */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-32" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-10 w-[100px]" />
                                            <Skeleton className="h-10 flex-1" />
                                        </div>
                                    </div>

                                    {/* Status (md:col-span-2) */}
                                    <div className="md:col-span-2 space-y-4">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>

                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 p-4 gap-4">
                                    <div className="space-y-4">
                                        <Label>First Name <span className="text-red-500">*</span></Label>
                                        <Input {...form.register('firstName')} disabled={!isEdit} placeholder="First Name" error={form.formState.errors.firstName} onChange={(e) => {
                                            const val = toTitleCase(e.target.value);
                                            e.target.value = val;
                                            form.register('firstName').onChange(e);
                                        }} />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Middle Name</Label>
                                        <Input {...form.register('middleName')} disabled={!isEdit} placeholder="Optional" error={form.formState.errors.middleName} onChange={(e) => {
                                            const val = toTitleCase(e.target.value);
                                            e.target.value = val;
                                            form.register('middleName').onChange(e);
                                        }} />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Last Name <span className="text-red-500">*</span></Label>
                                        <Input {...form.register('lastName')} disabled={!isEdit} placeholder="Last Name" error={form.formState.errors.lastName} onChange={(e) => {
                                            const val = toTitleCase(e.target.value);
                                            e.target.value = val;
                                            form.register('lastName').onChange(e);
                                        }} />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Gender <span className="text-red-500">*</span></Label>
                                        <Controller
                                            name="gender"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)} disabled={!isEdit}>
                                                    <SelectTrigger className={form.formState.errors.gender ? "border-red-500" : ""}>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {GENDER_OPTIONS.map(opt => (
                                                            <SelectItem key={opt.value} value={String(opt.value)}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Email <span className="text-red-500">*</span></Label>
                                        <Input {...form.register('email')} disabled />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Phone <span className="text-red-500">*</span></Label>
                                        <div className="flex gap-4">
                                            <Controller
                                                name="phoneCode"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!isEdit}>
                                                        <SelectTrigger className="w-[100px]">
                                                            <SelectValue placeholder="Code" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {COUNTRY_CODES.map((item) => (
                                                                <SelectItem key={item.code} value={item.code}>
                                                                    +{item.code} ({item.country})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            <Input
                                                {...form.register('phone')}
                                                disabled={!isEdit}
                                                placeholder="Phone Number"
                                                className="flex-1"
                                                error={form.formState.errors.phone}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Alternate Phone</Label>
                                        <div className="flex gap-4">
                                            <Controller
                                                name="alternatePhoneCode"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!isEdit}>
                                                        <SelectTrigger className="w-[100px]">
                                                            <SelectValue placeholder="Code" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {COUNTRY_CODES.map((item) => (
                                                                <SelectItem key={item.code} value={item.code}>
                                                                    +{item.code} ({item.country})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            <Input
                                                {...form.register('alternatePhone')}
                                                disabled={!isEdit}
                                                placeholder="Alternate Phone"
                                                className="flex-1"
                                                error={form.formState.errors.alternatePhone}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <Label>Search Status <span className="text-red-500">*</span></Label>
                                        <Controller
                                            name="status"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!isEdit}>
                                                    <SelectTrigger className={form.formState.errors.status ? "border-red-500" : ""}>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Accordion 2: Location */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => toggleSection('location')}
                            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-100 rounded-lg p-4">
                                    <MapPin className="h-5 w-5 text-brand-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900">Location & Mobility</h3>
                                    <p className="text-xs text-slate-500">Address, city, and relocation preferences</p>
                                </div>
                            </div>
                            {!isLoading && !isRefreshing && <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${activeSection === 'location' ? 'rotate-180' : ''}`} />}
                        </button>
                        {activeSection === 'location' && (
                            <div className="animate-in slide-in-from-top-2 duration-200 p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-4">
                                        <Label>Current Address <span className="text-red-500">*</span></Label>
                                        <Input {...form.register('address')} disabled={!isEdit} placeholder="House/Flat No, Street, Area" error={form.formState.errors.address} />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Country <span className="text-red-500">*</span></Label>
                                        <Controller
                                            name="country"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        form.setValue('state', '');
                                                        form.setValue('city', '');
                                                    }}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                    disabled={!isEdit}
                                                >
                                                    <SelectTrigger className={form.formState.errors.country ? "border-red-500" : ""}>
                                                        <SelectValue placeholder="Select Country" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map(c => (
                                                            <SelectItem key={c.iso2} value={c.name}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>State <span className="text-red-500">*</span></Label>
                                        <Controller
                                            name="state"
                                            control={form.control}
                                            render={({ field }) => (
                                                <div className="relative">
                                                    <Select
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            form.setValue('city', '');
                                                        }}
                                                        defaultValue={field.value}
                                                        value={field.value}
                                                        disabled={!isEdit || !watchedCurrentCountry}
                                                    >
                                                        <SelectTrigger className={form.formState.errors.state ? "border-red-500" : ""}>
                                                            <SelectValue placeholder="Select State" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {currentStates.map(s => (
                                                                <SelectItem key={s.iso2} value={s.name}>
                                                                    {s.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {isLoadingCurrentLoc && (
                                                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>City <span className="text-red-500">*</span></Label>
                                        <Controller
                                            name="city"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                    disabled={!isEdit || !watchedCurrentState}
                                                >
                                                    <SelectTrigger className={form.formState.errors.city ? "border-red-500" : ""}>
                                                        <SelectValue placeholder="Select City" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {currentCities.map(city => (
                                                            <SelectItem key={city.id} value={city.name}>
                                                                {city.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Postal Code <span className="text-red-500">*</span></Label>
                                        <Input {...form.register('postalCode')} disabled={!isEdit} error={form.formState.errors.postalCode} />
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2 space-y-4">

                                            <div className="flex items-end justify-between mb-4">
                                                <h4 className="text-sm font-medium text-slate-900">Permanent Address</h4>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        id="sameAsCurrent"
                                                        disabled={!isEdit}
                                                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const current = form.getValues();
                                                                form.setValue('permanentAddress', current.address);
                                                                form.setValue('permanentCountry', current.country);
                                                                form.setValue('permanentState', current.state);
                                                                form.setValue('permanentCity', current.city);
                                                                form.setValue('permanentPostalCode', current.postalCode);
                                                            } else {
                                                                form.setValue('permanentAddress', '');
                                                                form.setValue('permanentCountry', '');
                                                                form.setValue('permanentState', '');
                                                                form.setValue('permanentCity', '');
                                                                form.setValue('permanentPostalCode', '');
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="sameAsCurrent" className="cursor-pointer text-xs">Same as Current Address</Label>
                                                </div>
                                            </div>
                                            <Input {...form.register('permanentAddress')} disabled={!isEdit} placeholder="House/Flat No, Street, Area" error={form.formState.errors.permanentAddress} />
                                        </div>
                                        <div className="space-y-4">
                                            <Label>Country</Label>
                                            <Controller
                                                name="permanentCountry"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <Select
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            form.setValue('permanentState', '');
                                                            form.setValue('permanentCity', '');
                                                        }}
                                                        defaultValue={field.value}
                                                        value={field.value}
                                                        disabled={!isEdit}
                                                    >
                                                        <SelectTrigger className={form.formState.errors.permanentCountry ? "border-red-500" : ""}>
                                                            <SelectValue placeholder="Select Country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countries.map(c => (
                                                                <SelectItem key={c.iso2} value={c.name}>
                                                                    {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label>State </Label>
                                            <Controller
                                                name="permanentState"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <div className="relative">
                                                        <Select
                                                            onValueChange={(val) => {
                                                                field.onChange(val);
                                                                form.setValue('permanentCity', '');
                                                            }}
                                                            defaultValue={field.value}
                                                            value={field.value}
                                                            disabled={!isEdit || !watchedPermCountry}
                                                        >
                                                            <SelectTrigger className={form.formState.errors.permanentState ? "border-red-500" : ""}>
                                                                <SelectValue placeholder="Select State" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {permStates.map(s => (
                                                                    <SelectItem key={s.iso2} value={s.name}>
                                                                        {s.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {isLoadingPermLoc && (
                                                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                                <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label>City </Label>
                                            <Controller
                                                name="permanentCity"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!isEdit || !watchedPermState}>
                                                        <SelectTrigger className={form.formState.errors.permanentCity ? "border-red-500" : ""}>
                                                            <SelectValue placeholder="Select City" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {permCities.map(city => (
                                                                <SelectItem key={city.id} value={city.name}>
                                                                    {city.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label>Postal Code </Label>
                                            <Input {...form.register('permanentPostalCode')} disabled={!isEdit} error={form.formState.errors.permanentPostalCode} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg border border-slate-200 flex items-center p-4 gap-4">
                                    <input
                                        type="checkbox"
                                        id="relocate"
                                        {...form.register('willingToRelocate')}
                                        disabled={!isEdit}
                                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                    />
                                    <Label htmlFor="relocate" className="cursor-pointer">I am willing to relocate for the right opportunity</Label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Accordion 3: Links */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => toggleSection('links')}
                            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-100 rounded-lg p-4">
                                    <LinkIcon className="h-5 w-5 text-brand-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900">Social & Professional Links</h3>
                                    <p className="text-xs text-slate-500">Portfolio, GitHub, LinkedIn, and more</p>
                                </div>
                            </div>
                            {!isLoading && !isRefreshing && <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${activeSection === 'links' ? 'rotate-180' : ''}`} />}
                        </button>
                        {activeSection === 'links' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 animate-in slide-in-from-top-2 duration-200 p-4 gap-4">
                                {[
                                    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                                    { id: 'github', label: 'GitHub', icon: Github },
                                    { id: 'portfolio', label: 'Portfolio', icon: Globe2 },
                                    { id: 'leetcode', label: 'LeetCode', icon: Code2 },
                                    { id: 'naukri', label: 'Naukri Profile', icon: Navigation },
                                    { id: 'stackoverflow', label: 'StackOverflow', icon: Code2 },
                                    { id: 'medium', label: 'Medium', icon: FileText },
                                    { id: 'personalWebsite', label: 'Other Website', icon: Globe2 }
                                ].map(link => (
                                    <div key={link.id} className="space-y-4">
                                        <Label className="flex items-center gap-4">
                                            <link.icon className="h-4 w-4 text-slate-500" />
                                            {link.label}
                                        </Label>
                                        <Input
                                            {...form.register(link.id)}
                                            placeholder="https://..."
                                            disabled={!isEdit}
                                            className={form.formState.errors[link.id] ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        />
                                        {form.formState.errors[link.id] && (
                                            <p className="text-xs text-red-500 mt-4">{form.formState.errors[link.id].message}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Accordion 4: Professional */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => toggleSection('professional')}
                            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-100 rounded-lg p-4">
                                    <Briefcase className="h-5 w-5 text-brand-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900">Professional Summary</h3>
                                    <p className="text-xs text-slate-500">Headlines, salary expectations, and languages</p>
                                </div>
                            </div>
                            {!isLoading && !isRefreshing && <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${activeSection === 'professional' ? 'rotate-180' : ''}`} />}
                        </button>
                        {activeSection === 'professional' && (
                            <ProfessionalSection form={form} isEdit={isEdit} languageFields={languageFields} appendLanguage={appendLanguage} removeLanguage={removeLanguage} />
                        )}
                    </div>

                </section>

                <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                    <Button
                        type="button"
                        onClick={handlePrevious}
                        disabled={isSaving}
                        variant="outline"
                        className="gap-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <div className="flex items-center gap-4">
                        {!isLoading && isEdit ? (
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
                                    aria-label="Save profile"
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
                                    disabled={isSaving}
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
        </div>
    );
}