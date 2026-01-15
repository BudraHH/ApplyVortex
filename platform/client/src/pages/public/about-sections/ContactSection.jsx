import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageSquare, Send, Phone, Sparkles, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';

const ContactSection = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
        }, 1200);
    };

    const contactMethods = [
        {
            icon: Mail,
            label: "Technical Support",
            value: "support@applyvortex.com",
            description: "Direct line for active users and API inquiries.",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: MessageSquare,
            label: "Community Chat",
            value: "Available 24/7",
            description: "Join the conversation with our global team.",
            color: "text-brand-500",
            bg: "bg-brand-50"
        },
        {
            icon: Phone,
            label: "Enterprise Sales",
            value: "+1 (555) VORTEX-0",
            description: "For custom deployments and institutional access.",
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        }
    ];

    return (
        <section id="contact" className="relative py-12 md:py-20 lg:py-32 bg-slate-50 overflow-hidden border-t border-slate-100">
            {/* Background Elements - Identical to Problem/Values sections */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-brand-500/[0.03] rounded-full blur-[80px] md:blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-blue-500/[0.03] rounded-full blur-[80px] md:blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

                    {/* --- Left Column: Info Content --- */}
                    <div className="lg:col-span-5 flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="h-full flex flex-col"
                        >
                            {/* Header Pattern */}
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-2.5 py-2 md:py-2.5 mb-2"
                            >
                                <div className="w-10 md:w-16 h-0.5 bg-brand-500" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-700">Contact Us</span>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-4 md:mb-6"
                            >
                                Connect with our <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">
                                    Engineering Team.
                                </span>
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl mb-6 md:mb-8"
                            >
                                No sales bots. Speak directly with the people building the future of autonomous job searching.
                            </motion.p>

                            {/* Contact Cards - Filling the remaining space */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4 mt-auto">
                                {contactMethods.map((method, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className="group flex gap-3 md:gap-4 p-3 md:p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:bg-white transition-all cursor-pointer"
                                    >
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${method.bg} ${method.color} flex items-center justify-center shrink-0 border border-white/50 group-hover:scale-105 transition-transform`}>
                                            <method.icon size={16} className="md:w-5 md:h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="text-slate-900 font-bold text-xs md:text-sm truncate">{method.label}</h4>
                                                <ExternalLink size={10} className="text-slate-300 group-hover:text-brand-500 transition-colors shrink-0 md:w-3 md:h-3" />
                                            </div>
                                            <p className="text-brand-600 font-bold text-[11px] md:text-[13px] truncate">{method.value}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Progress Line - Hidden on very small screens or made more compact */}
                            <div className="mt-6 md:mt-8 flex items-center gap-2">
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    whileInView={{ width: '100%', opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-1 md:h-1.5 rounded-full flex-1 bg-gradient-to-r from-brand-500 to-brand-400"
                                />
                                <div className="flex gap-1.5">
                                    {[1, 2, 3].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{
                                                delay: 0.8 + (i * 0.15),
                                                duration: 0.4,
                                                ease: "easeOut"
                                            }}
                                            className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-slate-200"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* --- Right Column: The Form Panel --- */}
                    <div className="lg:col-span-7 flex flex-col mt-4 md:mt-0">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="bg-white border border-slate-100 hover:border-slate-200 shadow-2xl shadow-slate-200/40 rounded-2xl md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden h-full flex flex-col"
                        >
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="h-full flex flex-col items-center justify-center py-10 md:py-16 text-center"
                                    >
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 md:mb-8 mx-auto border border-emerald-100">
                                            <Sparkles size={32} className="md:w-10 md:h-10" />
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 font-display">Transmission Complete</h3>
                                        <p className="text-sm md:text-base text-slate-500 max-w-xs mx-auto mb-8 md:mb-10 font-medium leading-relaxed">Successfully routed to the appropriate department. Expect sync within 4 hours.</p>
                                        <Button variant="outline" onClick={() => setSubmitted(false)} className="rounded-xl px-8 md:px-10 h-10 md:h-12 text-sm">New Dispatch</Button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        onSubmit={handleSubmit}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4 md:space-y-6 lg:space-y-8 flex flex-col h-full"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <div className="space-y-1.5 md:space-y-2">
                                                <Label className="text-[9px] md:text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.15em] ml-1">Identity</Label>
                                                <Input placeholder="Your Name" required />
                                            </div>
                                            <div className="space-y-1.5 md:space-y-2">
                                                <Label className="text-[9px] md:text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.15em] ml-1">Communication</Label>
                                                <Input type="email" placeholder="Email Address" required />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 md:space-y-2">
                                            <Label className="text-[9px] md:text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.15em] ml-1">Subject Matter</Label>
                                            <Input placeholder="What can we help you with?" required />
                                        </div>

                                        <div className="space-y-1.5 md:space-y-2 flex-1">
                                            <Label className="text-[9px] md:text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.15em] ml-1">Payload Details</Label>
                                            <Textarea placeholder="Describe the situation in detail..." required 
                                            className="min-h-[120px]"
                                            />
                                        </div>

                                        <div className="pt-2 md:pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                size="lg"
                                                className="w-full h-12 md:h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm md:text-base rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 md:gap-3 group"
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>Dispatch Secure Message</span>
                                                        <Send size={16} className="md:w-5 md:h-5 group-hover:translate-x-1.5 group-hover:-translate-y-1.5 transition-transform duration-300" />
                                                    </>
                                                )}
                                            </Button>

                                            <div className="flex items-center justify-center gap-4 md:gap-6 mt-4 md:mt-6">
                                                <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                    Secure Dispatch
                                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                    4h Latency
                                                </div>
                                            </div>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
