import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";

export const SectionCard = ({ children, className }) => (
    <div className={cn(
        "bg-white rounded-xl border border-slate-100 overflow-hidden",
        "transition-all duration-200 hover:border-slate-200",
        className
    )}>
        {children}
    </div>
);

export const SectionHeader = ({ icon: Icon, title, description, iconBg = "bg-brand-50", iconColor = "text-brand-600", action }) => (
    <div className="bg-white border-b border-slate-100 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
            <div className={cn("rounded-lg p-2", iconBg)}>
                <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
        </div>
        {action}
    </div>
);

export const Switch = ({ checked, onCheckedChange, disabled = false }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
            checked ? "bg-brand-600" : "bg-slate-200",
            disabled && "opacity-50 cursor-not-allowed"
        )}
    >
        <span
            className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200",
                checked ? "translate-x-5" : "translate-x-0.5"
            )}
        />
    </button>
);

export const FormField = ({ label, children, error, hint, required = false }) => (
    <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            {label}
            {required && <span className="text-red-500">*</span>}
        </Label>
        {children}
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
);
