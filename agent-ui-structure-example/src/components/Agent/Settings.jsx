import { useState, useEffect } from 'react';
import { Palette, Zap, Monitor } from 'lucide-react';

export const Settings = ({ theme, currentTheme, onThemeChange, onSettingChange }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Local state for toggles
    const [autoStart, setAutoStart] = useState(false);
    const [backgroundPersistence, setBackgroundPersistence] = useState(true);
    const [browserVisibility, setBrowserVisibility] = useState(false);
    const [gpuAcceleration, setGpuAcceleration] = useState(true);

    // Load initial settings from Python
    useEffect(() => {
        const loadSettings = async () => {
            if (window.pywebview?.api?.get_settings) {
                try {
                    const settings = await window.pywebview.api.get_settings();
                    if (settings) {
                        setAutoStart(settings.auto_start || false);
                        setBackgroundPersistence(settings.background_persistence !== false);
                        setBrowserVisibility(settings.browser_visibility || false);
                        setGpuAcceleration(settings.gpu_acceleration !== false);
                    }
                } catch (e) {
                    console.error('Failed to load settings:', e);
                }
            }
        };
        loadSettings();
    }, []);

    // Handle toggle changes
    const handleToggle = async (key, value, setter) => {
        setter(value);

        // Call Python API
        if (window.pywebview?.api?.update_setting) {
            try {
                await window.pywebview.api.update_setting(key, value);
            } catch (e) {
                console.error(`Failed to update ${key}:`, e);
            }
        } else if (onSettingChange) {
            onSettingChange(key, value);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className={`text-xl font-black uppercase tracking-tight transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>System Configuration</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">
                    Manage agent runtime and environmental parameters.
                </p>
            </div>

            <div className="space-y-4">
                {/* Appearance Settings */}
                <div className={`border rounded-lg p-6 shadow-sm transition-colors ${isDark ? 'bg-[#0C0C0C] border-[#1A1A1A]' : 'bg-white border-[#EAEAEA]'
                    }`}>
                    <h3 className={`text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-widest transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>
                        <Palette size={14} className={isDark ? 'text-brand-400' : 'text-brand-500'} />
                        Aesthetics
                    </h3>
                    <div className="max-w-xs">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                            Interface Mode
                        </label>
                        <select
                            value={currentTheme}
                            onChange={(e) => onThemeChange(e.target.value)}
                            className={`w-full px-4 py-2.5 text-xs font-black border rounded-lg focus:outline-none focus:ring-1 transition-all cursor-pointer uppercase tracking-tight ${isDark ? 'bg-[#050505] text-[#E5E5E5] border-[#1A1A1A] focus:ring-brand-400/30' : 'bg-[#FAFAFA] text-black border-[#EAEAEA] focus:ring-brand-500/30'
                                }`}
                        >
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                            <option value="system">OS Default</option>
                        </select>
                    </div>
                </div>

                {/* Operations Settings */}
                <div className={`border rounded-lg p-6 shadow-sm transition-colors ${isDark ? 'bg-[#0C0C0C] border-[#1A1A1A]' : 'bg-white border-[#EAEAEA]'
                    }`}>
                    <h3 className={`text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-widest transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>
                        <Monitor size={14} className={isDark ? 'text-brand-400' : 'text-brand-500'} />
                        Operations
                    </h3>
                    <div className="space-y-5">
                        {/* Login Auto-start */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-black uppercase tracking-tight transition-colors ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900'}`}>Login Auto-start</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Initialize agent forge on system boot</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={autoStart}
                                    onChange={(e) => handleToggle('auto_start', e.target.checked, setAutoStart)}
                                />
                                <div className={`w-10 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-4 after:w-4 after:transition-all border transition-colors ${isDark
                                    ? 'bg-[#1A1A1A] border-[#333333] after:bg-[#444444] peer-checked:bg-brand-400 peer-checked:border-brand-400 peer-checked:after:bg-white'
                                    : 'bg-gray-100 border-gray-200 after:bg-white peer-checked:bg-brand-500 peer-checked:border-brand-500'
                                    }`}></div>
                            </label>
                        </div>

                        {/* Background Persistence */}
                        <div className={`flex items-center justify-between pt-5 border-t transition-colors ${isDark ? 'border-[#1A1A1A]' : 'border-[#EAEAEA]'}`}>
                            <div>
                                <p className={`text-xs font-black uppercase tracking-tight transition-colors ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900'}`}>Background Persistence</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Keep agent active when window is closed</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={backgroundPersistence}
                                    onChange={(e) => handleToggle('background_persistence', e.target.checked, setBackgroundPersistence)}
                                />
                                <div className={`w-10 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-4 after:w-4 after:transition-all border transition-colors ${isDark
                                    ? 'bg-[#1A1A1A] border-[#333333] after:bg-[#444444] peer-checked:bg-brand-400 peer-checked:border-brand-400 peer-checked:after:bg-white'
                                    : 'bg-gray-100 border-gray-200 after:bg-white peer-checked:bg-brand-500 peer-checked:border-brand-500'
                                    }`}></div>
                            </label>
                        </div>

                        {/* Browser Visibility */}
                        <div className={`flex items-center justify-between pt-5 border-t transition-colors ${isDark ? 'border-[#1A1A1A]' : 'border-[#EAEAEA]'}`}>
                            <div>
                                <p className={`text-xs font-black uppercase tracking-tight transition-colors ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900'}`}>Browser Visibility</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Show automated browser during execution</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={browserVisibility}
                                    onChange={(e) => handleToggle('browser_visibility', e.target.checked, setBrowserVisibility)}
                                />
                                <div className={`w-10 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-4 after:w-4 after:transition-all border transition-colors ${isDark
                                    ? 'bg-[#1A1A1A] border-[#333333] after:bg-[#444444] peer-checked:bg-brand-400 peer-checked:border-brand-400 peer-checked:after:bg-white'
                                    : 'bg-gray-100 border-gray-200 after:bg-white peer-checked:bg-brand-500 peer-checked:border-brand-500'
                                    }`}></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Hardware Settings */}
                <div className={`border rounded-lg p-6 shadow-sm transition-colors ${isDark ? 'bg-[#0C0C0C] border-[#1A1A1A]' : 'bg-white border-[#EAEAEA]'
                    }`}>
                    <h3 className={`text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-widest transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>
                        <Zap size={14} className={isDark ? 'text-brand-400' : 'text-brand-500'} />
                        Hardware & Memory
                    </h3>
                    <div className="space-y-5">
                        {/* GPU Acceleration */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-black uppercase tracking-tight transition-colors ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900'}`}>GPU Acceleration</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Enable hardware decoding for animations</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={gpuAcceleration}
                                    onChange={(e) => handleToggle('gpu_acceleration', e.target.checked, setGpuAcceleration)}
                                />
                                <div className={`w-10 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-4 after:w-4 after:transition-all border transition-colors ${isDark
                                    ? 'bg-[#1A1A1A] border-[#333333] after:bg-[#444444] peer-checked:bg-brand-400 peer-checked:border-brand-400 peer-checked:after:bg-white'
                                    : 'bg-gray-100 border-gray-200 after:bg-white peer-checked:bg-brand-500 peer-checked:border-brand-500'
                                    }`}></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
