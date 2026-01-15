import { useState } from 'react';
import { Button } from "@/components/ui/Button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    AlertTriangle, Trash2, Database, RefreshCw, Shield, Ban, Zap, Users, FileX, Lock
} from 'lucide-react';
import { Label } from "@/components/ui/Label";

// Confirmation Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, action, confirmText = 'DELETE', requirePassword = false }) {
    const [inputValue, setInputValue] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        if (inputValue.toUpperCase() !== confirmText.toUpperCase()) {
            alert(`Please type "${confirmText}" to confirm`);
            return;
        }

        if (requirePassword && !password) {
            alert('Password is required for this action');
            return;
        }

        setIsProcessing(true);
        try {
            await onConfirm(password);
            setInputValue('');
            setPassword('');
            onClose();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-3 lg:p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900">{action.title}</h3>
                </div>

                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <p className="text-sm text-zinc-700">{action.description}</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3 lg:p-4">
                        <p className="text-xs font-semibold text-red-900">This action cannot be undone</p>
                        <p className="text-xs text-red-700 mt-2 md:mt-3 lg:mt-4">{action.consequence}</p>
                    </div>
                </div>

                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <div>
                        <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">
                            Type <span className="font-mono font-bold text-red-600">{confirmText}</span> to confirm
                        </Label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                            placeholder={confirmText}
                        />
                    </div>

                    {requirePassword && (
                        <div>
                            <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">
                                Enter your password to confirm
                            </Label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                placeholder="Your password"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'I understand'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDangerZonePage() {
    const [modalState, setModalState] = useState({ isOpen: false, action: null });

    const openModal = (action) => {
        setModalState({ isOpen: true, action });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, action: null });
    };

    const handleAction = async (actionId, password = null) => {
        console.log(`Executing action: ${actionId}`, password ? 'with password' : 'without password');
        // TODO: Implement actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert(`Action "${actionId}" executed successfully (placeholder)`);
    };

    const dangerActions = {
        cache: [
            {
                id: 'flush-redis',
                title: 'Flush Redis Cache',
                description: 'Clears all cached data from Redis. This will force a clean slate for all cached job statuses, user sessions, and temporary data.',
                consequence: 'All user may experience slower load times temporarily. Active sessions may be disrupted.',
                icon: Database,
                confirmText: 'FLUSH',
                requirePassword: false,
            },
            {
                id: 'truncate-logs',
                title: 'Truncate System Logs',
                description: 'Deletes all audit logs and scraper logs older than 30 days.',
                consequence: 'Historical log data will be permanently lost. This cannot be recovered.',
                icon: FileX,
                confirmText: 'TRUNCATE',
                requirePassword: false,
            },
        ],
        emergency: [
            {
                id: 'cancel-ai-jobs',
                title: 'Cancel All Pending AI Jobs',
                description: 'Immediately stops all queued resume generation and AI processing tasks.',
                consequence: 'Users waiting for resume generation will need to restart their requests.',
                icon: Zap,
                confirmText: 'CANCEL',
                requirePassword: false,
            },
            {
                id: 'release-proxies',
                title: 'Force Release All Proxies',
                description: 'Resets the "In Use" flag on all proxy IPs, unblocking the scraper system.',
                consequence: 'May cause conflicts if scrapers are actually running.',
                icon: RefreshCw,
                confirmText: 'RELEASE',
                requirePassword: false,
            },
            {
                id: 'revoke-sessions',
                title: 'Revoke All User Sessions',
                description: 'Invalidates all JWT tokens and forces every user (including admins) to log in again.',
                consequence: 'ALL user will be logged out immediately, including you.',
                icon: Shield,
                confirmText: 'REVOKE',
                requirePassword: true,
            },
        ],
        data: [
            {
                id: 'purge-jobs',
                title: 'Purge Scraped Jobs',
                description: 'Deletes all job listings scraped before a specified date (default: 30 days ago).',
                consequence: 'Job data will be permanently deleted. Users cannot apply to removed jobs.',
                icon: Trash2,
                confirmText: 'PURGE',
                requirePassword: false,
            },
            {
                id: 'delete-ghost-user',
                title: 'Delete Ghost Users',
                description: 'Removes user who never verified their email or haven\'t logged in for 6+ months.',
                consequence: 'User accounts and their data will be permanently deleted.',
                icon: Users,
                confirmText: 'DELETE',
                requirePassword: false,
            },
        ],
        maintenance: [
            {
                id: 'reset-ip-bans',
                title: 'Reset IP Ban List',
                description: 'Clears all banned IPs and blocked domains from the system.',
                consequence: 'Previously blocked IPs will regain access.',
                icon: Ban,
                confirmText: 'RESET',
                requirePassword: false,
            },
            {
                id: 'reset-rate-limits',
                title: 'Reset API Rate Limits',
                description: 'Resets all rate limit counters for API usage tracking.',
                consequence: 'Users who hit rate limits will be able to make requests again.',
                icon: Lock,
                confirmText: 'RESET',
                requirePassword: false,
            },
        ],
    };

    return (
        <div className="h-full w-full bg-white text-zinc-950 font-sans">
            <main className="w-full mx-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                {/* Warning Header */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2 md:p-3 lg:p-4">
                    <div className="flex items-start gap-2 md:gap-3 lg:gap-4">
                        <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0 mt-2 md:mt-3 lg:mt-4" />
                        <div>
                            <h1 className="text-2xl font-bold text-red-900 mb-2 md:mb-3 lg:mb-4">Danger Zone</h1>
                            <p className="text-sm text-red-700 mb-2 md:mb-3 lg:mb-4">
                                This page contains irreversible, destructive, and highly disruptive actions.
                                These are emergency operations you hope to never use, but need when things go wrong.
                            </p>
                            <div className="flex items-center text-xs text-red-600 gap-2 md:gap-3 lg:gap-4">
                                <Shield className="h-4 w-4" />
                                <span className="font-semibold">All actions require confirmation. Critical actions require password re-authentication.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System & Cache Purging */}
                <section className="space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Database className="h-5 w-5 text-zinc-600" />
                        <h2 className="text-lg font-semibold text-black">System & Cache Purging</h2>
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        {dangerActions.cache.map((action) => (
                            <DangerButton
                                key={action.id}
                                action={action}
                                onClick={() => openModal(action)}
                            />
                        ))}
                    </div>
                </section>

                {/* Emergency Operations */}
                <section className="space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Zap className="h-5 w-5 text-zinc-600" />
                        <h2 className="text-lg font-semibold text-black">Emergency Operations (Panic Buttons)</h2>
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        {dangerActions.emergency.map((action) => (
                            <DangerButton
                                key={action.id}
                                action={action}
                                onClick={() => openModal(action)}
                            />
                        ))}
                    </div>
                </section>

                {/* Data Destructivity */}
                <section className="space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Trash2 className="h-5 w-5 text-zinc-600" />
                        <h2 className="text-lg font-semibold text-black">Data Destructivity (Nuclear Option)</h2>
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        {dangerActions.data.map((action) => (
                            <DangerButton
                                key={action.id}
                                action={action}
                                onClick={() => openModal(action)}
                            />
                        ))}
                    </div>
                </section>

                {/* Maintenance & Lockdowns */}
                <section className="space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Lock className="h-5 w-5 text-zinc-600" />
                        <h2 className="text-lg font-semibold text-black">Maintenance & Lockdowns</h2>
                    </div>
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        {dangerActions.maintenance.map((action) => (
                            <DangerButton
                                key={action.id}
                                action={action}
                                onClick={() => openModal(action)}
                            />
                        ))}
                    </div>
                </section>
            </main>

            {/* Confirmation Modal */}
            {modalState.isOpen && modalState.action && (
                <ConfirmationModal
                    isOpen={modalState.isOpen}
                    onClose={closeModal}
                    onConfirm={(password) => handleAction(modalState.action.id, password)}
                    action={modalState.action}
                    confirmText={modalState.action.confirmText}
                    requirePassword={modalState.action.requirePassword}
                />
            )}
        </div>
    );
}

// Danger Button Component
function DangerButton({ action, onClick }) {
    const Icon = action.icon;

    return (
        <div className="flex items-center justify-between bg-white border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50/30 transition-all group p-2 md:p-3 lg:p-4">
            <div className="flex items-start flex-1 gap-2 md:gap-3 lg:gap-4">
                <div className="bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors p-2 md:p-3 lg:p-4">
                    <Icon className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mb-2 md:mb-3 lg:mb-4">
                        <h3 className="text-sm font-semibold text-red-900">{action.title}</h3>
                        {action.requirePassword && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                <Shield className="h-3 w-3 mr-2 md:mr-3 lg:mr-4" />
                                Password Required
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-zinc-600">{action.description}</p>
                </div>
            </div>
            <Button
                onClick={onClick}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
            >
                Execute
            </Button>
        </div>
    );
}
