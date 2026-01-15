// src/features/dashboard/DateCalendar.jsx
import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export function DateCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[currentDate.getDay()];
    const monthName = months[currentDate.getMonth()];
    const date = currentDate.getDate();
    const year = currentDate.getFullYear();

    return (
        <div className="bg-card border-2 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-foreground/5 border-b flex items-center justify-between px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Today
                    </span>
                </div>
            </div>

            {/* Date Display */}
            <div className="text-center space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {dayName}
                </p>

                <div className="relative">
                    <div className="text-7xl font-bold tracking-tight leading-none">
                        {date}
                    </div>
                    {/* Subtle background number */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <span className="text-9xl font-black">{date}</span>
                    </div>
                </div>

                <div className="space-y-2 md:space-y-3 lg:space-y-4 pt-2 md:pt-3 lg:pt-4">
                    <p className="text-xl font-semibold">
                        {monthName}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                        {year}
                    </p>
                </div>
            </div>
        </div>
    );
}
