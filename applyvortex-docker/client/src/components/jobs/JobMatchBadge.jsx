import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Zap, AlertCircle } from "lucide-react";

export function JobMatchBadge({ matchScore }) {
    if (!matchScore) return null;

    const {
        overall_match,
        skill_match,
        experience_match,
        location_match,
        matched_skills,
        missing_skills,
        is_strong_match
    } = matchScore;

    const percentage = Math.round(overall_match * 100);

    // Color logic
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
    if (percentage >= 80) colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
    else if (percentage >= 60) colorClass = "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
    else if (percentage >= 40) colorClass = "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
    else colorClass = "bg-red-50 text-red-700 border-red-100 hover:bg-red-100";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "flex items-center rounded-full text-xs font-semibold cursor-pointer transition-colors border gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4",
                        colorClass
                    )}
                >
                    <Sparkles className="w-3 h-3" />
                    {percentage}% Match
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                <div className="bg-slate-900 text-white p-2 md:p-3 lg:p-4">
                    <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
                        <h4 className="font-semibold flex items-center gap-2 md:gap-3 lg:gap-4">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            Match Analysis
                        </h4>
                        <span className="text-xl font-bold">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-slate-700" indicatorClassName={percentage >= 80 ? "bg-emerald-500" : "bg-blue-500"} />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                    {/* Breakdown */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Score Breakdown</h5>
                        <div className="grid grid-cols-2 text-sm gap-2 md:gap-3 lg:gap-4">
                            <div className="flex justify-between bg-gray-50 rounded p-2 md:p-3 lg:p-4">
                                <span>Skills</span>
                                <span className="font-semibold">{Math.round(skill_match * 100)}%</span>
                            </div>
                            <div className="flex justify-between bg-gray-50 rounded p-2 md:p-3 lg:p-4">
                                <span>Experience</span>
                                <span className="font-semibold">{Math.round(experience_match * 100)}%</span>
                            </div>
                            <div className="flex justify-between bg-gray-50 rounded p-2 md:p-3 lg:p-4">
                                <span>Location</span>
                                <span className="font-semibold">{Math.round(location_match * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Missing Skills */}
                    {missing_skills && missing_skills.length > 0 && (
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <h5 className="text-xs font-medium text-amber-600 uppercase tracking-wider flex items-center gap-2 md:gap-3 lg:gap-4">
                                <AlertCircle className="w-3 h-3" />
                                Missing Skills
                            </h5>
                            <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4">
                                {missing_skills.map((skill, i) => (
                                    <Badge key={i} variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Matched Skills */}
                    {matched_skills && matched_skills.length > 0 && (
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <h5 className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Matched Skills</h5>
                            <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4">
                                {matched_skills.map((skill, i) => (
                                    <Badge key={i} variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-800">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
