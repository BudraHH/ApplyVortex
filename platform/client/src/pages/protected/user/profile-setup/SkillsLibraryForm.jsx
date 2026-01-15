// src/pages/protected/profile-setup/SkillsLibraryForm.jsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast.js";
import {
    ArrowLeft,
    ArrowRight,
    Plus,
    X,
    Sparkles,
    Code2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Save,
    Edit3,
    RefreshCw,
} from "lucide-react";
import isEqual from 'lodash.isequal';

import { Input } from "@/components/ui/Input.jsx";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/routes.js";
import { skillsAPI } from "@/services/api/skillsAPI.js";
import { SkillsCategory, SkillSubCategory } from "@/constants/constants.js";

// ============================================
// VALIDATION SCHEMA
// ============================================
const skillSchema = z.object({
    name: z
        .string()
        .min(2, "Skill name must be at least 2 characters")
        .max(50, "Skill name must not exceed 50 characters")
        .regex(/^[a-zA-Z0-9\s+#.-]+$/, "Invalid skill name format"),
});

const findLabel = (constObj, value) => {
    const entry = Object.entries(constObj).find(([k, v]) => v === Number(value));
    return entry ? entry[0] : "OTHER";
};


// ============================================
// SKILL BADGE COMPONENT
// ============================================
function SkillBadge({ skill, onRemove, isReadOnly }) {
    return (
        <span
            className="inline-flex items-center rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 group p-4"
        >
            <span>{skill}</span>
            {!isReadOnly && (
                <button
                    type="button"
                    onClick={() => onRemove(skill)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-100/50 hover:text-red-600 transition-colors ml-4"
                    aria-label={`Remove ${skill}`}
                >
                    <X className="h-3 w-3 group-hover:text-red-600 text-slate-500" />
                </button>
            )}
        </span>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SkillsLibraryForm() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [userSkills, setUserSkills] = useState([]);
    const [skillsBase, setSkillsBase] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [originalData, setOriginalData] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const skillForm = useForm({
        resolver: zodResolver(skillSchema),
        mode: "onChange",
        defaultValues: { name: "" },
    });

    // ============================================
    // FETCH EXISTING USER SKILLS
    // ============================================
    // ============================================
    // FETCH EXISTING USER SKILLS
    // ============================================
    const loadSkills = useCallback(async (isRefreshCall = false) => {
        if (isRefreshCall) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const response = await skillsAPI.getUserSkills();

            let userSkills = [];
            if (Array.isArray(response)) {
                if (typeof response[0] === "string") {
                    // Legacy string support
                    userSkills = response.map(name => ({ id: null, name, category: "Other" }));
                } else {
                    userSkills = response.map((s) => ({
                        id: s.id || null,
                        name: s.name,
                        category: s.category ?? 999,
                        sub_category: s.sub_category ?? 9999
                    })).filter(s => s.name);
                }
            } else if (response?.skills && Array.isArray(response.skills)) {
                if (typeof response.skills[0] === "string") {
                    userSkills = response.skills.map(name => ({ id: null, name, category: "Other" }));
                } else {
                    userSkills = response.skills.map((s) => ({
                        id: s.id || null,
                        name: s.name,
                        category: s.category ?? 999,
                        sub_category: s.sub_category ?? 9999
                    })).filter(s => s.name);
                }
            }

            if (userSkills.length > 0) {
                setUserSkills(userSkills);
                setOriginalData(userSkills);
                setHasData(true);
            } else {
                setUserSkills([]);
                setOriginalData([]);
                setHasData(false);
            }
        } catch (error) {
            console.error("Failed to fetch skills:", error);
            if (isRefreshCall) {
                toast({
                    title: "Refresh Failed",
                    description: "Failed to refresh skills data.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load skills. Starting fresh.",
                    variant: "destructive",
                });
            }
            setUserSkills([]);
            setOriginalData([]);
            setHasData(false);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        loadSkills();
    }, [loadSkills]);

    // ============================================
    // FETCH AVAILABLE SKILLS (AUTOCOMPLETE)
    // ============================================
    // Removed automatic effect, now handled in handleEdit
    // as per requirement to fetch only when Add/Edit is clicked

    // ============================================
    // FILTER SKILLS
    // ============================================
    const filteredOptions = skillsBase
        .filter((skill) => {
            const matchesInput = inputValue.trim()
                ? skill.name.toLowerCase().startsWith(inputValue.toLowerCase())
                : true;
            const isNotSelected = !userSkills.some(
                (s) => s.name.toLowerCase() === skill.name.toLowerCase()
            );
            return matchesInput && isNotSelected;
        })
        .slice(0, 50);

    const handleSelectSkill = (skillName) => {
        if (userSkills.some((skill) => skill.name.toLowerCase() === skillName.toLowerCase())) {
            toast({
                title: "Duplicate Skill",
                description: "This skill is already added",
                variant: "destructive",
            });
            return;
        }

        // Find skill from skillsBase to get ID and category
        const selectedSkill = skillsBase.find(s => s.name === skillName);
        const skillId = selectedSkill?.id || null;
        const category = selectedSkill?.category ?? 999;
        const sub_category = selectedSkill?.sub_category ?? 9999;

        setUserSkills([...userSkills, { id: skillId, name: skillName, category, sub_category }]);
        setInputValue("");
        setShowSuggestions(false);
        skillForm.reset();

        toast({
            title: "Skill Added",
            description: `${skillName} has been added`,
        });
    };

    // ============================================
    // ADD SKILL
    // ============================================
    const handleAddSkill = () => {
        const trimmedValue = inputValue.trim();

        if (!trimmedValue) {
            toast({
                title: "Invalid Input",
                description: "Please enter a skill name",
                variant: "destructive",
            });
            return;
        }

        if (userSkills.some((skill) => skill.name.toLowerCase() === trimmedValue.toLowerCase())) {
            toast({
                title: "Duplicate Skill",
                description: "This skill is already added",
                variant: "destructive",
            });
            return;
        }

        try {
            skillSchema.parse({ name: trimmedValue });
            // Manual entry - no ID available, will be created on backend. 999 is OTHER.
            setUserSkills([...userSkills, { id: null, name: trimmedValue, category: 999, sub_category: 9999 }]);
            setInputValue("");
            skillForm.reset();

            toast({
                title: "Skill Added",
                description: `${trimmedValue} has been added`,
            });
        } catch (error) {
            toast({
                title: "Invalid Skill",
                description: error.errors?.[0]?.message || "Invalid skill format",
                variant: "destructive",
            });
        }
    };

    // ============================================
    // REMOVE SKILL
    // ============================================
    const handleRemoveSkill = (skillToRemoveName) => {
        setUserSkills(userSkills.filter((skill) => skill.name !== skillToRemoveName));
        toast({
            title: "Skill Removed",
            description: `${skillToRemoveName} has been removed`,
        });
    };

    const handleClearAll = () => {
        setUserSkills([]);
        toast({
            title: "Skills Cleared",
            description: "All skills have been removed",
        });
    };

    // ============================================
    // SAVE SKILLS
    // ============================================
    const handleSave = async () => {
        // 1. Guard Clause - Deep compare current skills with original data
        if (isEdit && isEqual(userSkills, originalData)) {
            setIsEdit(false);
            return;
        }

        setIsSaving(true);
        try {
            // Transform to API expected format with skill IDs
            const payload = {
                skills: userSkills.map(skill => ({
                    id: skill.id,  // Include skill ID
                    name: skill.name,
                    proficiency_level: "intermediate", // Default for now
                    years_of_experience: 0,
                    is_primary: false
                }))
            };

            await skillsAPI.replaceUserSkills(payload);

            setOriginalData(userSkills);
            setIsEdit(false);

            toast({
                title: "Success!",
                description: "Skills saved successfully",
            });
        } catch (error) {
            console.error("Save error:", error);
            toast({
                title: "Error",
                description: "Failed to save skills",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClickEdit = async () => {
        try {
            // Fetch all skills for autocomplete when entering edit mode
            const response = await skillsAPI.searchSkills("", 1000);
            if (response?.skills) {
                setSkillsBase(response.skills);
            }
        } catch (error) {
            console.error("Failed to fetch available skills", error);
            toast({
                title: "Error",
                description: "Failed to load skills list",
                variant: "destructive",
            });
        }
        setIsEdit(true);
    };

    const handleClickCancel = () => {
        setUserSkills(originalData);
        setInputValue("");
        setIsEdit(false);
    };

    // ============================================
    // NAVIGATION
    // ============================================
    const handlePrevious = () => {
        if (isEdit) setIsEdit(false);
        navigate(ROUTES.PROFILE_SETUP.ACCOMPLISHMENTS);
    };



    const isFormValid = true;

    const handleRefresh = () => {
        loadSkills(true);
    };
    // ============================================
    // LOADING STATE
    // ============================================


    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div className="w-full mx-auto bg-white space-y-4 p-4">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-row justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Skills Library</h2>
                            <p className="text-slate-500 text-sm">
                                Add your technical and professional skills
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">



                        {/* Skills Counter */}
                        <div className="flex items-center gap-4">
                            {isLoading || isRefreshing ? (
                                <Skeleton className="h-9 w-24 rounded-lg" />

                            ) : (
                                <>
                                    {userSkills.length < 5 && (
                                        <span className="text-sm text-red-500">
                                            Minimum 5 required *
                                        </span>
                                    )}
                                    <div className={`inline-flex items-center rounded-lg text-sm font-medium transition-colors ${userSkills.length < 5 ? "bg-red-50 text-red-600 border border-red-200" : isFormValid ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"} gap-4 p-4`}>
                                        <span>{userSkills.length} skill{userSkills.length !== 1 ? "s" : ""}</span>
                                    </div>

                                </>
                            )}

                        </div>
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isLoading || isRefreshing || isSaving}
                            className="gap-4"
                        >
                            <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
                            {isLoading ? 'Loading...' : isRefreshing ? 'Refreshing...' : isSaving ? 'Saving...' : 'Refresh Intel'}
                        </Button>
                    </div>
                </div>

                {/* Add Skill Input (Edit Mode) */}
                {isEdit && (
                    <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <Code2 className="h-4 w-4 text-brand-600" />
                            <Label htmlFor="skill-input" className="text-sm font-medium text-slate-900">
                                Add New Skill
                            </Label>
                        </div>

                        <div className="relative">
                            <Input
                                id="skill-input"
                                placeholder="e.g., JavaScript, Python, Leadership..."
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => {
                                    // Delay hiding suggestions to allow click event to fire
                                    setTimeout(() => setShowSuggestions(false), 200);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddSkill();
                                        setShowSuggestions(false);
                                    }
                                }}
                                disabled={isSaving}
                                className="w-full"
                                autoComplete="off"
                            />

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && filteredOptions.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto mt-4 py-4">
                                    {filteredOptions.map((skill) => (
                                        <li
                                            key={skill.id || skill.name}
                                            className="hover:bg-slate-100 cursor-pointer text-sm text-slate-900 flex items-center justify-between group p-4"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent input blur
                                                handleSelectSkill(skill.name);
                                            }}
                                        >
                                            <span className="font-medium">{skill.name}</span>
                                            {skill.category !== undefined && (
                                                <span className="text-xs text-slate-500  group-hover:text-slate-700 ">
                                                    {findLabel(SkillsCategory, skill.category).replace(/_/g, " ")}
                                                    {skill.sub_category !== undefined && Number(skill.category) !== 99 && !["OTHER", "NONE"].includes(findLabel(SkillSubCategory, skill.sub_category)) && (
                                                        <span className="flex items-center">
                                                            <ChevronRight className="h-3 w-3 opacity-50 mx-4" />
                                                            {findLabel(SkillSubCategory, skill.sub_category).replace(/_/g, " ")}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <p className="text-xs text-slate-500">
                            Press Enter to add a skill
                        </p>
                    </div>
                )}

                {/* Skills Display */}
                <div className="w-full border border-slate-200 rounded-lg overflow-hidden">
                    <div className="w-full bg-slate-50 border-b border-slate-200 p-4">
                        <div className="w-full flex justify-between items-center gap-4">
                            <h3 className="text-base font-semibold text-slate-900">Your Skills</h3>
                            {isEdit && userSkills.length > 0 && (
                                <Button
                                    type="button"
                                    onClick={handleClearAll}
                                    variant="ghost"
                                    className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 h-auto uppercase tracking-wider p-4"
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>

                    </div>

                    {isLoading || isRefreshing ? (
                        <div className="p-4">
                            <div className="space-y-4">
                                {/* Category 1 Skeleton (e.g., Computer Domain) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-6 w-48 rounded" />
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>

                                    <div className="space-y-4 pl-4">
                                        {/* Subcategories */}
                                        {[1, 2, 3, 4].map((j) => (
                                            <div key={j} className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                                                    <Skeleton className="h-3 w-32 rounded" />
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <Skeleton key={`skill-${j}-${i}`} className="h-9 w-24 rounded-md" />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Category 2 Skeleton (e.g., Soft Skills) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-6 w-36 rounded" />
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>
                                    <div className="pl-4">
                                        <div className="flex flex-wrap gap-4">
                                            {[1, 2, 3,].map((i) => (
                                                <Skeleton key={`skill-3-${i}`} className="h-9 w-24 rounded-md" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4">
                            {userSkills.length > 0 ? (
                                <div className="space-y-4">
                                    {Object.entries(
                                        userSkills.reduce((acc, skill) => {
                                            const cat = skill.category ?? 999;
                                            const sub = skill.sub_category ?? 9999;
                                            if (!acc[cat]) acc[cat] = {};
                                            if (!acc[cat][sub]) acc[cat][sub] = [];
                                            acc[cat][sub].push(skill);
                                            return acc;
                                        }, {})
                                    ).sort((a, b) => Number(a[0]) - Number(b[0]))
                                        .map(([category, subcategories]) => (
                                            <div key={category} className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest bg-slate-100 rounded-sm border-l-2 border-brand-600 p-4">
                                                        {findLabel(SkillsCategory, category).replace(/_/g, " ")}
                                                    </h4>
                                                    <div className="flex-1 h-px bg-slate-200"></div>
                                                </div>

                                                <div className="space-y-4 pl-4">
                                                    {Object.entries(subcategories)
                                                        .sort((a, b) => Number(a[0]) - Number(b[0]))
                                                        .map(([subcategory, skills]) => (
                                                            <div key={subcategory} className="space-y-4">
                                                                {/* Only show subcategory if it's not "Other"/"None", it's not Soft Skills, or if there are multiple subcategories */}
                                                                {Number(category) !== 99 && findLabel(SkillSubCategory, subcategory) !== "NONE" && (findLabel(SkillSubCategory, subcategory) !== "OTHER" || Object.keys(subcategories).length > 1) && (
                                                                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-tight flex items-center gap-4">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400"></div>
                                                                        {findLabel(SkillSubCategory, subcategory).replace(/_/g, " ")}
                                                                    </h5>
                                                                )}
                                                                <div className="flex flex-wrap gap-4">
                                                                    {skills.sort((a, b) => a.name.localeCompare(b.name)).map((skill) => (
                                                                        <span
                                                                            key={skill.name}
                                                                            className="group inline-flex items-center rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm transition-all hover:bg-brand-50 active:scale-95 gap-4 p-4"
                                                                        >
                                                                            <span>{skill.name}</span>
                                                                            {isEdit && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveSkill(skill.name)}
                                                                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-100 transition-colors"
                                                                                    aria-label={`Remove ${skill.name}`}
                                                                                >
                                                                                    <X className="h-3 w-3 text-red-600" />
                                                                                </button>
                                                                            )}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-4">
                                    <Sparkles className="h-12 w-12 text-slate-500 mb-4" />
                                    <p className="text-slate-500 text-sm font-medium">
                                        No skills added yet
                                    </p>
                                    <p className="text-slate-500 text-xs mt-4">
                                        Start by adding your first skill above
                                    </p>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Save/Cancel Buttons (Edit Mode) */}

                </div>
            </div>
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
                                type="button"
                                onClick={handleSave}
                                disabled={!isFormValid || isSaving}
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
                                disabled={isSaving}
                                variant={`${isLoading || isRefreshing ? "disabled" : "primary"}`}
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
