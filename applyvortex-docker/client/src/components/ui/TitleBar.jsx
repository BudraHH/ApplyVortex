import React, { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';

/**
 * Detects the user's operating system
 * @returns {'macos' | 'windows' | 'linux'}
 */
const detectOS = () => {
    if (typeof window === 'undefined') return 'macos';

    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    if (userAgent.includes('mac') || platform.includes('mac')) {
        return 'macos';
    }
    if (userAgent.includes('win') || platform.includes('win')) {
        return 'windows';
    }
    // Default to Linux for other Unix-like systems
    return 'linux';
};

/**
 * OS-aware title bar component for mockups
 * Renders appropriate window controls based on detected operating system
 * 
 * @param {Object} props
 * @param {string} [props.title] - Title text to display
 * @param {'light' | 'dark'} [props.variant='dark'] - Light or dark theme
 * @param {string} [props.className] - Additional CSS classes
 */
const TitleBar = ({ title = '', variant = 'dark', className = '' }) => {
    const [os, setOS] = useState('macos');

    useEffect(() => {
        setOS(detectOS());
    }, []);

    const isDark = variant === 'dark';

    // Base styles for the container
    const containerStyles = isDark
        ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white'
        : 'bg-white/80 border-b border-slate-200/60';

    // macOS Traffic Light Buttons (left side) - decorative only
    const MacOSControls = () => (
        <div className="flex items-center gap-[0.4em] pointer-events-none">
            <div className="h-[0.6em] w-[0.6em] rounded-full bg-red-400/80" />
            <div className="h-[0.6em] w-[0.6em] rounded-full bg-yellow-400/80" />
            <div className="h-[0.6em] w-[0.6em] rounded-full bg-green-400/80" />
        </div>
    );

    // Windows Buttons (right side - minimize, maximize, close) - decorative only
    const WindowsControls = () => {
        const buttonBase = isDark
            ? 'text-white/70'
            : 'text-slate-500';

        return (
            <div className="flex items-center pointer-events-none">
                <div className={`p-[0.4em] ${buttonBase}`}>
                    <Minus className="h-[0.7em] w-[0.7em]" strokeWidth={2} />
                </div>
                <div className={`p-[0.4em] ${buttonBase}`}>
                    <Square className="h-[0.5em] w-[0.5em]" strokeWidth={2} />
                </div>
                <div className={`p-[0.4em] ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
                    <X className="h-[0.7em] w-[0.7em]" strokeWidth={2} />
                </div>
            </div>
        );
    };

    // Linux/GNOME style buttons (right side - similar to Windows but with circles) - decorative only
    const LinuxControls = () => {
        const buttonBase = isDark
            ? 'bg-slate-500/40 border-slate-400/30'
            : 'bg-slate-200 border-slate-300';

        return (
            <div className="flex items-center gap-[0.4em] pointer-events-none">
                <div className={`h-[0.7em] w-[0.7em] rounded-full border flex items-center justify-center ${buttonBase}`}>
                    <Minus className="h-[0.35em] w-[0.35em]" strokeWidth={3} />
                </div>
                <div className={`h-[0.7em] w-[0.7em] rounded-full border flex items-center justify-center ${buttonBase}`}>
                    <Square className="h-[0.3em] w-[0.3em]" strokeWidth={3} />
                </div>
                <div className={`h-[0.7em] w-[0.7em] rounded-full border flex items-center justify-center ${buttonBase}`}>
                    <X className="h-[0.35em] w-[0.35em]" strokeWidth={3} />
                </div>
            </div>
        );
    };

    // Render controls based on OS position (macOS: left, Windows/Linux: right)
    const renderControls = () => {
        switch (os) {
            case 'windows':
                return <WindowsControls />;
            case 'linux':
                return <LinuxControls />;
            case 'macos':
            default:
                return <MacOSControls />;
        }
    };

    return (
        <div className={`flex items-center justify-between px-[1em] py-[0.5em] text-sm font-medium shrink-0 ${containerStyles} ${className}`}>
            {/* Left side */}
            {os === 'macos' ? (
                <>
                    {renderControls()}
                    <span className={`text-[0.85em] font-medium ${isDark ? 'text-white' : 'text-slate-600'}`}>{title}</span>
                    <div className="w-16" /> {/* Spacer for balance */}
                </>
            ) : (
                <>
                    <div className="w-16" /> {/* Spacer for balance */}
                    <span className={`text-[0.85em] font-medium ${isDark ? 'text-white' : 'text-slate-600'}`}>{title}</span>
                    {renderControls()}
                </>
            )}
        </div>
    );
};

// Export both the component and the utility for external use
export { detectOS };
export default TitleBar;
