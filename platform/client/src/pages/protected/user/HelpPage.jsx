import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ChevronDown,
    LayoutGrid,
    User,
    FileText,
    Settings,
    Mail,
    MessageCircle,
    Zap,
    Clock,
    X,
    LifeBuoy,
    BookOpen,
    HelpCircle,
    Sparkles,
    ShieldCheck,
    ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/Input.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// ============================================
// FAQ DATA
// ============================================
const faqData = {
    general: [
        {
            question: "What is ApplyVortex?",
            answer: "ApplyVortex is a comprehensive job application management platform that helps you organize, track, and optimize your job search. It provides AI-powered resume parsing, application tracking, and personalized job recommendations.",
        },
        {
            question: "Is ApplyVortex free to use?",
            answer: "ApplyVortex offers both free and premium plans. The free plan includes basic application tracking and profile management. Premium plans unlock advanced features like AI resume optimization, unlimited applications, and priority support.",
        },
        {
            question: "How do I get started?",
            answer: "Simply sign up for an account, upload your resume for AI parsing, complete your profile setup, and start applying to jobs! Our onboarding guide will walk you through each step.",
        },
        {
            question: "Can I use ApplyVortex on mobile?",
            answer: "Yes! ApplyVortex is fully responsive and works seamlessly on mobile devices, tablets, and desktops. We also have native mobile apps coming soon.",
        },
    ],
    profile: [
        {
            question: "How does resume parsing work?",
            answer: "Upload your resume in PDF, DOC, or DOCX format. Our AI-powered parser extracts your personal information, work experience, education, skills, and projects automatically. You can then review and edit the extracted data before saving.",
        },
        {
            question: "Can I have multiple resume versions?",
            answer: "Yes! You can upload and manage multiple resume versions. Mark one as your default resume, which will be used for applications. You can switch between versions anytime.",
        },
        {
            question: "How do I edit my profile after the initial setup?",
            answer: "Navigate to Settings > Profile or click on your profile picture and select 'Edit Profile'. You can update any section including personal info, experience, education, projects, and skills.",
        },
        {
            question: "What file formats are supported for resume upload?",
            answer: "We support PDF (.pdf), Microsoft Word (.doc, .docx) formats. Maximum file size is 5MB. For best parsing results, use a well-formatted resume with clear section headers.",
        },
    ],
    applications: [
        {
            question: "How do I track my applications?",
            answer: "All your applications are automatically tracked in the Applications dashboard. You can filter by status (Applied, In Review, Interview, Offer, Rejected), sort by date, and search by company or position.",
        },
        {
            question: "Can I set reminders for follow-ups?",
            answer: "Yes! When adding or editing an application, you can set follow-up reminders. You'll receive notifications via email and in-app alerts when it's time to follow up.",
        },
        {
            question: "How do I add a new application?",
            answer: "Click the 'New Application' button on your dashboard, fill in the job details (company, position, job URL, etc.), select your resume version, and click 'Submit Application'. You can also add notes and custom fields.",
        },
        {
            question: "Can I export my application data?",
            answer: "Yes! Go to Settings > Advanced > Export Data to download all your application data in CSV or JSON format. This includes application details, statuses, dates, and notes.",
        },
    ],
    technical: [
        {
            question: "What browsers are supported?",
            answer: "ApplyVortex works best on the latest versions of Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.",
        },
        {
            question: "Why isn't my resume parsing correctly?",
            answer: "Ensure your resume is well-formatted with clear section headers (Experience, Education, Skills, etc.). Avoid using tables, columns, or images that may confuse the parser. If issues persist, contact support with your resume file.",
        },
        {
            question: "How do I reset my password?",
            answer: "Click 'Forgot Password?' on the login page, enter your email address, and follow the instructions in the reset email. The link expires in 24 hours.",
        },
        {
            question: "Is my data secure?",
            answer: "Absolutely! We use industry-standard encryption (SSL/TLS) for data transmission and AES-256 encryption for data at rest. We never share your personal information with third parties without your explicit consent.",
        },
    ],
};

