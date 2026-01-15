import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { userAPI } from "@/services/api/userAPI";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { SectionCard, SectionHeader } from "./Shared";

export function DangerZoneSection() {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleDelete = async () => {
        setIsDeletingAccount(true);
        try {
            await userAPI.deleteAccount();
            setIsDeleteModalOpen(false);
            useAuthStore.getState().logout();
            window.location.href = "/login?msg=account_deleted";
        } catch {
            toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    return (
        <>
            <SectionCard className="border-red-200/80 hover:border-red-300/80">
                <SectionHeader
                    icon={Trash2}
                    title="Danger Zone"
                    description="Irreversible account actions"
                    iconBg="bg-red-50"
                    iconColor="text-red-600"
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
                    <div>
                        <h4 className="font-medium text-slate-900">Delete Account</h4>
                        <p className="text-sm text-slate-500 max-w-md mt-1">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="shrink-0">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                    </Button>
                </div>
            </SectionCard>

            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isDeletingAccount && setIsDeleteModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="border-b border-slate-100 flex items-center justify-between px-6 py-4">
                                <h3 className="font-semibold text-lg text-red-600">Delete Account</h3>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors p-2"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4 p-6">
                                <div className="bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 p-4">
                                    <p className="font-semibold mb-2">⚠️ Warning: This action is permanent</p>
                                    <ul className="text-red-600/80 space-y-2">
                                        <li>• Your profile and all data will be deleted</li>
                                        <li>• Active agents will be stopped immediately</li>
                                        <li>• This cannot be undone</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-sm text-slate-700">
                                        Type <span className="font-mono font-bold text-slate-900">{user?.email}</span> to confirm
                                    </Label>
                                    <Input
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder={user?.email}
                                        className="text-center"
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 border-t border-slate-100 space-y-3 px-6 py-4">
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    disabled={deleteConfirmationText !== user?.email || isDeletingAccount}
                                    onClick={handleDelete}
                                >
                                    {isDeletingAccount ? "Deleting..." : "Delete Permanently"}
                                </Button>
                                <Button variant="ghost" className="w-full" onClick={() => setIsDeleteModalOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
