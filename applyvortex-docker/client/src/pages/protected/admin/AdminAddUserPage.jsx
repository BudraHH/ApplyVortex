import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { userAPI } from '@/services/api/userAPI.js';
import { toTitleCase } from '@/lib/utils.js';
import {
    Shield,
    User,
    Mail,
    Lock,
    Activity,
    CheckCircle,
    CreditCard,
    Eye,
    EyeOff
} from 'lucide-react';

// Common Components
import { Input } from "@/components/ui/Input.jsx";
import { Label } from "@/components/ui/Label.jsx";
import { Button } from "@/components/ui/Button.jsx"; // Capital B to match the file I edited
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select.jsx";

const baseSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain uppercase letter")
        .regex(/[a-z]/, "Must contain lowercase letter")
        .regex(/[0-9]/, "Must contain number"),
    role: z.enum(['user', 'admin', 'super-admin']),
    account_status: z.enum(['active', 'pending-verification', 'suspended']),
    subscription_plan: z.enum(['free_tier', 'pro_tier', 'max_tier']).optional(),
});

const createUserSchema = z.discriminatedUnion("role", [
    baseSchema.extend({
        role: z.literal("user"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        subscription_plan: z.enum(['free_tier', 'pro_tier', 'max_tier'])
    }),
    baseSchema.extend({
        role: z.enum(["admin", "super-admin"]),
        name: z.string().optional(),
        subscription_plan: z.string().optional()
    })
]);

export default function AdminAddUserPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showStatus, setShowStatus] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            role: 'user',
            account_status: 'active',
            subscription_plan: 'free_tier',
            name: ''
        }
    });

    const selectedRole = useWatch({
        control,
        name: "role",
        defaultValue: "user"
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError('');
        setShowStatus(false);

        // Auto-fill name for admins if not provided
        if (['admin', 'super-admin'].includes(data.role) && !data.name) {
            data.name = "System Admin";
        }

        // Default admin plans to free if irrelevant, or handle on backend
        if (['admin', 'super-admin'].includes(data.role)) {
            data.subscription_plan = 'free_tier';
        }

        try {
            await userAPI.createUser(data);
            setIsSuccess(true);
            setShowStatus(true);
        } catch (error) {
            console.error("Failed to create user:", error);
            setServerError(error.response?.data?.detail || "Failed to create user. Email may already exist.");
            setIsSuccess(false);
            setShowStatus(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full mx-auto space-y-2 md:space-y-3 lg:space-y-4">
            {/* Header */}
            <div className="flex flex-row justify-between items-center gap-2 md:gap-3 lg:gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-black tracking-tight">Add New User</h1>
                    <p className="text-sm text-black/50 font-medium">Create a new system account manually</p>
                </div>
                {showStatus && (
                    <div className={`rounded-lg text-sm font-medium ${isSuccess ? 'bg-emerald-50 border border-emerald-500 text-emerald-600' : 'bg-red-50 border border-red-500 text-red-600'} px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}>
                        {isSuccess ? 'User created successfully' : 'Failed to create user'}
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {serverError && (
                <div className="bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4">
                    <Activity className="h-4 w-4" />
                    {serverError}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 md:space-y-3 lg:space-y-4">
                <div className="bg-white rounded-2xl border border-black/5 p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">

                    {/* Stacked Controls: Role, Status, Plan */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <div className='w-full flex flex-row justify-between items-center'>
                                <Label className="text-sm font-semibold text-black/80">User Role</Label>
                                <p className="text-xs text-black/40">Defines system permission level</p>
                            </div>
                            <Controller
                                control={control}
                                name="role"
                                render={({ field }) => (
                                    <div className="relative group">
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="w-full bg-white border-black/10 rounded-xl text-sm text-black focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-none transition-all py-2 md:py-3 lg:py-4">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-black/10 text-black">
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="super-admin">Super Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <div className='w-full flex flex-row justify-between items-center'>
                                <Label className="text-sm font-semibold text-black/80">Account Status</Label>
                                <p className="text-xs text-black/40">Initial login status</p>
                            </div>
                            <Controller
                                control={control}
                                name="account_status"
                                render={({ field }) => (
                                    <div className="relative group">
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="w-full bg-white border-black/10 rounded-xl text-sm text-black focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-none transition-all py-2 md:py-3 lg:py-4">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-black/10 text-black">
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="pending-verification">Pending Verification</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Subscription Plan (Only for 'user' role) */}
                        {selectedRole === 'user' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2 md:space-y-3 lg:space-y-4">
                                <div className='w-full flex flex-row justify-between items-center'>
                                    <Label className="text-sm font-semibold text-black/80">Subscription Plan</Label>
                                    <p className="text-xs text-black/40">Initial billing tier</p>
                                </div>
                                <Controller
                                    control={control}
                                    name="subscription_plan"
                                    render={({ field }) => (
                                        <div className="relative group">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="w-full bg-white border-black/10 rounded-xl text-sm text-black focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-none transition-all py-2 md:py-3 lg:py-4">
                                                    <SelectValue placeholder="Select plan" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-black/10 text-black">
                                                    <SelectItem value="free_tier">Free Tier</SelectItem>
                                                    <SelectItem value="pro_tier">Pro Tier</SelectItem>
                                                    <SelectItem value="max_tier">Max Tier</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-black/5 w-full"></div>

                    {/* Personal Info */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">

                        {/* Name Input - Conditional */}
                        {selectedRole === 'user' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2 md:space-y-3 lg:space-y-4">
                                <Label className="text-sm font-semibold text-black/80">Full Name</Label>
                                <div className="relative group">
                                    <Input
                                        placeholder="e.g. John Doe"
                                        {...register('name')}
                                        onChange={(e) => {
                                            const val = toTitleCase(e.target.value);
                                            e.target.value = val;
                                            register('name').onChange(e);
                                        }}
                                        className={`bg-white rounded-xl text-sm transition-all shadow-none ${errors.name ? 'border-red-500 focus-visible:ring-red-500/20' : 'border-black/10 focus-visible:ring-brand-500/20 focus-visible:border-brand-500'} py-2 md:py-3 lg:py-4`}
                                    />
                                </div>
                                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                            </div>
                        )}

                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <Label className="text-sm font-semibold text-black/80">Email Address</Label>
                            <div className="relative group">
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    {...register('email')}
                                    className={`bg-white rounded-xl text-sm transition-all shadow-none ${errors.email ? 'border-red-500 focus-visible:ring-red-500/20' : 'border-black/10 focus-visible:ring-brand-500/20 focus-visible:border-brand-500'} py-2 md:py-3 lg:py-4`}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <Label className="text-sm font-semibold text-black/80">Password</Label>
                            <div className="relative group">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register('password')}
                                    className={`bg-white rounded-xl text-sm transition-all shadow-none ${errors.password ? 'border-red-500 focus-visible:ring-red-500/20' : 'border-black/10 focus-visible:ring-brand-500/20 focus-visible:border-brand-500'} py-2 md:py-3 lg:py-4`}
                                />
                                <Button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    variant="ghost"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-600 hover:text-brand-800 hover:bg-transparent p-0 h-auto uppercase tracking-wide"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </Button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 md:pt-3 lg:pt-4 py-2 md:py-3 lg:py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/admin/user')}
                    >
                        Back
                    </Button>
                    <div className="flex gap-2 md:gap-3 lg:gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/admin/user')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                        >
                            {isLoading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