const categoryConfig = {
    general: { label: 'General', icon: LayoutGrid, color: 'text-brand-600', bg: 'bg-brand-50' },
    profile: { label: 'Profile', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    applications: { label: 'Applications', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    technical: { label: 'Technical', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' },
};

const popularTopics = [
    { path: "/help/quick-start-guide", title: "Quick Start Guide", icon: Zap, desc: "Get up and running in 5 minutes", color: "bg-amber-100/50 text-amber-600", borderColor: "hover:border-amber-200" },
    { path: "/help/resume-builder", title: "Resume Builder", icon: Sparkles, desc: "Optimize your resume with AI", color: "bg-purple-100/50 text-purple-600", borderColor: "hover:border-purple-200" },
    { path: "/help/security-privacy", title: "Security & Privacy", icon: ShieldCheck, desc: "How we protect your data", color: "bg-blue-100/50 text-blue-600", borderColor: "hover:border-blue-200" },
    { path: null, title: "Live Ops Support", icon: Clock, desc: "Real-time updates & help", color: "bg-emerald-100/50 text-emerald-600", borderColor: "hover:border-emerald-200" },
];

// ============================================
// CUSTOM COMPONENTS
// ============================================

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            layout
            initial={false}
            className={cn(
                "group rounded-xl border transition-all duration-300 overflow-hidden bg-white",
                isOpen
                    ? "border-brand-200 shadow-lg shadow-brand-500/5 ring-1 ring-brand-100"
                    : "border-slate-200 hover:border-brand-200/60 hover:shadow-md"
            )}
        >
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between text-left h-auto hover:bg-transparent hover:text-inherit p-3 lg:p-4"
            >
                <span className={cn(
                    "font-medium text-[15px] transition-colors duration-300",
                    isOpen ? "text-brand-700" : "text-slate-700 group-hover:text-slate-900"
                )}>
                    {question}
                </span>
                <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                    isOpen
                        ? "bg-brand-100 text-brand-600 rotate-180"
                        : "bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600"
                )}>
                    <ChevronDown className="h-4 w-4" />
                </span>
            </Button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <div className="pt-0 px-4 pb-4">
                            <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                                {answer}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TabButton = ({ isActive, onClick, icon: Icon, children }) => (
    <Button
        variant="ghost"
        onClick={onClick}
        className={cn(
            "relative flex items-center rounded-lg h-auto text-sm font-medium transition-all hover:bg-transparent gap-3 px-4 py-3",
            isActive
                ? "text-brand-700"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        )}
    >
        {isActive && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] ring-1 ring-slate-200 rounded-lg"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
        )}
        <span className="relative z-10 flex items-center gap-2">
            {Icon && (
                <Icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-brand-600" : "text-slate-400"
                )} />
            )}
            {children}
        </span>
    </Button>
);

