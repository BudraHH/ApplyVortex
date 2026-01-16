import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 lg:h-12 w-full rounded-md border text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4",
                "bg-white text-slate-900",
                "placeholder:text-slate-400",
                "focus:border-brand-500/70 ",
                error
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-200 hover:border-slate-300",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = "Input"

export { Input }
