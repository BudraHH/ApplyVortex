// src/pages/public/about-sections/AboutCTA.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Shield, Clock, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';

const AboutCTA = () => {
    const stats = [
        { value: "10K+", label: "Active Users", icon: Users },
        { value: "500K+", label: "Applications Sent", icon: TrendingUp },
        { value: "98%", label: "Success Rate", icon: CheckCircle2 },
    ];

    const benefits = [
        { icon: Zap, text: "Setup in 5 minutes" },
        { icon: Shield, text: "Enterprise-grade security" },
        { icon: Clock, text: "24/7 autonomous operation" },
    ];

    return (
        <section id="about-cta" className="relative py-12 md:py-24 lg:py-32 bg-white overflow-hidden">
            {/* Background accents */}

            <div className="container mx-auto px-4 md:px-6 relative">
                {/* Main CTA Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative "
                >
                    <div className="relative rounded-2xl bg-slate-950 overflow-hidden shadow-2xl shadow-slate-900/50">
                        {/* Content */}
                        <div className="relative z-10 py-10 md:py-16 lg:py-24 px-4 md:px-12 lg:px-20">
                            <div className="max-w-4xl mx-auto text-center">
                                {/* Badge */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-flex items-center gap-2 py-2 mb-3 md:mb-5"
                                >
                                    <div className="w-10 md:w-16 h-0.5 bg-brand-500" />
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Ready to Transform?</span>
                                </motion.div>

                                {/* Headline */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.15 }}
                                    className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-8 tracking-tight leading-[1.1] drop-shadow-sm"
                                >
                                    Stop applying manually.
                                    <br className="hidden sm:block" />
                                    <span className="relative inline-block mt-1 md:mt-2">
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-brand-400 animate-gradient">
                                            Start getting hired.
                                        </span>
                                    </span>
                                </motion.div>

                                {/* Subheadline */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="text-sm md:text-lg lg:text-xl text-slate-400 mb-6 md:mb-12 leading-relaxed max-w-2xl mx-auto font-light"
                                >
                                    Join thousands who automated their job search and landed dream roles.
                                </motion.p>

                                {/* Benefits Row */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.25 }}
                                    className="flex flex-col md:flex-row md:flex-wrap justify-center items-center gap-2 md:gap-x-6 gap-y-2 mb-6 md:mb-12"
                                >
                                    {benefits.map((benefit, index) => (
                                        <div key={index} className=" w-2/3 md:w-auto flex items-center gap-1.5 md:gap-2.5 text-slate-300/90 bg-white/5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/5">
                                            <benefit.icon size={14} className="text-brand-400" />
                                            <span className="text-[11px] md:text-sm font-medium">{benefit.text}</span>
                                        </div>
                                    ))}
                                </motion.div>

                                {/* CTA Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-row gap-2 md:gap-5 justify-center items-center mb-8 md:mb-16"
                                >
                                    <Button
                                        as={Link}
                                        to={ROUTES.SIGNUP}
                                        size="responsive"
                                        className='group hover:bg-brand-400'
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <span className="hidden sm:inline">Get Started</span>
                                            <span className="sm:hidden">Start</span>
                                            <ArrowRight size={16} className="md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </Button>
                                    <Button
                                        as={Link}
                                        to={ROUTES.HOME + '#pricing'}
                                        variant="outline"
                                        size="responsive"
                                        className=" bg-slate-200 hover:bg-white"
                                    >
                                        <span className="hidden sm:inline">View Pricing</span>
                                        <span className="sm:hidden">Pricing</span>
                                    </Button>
                                </motion.div>

                                {/* Trust indicator */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.35 }}
                                    className="text-[10px] md:text-sm text-slate-500 font-medium"
                                >
                                    No credit card required • Free forever • Cancel anytime
                                </motion.p>
                            </div>
                        </div>


                    </div>
                </motion.div>

                {/* Bottom text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-8 md:mt-12"
                >
                    <p className="text-slate-500 text-xs md:text-sm">
                        Trusted by engineers at top companies worldwide
                    </p>
                    {/* Optional: Add logos here if available */}
                </motion.div>
            </div>
        </section>
    );
};

export default AboutCTA;