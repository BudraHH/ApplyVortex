// src/features/profile-setup/EducationCard.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { locationAPI } from '@/services/api/locationAPI';
import {
    Trash2
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

const DEGREE_TYPES = [
    { value: 'phd', label: 'Ph.D. / Doctorate' },
    { value: 'masters', label: "Master's " },
    { value: 'bachelors', label: "Bachelor's " },
    { value: 'diploma', label: 'Diploma' },
    { value: 'certification', label: 'Professional Certification' },
];

const GRADE_SYSTEMS = [
    { value: 'CGPA', label: 'CGPA (out of 10)' },
    { value: 'GPA', label: 'GPA (out of 4)' },
    { value: 'Percentage', label: 'Percentage (%)' },
    { value: 'Grade', label: 'Grade (A/B/C)' },
];

const EDUCATION_STATUSES = [
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'dropped-out', label: 'Dropped Out' },
];

export default function EducationCard({ form, index, onRemove, onCurrentlyStudyingChange, canRemove, isReadOnly }) {
    const isCurrentlyStudying = form.watch(`education.${index}.isCurrent`);

    const descriptionValue = form.watch(`education.${index}.description`);
    const [descCharCount, setDescCharCount] = useState(0);

    const isEdit = !isReadOnly;

    // ✅ Watch all form values
    const degreeTypeValue = form.watch(`education.${index}.degreeType`) || '';
    const gradeSystemValue = form.watch(`education.${index}.gradeSystem`) || '';
    const statusValue = form.watch(`education.${index}.status`) || '';

    const degreeLabel = DEGREE_TYPES.find(d => d.value === degreeTypeValue)?.label || `Education ${index + 1}`;

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

    // Cascading Location State: Current Address
    const [countries, setCountries] = useState([]);
    const [currentStates, setCurrentStates] = useState([]);
    const [currentCities, setCurrentCities] = useState([]);

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



    useEffect(() => {
        setDescCharCount(descriptionValue?.length || 0);
    }, [descriptionValue]);

    const getError = (field) => {
        return form.formState.errors?.education?.[index]?.[field];
    };


    const selectedCountry = form.watch(`education.${index}.country`);
    const selectedState = form.watch(`education.${index}.state`);

    // Effect to fetch states when country changes
    useEffect(() => {
        const loadStates = async () => {
            if (selectedCountry) {
                // Find country ISO2
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

    // Effect to fetch cities when state changes
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
        <div className={`w-full rounded-xl border bg-white shadow-sm ${isReadOnly ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-blue-500/50 transition-colors'
            }`}>
            <div className="bg-slate-50 flex items-center justify-between rounded-t-xl p-3 lg:p-4">
                <h3 className="text-lg font-medium leading-none tracking-tight text-slate-900 ">{degreeLabel}</h3>
                {canRemove && !isReadOnly && (
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
                {/* Row 1: Degree Type (Select) + Degree Name (Input) */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`degreeType-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Degree Type <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Controller
                                name={`education.${index}.degreeType`}
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger className={getError('degreeType') ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select degree type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DEGREE_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
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
                        <Label htmlFor={`degreeName-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Degree Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`degreeName-${index}`}
                            placeholder="e.g., Master of Technology, B.Tech"
                            {...form.register(`education.${index}.degreeName`)}
                            disabled={isReadOnly}
                            error={getError('degreeName')}
                        />
                    </div>
                </div>

                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`fieldOfStudy-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Field of Study <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`fieldOfStudy-${index}`}
                        placeholder="e.g., Computer Science"
                        {...form.register(`education.${index}.fieldOfStudy`)}
                        disabled={isReadOnly}
                        error={getError('fieldOfStudy')}
                    />
                </div>

                {/* Institutions */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`institution-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Institution <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`institution-${index}`}
                            placeholder="e.g., IIT Bombay"
                            {...form.register(`education.${index}.institution`)}
                            disabled={isReadOnly}
                            error={getError('institution')}
                        />
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`university-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            University (if different)
                        </Label>
                        <Input
                            id={`university-${index}`}
                            placeholder="e.g., University of Mumbai"
                            {...form.register(`education.${index}.universityName`)}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                {/* Location - Cascading Selects */}
                <div className="grid md:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Country <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name={`education.${index}.country`}
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue(`education.${index}.state`, '');
                                        form.setValue(`education.${index}.city`, '');
                                    }}
                                    value={field.value}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger className={getError('country') ? "border-red-500" : ""}>
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
                            name={`education.${index}.state`}
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue(`education.${index}.city`, '');
                                    }}
                                    value={field.value}
                                    disabled={isReadOnly || currentStates.length === 0}
                                >
                                    <SelectTrigger className={getError('state') ? "border-red-500" : ""}>
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
                            name={`education.${index}.city`}
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isReadOnly || currentCities.length === 0}
                                >
                                    <SelectTrigger className={getError('city') ? "border-red-500" : ""}>
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

                {/* Row 3: Start Date + End Date + Currently Studying */}
                <div className="grid md:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`startDate-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Start Date <span className="text-red-500">*</span>
                        </Label>
                        <DateInput
                            id={`startDate-${index}`}
                            type="month"
                            {...form.register(`education.${index}.startDate`)}
                            disabled={isReadOnly}
                            error={getError('startDate')}
                        />
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`endDate-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            End Date <span className="text-red-500">*</span>
                        </Label>
                        <DateInput
                            id={`endDate-${index}`}
                            type="month"
                            placeholder={isCurrentlyStudying ? 'Present' : 'YYYY-MM'}
                            disabled={isCurrentlyStudying || isReadOnly}
                            {...form.register(`education.${index}.endDate`)}
                            className={isCurrentlyStudying ? 'bg-slate-100  cursor-not-allowed' : ''}
                            error={!isCurrentlyStudying && getError('endDate')}
                        />
                    </div>

                    <div className="flex justify-start items-end space-y-2 md:space-y-3 lg:space-y-4">
                        <Label className="flex items-center text-sm font-medium h-10 cursor-pointer select-none gap-2 md:gap-3 lg:gap-4">
                            <Checkbox
                                id={`isCurrent-${index}`}
                                checked={!!isCurrentlyStudying}
                                disabled={isReadOnly}
                                onCheckedChange={(checked) => {
                                    if (onCurrentlyStudyingChange) {
                                        const canProceed = onCurrentlyStudyingChange(index, checked);
                                        if (canProceed === false) {
                                            return;
                                        }
                                    }

                                    form.setValue(
                                        `education.${index}.isCurrent`,
                                        checked,
                                        { shouldValidate: true }
                                    );
                                    if (checked) {
                                        form.setValue(`education.${index}.endDate`, '', {
                                            shouldValidate: true,
                                        });
                                        form.setValue(`education.${index}.status`, 'in-progress', { shouldValidate: true });
                                    } else {
                                        form.setValue(`education.${index}.status`, 'completed', { shouldValidate: true });
                                    }
                                }}
                            />
                            Currently studying
                        </Label>
                    </div>
                </div>

                {/* Status + Grade */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`status-${index}`} className="text-sm font-medium leading-none">
                            Status <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Controller
                                name={`education.${index}.status`}
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            if (val === 'in-progress') {
                                                form.setValue(`education.${index}.isCurrent`, true, { shouldValidate: true });
                                                form.setValue(`education.${index}.endDate`, '', { shouldValidate: true });
                                            } else {
                                                form.setValue(`education.${index}.isCurrent`, false, { shouldValidate: true });
                                            }
                                        }}
                                        value={field.value}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger className={getError('status') ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EDUCATION_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Grade + Grade System */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`grade-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Grade / Score <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`grade-${index}`}
                            placeholder="e.g., 8.5 or 85"
                            {...form.register(`education.${index}.grade`)}
                            disabled={isReadOnly}
                            error={getError('grade')}
                        />
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`gradeSystem-${index}`} className="text-sm font-medium leading-none">
                            Grade System <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Controller
                                name={`education.${index}.gradeSystem`}
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger className={getError('gradeSystem') ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select grade system" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GRADE_SYSTEMS.map((system) => (
                                                <SelectItem key={system.value} value={system.value}>
                                                    {system.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`description-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Description
                    </Label>
                    <Textarea
                        id={`description-${index}`}
                        rows={3}
                        placeholder="Brief overview of your studies..."
                        {...form.register(`education.${index}.description`)}
                        disabled={isReadOnly}
                    />
                    <div className="flex justify-end pt-2 md:pt-3 lg:pt-4">
                        <p className={`text-sm font-medium ${descCharCount > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                            {descCharCount}/500
                        </p>
                    </div>
                </div>

                {/* Relevant Coursework */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`coursework-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Relevant Coursework
                    </Label>
                    <Textarea
                        id={`coursework-${index}`}
                        rows={3}
                        placeholder="List relevant courses (one per line)..."
                        {...form.register(`education.${index}.relevantCoursework`)}
                        disabled={isReadOnly}
                    />
                    <p className="text-xs text-slate-400 ">Enter each course on a new line.</p>
                </div>

                {/* Thesis - Only for Masters or PhD */}
                {(degreeTypeValue === 'masters' || degreeTypeValue === 'phd') && (
                    <div className="border-t border-slate-200 space-y-2 md:space-y-3 lg:space-y-4 pt-2 md:pt-3 lg:pt-4">
                        <h4 className="text-sm font-semibold text-slate-900 ">Thesis & Research</h4>
                        <div className="grid md:grid-cols-1 gap-2 md:gap-3 lg:gap-4">
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label htmlFor={`thesisTitle-${index}`} className="text-sm font-medium leading-none">Thesis Title</Label>
                                <Input
                                    id={`thesisTitle-${index}`}
                                    placeholder="PhD/Masters Thesis Title"
                                    {...form.register(`education.${index}.thesisTitle`)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label htmlFor={`thesisDesc-${index}`} className="text-sm font-medium leading-none">Thesis Description</Label>
                                <Textarea
                                    id={`thesisDesc-${index}`}
                                    rows={3}
                                    placeholder="Brief description of your research..."
                                    {...form.register(`education.${index}.thesisDescription`)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label htmlFor={`researchAreas-${index}`} className="text-sm font-medium leading-none">Research Areas (one per line)</Label>
                                <Textarea
                                    id={`researchAreas-${index}`}
                                    rows={2}
                                    {...form.register(`education.${index}.researchAreas`)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <Label htmlFor={`publications-${index}`} className="text-sm font-medium leading-none">Publications (one per line)</Label>
                                <Textarea
                                    id={`publications-${index}`}
                                    rows={2}
                                    {...form.register(`education.${index}.publications`)}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}
