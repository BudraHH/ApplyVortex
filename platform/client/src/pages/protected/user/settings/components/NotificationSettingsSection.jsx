import { useState } from "react";
import { Bell, MailOpen, ShieldAlert, BarChart, Gift, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { SectionCard, SectionHeader, Switch } from "./Shared";

export function NotificationSettingsSection() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [notifications, setNotifications] = useState({
        security: true,
        updates: true,
        report: true,
        marketing: false
    });
    const [originalNotifications, setOriginalNotifications] = useState(null);

    const handleChange = (key, value) => setNotifications(prev => ({ ...prev, [key]: value }));

    const isDirty = JSON.stringify(notifications) !== JSON.stringify(originalNotifications || { security: true, updates: true, report: true, marketing: false });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            setOriginalNotifications(notifications);
            toast({ title: "Preferences Saved", description: "Your notification settings have been updated." });
        } catch {
            toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const items = [
        { id: "security", label: "Security Alerts", desc: "Get notified about important security events", icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
        { id: "updates", label: "Product Updates", desc: "New features and improvements", icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
        { id: "report", label: "Weekly Report", desc: "Summary of your activity and stats", icon: BarChart, color: "text-emerald-600", bg: "bg-emerald-50" },
        { id: "marketing", label: "Marketing", desc: "Tips, offers, and promotional content", icon: Gift, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    return (
        <SectionCard>
            <SectionHeader
                icon={MailOpen}
                title="Email Notifications"
                description="Manage how you receive updates"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
            />
            <div className="divide-y divide-slate-100">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between hover:bg-slate-50/50 transition-colors px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className={cn("rounded-lg p-2", item.bg)}>
                                <item.icon className={cn("h-5 w-5", item.color)} />
                            </div>
                            <div>
                                <Label
                                    className="text-sm font-medium text-slate-900 cursor-pointer hover:text-brand-600 transition-colors"
                                    onClick={() => handleChange(item.id, !notifications[item.id])}
                                >
                                    {item.label}
                                </Label>
                                <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                            </div>
                        </div>
                        <Switch
                            checked={notifications[item.id]}
                            onCheckedChange={(val) => handleChange(item.id, val)}
                        />
                    </div>
                ))}
            </div>
            <div className="bg-slate-50 border-t border-slate-100 flex justify-end px-6 py-4">
                <Button onClick={handleSave} disabled={isSaving || !isDirty} className="min-w-[120px]">
                    {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
                </Button>
            </div>
        </SectionCard>
    );
}
