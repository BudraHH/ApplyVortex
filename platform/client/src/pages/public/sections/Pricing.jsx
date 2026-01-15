import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { Button } from '@/components/ui/Button';

const plans = [
    {
        id: "starter",
        name: "Starter",
        price: "$0",
        period: "forever",
        description: "Perfect for testing the waters.",
        icon: Zap,
        features: [
            "10 AI-tailored resumes/month",
            "50 Auto-applications/month",
            "Basic Analytics dashboard",
            "LinkedIn Scraping only",
            "Community Support"
        ],
        cta: "Start for Free",
        gradient: "from-slate-500 to-slate-600",
        popular: false
    },
    {
        id: "pro",
        name: "Pro Hunter",
        price: "$29",
        period: "per month",
        description: "For serious job seekers who want results.",
        icon: Sparkles,
        features: [
            "Unlimited AI resumes",
            "500 Auto-applications/month",
            "Advanced Analytics & Insights",
            "All Job Portals (LinkedIn, Naukri, Indeed)",
            "Priority 24/7 Support",
            "Cover Letter Generator"
        ],
        cta: "Upgrade to Pro",
        gradient: "from-brand-600 to-brand-500",
        popular: true
    },
    {
        id: "scale",
        name: "Career Scale",
        price: "$99",
        period: "per month",
        description: "Power users and agencies.",
        icon: Crown,
        features: [
            "Unlimited Everything",
            "Dedicated Account Manager",
            "Interview Coaching AI",
            "Salary Negotiation Assistant",
            "API Access",
            "White-label Reports"
        ],
        cta: "Contact Sales",
        gradient: "from-violet-600 to-violet-500",
        popular: false
    }
];

const Pricing = () => {
    const [billingCycle, setBillingCycle] = useState('monthly');

    return (
        <section
            id="pricing"
            className="relative py-10 md:py-16 lg:py-0 h-auto lg:h-screen bg-slate-50 overflow-hidden flex flex-col justify-center"
        >
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] lg:w-[1000px] h-[600px] bg-brand-500/5 rounded-full blur-[80px] lg:blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] lg:w-[800px] h-[500px] bg-brand-500/5 rounded-full blur-[80px] lg:blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col h-full lg:h-auto justify-center">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-8 shrink-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-3"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                            Plans & Pricing
                        </span>
                    </motion.div>

                    <motion.h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-2">
                        Simple, transparent{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">
                            pricing.
                        </span>
                    </motion.h2>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center mt-3 gap-3">
                        <span className={`text-xs font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-10 h-5 bg-slate-200 rounded-full p-0.5 relative transition-colors duration-300 hover:bg-slate-300 focus:outline-none"
                        >
                            <motion.div
                                animate={{ x: billingCycle === 'monthly' ? 0 : 20 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                        </button>
                        <span className={`text-xs font-semibold transition-colors ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
                            Yearly <span className="text-emerald-500 text-[9px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full ml-1 border border-emerald-100">SAVE 20%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 max-w-7xl mx-auto items-start lg:items-center w-full relative">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl p-5 lg:p-6 flex flex-col h-full transition-all duration-300 ${plan.popular
                                ? `bg-white ring-2 ring-brand-500 shadow-xl shadow-brand-500/10 z-10 lg:scale-105`
                                : 'bg-white/60 border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-brand-500/30 ring-2 ring-white">
                                    Most Popular
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="mb-4 shrink-0 relative">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white mb-3 shadow-md`}>
                                    <plan.icon size={18} className={plan.popular ? 'animate-pulse' : ''} />
                                </div>
                                <h3 className="text-lg font-bold mb-0.5 text-slate-900">{plan.name}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-4 shrink-0 flex items-end gap-2">
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${plan.popular ? `text-transparent bg-clip-text bg-gradient-to-r ${plan.gradient}` : 'text-slate-900'}`}>{plan.price}</span>
                                    <span className="text-[10px] font-medium text-slate-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                {billingCycle === 'yearly' && plan.price !== '$0' && (
                                    <p className="text-[9px] text-emerald-600 font-semibold mb-0.5">Billed ${parseInt(plan.price.slice(1)) * 12} yearly</p>
                                )}</div>

                            {/* Features */}
                            <div className="flex-1 mb-4">
                                <div className="w-full h-px bg-slate-100 mb-3" />
                                <ul className="space-y-2">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[11px] lg:text-xs leading-relaxed text-slate-600">
                                            <div className={`mt-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center ${plan.popular ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-400'}`}>
                                                <Check size={8} strokeWidth={3} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA Button */}
                            <Button
                                as={Link}
                                to={ROUTES.SIGNUP}
                                variant={plan.popular ? 'primary' : 'outline'}
                                className={`w-full rounded-lg h-9 lg:h-10 text-xs lg:text-sm font-bold transition-all duration-300 shrink-0 ${plan.popular
                                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-white border-0'
                                    : 'hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                                    }`}
                            >
                                {plan.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
