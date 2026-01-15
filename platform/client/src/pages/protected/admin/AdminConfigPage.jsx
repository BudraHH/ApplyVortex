import { useState } from 'react';
import { Button } from "@/components/ui/Button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select.jsx";
import { Label } from "@/components/ui/Label";
import {
    Settings, Brain, Globe, Flag, DollarSign, Bell, Save, AlertTriangle
} from 'lucide-react';

export default function AdminConfigPage() {
    // AI & LLM Settings
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [resumePrompt, setResumePrompt] = useState('You are an expert ATS optimizer...');
    const [coverLetterPrompt, setCoverLetterPrompt] = useState('You are a professional cover letter writer...');
    const [temperature, setTemperature] = useState(0.7);

    // Scraper Configuration
    const [platforms, setPlatforms] = useState({
        linkedin: true,
        indeed: false,
        glassdoor: true,
    });
    const [maxJobsPerDay, setMaxJobsPerDay] = useState(10000);
    const [scrapeInterval, setScrapeInterval] = useState(6);
    const [proxyStrategy, setProxyStrategy] = useState('residential');

    // Feature Flags
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [pauseJobQueue, setPauseJobQueue] = useState(false);
    const [allowSignups, setAllowSignups] = useState(true);

    // Plan & Credit Limits
    const [freeTierCredits, setFreeTierCredits] = useState(5);
    const [proTierCredits, setProTierCredits] = useState(50);
    const [maxTierCredits, setMaxTierCredits] = useState(200);
    const [jobAppLimit, setJobAppLimit] = useState(50);
    const [trialDays, setTrialDays] = useState(7);

    // Notifications
    const [emailAlerts, setEmailAlerts] = useState({
        newSignup: true,
        scraperFailure: true,
        paymentReceived: false,
    });
    const [bannerMessage, setBannerMessage] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: Implement API call to save configuration
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Configuration saved successfully!');
        } catch (error) {
            console.error('Failed to save configuration:', error);
            alert('Failed to save configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full w-full bg-white text-zinc-950 font-sans">
            <main className="w-full mx-auto space-y-2 md:space-y-3 lg:space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-black flex items-center gap-2 md:gap-3 lg:gap-4">
                            <Settings className="h-8 w-8 text-brand-600" />
                            System Configuration
                        </h1>
                        <p className="text-sm text-zinc-500 mt-2 md:mt-3 lg:mt-4">Manage global settings, AI models, and feature flags</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        <Save className="h-4 w-4 mr-2 md:mr-3 lg:mr-4" />
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="ai" className="w-full">
                    <div className="border-b border-zinc-100 mb-2 md:mb-3 lg:mb-4">
                        <TabsList className="h-12 w-full justify-start bg-transparent p-0 gap-2 md:gap-3 lg:gap-4">
                            {[
                                { value: 'ai', label: 'System' },
                                { value: 'scraper', label: 'Scraper' },
                                { value: 'flags', label: 'Feature Flags' },
                                { value: 'plans', label: 'Plans & Limits' },
                                { value: 'notifications', label: 'Notifications' },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="rounded-none border-b-2 border-transparent text-sm font-medium text-zinc-500 hover:text-black transition-all data-[state=active]:border-brand-600 data-[state=active]:text-brand-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* System Settings */}
                    <TabsContent value="ai" className="mt-0 space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="bg-white border border-zinc-200 rounded-lg space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                            <div>
                                <h3 className="text-lg font-semibold text-black mb-2 md:mb-3 lg:mb-4">System Prompts</h3>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">The "secret sauce" - instructions given to the AI</p>

                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Resume System Prompt</Label>
                                        <textarea
                                            value={resumePrompt}
                                            onChange={(e) => setResumePrompt(e.target.value)}
                                            className="w-full h-32 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none font-mono p-2 md:p-3 lg:p-4"
                                            placeholder="Enter resume generation instructions..."
                                        />
                                    </div>

                                    <div>
                                        <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Cover Letter Prompt</Label>
                                        <textarea
                                            value={coverLetterPrompt}
                                            onChange={(e) => setCoverLetterPrompt(e.target.value)}
                                            className="w-full h-32 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none font-mono p-2 md:p-3 lg:p-4"
                                            placeholder="Enter cover letter generation instructions..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 pt-2 md:pt-3 lg:pt-4">
                                <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">
                                    Temperature: {temperature.toFixed(1)}
                                </Label>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">Control creativity (0.0 = strict, 1.0 = creative)</p>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="w-full max-w-md accent-brand-600"
                                />
                                <div className="flex justify-between text-xs text-zinc-400 max-w-md mt-2 md:mt-3 lg:mt-4">
                                    <span>Strict</span>
                                    <span>Creative</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Scraper Configuration */}
                    <TabsContent value="scraper" className="mt-0 space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="bg-white border border-zinc-200 rounded-lg space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                            <div>
                                <h3 className="text-lg font-semibold text-black mb-2 md:mb-3 lg:mb-4">Platform Toggles</h3>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">Enable or disable specific job platforms</p>

                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    {Object.entries(platforms).map(([platform, enabled]) => (
                                        <div key={platform} className="flex items-center justify-between bg-zinc-50 rounded-lg border border-zinc-100 p-2 md:p-3 lg:p-4">
                                            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={enabled}
                                                    onChange={(e) => setPlatforms({ ...platforms, [platform]: e.target.checked })}
                                                    className="h-4 w-4 accent-brand-600"
                                                    disabled={platform === 'indeed'}
                                                />
                                                <span className="text-sm font-medium text-zinc-900 capitalize">{platform}</span>
                                            </div>
                                            {platform === 'indeed' && (
                                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                                    Disabled (Captcha Issues)
                                                </Badge>
                                            )}
                                            {enabled && platform !== 'indeed' && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 pt-2 md:pt-3 lg:pt-4">
                                <h3 className="text-lg font-semibold text-black mb-2 md:mb-3 lg:mb-4">Global Daily Limits</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Max Jobs to Scrape/Day</Label>
                                        <input
                                            type="number"
                                            value={maxJobsPerDay}
                                            onChange={(e) => setMaxJobsPerDay(parseInt(e.target.value))}
                                            className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Scrape Interval (hours)</Label>
                                        <input
                                            type="number"
                                            value={scrapeInterval}
                                            onChange={(e) => setScrapeInterval(parseInt(e.target.value))}
                                            className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 pt-2 md:pt-3 lg:pt-4">
                                <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Proxy Strategy</Label>
                                <Select value={proxyStrategy} onValueChange={setProxyStrategy}>
                                    <SelectTrigger className="w-full max-w-md">
                                        <SelectValue placeholder="Select proxy type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="residential">Residential Proxies</SelectItem>
                                        <SelectItem value="datacenter">Datacenter Proxies</SelectItem>
                                        <SelectItem value="mobile">Mobile 4G Proxies</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Feature Flags */}
                    <TabsContent value="flags" className="mt-0 space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="bg-white border border-zinc-200 rounded-lg space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                            <div>
                                <h3 className="text-lg font-semibold text-black mb-2 md:mb-3 lg:mb-4">Emergency Controls</h3>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">Kill switches for critical system functions</p>

                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    <div className="flex items-center justify-between bg-red-50 rounded-lg border border-red-200 p-2 md:p-3 lg:p-4">
                                        <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                            <div>
                                                <p className="text-sm font-semibold text-red-900">Maintenance Mode</p>
                                                <p className="text-xs text-red-600">Shows "upgrading" screen to users</p>
                                            </div>
                                        </div>
                                        <Label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={maintenanceMode}
                                                onChange={(e) => setMaintenanceMode(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                        </Label>
                                    </div>

                                    <div className="flex items-center justify-between bg-amber-50 rounded-lg border border-amber-200 p-2 md:p-3 lg:p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-amber-900">Pause Job Queue</p>
                                            <p className="text-xs text-amber-600">Stop processing background tasks</p>
                                        </div>
                                        <Label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={pauseJobQueue}
                                                onChange={(e) => setPauseJobQueue(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                        </Label>
                                    </div>

                                    <div className="flex items-center justify-between bg-zinc-50 rounded-lg border border-zinc-200 p-2 md:p-3 lg:p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">Allow New Signups</p>
                                            <p className="text-xs text-zinc-600">Toggle OFF if overwhelmed or spammed</p>
                                        </div>
                                        <Label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allowSignups}
                                                onChange={(e) => setAllowSignups(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Plans & Limits */}
                    <TabsContent value="plans" className="mt-0 space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="bg-white border border-zinc-200 rounded-lg space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                            <div>
                                <h3 className="text-lg font-semibold text-black mb-2 md:mb-3 lg:mb-4">Subscription Tiers</h3>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">Configure credit limits for each subscription tier</p>

                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    {/* Free Tier */}
                                    <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-2 md:p-3 lg:p-4">
                                        <h4 className="text-sm font-semibold text-zinc-900 mb-2 md:mb-3 lg:mb-4">Free Tier</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                            <div>
                                                <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Resume Credits</Label>
                                                <input
                                                    type="number"
                                                    value={freeTierCredits}
                                                    onChange={(e) => setFreeTierCredits(parseInt(e.target.value))}
                                                    className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                                />
                                                <p className="text-xs text-zinc-400 mt-2 md:mt-3 lg:mt-4">Resumes per free user</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pro Tier */}
                                    <div className="bg-brand-50 rounded-lg border border-brand-200 p-2 md:p-3 lg:p-4">
                                        <h4 className="text-sm font-semibold text-brand-900 mb-2 md:mb-3 lg:mb-4">Pro Tier</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                            <div>
                                                <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Resume Credits</Label>
                                                <input
                                                    type="number"
                                                    value={proTierCredits}
                                                    onChange={(e) => setProTierCredits(parseInt(e.target.value))}
                                                    className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                                />
                                                <p className="text-xs text-zinc-400 mt-2 md:mt-3 lg:mt-4">Resumes per Pro user</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Max Tier */}
                                    <div className="bg-purple-50 rounded-lg border border-purple-200 p-2 md:p-3 lg:p-4">
                                        <h4 className="text-sm font-semibold text-purple-900 mb-2 md:mb-3 lg:mb-4">Max Tier</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                            <div>
                                                <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Resume Credits</Label>
                                                <input
                                                    type="number"
                                                    value={maxTierCredits}
                                                    onChange={(e) => setMaxTierCredits(parseInt(e.target.value))}
                                                    className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                                />
                                                <p className="text-xs text-zinc-400 mt-2 md:mt-3 lg:mt-4">Resumes per Max user</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 pt-2 md:pt-3 lg:pt-4">
                                <h3 className="text-lg font-semibold text-black mb-2 md:mb-3 lg:mb-4">General Limits</h3>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">Global limits and trial settings</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Job Application Limit</Label>
                                        <input
                                            type="number"
                                            value={jobAppLimit}
                                            onChange={(e) => setJobAppLimit(parseInt(e.target.value))}
                                            className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                        />
                                        <p className="text-xs text-zinc-400 mt-2 md:mt-3 lg:mt-4">Max applications/day/user</p>
                                    </div>

                                    <div>
                                        <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Default Trial Days</Label>
                                        <input
                                            type="number"
                                            value={trialDays}
                                            onChange={(e) => setTrialDays(parseInt(e.target.value))}
                                            className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                        />
                                        <p className="text-xs text-zinc-400 mt-2 md:mt-3 lg:mt-4">Trial period length</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="notifications" className="mt-0 space-y-2 md:space-y-3 lg:space-y-4">
                        <div className="bg-white border border-zinc-200 rounded-lg space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                            <div>
                                <h3 className="text-lg font-semibold text-black mb-2 md:mb-3 lg:mb-4">Admin Email Alerts</h3>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">Receive email notifications for important events</p>

                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    {Object.entries({
                                        newSignup: 'New User Signup',
                                        scraperFailure: 'Scraper Failure (>10%)',
                                        paymentReceived: 'Payment Received',
                                    }).map(([key, label]) => (
                                        <div key={key} className="flex items-center bg-zinc-50 rounded-lg border border-zinc-100 gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4">
                                            <input
                                                type="checkbox"
                                                checked={emailAlerts[key]}
                                                onChange={(e) => setEmailAlerts({ ...emailAlerts, [key]: e.target.checked })}
                                                className="h-4 w-4 accent-brand-600"
                                            />
                                            <span className="text-sm font-medium text-zinc-900">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 pt-2 md:pt-3 lg:pt-4">
                                <Label className="block text-sm font-medium text-zinc-700 mb-2 md:mb-3 lg:mb-4">Banner Message</Label>
                                <p className="text-xs text-zinc-500 mb-2 md:mb-3 lg:mb-4">Broadcast a message to all users</p>
                                <textarea
                                    value={bannerMessage}
                                    onChange={(e) => setBannerMessage(e.target.value)}
                                    className="w-full h-24 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none p-2 md:p-3 lg:p-4"
                                    placeholder="e.g., 'LinkedIn scraping is delayed today due to updates.'"
                                />
                                {bannerMessage && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg mt-2 md:mt-3 lg:mt-4 p-2 md:p-3 lg:p-4">
                                        <p className="text-xs font-medium text-amber-900">Preview:</p>
                                        <p className="text-sm text-amber-700 mt-2 md:mt-3 lg:mt-4">{bannerMessage}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
