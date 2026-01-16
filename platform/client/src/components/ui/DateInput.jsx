import * as React from "react"
import { cn } from "@/lib/utils"

const DateInput = React.forwardRef(({ className, error, ...props }, ref) => {
    return (
        <input
            type="date"
            className={cn(
                "flex h-10 lg:h-12 w-full rounded-lg border bg-white text-sm text-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm min-w-[150px] px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4",
                error
                    ? "border-red-500 focus-visible:ring-red-500/20"
                    : "border-slate-200 hover:border-slate-300 focus-visible:border-brand-500",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
DateInput.displayName = "DateInput"

export { DateInput }
