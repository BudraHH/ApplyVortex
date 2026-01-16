// src/pages/protected/profile-setup/ResumeUploadPage.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.js";
import { resumeAPI } from '@/services/api/resumeAPI.js';
import {
    Upload,
    FileText,
    FileSearch, // For dramatic empty state
    Trash2,
    Loader2,
    ArrowRight,
    ExternalLink,
    Clock,
    File,
    Edit3,
    Plus, X, Save,
    RefreshCw,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/routes/routes.js";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from "@/stores/notificationStore.js";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================
// CONSTANTS
// ============================================
const ALLOWED_TYPES = [".pdf"];

const PARSING_STATUS = {
    PENDING: 1,
    PROCESSING: 2,
    SUCCESS: 3,
    FAILED: 4,
    SKIPPED: 5
};

// ============================================
// SINGLE RESUME CARD COMPONENT
// ============================================
function ResumeCard({ resume, onDelete }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(resume.id);
        setIsDeleting(false);
    };

    return (
        <div className="group relative rounded-lg border border-slate-100 hover:border-slate-200 bg-white transition-all duration-300 p-3 lg:p-4"
        >
            <div className="flex items-center gap-3 lg:gap-4">
                <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                    {/* File Icon */}
                    <FileText className="h-8 w-8 flex-shrink-0" />
                    {/* Resume Details */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm lg:text-lg font-semibold text-slate-900 truncate mb-1 ">
                            {resume.name}
                        </h4>

                        <div className="flex flex-wrap items-center text-xs lg:text-sm text-slate-500 gap-2 lg:gap-4">
                            <span className="flex items-center gap-1 ">
                                <Clock className="h-3.5 w-3.5 hidden lg:block" />
                                {resume.uploadedAt}
                            </span>
                            <span className="hidden lg:block w-1 h-1 rounded-full bg-slate-400" />
                            <span className="hidden lg:block">{resume.size}</span>
                            {resume.parsingStatus === PARSING_STATUS.SUCCESS ? (
                                <>
                                    <span className="hidden lg:block w-1 h-1 rounded-full bg-slate-400" />
                                    <span className="text-emerald-600 font-medium flex items-center gap-1 lg:gap-4">
                                        Parsed
                                    </span>
                                </>
                            ) : resume.parsingStatus === PARSING_STATUS.FAILED ? (
                                <>
                                    <span className="hidden lg:block w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-red-600 font-medium">Parsing Failed</span>
                                </>
                            ) : (
                                <>
                                    <span className="hidden lg:block w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-brand-600 font-medium flex items-center gap-1 lg:gap-4">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Analyzing...
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            try {
                                const { download_url } = await resumeAPI.getDownloadUrl(resume.id);
                                window.open(download_url, '_blank');
                            } catch (error) {
                                console.error("Failed to open resume:", error);
                            }
                        }}
                        className="gap-2 lg:gap-4 px-2 lg:px-4"
                        title="Preview Resume"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden lg:inline">Preview</span>
                    </Button>

                    {/* Only show delete if passed */}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            title="Delete Resume"
                            className="hover:text-red-600 hover:bg-red-50 -mr-2 lg:mr-0 text-slate-400"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Trash2 className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ResumeUploadPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isEdit, setIsEdit] = useState(false); // Controls View vs Edit/Upload mode
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Single active resume
    const [currentResume, setCurrentResume] = useState(null);

    // ============================================
    // FETCH EXISTING RESUME
    // ============================================
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    const startParsingStatusPoll = (resumeId) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            try {
                const data = await resumeAPI.getResume(resumeId);

                setCurrentResume(prev => {
                    if (!prev || prev.id !== resumeId) return prev;
                    return {
                        ...prev,
                        parsingStatus: data.parsing_status
                    };
                });

                if (data.parsing_status === PARSING_STATUS.SUCCESS || data.parsing_status === PARSING_STATUS.FAILED) {
                    clearInterval(pollIntervalRef.current);
                    if (data.parsing_status === PARSING_STATUS.SUCCESS) {
                        toast({ title: "Parsing Complete", description: "Your resume has been analyzed successfully." });
                    } else {
                        toast({ title: "Parsing Failed", description: "We couldn't parse this resume.", variant: "destructive" });
                    }
                }
            } catch (e) {
                console.error("Poll failed", e);
            }
        }, 15000); // Poll every 15 seconds
    };

    const fetchResumes = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const data = await resumeAPI.getResumes();
            console.log("data fetched from API : ", data);
            const resume = data.resumes;

            if (resume) {
                setCurrentResume({
                    id: resume.id,
                    name: resume.file_name,
                    size: `${Math.round(resume.file_size_bytes / 1024)} KB`,
                    uploadedAt: formatDate(resume.created_at),
                    parsingStatus: resume.parsing_status,
                    fileUrl: resume.file_url || "#"
                });

                // Resume polling if pending
                if (resume.parsing_status !== PARSING_STATUS.SUCCESS && resume.parsing_status !== PARSING_STATUS.FAILED) {
                    startParsingStatusPoll(resume.id);
                }
            } else {
                setCurrentResume(null);
            }
        } catch (error) {
            console.error("Failed to fetch resumes:", error);
            toast({
                title: "Error",
                description: "Failed to load resume data.",
                variant: "destructive",
            });
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const { lastNotification } = useNotificationStore();

    // WebSocket Listener for real-time parsing updates
    useEffect(() => {
        if (lastNotification && (lastNotification.title === "Resume Parsing Complete" || lastNotification.title === "Resume Parsing Failed")) {
            console.log("Resume parsing notification received, refreshing...");
            fetchResumes(false);
        }
    }, [lastNotification]);

    useEffect(() => {
        fetchResumes();
    }, [toast]);

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ============================================
    // FILE HANDLERS
    // ============================================
    const validateFile = (file) => {
        const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;
        if (!ALLOWED_TYPES.includes(fileExtension)) {
            toast({
                title: "Invalid File Type",
                description: `Only ${ALLOWED_TYPES.join(", ")} files are allowed`,
                variant: "destructive",
            });
            return false;
        }

        const MAX_SIZE_BYTES = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE_BYTES) {
            toast({
                title: "File Too Large",
                description: `File size must be less than 5MB`,
                variant: "destructive",
            });
            return false;
        }
        return true;
    };

    const handleFileSelect = (file) => {
        if (validateFile(file)) setSelectedFile(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    // ============================================
    // ACTIONS
    // ============================================
    const handleDeleteResume = async (id) => {
        try {
            await resumeAPI.deleteResume(id);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setCurrentResume(null);
            // Don't auto-switch to edit mode, let user see empty state + add button?
            // Actually, if they delete, they probably want to see empty state now.
            // Requirement says "if nothing... display Oops... add button".
            // So staying in View Mode (which shows Empty State) is correct.
            setIsEdit(false);

            toast({
                title: "Resume Removed",
                description: "Resume deleted successfully.",
            });
        } catch (error) {
            console.error("Delete failed:", error);
            toast({
                title: "Delete Failed",
                description: "Failed to delete resume.",
                variant: "destructive",
            });
        }
    };

    const handleSave = async () => {
        console.log(">> handleSave STARTED");
        if (!selectedFile) {
            console.log(">> No file selected");
            return;
        }

        setIsUploading(true);
        setIsSaving(true);
        setUploadProgress(0);

        try {
            // IF REPLACING: Delete old resume first to ensure 1:1 relationship
            if (currentResume?.id) {
                console.log(">> Deleting existing resume:", currentResume.id);
                setUploadProgress(5);
                await resumeAPI.deleteResume(currentResume.id);
                console.log(">> Delete successful");
            }

            // 1. Force a valid Content-Type (Signature Requirement)
            const fileType = selectedFile.type || "application/pdf";
            console.log(`>> Using Content-Type: ${fileType} for file: ${selectedFile.name}`);

            console.log(">> Getting upload URL...");
            setUploadProgress(10);
            const { upload_url, file_key } = await resumeAPI.getUploadUrl(
                selectedFile.name,
                fileType // Explicitly pass matched type
            );
            console.log(">> Upload URL received. Key:", file_key);

            console.log(">> Uploading to R2 with PUT...");
            setUploadProgress(40);

            // 2. Pass explicit type to ensure header matches signature
            await resumeAPI.uploadToR2(upload_url, selectedFile, fileType);
            console.log(">> Upload to R2 successful");

            setUploadProgress(70);
            // Derive format from extension as fallback
            const fileFormat = selectedFile.name.split('.').pop().toLowerCase();

            console.log(">> Creating resume record...");
            const resume = await resumeAPI.createResume({
                file_key: file_key,
                file_name: selectedFile.name,
                file_size: selectedFile.size,
                file_format: fileFormat,
                is_default: true
            });
            console.log(">> Resume record created:", resume);

            setUploadProgress(100);

            setCurrentResume({
                id: resume.id,
                name: resume.file_name,
                size: `${Math.round(resume.file_size_bytes / 1024)} KB`,
                uploadedAt: "Just now",
                parsingStatus: resume.parsing_status,
                fileUrl: resume.file_url
            });

            setSelectedFile(null);
            console.log(">> Setting isEdit to FALSE");
            setIsEdit(false); // Return to View Mode

            toast({
                title: "Resume Uploaded",
                description: "Analysis in progress...",
            });

            // Start polling
            startParsingStatusPoll(resume.id);

        } catch (error) {
            console.error(">> handleSave FAILED:", error);
            toast({
                title: "Upload Failed",
                description: `Error: ${error.message || "Unknown error"}`,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            setIsSaving(false);
            setUploadProgress(0);
            console.log(">> handleSave FINISHED");
        }
    };

    const handleNext = () => {
        // Allow next even if parsing is in progress (it runs in background)
        navigate(ROUTES.PROFILE_SETUP.PERSONAL);
    };


    const handleRefresh = async () => {
        setIsEdit(false);
        setIsRefreshing(true);
        await fetchResumes(false); // Don't trigger full page loading, just refresh
        setIsRefreshing(false);
    }

    return (
        <div className="h-full w-full mx-auto bg-white rounded-xl flex flex-col justify-between gap-4 p-3 pb-24 md:pb-3 lg:p-4">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-slate-200 pb-3 lg:pb-4 gap-3 lg:gap-0">
                    <div className="flex-1">
                        <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-slate-900">Resume</h2>
                        <p className="text-slate-500 text-xs lg:text-sm mt-1 lg:mt-4">
                            Upload your resume to auto-fill your profile details.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isLoading || isRefreshing || isSaving}
                        className="w-full lg:w-auto mt-2 lg:mt-0 gap-2 lg:gap-4 h-9 lg:h-10 text-xs lg:text-sm"
                    >
                        <RefreshCw className={cn("h-3 w-3 lg:h-4 lg:w-4", isLoading && "animate-spin")} />
                        {isLoading ? 'Loading...' : isRefreshing ? 'Refreshing...' : isSaving ? 'Saving...' : 'Refresh Intel'}
                    </Button>
                </div>

                {/* CONTENT AREA */}
                <div className="space-y-3 lg:space-y-4">
                    <div className={`flex items-start lg:items-center ${isLoading || isRefreshing ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-emerald-50/50 text-emerald-800 border-emerald-200'} rounded-lg text-xs lg:text-sm border gap-2 lg:gap-4 p-3 lg:p-4`}>
                        <Clock className="h-4 w-4 flex-shrink-0 mt-0.5 lg:mt-0" />
                        <span>Select "Edit" below if you wish to replace this resume.</span>
                    </div>
                    <div className="flex items-start lg:items-center bg-slate-50 text-slate-700 rounded-lg text-xs lg:text-sm border border-slate-200 gap-2 lg:gap-4 p-3 lg:p-4">
                        <Info className="h-5 w-5 flex-shrink-0" />
                        <span>Please note: It usually takes a few minutes for our AI to fully parse your resume and update your profile data.</span>
                    </div>
                    {/* 1. VIEW MODE: EMPTY STATE */}
                    {isLoading || isRefreshing ? (
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 lg:p-4">
                            {/* Mobile Skeleton Layout - Vertical & Compact */}
                            <div className="lg:hidden flex flex-col items-center gap-3 py-2">
                                <div className="flex items-center gap-3 w-full">
                                    <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-3 w-12" />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Desktop Skeleton Layout - Preserved */}
                            <div className="hidden lg:flex flex-row items-center gap-4">
                                {/* File Icon Skeleton */}
                                <Skeleton className="h-10 w-10 rounded-md" />

                                {/* Resume Details Skeleton */}
                                <div className="flex-1 min-w-0 space-y-4">
                                    {/* Resume name */}
                                    <Skeleton className="h-5 w-64" />

                                    {/* Meta row */}
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-1 w-1 rounded-full" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-1 w-1 rounded-full" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>

                                {/* Actions Skeleton */}
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        !isEdit && currentResume && (
                            <div className="space-y-4">
                                <ResumeCard
                                    resume={currentResume}
                                    onDelete={handleDeleteResume}
                                />
                            </div>
                        )
                    )}

                    {!isLoading && !isRefreshing && !isEdit && !currentResume && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 p-6 lg:p-8"
                        >
                            <div className="bg-white rounded-full relative shadow-sm p-3 lg:p-4 mb-3 lg:mb-4">
                                <FileSearch className="h-8 w-8 lg:h-12 lg:w-12 text-slate-400" />
                                <span className="absolute -top-1 -right-1 text-lg lg:text-2xl">🧐</span>
                            </div>
                            <h2 className="text-lg lg:text-2xl font-bold text-slate-900 mb-2 lg:mb-4">
                                Oops... Nothing here!
                            </h2>
                            <p className="text-slate-500 max-w-md text-xs lg:text-base leading-relaxed">
                                It seems you haven't uploaded any resume so far.
                                <br />
                                Let's fix that to get your profile ready!
                            </p>
                        </motion.div>
                    )}

                    {/* 3. EDIT MODE: UPLOAD INTERFACE */}
                    {isEdit && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
                        >
                            {currentResume && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Current Resume</h3>
                                    <ResumeCard
                                        resume={currentResume}
                                        onDelete={handleDeleteResume}
                                    />
                                </div>
                            )}

                            <h3 className="text-lg font-semibold text-slate-900 flex items-center mb-4 gap-4">
                                <Upload className="h-5 w-5 text-brand-600" />
                                {currentResume ? "Replace Resume" : "Upload Resume"}
                            </h3>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !selectedFile && !isUploading && fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out group transition-all duration-300 ease-in-out group ${isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-500 hover:bg-slate-50"} ${selectedFile ? "border-brand-600 bg-brand-50" : ""} p-4`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ALLOWED_TYPES.join(",")}
                                    onChange={handleInputChange}
                                    className="hidden"
                                    disabled={isUploading}
                                />

                                {selectedFile ? (
                                    <div className="space-y-4">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
                                            <File className="h-8 w-8 text-brand-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg text-slate-900">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            Remove file
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <Upload className="h-8 w-8 text-slate-400 group-hover:text-brand-600" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-slate-900">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-sm text-slate-500 mt-4">
                                                PDF only (Max 5MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Upload Progress Bar */}
                            <AnimatePresence>
                                {isUploading && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 space-y-4"
                                    >
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 font-medium flex items-center gap-4">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
                                                Uploading & Parsing...
                                            </span>
                                            <span className="font-bold">{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <motion.div
                                                className="h-full bg-brand-600"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                transition={{ ease: "linear" }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>


                        </motion.div>
                    )}
                </div>

            </div>


            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 lg:flex lg:justify-end lg:items-center lg:gap-4 lg:pt-4">
                {isEdit ? (
                    <div className="col-span-2 flex items-center gap-3 w-full lg:w-auto lg:gap-4">
                        <Button
                            type="button"
                            onClick={() => setIsEdit(false)}
                            disabled={isUploading}
                            variant="outline"
                            className="flex-1 lg:flex-none gap-2 lg:gap-4"
                        >
                            <X className="h-3 w-3 lg:h-4 lg:w-4" />
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isUploading}
                            variant="default"
                            className="flex-1 lg:flex-none gap-2 lg:gap-4"
                            aria-label="Save education"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin" />
                                    Submitting
                                </>
                            ) : (
                                <>
                                    <Save className="h-3 w-3 lg:h-4 lg:w-4" />
                                    Submit
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <>
                        <Button
                            type="button"
                            onClick={() => setIsEdit(true)}
                            disabled={isUploading || isLoading}
                            variant="default"
                            className="gap-2 lg:gap-4 w-full lg:w-auto"
                        >
                            {currentResume ? (
                                <>
                                    <Edit3 className="h-3 w-3 lg:h-4 lg:w-4" />
                                    Edit
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                                    Add
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            disabled={isUploading || isLoading || isRefreshing}
                            onClick={handleNext}
                            variant={"outline"}
                            className="gap-2 lg:gap-4 w-full lg:w-auto"
                        >
                            Next
                            <ArrowRight className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                    </>
                )}


            </div>
        </div >
    );
}
