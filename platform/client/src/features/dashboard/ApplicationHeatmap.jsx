// src/features/dashboard/ApplicationHeatmap.jsx
import { useState } from 'react';

export function ApplicationHeatmap({ data }) {
    const [hoveredDay, setHoveredDay] = useState(null);

    // Generate last 90 days
    const generateDays = () => {
        const days = [];
        const today = new Date();

        for (let i = 89; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dateStr = date.toISOString().split('T')[0];
            const dayData = data.find(d => d.date === dateStr);

            days.push({
                date: dateStr,
                day: date.getDate(),
                month: date.toLocaleString('default', { month: 'short' }),
                count: dayData?.count || 0,
                dayOfWeek: date.getDay(),
            });
        }

        return days;
    };

    const days = generateDays();

    const getIntensity = (count) => {
        if (count === 0) return 'bg-muted hover:bg-muted/80';
        if (count <= 2) return 'bg-foreground/20 hover:bg-foreground/30';
        if (count <= 4) return 'bg-foreground/40 hover:bg-foreground/50';
        if (count <= 6) return 'bg-foreground/60 hover:bg-foreground/70';
        return 'bg-foreground/80 hover:bg-foreground/90';
    };

    // Group by weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <div className="bg-card border rounded-xl p-2 md:p-3 lg:p-4">
            <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
                <h2 className="text-lg font-semibold">Application Activity</h2>
                <p className="text-sm text-muted-foreground">Last 90 days</p>
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-2 md:space-y-3 lg:space-y-4 mb-2 md:mb-3 lg:mb-4">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex gap-2 md:gap-3 lg:gap-4">
                        {week.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className={`flex-1 aspect-square rounded ${getIntensity(day.count)} cursor-pointer transition-all relative group`}
                                onMouseEnter={() => setHoveredDay(day)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                {/* Tooltip */}
                                {hoveredDay?.date === day.date && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-foreground text-background text-xs rounded shadow-lg whitespace-nowrap z-10 mb-2 md:mb-3 lg:mb-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        <p className="font-semibold">{day.count} applications</p>
                                        <p>{day.month} {day.day}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-2 md:gap-3 lg:gap-4">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <div className="w-4 h-4 rounded bg-foreground/20" />
                    <div className="w-4 h-4 rounded bg-foreground/40" />
                    <div className="w-4 h-4 rounded bg-foreground/60" />
                    <div className="w-4 h-4 rounded bg-foreground/80" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
