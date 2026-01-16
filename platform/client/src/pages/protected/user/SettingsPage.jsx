import { AccountSettingsSection } from "./settings/components/AccountSettingsSection";
import { SecuritySettingsSection } from "./settings/components/SecuritySettingsSection";
import { NotificationSettingsSection } from "./settings/components/NotificationSettingsSection";
import { DangerZoneSection } from "./settings/components/DangerZoneSection";

export default function SettingsPage() {
    return (
        <div className="h-full overflow-hidden flex flex-col bg-white rounded-xl border border-slate-100 hover:border-slate-200 animate-in fade-in duration-300">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="mx-auto space-y-4 p-3 lg:space-y-6 lg:p-6">
                    {/* Page Header */}
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg lg:text-2xl font-bold text-slate-900">Settings</h1>
                            <p className="text-xs lg:text-sm text-slate-500 mt-1">Manage your account and preferences</p>
                        </div>
                    </div>

                    {/* Sections */}
                    <section id="account">
                        <AccountSettingsSection />
                    </section>

                    <section id="security">
                        <SecuritySettingsSection />
                    </section>

                    <section id="notifications">
                        <NotificationSettingsSection />
                    </section>

                    <section id="danger-zone">
                        <DangerZoneSection />
                    </section>

                    <div className="h-8" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}