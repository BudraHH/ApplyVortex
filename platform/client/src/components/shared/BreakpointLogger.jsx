import { useEffect } from 'react';

/**
 * BreakpointLogger
 * This component handles console logging the current Tailwind CSS breakpoint
 * whenever the window is resized. It helps in debugging responsive designs.
 */
const BreakpointLogger = () => {
    useEffect(() => {
        const getBreakpoint = (width) => {
            if (width >= 1536) return '2xl';
            if (width >= 1280) return 'xl';
            if (width >= 1024) return 'lg';
            if (width >= 768) return 'md';
            if (width >= 640) return 'sm';
            return 'xs (base)';
        };

        const handleResize = () => {
            const width = window.innerWidth;
            const breakpoint = getBreakpoint(width);
            console.log(`%c [Device Size]: ${breakpoint} (${width}px)`, 'background: #6366f1; color: white; padding: 2px 4px; border-radius: 4px; font-weight: bold;');
        };

        // Initial log on mount
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return null; // This component doesn't render anything UI-wise
};

export default BreakpointLogger;
