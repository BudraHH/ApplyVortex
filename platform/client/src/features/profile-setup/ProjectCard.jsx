import { useState, useEffect, useRef } from 'react';
import {
    AlertCircle,
    Trash2,
    X,
    Plus
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

export default function ProjectCard({
    form,
    index,
    onRemove,
    canRemove,
    isReadOnly,
    skillsBase,
}) {
    const [shortDescCharCount, setShortDescCharCount] = useState(0);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);

    const shortDescriptionValue = form.watch(`projects.${index}.shortDescription`);
    const selectedSkills = form.watch(`projects.${index}.skillsUsed`) || [];
    const projectTypeValue = form.watch(`projects.${index}.projectType`);
    const statusValue = form.watch(`projects.${index}.status`);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const filteredSkills = skillsBase.filter(skill => {
        if (!skill?.name) return false;
        const matchesSearch = skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase());
        const notSelected = !selectedSkills.some(s => s.id === skill.id);
        return matchesSearch && notSelected;
    });

    const handleAddSkill = (skill) => {
        if (isReadOnly) return;
        const updated = [...selectedSkills, skill];
        form.setValue(`projects.${index}.skillsUsed`, updated, { shouldValidate: true });
        setSkillSearchQuery('');
        setShowSkillDropdown(false);
    };

    const handleRemoveSkill = (skillId) => {
        if (isReadOnly) return;
        const updated = selectedSkills.filter(s => s.id !== skillId);
        form.setValue(`projects.${index}.skillsUsed`, updated, { shouldValidate: true });
    };

    const handleRemoveAllSkills = () => {
        form.setValue(`projects.${index}.skillsUsed`, [], { shouldValidate: true });
    };

    const getError = (field) => form.formState.errors?.projects?.[index]?.[field];

    const isOngoing = form.watch(`projects.${index}.isOngoing`) || false;

    const handleCurrentChange = (checked) => {
        if (isReadOnly) return;
        form.setValue(`projects.${index}.isOngoing`, checked, { shouldValidate: true });
        if (checked) {
            form.setValue(`projects.${index}.endDate`, '', { shouldValidate: true });
            form.setValue(`projects.${index}.status`, 'in-progress', { shouldValidate: true });
        } else {
            form.setValue(`projects.${index}.status`, 'completed', { shouldValidate: true });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSkillDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setShortDescCharCount(shortDescriptionValue?.length || 0);
    }, [shortDescriptionValue]);

    return (
        <div className={`w-full rounded-xl border bg-white shadow-sm ${isReadOnly ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-blue-500/50 transition-colors'}`}>
            <div className="w-full bg-slate-50 rounded-t-xl flex items-center justify-between p-3 lg:p-4">
                <div className="flex flex-col items-start justify-start gap-3 lg:gap-4">
                    <h3 className="text-lg font-medium leading-none tracking-tight text-slate-900 ">
                        {`Project ${index + 1}`}
                    </h3>
                    <h3 className="text-slate-700  font-medium">
                        {form.watch(`projects.${index}.title`)}</h3>
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
                {/* Title */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`project-title-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Project Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`project-title-${index}`}
                        placeholder="e.g., Real-time Code Collaboration Tool"
                        {...form.register(`projects.${index}.title`)}
                        disabled={isReadOnly}
                        error={!isReadOnly && getError('title')}
                    />
                </div>

                {/* URLs Row */}
                <div className="grid md:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`github-url-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            GitHub Repository
                        </Label>
                        <Input
                            id={`github-url-${index}`}
                            placeholder="https://github.com/..."
                            {...form.register(`projects.${index}.githubUrl`)}
                            disabled={isReadOnly}
                            error={!isReadOnly && getError('githubUrl')}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`live-url-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Live URL
                        </Label>
                        <Input
                            id={`live-url-${index}`}
                            placeholder="https://project.vercel.app"
                            {...form.register(`projects.${index}.liveUrl`)}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`doc-url-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Documentation URL
                        </Label>
                        <Input
                            id={`doc-url-${index}`}
                            placeholder="https://docs.project.com"
                            {...form.register(`projects.${index}.documentationUrl`)}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`project-type-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Project Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={projectTypeValue}
                            onValueChange={(value) => form.setValue(`projects.${index}.projectType`, value, { shouldValidate: true })}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger className={!isReadOnly && getError('projectType') ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="academic">Academic</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="open-source">Open Source</SelectItem>
                                <SelectItem value="freelance">Freelance</SelectItem>
                                <SelectItem value="hackathon">Hackathon</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`project-status-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Status <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={statusValue}
                            onValueChange={(value) => {
                                form.setValue(`projects.${index}.status`, value, { shouldValidate: true });
                                if (value === 'in-progress') {
                                    form.setValue(`projects.${index}.isOngoing`, true, { shouldValidate: true });
                                    form.setValue(`projects.${index}.endDate`, '', { shouldValidate: true });
                                } else {
                                    form.setValue(`projects.${index}.isOngoing`, false, { shouldValidate: true });
                                }
                            }}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger className={!isReadOnly && getError('status') ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!isReadOnly ? (
                    // EDIT MODE: Searchable with dropdown
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor={`skills-${index}`}
                                className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4"
                            >
                                Tech Stack / Skills Used <span className="text-red-500">*</span>
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
                                    className="absolute w-full max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg z-[100] mt-2 md:mt-3 lg:mt-4"
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
                            <span>Skills Used</span>
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
                                No recorded for this experience.
                            </p>
                        )}
                    </div>
                )}

                {/* Dates */}
                <div className="grid md:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`startDate-${index}`}
                            className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4"
                        >
                            Start Date <span className="text-red-500">*</span>
                        </Label>
                        <DateInput
                            id={`startDate-${index}`}
                            type="month"
                            placeholder="2025-01"
                            {...form.register(`projects.${index}.startDate`)}
                            disabled={isReadOnly}
                            error={!isReadOnly && getError('startDate')}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label
                            htmlFor={`endDate-${index}`}
                            className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4"
                        >
                            End Date{' '}
                            {!isOngoing && (
                                <span className="text-red-500">*</span>
                            )}
                        </Label>
                        <DateInput
                            id={`endDate-${index}`}
                            type="month"
                            placeholder={isOngoing ? 'Present' : '2025-08'}
                            disabled={isReadOnly || isOngoing}
                            {...form.register(`projects.${index}.endDate`)}
                            className={isOngoing || isReadOnly ? 'cursor-not-allowed' : ''}
                            error={!isOngoing && !isReadOnly && getError('endDate')}
                        />
                    </div>

                    <div className="flex flex-col justify-end space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="flex items-center h-10 space-x-2 md:space-x-3 lg:space-x-4">
                            <Checkbox
                                id={`isCurrent-${index}`}
                                checked={!!isOngoing}
                                onCheckedChange={(checked) => handleCurrentChange(checked)}
                                disabled={isReadOnly}
                            />
                            <Label
                                htmlFor={`isCurrent-${index}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                On going
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Short Description */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`short-desc-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Short Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id={`short-desc-${index}`}
                        rows={3}
                        placeholder="Brief summary of the project..."
                        {...form.register(`projects.${index}.shortDescription`)}
                        disabled={isReadOnly}
                        error={!isReadOnly && getError('shortDescription')}
                    />
                    <div className="flex justify-between items-center">
                        {getError('shortDescription') && !isReadOnly && (
                            <p className="text-sm text-red-500 flex items-center gap-2 md:gap-3 lg:gap-4">
                                <AlertCircle className="h-3 w-3" />
                                {getError('shortDescription').message}
                            </p>
                        )}
                        <p className="text-sm text-slate-400 ">
                            Visible on project cards (max 500 chars).
                        </p>
                        <p className={`text-sm ${shortDescCharCount > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                            {shortDescCharCount} /500
                        </p>
                    </div>
                </div>

                {/* Detailed Description */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`detailed-desc-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Detailed Description
                    </Label>
                    <Textarea
                        id={`detailed-desc-${index}`}
                        rows={6}
                        placeholder="In-depth explanation of architecture, implementation details, etc..."
                        {...form.register(`projects.${index}.detailedDescription`)}
                        disabled={isReadOnly}
                    />
                </div>



            </div>
        </div >
    );
}
