import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function TopBarClock() {
    const [time, setTime] = useState(new Date());
    const { user, dateFormat } = useAuthStore();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Defaults
    const timezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const getFormattedDate = () => {
        if (!dateFormat) {
            return time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone });
        }

        // Helper to get formatted parts
        const getPart = (options) => new Intl.DateTimeFormat('en-US', { ...options, timeZone: timezone }).format(time);

        // Standard numeric parts (with padding for ISO-like formats)
        const dp = new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone
        }).formatToParts(time);
        const findVal = (type) => dp.find(p => p.type === type)?.value;
        const YYYY = findVal('year');
        const MM = findVal('month');
        const DD_padded = findVal('day');

        // Textual parts
        const dddd = getPart({ weekday: 'long' });
        const ddd = getPart({ weekday: 'short' });
        const MMMM = getPart({ month: 'long' });
        const MMM = getPart({ month: 'short' });
        const D = getPart({ day: 'numeric' }); // No leading zero

        switch (dateFormat) {
            case 'YYYY-MM-DD': return `${YYYY}-${MM}-${DD_padded}`;
            case 'MM/DD/YYYY': return `${MM}/${DD_padded}/${YYYY}`;
            case 'DD-MM-YYYY': return `${DD_padded}-${MM}-${YYYY}`;
            case 'dddd, MMMM D': return `${dddd}, ${MMMM} ${D}`;
            case 'ddd, MMM D': return `${ddd}, ${MMM} ${D}`;
            case 'D MMMM, dddd': return `${D} ${MMMM}, ${dddd}`;
            default: return time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone });
        }
    };

    return (
        <div className="hidden lg:flex items-center text-sm font-medium text-slate-600 bg-slate-50 rounded-lg border border-slate-200 transition-all duration-300 gap-3 px-4 py-2">
            <span className="text-slate-900">
                {getFormattedDate()}
            </span>
            <div className="h-4 w-px bg-slate-300" />
            <span className="tabular-nums font-mono text-brand-600 font-bold">
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: timezone })}
            </span>
        </div>
    );
}
