// src/features/dashboard/WeeklyGoal.jsx
import { Target, TrendingUp } from 'lucide-react';

export function WeeklyGoal({ current, goal }) {
    const percentage = Math.min((current / goal) * 100, 100);
    const remaining = Math.max(goal - current, 0);

    return (
        <div className="bg-card border-2 rounded-2xl p-2 md:p-3 lg:p-4">
            <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
                <h3 className="text-lg font-bold">Weekly Goal</h3>
                <div className="rounded-lg bg-foreground/5 p-2 md:p-3 lg:p-4">
                    <Target className="h-5 w-5" />
                </div>
            </div>

            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                <div className="text-center">
                    <div className="text-5xl font-bold mb-2 md:mb-3 lg:mb-4">{current}</div>
                    <p className="text-sm text-muted-foreground">
                        of {goal} applications
                    </p>
                </div>

                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-foreground transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        {percentage >= 100 ? (
                            <span className="text-green-500 font-semibold flex items-center justify-center gap-2 md:gap-3 lg:gap-4">
                <TrendingUp className="h-3 w-3" />
                Goal achieved! 🎉
              </span>
                        ) : (
                            `${remaining} more to reach your goal`
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
