import { useEffect, useState, useRef, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { locationAPI } from '@/services/api/locationAPI';
import {
    Trash2,
    X,
    Plus,
    AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { Textarea } from '@/components/ui/Textarea';
import { DateInput } from '@/components/ui/DateInput';
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";

import { JobType, WorkMode } from '@/constants/constants';

const EMPLOYMENT_TYPES = [
    { value: JobType.FULL_TIME, label: 'Full-time' },
    { value: JobType.PART_TIME, label: 'Part-time' },
    { value: JobType.INTERNSHIP, label: 'Internship' },
    { value: JobType.CONTRACT, label: 'Contract' },
    { value: JobType.FREELANCE, label: 'Freelance' },
];

const WORK_MODES = [
    { value: WorkMode.ONSITE, label: 'On-site' },
    { value: WorkMode.REMOTE, label: 'Remote' },
    { value: WorkMode.HYBRID, label: 'Hybrid' },
];

export default function ExperienceCard({
    form,
    index,
    onRemove,
    canRemove,
    isReadOnly,
    hasMultipleCurrentJobs,
    currentJobsCount,
    skillsBase,
}) {
    const [summaryCharCount, setSummaryCharCount] = useState(0);
    const [achievementsCharCount, setAchievementsCharCount] = useState(0);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);

    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const summaryValue = form.watch(`experiences.${index}.summary`);
    const achievementsValue = form.watch(`experiences.${index}.achievements`);

    const isCurrent = form.watch(`experiences.${index}.isCurrent`);
    const company = form.watch(`experiences.${index}.company`);
    const jobTitle = form.watch(`experiences.${index}.jobTitle`);
    const selectedSkills = form.watch(`experiences.${index}.skillsUsed`) || [];
    const employmentTypeValue = form.watch(`experiences.${index}.employmentType`);
    const workModeValue = form.watch(`experiences.${index}.workMode`);

    const getError = (field) => form.formState.errors?.experiences?.[index]?.[field];

    const filteredSkills = skillsBase.filter(skill => {
        if (!skill?.name) return false;
        const matchesSearch = skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase());
        const notSelected = !selectedSkills.some(s => s.id === skill.id);
        return matchesSearch && notSelected;
    });

    const handleCurrentChange = (checked) => {
        if (isReadOnly) return;
        if (checked && currentJobsCount >= 1 && !isCurrent) return;
        form.setValue(`experiences.${index}.isCurrent`, checked, { shouldValidate: true });
        if (checked) {
            form.setValue(`experiences.${index}.endDate`, '', { shouldValidate: true });
        }
    };

    const handleAddSkill = (skill) => {
        if (isReadOnly) return;
        const updated = [...selectedSkills, skill];
        form.setValue(`experiences.${index}.skillsUsed`, updated, { shouldValidate: true });
        setSkillSearchQuery('');
        setShowSkillDropdown(false);
        inputRef.current?.focus();
    };

    const handleRemoveSkill = (skillId) => {
        if (isReadOnly) return;
        const updated = selectedSkills.filter(s => s.id !== skillId);
        form.setValue(`experiences.${index}.skillsUsed`, updated, { shouldValidate: true });
    };

    const handleRemoveAllSkills = () => {
        if (isReadOnly) return;
        form.setValue(`experiences.${index}.skillsUsed`, [], { shouldValidate: true });
    };

    useEffect(() => {
        setSummaryCharCount(summaryValue?.length || 0);
    }, [summaryValue]);



    useEffect(() => {
        setAchievementsCharCount(achievementsValue?.length || 0);
    }, [achievementsValue]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setShowSkillDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isCurrentCheckboxDisabled = isReadOnly || (hasMultipleCurrentJobs && !isCurrent);

    const locationCache = useRef({
        countries: null,
        states: {},
        cities: {}
    });

    const promiseCache = useRef({
        countries: null,
        states: {},
        cities: {}
    });

    const [countries, setCountries] = useState([]);
    const [currentStates, setCurrentStates] = useState([]);
    const [currentCities, setCurrentCities] = useState([]);

    const fetchCountries = useCallback(async (signal) => {
        if (locationCache.current.countries) return locationCache.current.countries;
        if (promiseCache.current.countries) return promiseCache.current.countries;

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

    const fetchStates = useCallback(async (countryIso2) => {
        if (!countryIso2) return [];
        if (locationCache.current.states[countryIso2]) return locationCache.current.states[countryIso2];
        if (promiseCache.current.states[countryIso2]) return promiseCache.current.states[countryIso2];

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

    const fetchCities = useCallback(async (countryIso2, stateIso2) => {
        if (!countryIso2 || !stateIso2) return [];
        const cacheKey = `${countryIso2}_${stateIso2}`;
        if (locationCache.current.cities[cacheKey]) return locationCache.current.cities[cacheKey];
        if (promiseCache.current.cities[cacheKey]) return promiseCache.current.cities[cacheKey];

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

    const selectedCountry = form.watch(`experiences.${index}.country`);
    const selectedState = form.watch(`experiences.${index}.state`);

    useEffect(() => {
        const loadStates = async () => {
            if (selectedCountry) {
                const countryObj = countries.find(c => c.name === selectedCountry);
                if (countryObj) {
                    const statesData = await fetchStates(countryObj.iso2);
                    setCurrentStates(statesData);
                } else {
                    setCurrentStates([]);
                }
            } else {
                setCurrentStates([]);
            }
        };
        loadStates();
    }, [selectedCountry, countries, fetchStates]);

    useEffect(() => {
        const loadCities = async () => {
            if (selectedCountry && selectedState) {
                const countryObj = countries.find(c => c.name === selectedCountry);
                const stateObj = currentStates.find(s => s.name === selectedState);
                if (countryObj && stateObj) {
                    const citiesData = await fetchCities(countryObj.iso2, stateObj.iso2);
                    setCurrentCities(citiesData);
                } else {
                    setCurrentCities([]);
                }
            } else {
                setCurrentCities([]);
            }
        };
        loadCities();
    }, [selectedCountry, selectedState, countries, currentStates, fetchCities]);

    return (
        <div
            className={`w-full rounded-xl border bg-white shadow-sm ${isReadOnly
                ? 'bg-slate-50 border-slate-200'
                : 'border-slate-200 hover:border-blue-500/50 transition-colors'
                }`}
        >
            <div className="w-full bg-slate-50 rounded-t-xl flex items-center justify-between p-3 lg:p-4">
                <div className="flex flex-col items-start justify-start gap-3 lg:gap-4">
                    <h3 className="text-lg font-medium leading-none tracking-tight text-slate-900 ">
                        {`Experience ${index + 1}`}
                    </h3>
                    <h3 className="text-slate-700  font-medium">
                        {jobTitle || 'Job Title'} <span className="text-slate-500  text-sm">@</span> {company || 'Company name'}
                    </h3>
                </div>

                {!isReadOnly && canRemove && (
                    <Button
                        type="button"
                        onClick={onRemove}
                        variant="ghost"
                        className="h-10 w-10 p-0 text-slate-500  hover:text-red-600 hover:bg-slate-100 "
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">

                {/* Company + Job title */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`company-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 md:gap-3 lg:gap-4"
                        >
                            Company <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`company-${index}`}
                            placeholder="e.g., Movate Technologies"
                            {...form.register(`experiences.${index}.company`)}
                            disabled={isReadOnly}
                            error={!isReadOnly && getError('company')}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`jobTitle-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 md:gap-3 lg:gap-4"
                        >
                            Job Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`jobTitle-${index}`}
                            placeholder="e.g., Technical Support Engineer"
                            {...form.register(`experiences.${index}.jobTitle`)}
                            disabled={isReadOnly}
                            error={!isReadOnly && getError('jobTitle')}
                        />
                    </div>
                </div>

                {/* Employment Type + Work Mode */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`employmentType-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Employment Type{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Controller
                                name={`experiences.${index}.employmentType`}
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(val) => field.onChange(Number(val))}
                                        value={String(field.value)}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger className={!isReadOnly && getError('employmentType') ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EMPLOYMENT_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={String(type.value)}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`workMode-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Work Mode{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Controller
                                name={`experiences.${index}.workMode`}
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(val) => field.onChange(Number(val))}
                                        value={String(field.value)}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger className={!isReadOnly && getError('workMode') ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WORK_MODES.map((mode) => (
                                                <SelectItem key={mode.value} value={String(mode.value)}>
                                                    {mode.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Location Details: Country, State, City */}
                <div className="grid md:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Country  <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name={`experiences.${index}.country`}
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue(`experiences.${index}.state`, '');
                                        form.setValue(`experiences.${index}.city`, '');
                                    }}
                                    value={field.value}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger className={!isReadOnly && getError('country') ? "border-red-500" : ""}>
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

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            State <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name={`experiences.${index}.state`}
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue(`experiences.${index}.city`, '');
                                    }}
                                    value={field.value}
                                    disabled={isReadOnly || currentStates.length === 0}
                                >
                                    <SelectTrigger className={!isReadOnly && getError('state') ? "border-red-500" : ""}>
                                        <SelectValue placeholder={selectedCountry ? "Select State" : "Select Country first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentStates.map(s => (
                                            <SelectItem key={s.iso2} value={s.name}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            City <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name={`experiences.${index}.city`}
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isReadOnly || currentCities.length === 0}
                                >
                                    <SelectTrigger className={!isReadOnly && getError('city') ? "border-red-500" : ""}>
                                        <SelectValue placeholder={selectedState ? "Select City" : "Select State first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentCities.map(c => (
                                            <SelectItem key={c.id || c.name} value={c.name}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="grid md:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`startDate-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 md:gap-3 lg:gap-4"
                        >
                            Start Date <span className="text-red-500">*</span>
                        </Label>
                        <DateInput
                            id={`startDate-${index}`}
                            type="month"
                            placeholder="2025-01"
                            {...form.register(`experiences.${index}.startDate`)}
                            disabled={isReadOnly}
                            error={!isReadOnly && getError('startDate')}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`endDate-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 md:gap-3 lg:gap-4"
                        >
                            End Date <span className="text-red-500">*</span>
                        </Label>
                        <DateInput
                            id={`endDate-${index}`}
                            type="month"
                            placeholder={isCurrent ? 'Present' : '2025-08'}
                            disabled={isReadOnly || isCurrent}
                            {...form.register(`experiences.${index}.endDate`)}
                            className={isCurrent || isReadOnly ? 'cursor-not-allowed' : ''}
                            error={!isCurrent && !isReadOnly && getError('endDate')}
                        />
                    </div>

                    <div className="flex flex-col justify-end space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center h-10 space-x-2 md:space-x-3 lg:space-x-4">
                            <Checkbox
                                id={`isCurrent-${index}`}
                                checked={!!isCurrent}
                                disabled={isCurrentCheckboxDisabled}
                                onCheckedChange={(checked) =>
                                    handleCurrentChange(checked)
                                }
                            />
                            <Label
                                htmlFor={`isCurrent-${index}`}
                                className={`text-sm font-medium leading-none ${isCurrentCheckboxDisabled
                                    ? 'opacity-70 cursor-not-allowed'
                                    : 'cursor-pointer'
                                    }`}
                            >
                                I currently work here
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Skills Section - EDIT MODE vs READ-ONLY MODE */}
                {!isReadOnly ? (
                    // EDIT MODE: Searchable with dropdown
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor={`skills-${index}`}
                                className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4"
                            >
                                Skills Used <span className="text-red-500">*</span>
                            </Label>

                            {selectedSkills.length > 0 && (
                                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                    <Button
                                        type="button"
                                        onClick={handleRemoveAllSkills}
                                        variant="ghost"
                                        className="rounded-full h-auto text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 gap-2 md:gap-3 lg:gap-4"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Clear all</span>
                                    </Button>
                                    <span className="rounded-full bg-slate-100 text-[11px] font-medium text-slate-700 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        {selectedSkills.length} selected
                                    </span>
                                </div>
                            )}
                        </div>

                        {selectedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4 mb-2 md:mb-3 lg:mb-4">
                                {selectedSkills.map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="inline-flex items-center rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                    >
                                        <span className="text-sm">{skill.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill.id)}
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 transition-colors ml-2 md:ml-3 lg:ml-4"
                                            aria-label={`Remove ${skill.name}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="relative z-50">
                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    id={`skills-${index}`}
                                    placeholder="Search skills like Python, React, Docker..."
                                    value={skillSearchQuery}
                                    onChange={(e) => {
                                        setSkillSearchQuery(e.target.value);
                                        setShowSkillDropdown(true);
                                    }}
                                    onFocus={() => {
                                        if (skillSearchQuery.length > 0) {
                                            setShowSkillDropdown(true);
                                        }
                                    }}
                                    autoComplete="off"
                                    className="pl-2 md:pl-3 lg:pl-4 pr-2 md:pr-3 lg:pr-4"
                                />
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                                </span>
                                {skillSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSkillSearchQuery('');
                                            setShowSkillDropdown(false);
                                        }}
                                        className="absolute inset-y-0 right-3 flex items-center text-slate-500  hover:text-slate-700 "
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {showSkillDropdown && skillSearchQuery.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg z-[100] mt-2 md:mt-3 lg:mt-4"
                                >
                                    {filteredSkills.length > 0 ? (
                                        <>
                                            {filteredSkills.slice(0, 10).map((skill) => (
                                                <button
                                                    key={skill.id}
                                                    type="button"
                                                    className="w-full text-left text-sm hover:bg-slate-50 flex items-center transition-colors text-slate-900 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 gap-2 md:gap-3 lg:gap-4"
                                                    onClick={() => handleAddSkill(skill)}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                    <span>{skill.name}</span>
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-sm text-slate-500 flex items-center px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 gap-2 md:gap-3 lg:gap-4">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>
                                                No skills found. Try a different keyword.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-400 mt-2 md:mt-3 lg:mt-4">
                            Add technologies, tools, and frameworks you used for this
                            role to improve matching.
                        </p>
                    </div>
                ) : (
                    // READ-ONLY MODE: Just display badges
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center text-sm font-medium gap-2 md:gap-3 lg:gap-4">
                            <span>Skills Used <span className="text-red-500">*</span> </span>
                        </div>

                        {selectedSkills.length > 0 ? (
                            <div className="flex flex-wrap border border-slate-200 rounded-lg gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4">
                                {selectedSkills.map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="inline-flex items-center rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                    >
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic pb-2 md:pb-3 lg:pb-4">
                                No skills recorded for this experience.
                            </p>
                        )}
                    </div>
                )}

                {/* Summary */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label
                        htmlFor={`summary-${index}`}
                        className="text-sm font-medium leading-none"
                    >
                        Role Summary <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id={`summary-${index}`}
                        rows={4}
                        placeholder="Summarize your role, scope, and impact."
                        {...form.register(`experiences.${index}.summary`)}
                        disabled={isReadOnly}
                        error={!isReadOnly && getError('summary')}
                    />
                    <div className="flex justify-between items-center">
                        {getError('summary') && !isReadOnly && (
                            <p className="text-sm text-red-500 flex items-center gap-2 md:gap-3 lg:gap-4">
                                <AlertCircle className="h-3 w-3" />
                                {getError('summary').message}
                            </p>
                        )}
                        <p className="text-sm text-slate-500">
                            Focus on measurable impact and technologies.
                        </p>

                        <p
                            className={`text-sm ${summaryCharCount > 1000
                                ? 'text-red-500'
                                : 'text-slate-500'
                                }`}
                        >
                            {summaryCharCount}/1000
                        </p>
                    </div>
                </div>



                {/* Achievements */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label
                        htmlFor={`achievements-${index}`}
                        className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4"
                    >
                        Achievements <span className="text-slate-500 font-light">(optional)</span>
                    </Label>
                    <Textarea
                        id={`achievements-${index}`}
                        rows={3}
                        placeholder="List specific achievements, awards, or recognitions."
                        {...form.register(`experiences.${index}.achievements`)}
                        disabled={isReadOnly}
                        error={!isReadOnly && getError('achievements')}
                    />
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">
                            Highlight quantifiable successes.
                        </p>
                        <p className="text-sm text-slate-500">
                            {achievementsCharCount} chars
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
