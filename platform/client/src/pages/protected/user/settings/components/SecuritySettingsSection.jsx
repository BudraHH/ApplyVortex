import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Laptop, Smartphone, LogOut, Check, Loader2 } from "lucide-react";
import { userAPI } from "@/services/api/userAPI";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { passwordSchema } from "../schemas";
import { SectionCard, SectionHeader, FormField } from "./Shared";
import { PasswordInput } from "./PasswordInput";

export function SecuritySettingsSection() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isRevokingSession, setIsRevokingSession] = useState(null);
    const [isRevokingAllOtherSessions, setIsRevokingAllOtherSessions] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    });

    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoadingSessions(true);
            try {
                const res = await userAPI.getUserSessions();
                setSessions(res?.data?.sessions || res?.sessions || []);
            } catch {
                toast({ title: "Error", description: "Failed to load sessions.", variant: "destructive" });
            } finally {
                setIsLoadingSessions(false);
            }
        };
        fetchSessions();
    }, [toast]);

    const watchNewPassword = passwordForm.watch("newPassword");
    const watchConfirmPassword = passwordForm.watch("confirmPassword");

    const passwordRequirements = [
        { label: "8+ characters", met: watchNewPassword?.length >= 8 },
        { label: "Uppercase & Lowercase", met: /[A-Z]/.test(watchNewPassword) && /[a-z]/.test(watchNewPassword) },
        { label: "At least one number", met: /[0-9]/.test(watchNewPassword) },
        { label: "Passwords match", met: watchNewPassword && watchNewPassword === watchConfirmPassword },
    ];

    const onChangePassword = async (data) => {
        setIsSaving(true);
        try {
            await userAPI.updatePassword({
                current_password: data.currentPassword,
                new_password: data.newPassword
            });
            passwordForm.reset();
            toast({ title: "Success", description: "Password updated successfully. Other sessions have been logged out." });
        } catch (err) {
            toast({ title: "Error", description: err.response?.data?.detail || "Failed to update password", variant: "destructive" });
        } finally {
            setIsSaving(false);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    };

    const handleRevokeSession = async (sid) => {
        setIsRevokingSession(sid);
        try {
            await userAPI.revokeSession(sid);
            toast({ title: "Success", description: "Session revoked." });
            const res = await userAPI.getUserSessions();
            setSessions(res?.data?.sessions || res?.sessions || []);
        } catch {
            toast({ title: "Error", description: "Failed to revoke session.", variant: "destructive" });
        } finally {
            setIsRevokingSession(null);
        }
    };

    const handleRevokeAllOtherSessions = async () => {
        setIsRevokingAllOtherSessions(true);
        try {
            await userAPI.revokeAllOtherSessions();
            toast({ title: "Success", description: "All other sessions revoked." });
            const res = await userAPI.getUserSessions();
            setSessions(res?.data?.sessions || res?.sessions || []);
        } catch {
            toast({ title: "Error", description: "Failed to revoke sessions.", variant: "destructive" });
        } finally {
            setIsRevokingAllOtherSessions(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionCard>
                <SectionHeader
                    icon={Lock}
                    title="Password"
                    description="Update your password regularly for security"
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                />
                <div className="p-6">
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                        <FormField label="Current Password" error={passwordForm.formState.errors.currentPassword?.message} required>
                            <PasswordInput
                                id="currentPassword"
                                show={showCurrentPassword}
                                setShow={setShowCurrentPassword}
                                placeholder="Enter current password"
                                disabled={isSaving}
                                {...passwordForm.register("currentPassword")}
                            />
                        </FormField>

                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField label="New Password" error={passwordForm.formState.errors.newPassword?.message} required>
                                <PasswordInput
                                    id="newPassword"
                                    show={showNewPassword}
                                    setShow={setShowNewPassword}
                                    placeholder="Enter new password"
                                    disabled={isSaving}
                                    {...passwordForm.register("newPassword")}
                                />
                            </FormField>

                            <FormField label="Confirm Password" error={passwordForm.formState.errors.confirmPassword?.message} required>
                                <PasswordInput
                                    id="confirmPassword"
                                    show={showConfirmPassword}
                                    setShow={setShowConfirmPassword}
                                    placeholder="Confirm new password"
                                    disabled={isSaving}
                                    {...passwordForm.register("confirmPassword")}
                                />
                            </FormField>
                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Security Checklist</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {passwordRequirements.map((req, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                                            req.met ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                                        )}>
                                            <Check className="h-2.5 w-2.5" />
                                        </div>
                                        <span className={cn(
                                            "text-sm transition-colors",
                                            req.met ? "text-slate-900 font-medium" : "text-slate-500"
                                        )}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Update Password
                            </Button>
                        </div>
                    </form>
                </div>
            </SectionCard>

            <SectionCard>
                <SectionHeader
                    icon={Laptop}
                    title="Active Sessions"
                    description="Manage your logged-in devices"
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={handleRevokeAllOtherSessions}
                            disabled={isLoadingSessions || isRevokingAllOtherSessions}
                        >
                            {isRevokingAllOtherSessions ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Out All"}
                        </Button>
                    }
                />
                {!isLoadingSessions && sessions.length > 0 && (
                    <div className="bg-slate-50 border-y border-slate-100 flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "text-xs font-semibold rounded-sm px-2 py-0.5",
                                sessions.length >= 5 ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700"
                            )}>
                                {sessions.length} / 5
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Active sessions used</span>
                        </div>
                        {sessions.length >= 5 && (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                                Limit Reached
                            </span>
                        )}
                    </div>
                )}
                <div className="divide-y divide-slate-100 h-full min-h-[250px]">
                    {isLoadingSessions ? (
                        [1, 2].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <Skeleton className="h-11 w-11 rounded-full" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            </div>
                        ))
                    ) : sessions.length === 0 ? (
                        <div className="text-center text-slate-500 p-6">
                            <Laptop className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                            <p>No active sessions found</p>
                        </div>
                    ) : (
                        sessions.map(s => (
                            <div key={s.id} className="flex items-center justify-between hover:bg-slate-50/50 transition-colors px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "rounded-full p-2.5",
                                        s.is_current ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {s.user_agent?.toLowerCase().includes('mobile') ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-medium text-slate-900">{s.device_name || "Unknown Device"}</p>
                                            {s.is_current && (
                                                <span className="text-[10px] font-semibold uppercase tracking-wide bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {[s.city, s.country].filter(Boolean).join(", ") || "Unknown location"}
                                        </p>
                                    </div>
                                </div>
                                {!s.is_current && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleRevokeSession(s.id)}
                                        disabled={isRevokingSession === s.id}
                                    >
                                        {isRevokingSession === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
