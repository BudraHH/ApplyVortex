// src/features/layout/ThemeProvider.jsx
import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
    theme: "system",
    setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = "light", storageKey = "applyvortex-theme" }) {
    // Force light theme
    const theme = "light";

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("dark")
        root.classList.add("light")
    }, [])

    const value = {
        theme,
        setTheme: () => null, // No-op
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
