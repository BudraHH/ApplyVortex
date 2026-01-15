import { z } from "zod";

export const accountSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone_number: z.string().optional().nullable(),
    phone_country_code: z.string().optional().nullable(),
});

export const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain uppercase letter")
            .regex(/[a-z]/, "Must contain lowercase letter")
            .regex(/[0-9]/, "Must contain number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
        message: "New password must be different from current password",
        path: ["newPassword"],
    });

export const COUNTRY_CODES = [
    { code: "1", country: "US/CA", flag: "🇺🇸" },
    { code: "44", country: "UK", flag: "🇬🇧" },
    { code: "91", country: "IN", flag: "🇮🇳" },
    { code: "61", country: "AU", flag: "🇦🇺" },
    { code: "49", country: "DE", flag: "🇩🇪" },
    { code: "33", country: "FR", flag: "🇫🇷" },
    { code: "81", country: "JP", flag: "🇯🇵" },
];
