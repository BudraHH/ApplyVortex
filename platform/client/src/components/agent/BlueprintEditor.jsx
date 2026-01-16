import { useState, useEffect } from 'react';
import {
    Loader2,
    Target,
    Plus,
    X,
    Save,
    Edit2,
    Briefcase,
    MapPin,
    Search,
    ChevronDown,
    ChevronRight,
    Globe,
    Layout
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/Label';
import locationAPI from '@/services/api/locationAPI';
import targetingAPI from '@/services/api/targetingAPI';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ExperienceLevel, JobType, WorkMode, Portal } from '@/constants/constants';

const PORTALS = [
    { id: 'linkedin', name: 'LinkedIn', value: Portal.LINKEDIN },
    { id: 'naukri', name: 'Naukri', value: Portal.NAUKRI },
    { id: 'indeed', name: 'Indeed', value: Portal.INDEED }
];

const EXPERIENCE_LABELS = {
    [ExperienceLevel.INTERN]: 'Internship',
    [ExperienceLevel.ENTRY_LEVEL]: 'Entry Level',
    [ExperienceLevel.ASSOCIATE]: 'Associate', // Added missing mapping if needed, or map appropriately
    [ExperienceLevel.JUNIOR]: 'Junior',
    [ExperienceLevel.MID_LEVEL]: 'Mid-Senior',
    [ExperienceLevel.SENIOR]: 'Senior',
    [ExperienceLevel.LEAD]: 'Lead',
    [ExperienceLevel.ARCHITECT]: 'Architect',
    [ExperienceLevel.EXECUTIVE]: 'Executive',
};

const JOB_TYPE_LABELS = {
    [JobType.FULL_TIME]: 'Full-time',
    [JobType.PART_TIME]: 'Part-time',
    [JobType.CONTRACT]: 'Contract',
    [JobType.INTERNSHIP]: 'Internship',
    [JobType.FREELANCE]: 'Freelance',
};

const WORK_MODE_LABELS = {
    [WorkMode.ONSITE]: 'On-site',
    [WorkMode.REMOTE]: 'Remote',
    [WorkMode.HYBRID]: 'Hybrid',
};