const PopularCard = ({ topic, onClick }) => (
    <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
            "bg-white rounded-xl border border-slate-200 hover:shadow-brand-500/5 transition-all cursor-pointer group flex flex-col justify-between h-full p-3 lg:p-4",
            topic.borderColor
        )}
    >
        <div>
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 mb-1 lg:mb-4", topic.color)}>
                <topic.icon className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors text-sm">{topic.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-0 lg:mt-4">{topic.desc}</p>
        </div>
        <div className="flex items-center text-[10px] font-semibold text-slate-400 group-hover:text-brand-600 transition-colors mt-0 lg:mt-4">
            Learn more
            <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ml-2" />
        </div>
    </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("general");
    const navigate = useNavigate();

    const filteredFAQs = useMemo(() => {
        if (!searchQuery.trim()) return null;

        const query = searchQuery.toLowerCase();
        const results = {};

        Object.keys(faqData).forEach((category) => {
            const matches = faqData[category].filter(
                (faq) =>
                    faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query)
            );
            if (matches.length > 0) {
                results[category] = matches;
            }
        });
        return results;
    }, [searchQuery]);

    const renderData = filteredFAQs || { [activeTab]: faqData[activeTab] };
    const hasResults = Object.keys(renderData).length > 0;

    return (
        <div className="h-full flex flex-col bg-white rounded-xl border border-slate-100 hover:border-slate-200 overflow-hidden">
            {/* Scrollable Container */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="mx-auto p-2 space-y-2 lg:p-6 lg:space-y-6">

                    {/* HERO SECTION */}
                    <div className="relative overflow-hidden rounded-xl bg-slate-900 text-center shadow-xl ring-1 ring-white/10 p-4 lg:p-8">
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/50 via-slate-900 to-slate-900" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />

                        {/* Content */}
                        <div className="relative z-10 max-w-2xl mx-auto space-y-4 lg:space-y-6">
                            <div className="space-y-2 lg:space-y-4">
                                <h1 className="text-2xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                                    How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-300">help you?</span>
                                </h1>
                                <p className="text-brand-100/60 text-base font-medium max-w-lg mx-auto leading-relaxed">
                                    Search our knowledge base or browse popular topics to get the answers you need.
                                </p>
                            </div>

                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="relative group max-w-xl mx-auto"
                            >
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand-400 transition-colors" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Ask a question..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-base border-0 bg-white/10 text-white placeholder:text-slate-500 shadow-xl backdrop-blur-sm transition-all focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/20 !pl-12 !pr-10"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-slate-200/20 text-slate-400 hover:text-white hover:bg-slate-200/30 transition-all hover:scale-105"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    {/* POPULAR TOPICS */}
                    {!searchQuery && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4"
                        >
                            {popularTopics.map((topic, i) => (
                                <PopularCard
                                    key={i}
                                    topic={topic}
                                    onClick={() => topic.path && navigate(topic.path)}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* MAIN CONTENT AREA */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm min-h-[400px] p-3 lg:p-6">
                        {!searchQuery && (
                            <div className="w-full flex overflow-x-auto custom-scrollbar gap-2 lg:justify-around bg-slate-100/50 rounded-xl border border-slate-200/50 mb-4 lg:mb-6 p-2">
                                {Object.entries(categoryConfig).map(([key, config]) => (
                                    <div key={key} className="shrink-0">
                                        <TabButton
                                            isActive={activeTab === key}
                                            onClick={() => setActiveTab(key)}
                                            icon={config.icon}
                                        >
                                            {config.label}
                                        </TabButton>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery && (
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Search className="h-5 w-5 text-brand-500" />
                                    Search Results
                                </h2>
                                <span className="text-xs font-semibold rounded-full bg-slate-100 text-slate-600 px-3 py-1">
                                    {Object.values(renderData).flat().length} found
                                </span>
                            </div>
                        )}

                        {/* FAQ LIST */}
                        <div className="mx-auto">
                            <AnimatePresence mode="wait">
                                {hasResults ? (
                                    <motion.div
                                        key={searchQuery ? "search" : activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        {Object.keys(renderData).map((category) => {
                                            const config = categoryConfig[category];
                                            return (
                                                <div key={category} className="space-y-4">
                                                    {searchQuery && (
                                                        <div className="flex items-center text-slate-400 first:mt-0 gap-2 mb-4 mt-8">
                                                            <div className={cn("rounded-md bg-opacity-10 p-2", config.bg)}>
                                                                <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">{config.label}</span>
                                                        </div>
                                                    )}
                                                    <div className="grid gap-3">
                                                        {renderData[category].map((faq, index) => (
                                                            <FAQItem key={`${category}-${index}`} question={faq.question} answer={faq.answer} />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-12"
                                    >
                                        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm ring-1 ring-slate-100 mb-4">
                                            <Search className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">No matching results</h3>
                                        <p className="text-sm text-slate-500 max-w-xs text-center mt-2">
                                            We couldn't find any articles matching "{searchQuery}"
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-6"
                                            onClick={() => setSearchQuery("")}
                                        >
                                            Clear Search
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* CONTACT FOOTER */}
                    <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm p-3 gap-3 lg:p-6 lg:gap-6">
                        <div className="flex items-center text-center sm:text-left gap-4">
                            <div className="hidden lg:block h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                                <MessageCircle className="h-6 w-6 text-brand-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Still have questions?</h3>
                                <p className="text-sm text-slate-500">Our team is here to help you get the most out of ApplyVortex.</p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => window.location.href = 'mailto:support@applyvortex.com'}
                            className="gap-2 w-full"
                        >
                            <Mail className="h-4 w-4" />
                            Contact Us
                        </Button>
                    </div>

                    {/* Bottom Spacer */}
                    <div className="h-4" />
                </div>
            </div>
        </div>
    );
}
