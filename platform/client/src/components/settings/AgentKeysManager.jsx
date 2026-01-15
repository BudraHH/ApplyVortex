/**
 * Agent API Keys Management Component
 * Allows user to generate, view, and revoke API keys for agent authentication
 */
import React, { useState, useEffect } from 'react';
import { agentKeysAPI } from '@/services/api/agentKeysAPI';
import { Copy, Trash2, Plus, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/Label';

export function AgentKeysManager() {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [generatedKey, setGeneratedKey] = useState(null);
    const [copiedKey, setCopiedKey] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const data = await agentKeysAPI.listKeys();
            setKeys(data);
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateKey = async () => {
        if (!newKeyName.trim()) return;

        try {
            const newKey = await agentKeysAPI.generateKey(newKeyName);
            setGeneratedKey(newKey);
            setNewKeyName('');
            fetchKeys();
        } catch (error) {
            console.error('Failed to generate API key:', error);
            alert('Failed to generate API key. You may have reached the limit (10 keys).');
        }
    };

    const handleRevokeKey = async (keyId, keyName) => {
        if (!confirm(`Are you sure you want to revoke "${keyName}"? This cannot be undone.`)) {
            return;
        }

        try {
            await agentKeysAPI.revokeKey(keyId);
            fetchKeys();
        } catch (error) {
            console.error('Failed to revoke API key:', error);
            alert('Failed to revoke API key.');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="text-center py-2 md:py-3 lg:py-4">Loading...</div>;
    }

    return (
        <div className="space-y-2 md:space-y-3 lg:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 ">Agent API Keys</h2>
                    <p className="text-sm text-slate-600 mt-2 md:mt-3 lg:mt-4">
                        Manage API keys for your Agent Forge clients
                    </p>
                </div>
                <button
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                >
                    <Plus className="h-4 w-4" />
                    Generate New Key
                </button>
            </div>

            {/* Keys List */}
            <div className="bg-white  rounded-lg shadow overflow-hidden">
                {keys.length === 0 ? (
                    <div className="text-center py-2 md:py-3 lg:py-4">
                        <Key className="h-12 w-12 text-slate-400 mx-auto mb-2 md:mb-3 lg:mb-4" />
                        <p className="text-slate-600 ">No API keys yet</p>
                        <p className="text-sm text-slate-500 mt-2 md:mt-3 lg:mt-4">
                            Generate your first key to get started
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 ">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    Name
                                </th>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    Key Prefix
                                </th>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    Created
                                </th>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    Last Used
                                </th>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    Status
                                </th>
                                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 ">
                            {keys.map((key) => (
                                <tr key={key.id} className="hover:bg-slate-50 ">
                                    <td className="whitespace-nowrap text-sm font-medium text-slate-900 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        {key.name}
                                    </td>
                                    <td className="whitespace-nowrap text-sm font-mono text-slate-600 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        {key.key_prefix}...
                                    </td>
                                    <td className="whitespace-nowrap text-sm text-slate-600 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        {formatDate(key.created_at)}
                                    </td>
                                    <td className="whitespace-nowrap text-sm text-slate-600 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                                    </td>
                                    <td className="whitespace-nowrap px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        <span className={`text-xs font-medium rounded-full ${key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' } px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}>
                                            {key.is_active ? 'Active' : 'Revoked'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap text-right text-sm px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        <button
                                            onClick={() => handleRevokeKey(key.id, key.name)}
                                            className="text-red-600 hover:text-red-900  "
                                            disabled={!key.is_active}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Generate Key Modal */}
            <AnimatePresence>
                {showGenerateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg max-w-md w-full p-2 md:p-3 lg:p-4 mx-2 md:mx-3 lg:mx-4"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-2 md:mb-3 lg:mb-4">
                                Generate New API Key
                            </h3>
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <div>
                                    <Label className="block text-sm font-medium text-slate-700 mb-2 md:mb-3 lg:mb-4">
                                        Key Name
                                    </Label>
                                    <input
                                        type="text"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        placeholder="e.g., Johns MacBook"
                                        className="w-full border border-slate-300 rounded-lg bg-white text-slate-900 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                    />
                                </div>
                                <div className="flex gap-2 md:gap-3 lg:gap-4">
                                    <button
                                        onClick={() => {
                                            setShowGenerateModal(false);
                                            setNewKeyName('');
                                        }}
                                        className="flex-1 border border-slate-300 rounded-lg hover:bg-slate-50 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerateKey}
                                        disabled={!newKeyName.trim()}
                                        className="flex-1 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Generated Key Modal */}
            <AnimatePresence>
                {generatedKey && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg max-w-2xl w-full p-2 md:p-3 lg:p-4 mx-2 md:mx-3 lg:mx-4"
                        >
                            <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mb-2 md:mb-3 lg:mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <h3 className="text-lg font-bold text-slate-900 ">
                                    API Key Generated!
                                </h3>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-3 lg:p-4 mb-2 md:mb-3 lg:mb-4">
                                <div className="flex gap-2 md:gap-3 lg:gap-4">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-2 md:mt-3 lg:mt-4" />
                                    <div className="text-sm text-yellow-800 ">
                                        <strong>Important:</strong> This is the only time you'll see this key. Copy it now and store it securely. </div> </div> </div> <div className="space-y-4"> <div> <Label className="block text-sm font-medium text-slate-700 mb-2"> API Key </Label> <div className="flex gap-2"> <input type="text" value={generatedKey.api_key} readOnly className="flex-1 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-mono text-sm" /> <button onClick={() => copyToClipboard(generatedKey.api_key)} className="px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2" > {copiedKey ? ( <> <CheckCircle className="h-4 w-4" /> Copied! </> ) : ( <> <Copy className="h-4 w-4" /> Copy </> )} </button> </div> </div> <div className="bg-slate-50 rounded-lg p-4"> <p className="text-sm text-slate-700 font-medium mb-2"> Next Steps: </p> <ol className="text-sm text-slate-600 list-decimal list-inside"> <li>Copy the API key above</li> <li>Add it to your agent px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 space-y-2 md:space-y-3 lg:space-y-4's <code className="bg-slate-200 rounded px-2 md:px-3 lg:px-4">.env</code> file</li>
                                        <li>Set <code className="bg-slate-200 rounded px-2 md:px-3 lg:px-4">API_KEY=apf_agent_...</code></li>
                                        <li>Start your agent</li>
                                    </ol>
                                </div>

                                <button
                                    onClick={() => setGeneratedKey(null)}
                                    className="w-full bg-slate-600 text-white rounded-lg hover:bg-slate-700 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AgentKeysManager;