export function BlueprintEditor({
    profile = null,
    onSave,
    onCancel,
    onDelete,
    isEditing: initialIsEditing = false,
    className,
    disabled = false
}) {
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(initialIsEditing);

    // State initialization from profile prop
    const [name, setName] = useState(profile?.name || '');
    const [portalSlug, setPortalSlug] = useState(profile?.portal_slug || profile?.job_portal?.slug || 'linkedin');
    const [keywordList, setKeywordList] = useState(profile?.keywords || []);
    const [keywordInput, setKeywordInput] = useState('');
    const [locations, setLocations] = useState(profile?.locations || []);
    const [experience, setExperience] = useState(profile?.experience_level ?? '');
    const [employmentType, setEmploymentType] = useState(profile?.job_type ?? '');
    const [workMode, setWorkMode] = useState(profile?.work_mode ?? '');
    const [datePosted, setDatePosted] = useState(profile?.date_posted || '');
    const [minSalary, setMinSalary] = useState(profile?.min_salary || '');
    const [checkInterval, setCheckInterval] = useState(profile?.frequency || 86400);
    const [autoScrape, setAutoScrape] = useState(profile?.auto_scrape || false);
    const [autoApply, setAutoApply] = useState(profile?.auto_apply || false);

    // Geo Picker UI state
    const [isGeoPickerOpen, setIsGeoPickerOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    // Cascading Location State
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const [relocationContext, setRelocationContext] = useState(null);

    const toTitleCase = (str) => {
        return str.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatFrequency = (seconds) => {
        if (!seconds) return '24 Hours';
        if (seconds === 3600) return '1 Hour';
        if (seconds === 86400) return '24 Hours';
        if (seconds === 0) return 'Immediate';
        const hours = Math.floor(seconds / 3600);
        return `${hours} Hours`;
    };

    // Update state when profile prop changes
    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setPortalSlug(profile.portal_slug || profile?.job_portal?.slug || 'linkedin');
            setKeywordList(profile.keywords || []);
            setLocations(profile.locations || []);
            setExperience(profile.experience_level ?? '');
            setEmploymentType(profile.job_type ?? '');
            setWorkMode(profile.work_mode ?? '');
            setDatePosted(profile.date_posted || '');
            setMinSalary(profile.min_salary || '');
            setCheckInterval(profile.frequency || 86400);
            setAutoScrape(profile.auto_scrape || false);
            setAutoApply(profile.auto_apply || false);
        }
    }, [profile]);

    // Reset editing state if initialIsEditing prop changes (e.g. creating new vs viewing)
    useEffect(() => {
        setIsEditing(initialIsEditing);
    }, [initialIsEditing]);

    // Location Handlers (Only fetch if editing)
    useEffect(() => {
        if (!isEditing) return;

        const fetchRelocationContext = async () => {
            try {
                const ctx = await targetingAPI.getRelocationContext();
                setRelocationContext(ctx);
                if (ctx.relocation === false && ctx.location) {
                    setLocations([ctx.location]);
                }
            } catch (error) {
                console.error("Failed to fetch relocation context:", error);
            }
        };

        fetchRelocationContext();

        const fetchCountries = async () => {
            try {
                const data = await locationAPI.getCountries();
                setCountries(data);
            } catch (error) {
                console.error("Failed to fetch countries:", error);
            }
        };
        if (isGeoPickerOpen) {
            fetchCountries();
        }
    }, [isEditing]);

    // ... (Other location effects are fine, they depend on isEditing indirectly via render or can run)
    useEffect(() => {
        if (!isEditing || !selectedCountry) {
            setStates([]);
            setCities([]);
            return;
        }
        const fetchStates = async () => {
            setIsLoadingLocations(true);
            try {
                const data = await locationAPI.getStates(selectedCountry);
                setStates(data);
                setCities([]);
                setSelectedState('');
                setSelectedCity('');
            } catch (error) {
                console.error("Failed to fetch states:", error);
            } finally {
                setIsLoadingLocations(false);
            }
        };
        fetchStates();
    }, [selectedCountry, isEditing]);

    useEffect(() => {
        if (!isEditing || !selectedCountry || !selectedState) {
            setCities([]);
            return;
        }
        const fetchCities = async () => {
            setIsLoadingLocations(true);
            try {
                const data = await locationAPI.getCities(selectedCountry, selectedState);
                setCities(data);
                setSelectedCity('');
            } catch (error) {
                console.error("Failed to fetch cities:", error);
            } finally {
                setIsLoadingLocations(false);
            }
        };
        fetchCities();
    }, [selectedCountry, selectedState, isEditing]);

    useEffect(() => {
        if (selectedCity && selectedState && selectedCountry && isEditing) {
            // Only use the city name as requested
            const locationToAdd = selectedCity;

            if (!locations.includes(locationToAdd)) {
                setLocations(prev => [...prev, locationToAdd]);
                toast({
                    title: "Location Added",
                    description: `${locationToAdd} has been added to target areas.`
                });
            } else {
                toast({
                    title: "Duplicate Location",
                    description: "This location is already in your list.",
                    variant: "destructive"
                });
            }
            setSelectedCity('');
        }
    }, [selectedCity, selectedState, selectedCountry, countries, states, locations, isEditing]);

    const handleRemoveLocation = (locToRemove) => {
        setLocations(prev => prev.filter(loc => loc !== locToRemove));
    };

    const handleClearLocations = () => {
        setLocations([]);
    };

    const handleAddLocationManual = () => {
        const trimmed = locationInput.trim();
        if (!trimmed) return;

        if (!locations.includes(trimmed)) {
            setLocations(prev => [...prev, trimmed]);
            toast({
                title: "Location Added",
                description: `${trimmed} has been added to target areas.`
            });
        }
        setLocationInput('');
    };

    const handleAddKeyword = () => {
        const trimmed = keywordInput.trim();
        if (!trimmed) return;

        if (!keywordList.includes(trimmed)) {
            setKeywordList(prev => [...prev, trimmed]);
        }
        setKeywordInput('');
    };

    const handleRemoveKeyword = (kwToRemove) => {
        setKeywordList(prev => prev.filter(kw => kw !== kwToRemove));
    };

    const handleSave = async () => {
        // Validation: Required fields
        if (!name.trim()) {
            toast({
                title: 'Blueprint Name Required',
                description: 'Please give your blueprint a name.',
                variant: 'destructive',
            });
            return;
        }

        if (keywordList.length === 0 && !keywordInput.trim()) {
            toast({
                title: 'Keywords Required',
                description: 'Please enter at least one keyword or role.',
                variant: 'destructive',
            });
            return;
        }

        if (!employmentType) {
            toast({
                title: 'Job Type Required',
                description: 'Please select an employment type (e.g. Full-time).',
                variant: 'destructive',
            });
            return;
        }

        let finalKeywords = [...keywordList];
        if (keywordInput.trim() && !finalKeywords.includes(keywordInput.trim())) {
            finalKeywords.push(keywordInput.trim());
        }

        const profileData = {
            name: name.trim(),
            keywords: finalKeywords,
            locations: locations,
            portal_slug: portalSlug,
            experience_level: experience || null,
            job_type: employmentType || null,
            work_mode: workMode || null,
            date_posted: datePosted || null,
            min_salary: minSalary ? parseInt(minSalary) : null,
            frequency: parseInt(checkInterval),
            auto_scrape: autoScrape,
            auto_apply: autoApply,
            is_active: profile ? profile.is_active : false
        };

        if (onSave) {
            setIsSaving(true);
            try {
                await onSave(profileData);
                // If creating new (no profile id initially), parent handles logic.
                // If updating, we exit edit mode.
                if (profile) setIsEditing(false);
            } finally {
                setIsSaving(false);
            }
        }
    };

    // View Mode Render
    if (!isEditing) {
        return (
            <div className={cn("p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4", className)}>
                <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
                    <div className="flex-1 space-y-2 md:space-y-3 lg:space-y-4">
                        <div>
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 md:mb-3 lg:mb-4">
                                Target Roles
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {keywordList.length > 0 ? keywordList.map((kw, i) => (
                                    <span key={i} className="text-brand-500 text-sm font-medium rounded-md border border-slate-200 px-2 py-1 lg:p-2">
                                        {kw}
                                    </span>
                                )) : <span className="text-slate-400 italic text-sm">No keywords defined</span>}
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 md:mb-3 lg:mb-4">
                                Locations ({locations.length})
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {locations.length > 0 ? locations.map((loc, i) => (
                                    <span key={i} className="text-brand-500 text-sm font-medium rounded-md border border-slate-200 px-2 py-1 lg:p-2">
                                        {loc}
                                    </span>
                                )) : <span className="text-slate-400 italic text-sm">Anywhere</span>}
                            </div>
                        </div>
                    </div>

                    <div className="md:w-1/2 border-l border-slate-100 space-y-2 md:space-y-3 lg:space-y-4 md:pl-3 lg:pl-4">
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <div>
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 md:mb-3 lg:mb-4">
                                    Filters
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {(!experience && !employmentType && !workMode && !datePosted) && (
                                        <span className="text-slate-400 italic text-sm">No filters applied</span>
                                    )}

                                    {experience !== '' && experience !== null && (
                                        <div className="inline-flex items-center bg-brand-50 text-brand-500 text-xs font-medium rounded border border-brand-100 gap-2 px-2 py-1 lg:p-2">
                                            <span className="capitalize">{EXPERIENCE_LABELS[experience] || 'Unknown'}</span>
                                        </div>
                                    )}

                                    {employmentType !== '' && employmentType !== null && (
                                        <div className="inline-flex items-center bg-brand-50 text-brand-500 text-xs font-medium rounded border border-brand-100 gap-2 px-2 py-1 lg:p-2">
                                            <span className="capitalize">{JOB_TYPE_LABELS[employmentType] || 'Unknown'}</span>
                                        </div>
                                    )}

                                    {workMode !== '' && workMode !== null && (
                                        <div className="inline-flex items-center bg-brand-50 text-brand-500 text-xs font-medium rounded border border-brand-100 gap-2 px-2 py-1 lg:p-2">
                                            <span className="capitalize">{WORK_MODE_LABELS[workMode] || 'Unknown'}</span>
                                        </div>
                                    )}

                                    {datePosted && datePosted !== 'any_time' && (
                                        <div className="inline-flex items-center bg-brand-50 text-brand-500 text-xs font-medium rounded border border-brand-100 gap-2 px-2 py-1 lg:p-2">
                                            <span className="capitalize">{datePosted.replace('-', ' ')}</span>
                                        </div>
                                    )}

                                    {minSalary && minSalary !== '0' && (
                                        <div className="inline-flex items-center bg-orange-50 text-orange-700 text-xs font-medium rounded border border-orange-100 gap-2 px-2 py-1 lg:p-2">
                                            <span>{parseInt(minSalary) / 100000} LPA+</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-2 md:pt-3 lg:pt-4">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 md:mb-3 lg:mb-4">
                                    Config
                                </Label>
                                <div className="text-sm space-y-2 md:space-y-3 lg:space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Portal</span>
                                        <span className="font-medium text-slate-900  capitalize">{portalSlug}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Frequency</span>
                                        <span className="font-medium text-slate-900 ">{formatFrequency(checkInterval)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-50 gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            onClick={onDelete}
                            className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 md:px-3 lg:px-4"
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => setIsEditing(true)}
                        className={cn("gap-2 md:gap-3 lg:gap-4", (autoScrape || autoApply) && "opacity-50 cursor-not-allowed")}
                    >
                        <Edit2 className="h-3.5 w-3.5" /> Edit Blueprint
                    </Button>
                </div>
            </div>
        );
    }

    // Edit Mode Render
    return (
        <div className={cn("bg-slate-50/50 ", className)}>
            <div className="border-b border-slate-200 bg-white px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Blueprint Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Layout className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="e.g. Remote React Jobs"
                            value={name}
                            onChange={(e) => setName(toTitleCase(e.target.value))}
                            className="h-10 lg:h-11 border-slate-200 bg-slate-50 focus:bg-white transition-colors font-medium text-slate-900 pl-10"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 ">
                {/* Left Column: Core Definition */}
                <div className="p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Target Roles <span className="text-red-500">*</span>
                            </Label>
                            {keywordList.length > 0 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setKeywordList([])}
                                    className="h-auto w-auto p-0 text-[10px] text-red-500 hover:text-red-700 hover:bg-transparent font-bold uppercase tracking-wide"
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Add role (e.g. React Developer)"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(toTitleCase(e.target.value))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddKeyword();
                                        }
                                    }}
                                    className="h-10 lg:h-11 border-slate-200 bg-white focus:ring-brand-500/20 pl-10"
                                />
                            </div>
                            <div className="flex flex-wrap min-h-[32px] gap-2 md:gap-3 lg:gap-4">
                                {keywordList.length > 0 ? keywordList.map((kw, idx) => (
                                    <div key={idx} className="flex items-center bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 shadow-sm group gap-2 px-2 py-1.5 lg:gap-4 lg:px-4 lg:py-4">
                                        {kw}
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleRemoveKeyword(kw)}
                                            className="h-auto w-auto p-0 hover:bg-transparent text-slate-400 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )) : (
                                    <span className="text-sm text-slate-400 italic px-2 md:px-3 lg:px-4 pt-2 md:pt-3 lg:pt-4">No roles added yet.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Target Locations <span className="text-slate-100">{"(Optional, but preferred)"}</span>
                            </Label>
                            {locations.length > 0 && (!relocationContext || relocationContext.relocation !== false) && (
                                <Button
                                    variant="ghost"
                                    onClick={handleClearLocations}
                                    className="h-auto w-auto p-0 text-[10px] text-red-500 hover:text-red-700 hover:bg-transparent font-bold uppercase tracking-wide"
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>

                        {relocationContext && relocationContext.relocation === false && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 md:p-3 lg:p-4 mb-2 md:mb-3 lg:mb-4">
                                <p className="text-xs text-amber-700  font-medium">
                                    Location is fixed to <span className="font-bold underline">{relocationContext.location}</span> because you marked "Not willing to relocate" in your profile.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            {!relocationContext?.location && (<><div className="relative">
                                <Input
                                    disabled={relocationContext?.relocation === false}
                                    placeholder={relocationContext?.relocation === false ? "Location is restricted" : "Add city manually (e.g. London)"}
                                    value={locationInput}
                                    onChange={(e) => setLocationInput(toTitleCase(e.target.value))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddLocationManual();
                                        }
                                    }}
                                    className="h-11 border-slate-200  bg-white  focus:ring-brand-500/20"
                                />
                            </div>

                                <Collapsible
                                    disabled={relocationContext?.relocation === false}
                                    open={isGeoPickerOpen && relocationContext?.relocation !== false}
                                    onOpenChange={setIsGeoPickerOpen}
                                    className={cn(
                                        "border border-slate-200  rounded-lg bg-white  overflow-hidden",
                                        relocationContext?.relocation === false && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors p-2 md:p-3 lg:p-4">
                                        <span className="flex items-center text-xs uppercase font-bold text-slate-500 gap-2 md:gap-3 lg:gap-4">
                                            <Globe className="h-3.5 w-3.5" />
                                            Advanced Geo Picker
                                        </span>
                                        {isGeoPickerOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-0 animate-slide-down p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                                        <div className="border-t border-slate-100 grid grid-cols-1 pt-2 md:pt-3 lg:pt-4 gap-2 md:gap-3 lg:gap-4">
                                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                                <Label className="text-[10px] uppercase font-bold text-slate-400">Country</Label>
                                                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue placeholder="Select Country" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map(c => <SelectItem key={c.iso2} value={c.iso2}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">State</Label>
                                                    <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedCountry}>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder="Select State" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {states.map(s => <SelectItem key={s.iso2} value={s.iso2}>{s.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="relative space-y-2 md:space-y-3 lg:space-y-4">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">City</Label>
                                                    <div className="relative">
                                                        <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                                                            <SelectTrigger className="h-9 text-xs">
                                                                <SelectValue placeholder="Select City" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {cities.map(city => <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        {isLoadingLocations && (
                                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-white p-2 md:p-3 lg:p-4">
                                                                <Loader2 className="h-3 w-3 animate-spin text-brand-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </>)}

                            {locations.length > 0 && (
                                <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
                                    {locations.map((loc, idx) => (
                                        <div key={idx} className="flex items-center bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 shadow-sm group gap-2 px-2 py-1.5 lg:gap-4 lg:px-4 lg:py-4">
                                            {loc}
                                            <Button
                                                variant="ghost"
                                                disabled={relocationContext?.relocation === false}
                                                onClick={() => handleRemoveLocation(loc)}
                                                className="h-auto w-auto p-0 hover:bg-transparent text-slate-400 hover:text-red-500"
                                            >
                                                {!relocationContext?.location && <X className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="bg-white p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Platform & Automation
                        </Label>
                        <div className="grid grid-cols-1 gap-2 md:gap-3 lg:gap-4">
                            <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    <Label className="text-xs font-medium text-slate-600 ">Source <span className="text-red-500">*</span></Label>
                                    <Select value={portalSlug} onValueChange={setPortalSlug}>
                                        <SelectTrigger className="h-9 lg:h-10 bg-white ">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PORTALS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    <Label className="text-xs font-medium text-slate-600 ">Scan Frequency</Label>
                                    <Select value={String(checkInterval)} onValueChange={setCheckInterval}>
                                        <SelectTrigger className="h-9 lg:h-10 bg-white ">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3600">Every 1 Hour</SelectItem>
                                            <SelectItem value="21600">Every 6 Hours</SelectItem>
                                            <SelectItem value="43200">Every 12 Hours</SelectItem>
                                            <SelectItem value="86400">Every 24 Hours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>


                        </div>
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Refinement Filters
                            </Label>
                            {(experience || employmentType || workMode || datePosted) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setExperience('');
                                        setEmploymentType('');
                                        setWorkMode('');
                                        setDatePosted('');
                                        setMinSalary('');
                                    }}
                                    className="h-auto w-auto p-0 text-[10px] text-red-500 hover:text-red-700 hover:bg-transparent font-bold uppercase tracking-wide"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                        <div className="bg-slate-50 rounded-lg border border-slate-100 space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                            {/* Minimum Salary (Naukri Only) */}
                            {portalSlug === 'naukri' && (
                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    <Label className="text-xs font-medium text-slate-600 ">Minimum Salary (Naukri Only)</Label>
                                    <Select value={String(minSalary)} onValueChange={setMinSalary}>
                                        <SelectTrigger className="h-9 bg-white  border-slate-200 ">
                                            <SelectValue placeholder="Any" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Any</SelectItem>
                                            <SelectItem value="300000">3 LPA+</SelectItem>
                                            <SelectItem value="600000">6 LPA+</SelectItem>
                                            <SelectItem value="1000000">10 LPA+</SelectItem>
                                            <SelectItem value="1500000">15 LPA+</SelectItem>
                                            <SelectItem value="2500000">25 LPA+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Date Posted */}
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label className="text-xs font-medium text-slate-600 ">Date Posted <span className="text-slate-100">{"(Freshness)"}</span></Label>
                                <Select value={datePosted} onValueChange={setDatePosted} disabled={!portalSlug}>
                                    <SelectTrigger className="h-9 bg-white  border-slate-200 ">
                                        <SelectValue placeholder="Any Time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any_time">Any Time</SelectItem>
                                        <SelectItem value="past-1h">Past 1 Hour</SelectItem>
                                        {portalSlug === 'linkedin' && (
                                            <>
                                                <SelectItem value="past-3h">Past 3 Hours</SelectItem>
                                                <SelectItem value="past-6h">Past 6 Hours</SelectItem>
                                            </>
                                        )}
                                        <SelectItem value="past-24h">Past 24 Hours</SelectItem>
                                        <SelectItem value="past-week">Past Week</SelectItem>
                                        <SelectItem value="past-month">Past Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label className="text-xs font-medium text-slate-600 ">Experience Level <span className="text-slate-100">{"(Optional, but preferred)"}</span></Label>
                                <Select value={String(experience) || 'any'} onValueChange={(val) => setExperience(val === 'any' ? '' : Number(val))} disabled={!portalSlug}>
                                    <SelectTrigger className="h-9 bg-white  border-slate-200 ">
                                        <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any Level</SelectItem>
                                        {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label className="text-xs font-medium text-slate-600 ">Employment Type <span className="text-red-500">*</span></Label>
                                <Select value={String(employmentType) || 'any'} onValueChange={(val) => setEmploymentType(val === 'any' ? '' : Number(val))} disabled={!portalSlug}>
                                    <SelectTrigger className="h-9 bg-white  border-slate-200 ">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any Type</SelectItem>
                                        {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label className="text-xs font-medium text-slate-600 ">Work Mode</Label>
                                <Select value={String(workMode) || 'any'} onValueChange={(val) => setWorkMode(val === 'any' ? '' : Number(val))} disabled={!portalSlug}>
                                    <SelectTrigger className="h-9 bg-white  border-slate-200 ">
                                        <SelectValue placeholder="Any Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any Mode</SelectItem>
                                        {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end border-t border-slate-300 bg-slate-50 p-2 md:p-3 lg:p-4 pt-2 md:pt-3 lg:pt-4 gap-2 md:gap-3 lg:gap-4">
                <Button variant="ghost" onClick={() => {
                    setIsEditing(false);
                    if (onCancel && !profile) onCancel(); // If creating new and cancelled, parent might want to close
                }} className="text-slate-500">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="primary"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2 md:mr-3 lg:mr-4" /> : <Save className="h-4 w-4" />}
                    {isSaving ? 'Saving' : 'Save '}
                </Button>
            </div>
        </div>
    );
}
