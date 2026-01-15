import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none custom-scrollbar shadow-sm px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4",
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
Textarea.displayName = "Textarea"

export { Textarea }
