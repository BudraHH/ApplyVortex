import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming utils exists, usage helps with merging

const Button = forwardRef(({
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    children,
    ...props
}, ref) => {

    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-brand-600 text-white hover:bg-brand-700 border border-brand-600 shadow-sm",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-transparent",
        outline: "border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900",
        ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
        danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        link: "text-brand-600 underline-offset-4 hover:underline",
        disabled: "bg-slate-100 text-slate-400"
    };

    const sizes = {
        xs: "h-7 text-xs px-2 gap-1",
        sm: "h-8 text-xs px-4 gap-1.5",
        md: "h-10 text-sm px-4 gap-2",
        lg: "h-12 text-base px-6 gap-2",
        xl: "h-14 text-lg px-8 gap-3",
        icon: "h-10 w-10",
        // Responsive size: scales up from sm to lg
        responsive: "h-8 text-xs px-4 gap-1.5 md:h-10 md:text-sm md:px-4 md:gap-2 lg:h-12 lg:text-base lg:px-6",
    };

    // Fallback to primary if variant not found
    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;

    const Comp = props.as || 'button';

    return (
        <Comp
            ref={ref}
            disabled={(!props.as && (isLoading || disabled)) || undefined}
            data-disabled={isLoading || disabled ? "" : undefined}
            className={cn(baseStyles, variantStyles, sizeStyles, className, (isLoading || disabled) && "opacity-50 pointer-events-none")}
            {...props}
        >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </Comp>
    );
});

Button.displayName = "Button";

export { Button };
