import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, UserCircle, Camera, Mail, Phone, ShieldCheck, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { userAPI } from "@/services/api/userAPI";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { accountSchema, COUNTRY_CODES } from "../schemas";
import { SectionCard, SectionHeader, FormField } from "./Shared";

export function AccountSettingsSection() {
    const { user, updateUser } = useAuthStore();
    const { toast } = useToast();

    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty }
    } = useForm({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            full_name: "",
            email: "",
            phone_number: "",
            phone_country_code: "1",
        },
    });

    const watchCountryCode = watch("phone_country_code");

    useEffect(() => {
        const fetchDetailedSettings = async () => {
            setIsLoading(true);
            try {
                const res = await userAPI.getAccountSettings();
                const data = res?.data || res;

                reset({
                    full_name: data.full_name || (user ? (user.full_name || [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ")) : ""),
                    email: data.email || user?.email || "",
                    phone_number: data.phone_number || "",
                    phone_country_code: (data.phone_country_code || "+1").replace('+', ''),
                });
            } catch (err) {
                console.error("Failed to fetch detailed settings:", err);
                if (user) {
                    const fullNameParts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
                    reset({
                        full_name: user.full_name || fullNameParts.join(" "),
                        email: user.email || "",
                        phone_number: user.phone_number || user.phone || "",
                        phone_country_code: (user.phone_country_code || "+1").replace('+', ''),
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetailedSettings();
    }, [user, reset]);

    const handleCancel = () => {
        if (user) {
            const fullNameParts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
            reset({
                full_name: user.full_name || fullNameParts.join(" "),
                email: user.email || "",
                phone_number: user.phone_number || user.phone || "",
                phone_country_code: (user.phone_country_code || "+1").replace('+', ''),
            });
        }
        setIsEditing(false);
    };

    const onSave = async (data) => {
        setIsSaving(true);
        try {
            const res = await userAPI.updateAccountSettings({
                full_name: data.full_name,
                phone_number: data.phone_number || null,
                phone_country_code: data.phone_country_code ? `+${data.phone_country_code}` : null,
            });

            const freshUser = await userAPI.getProfile();
            updateUser(freshUser?.data || freshUser);

            const updatedData = res?.data || res;
            reset({
                full_name: updatedData.full_name || data.full_name,
                email: updatedData.email || user?.email || "",
                phone_number: updatedData.phone_number || "",
                phone_country_code: (updatedData.phone_country_code || "+1").replace('+', ''),
            });

            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
        } catch (error) {
            toast({ title: "Error", description: error.response?.data?.detail || "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user && !isLoading) return null;

    return (
        <SectionCard>
            <form onSubmit={handleSubmit(onSave)}>
                <SectionHeader
                    icon={UserCircle}
                    title="Personal Information"
                    description="Manage your personal details and contact info"
                    action={!isEditing && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                />

                <div className="p-6 space-y-6">
                    <div className="flex items-center border-b border-slate-100 gap-4 pb-4">
                        {isLoading ? (
                            <Skeleton className="h-20 w-20 rounded-full" />
                        ) : (
                            <div className="relative group">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center border-2 border-white shadow-md">
                                    <User className="h-8 w-8 text-brand-600" />
                                </div>
                                {isEditing && (
                                    <button
                                        type="button"
                                        className="absolute -bottom-1 -right-1 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-105 p-2"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="font-medium text-slate-900">Profile Photo</h4>
                            <p className="text-sm text-slate-500 mt-1">JPG or PNG. Max size 1MB.</p>
                            {isEditing && (
                                <div className="flex gap-4 mt-3">
                                    <Button type="button" size="sm" variant="outline" className="text-xs h-8">Upload</Button>
                                    <Button type="button" size="sm" variant="ghost" className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50">Remove</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField label="Full Name" error={errors.full_name?.message} required>
                            {isLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        {...register("full_name")}
                                        placeholder="John Doe"
                                        disabled={!isEditing}
                                        className={cn("pl-10", errors.full_name && "border-red-500")}
                                    />
                                </div>
                            )}
                        </FormField>

                        <FormField label="Email Address" hint="Contact support to change email">
                            {isLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input {...register("email")} disabled className="bg-slate-50 text-slate-500 pl-10" />
                                </div>
                            )}
                        </FormField>

                        <div className="md:col-span-2">
                            <FormField label="Phone Number" error={errors.phone_number?.message}>
                                {isLoading ? (
                                    <div className="flex gap-4">
                                        <Skeleton className="h-10 w-28" />
                                        <Skeleton className="h-10 flex-1" />
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <Select
                                            value={watchCountryCode}
                                            onValueChange={(val) => setValue('phone_country_code', val, { shouldDirty: true })}
                                            disabled={!isEditing}
                                        >
                                            <SelectTrigger className="w-28">
                                                <SelectValue placeholder="Code" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COUNTRY_CODES.map((c) => (
                                                    <SelectItem key={c.code} value={c.code}>
                                                        {c.flag} +{c.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="relative flex-1">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                {...register("phone_number")}
                                                placeholder="123 456 7890"
                                                disabled={!isEditing}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                )}
                            </FormField>
                            <p className="text-xs text-slate-500 flex items-center mt-3 gap-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                                Your phone is used for two-factor authentication
                            </p>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="bg-slate-50 border-t border-slate-100 flex justify-end px-6 py-4 gap-4">
                        {!isSaving && (
                            <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                        )}
                        <Button type="submit" disabled={isSaving || !isDirty} className="min-w-[100px]">
                            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
                        </Button>
                    </div>
                )}
            </form>
        </SectionCard>
    );
}
