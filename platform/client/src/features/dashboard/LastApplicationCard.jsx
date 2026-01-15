// src/features/dashboard/LastApplicationCard.jsx
import { Calendar, ExternalLink } from 'lucide-react';

export function LastApplicationCard({ application }) {
    if (!application) {
        return (
            <div className="bg-card border rounded-xl text-center p-2 md:p-3 lg:p-4">
                <p className="text-muted-foreground">No applications yet</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} days ago`;
    };

    return (
        <div className="bg-card border-2 rounded-xl p-2 md:p-3 lg:p-4">
            <div className="flex items-start justify-between mb-2 md:mb-3 lg:mb-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Last Applied</h2>
                <span className="rounded-full text-xs font-medium bg-muted px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
          {application.portal}
        </span>
            </div>

            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                <div>
                    <h3 className="text-3xl font-bold mb-2 md:mb-3 lg:mb-4">{application.role}</h3>
                    <p className="text-lg text-muted-foreground">{application.company}</p>
                </div>

                <div className="flex items-center text-muted-foreground gap-2 md:gap-3 lg:gap-4">
                    <Calendar className="h-5 w-5" />
                    <span className="text-lg">{formatDate(application.appliedDate)}</span>
                </div>

                <div className="border-t pt-2 md:pt-3 lg:pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="text-sm font-medium capitalize">{application.status}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
