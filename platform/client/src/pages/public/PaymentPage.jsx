import React, { useState, useEffect } from 'react';
import { Check, Shield, CreditCard, Sparkles, Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Navbar from './sections/Navbar';

const PaymentPage = () => {
    const location = useLocation();
    const [selectedPlan, setSelectedPlan] = useState('pro'); // 'pro', 'max'
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
    const [isLoading, setIsLoading] = useState(false);

    // Initialize plan from URL or other state if needed in future
    useEffect(() => {
        // Example: logic to pre-select plan could go here if passed via navigation state
    }, []);

    const plans = {
        pro: {
            id: 'pro',
            name: 'Pro Hunter',
            price: billingCycle === 'monthly' ? 29 : 24,
            period: 'mo',
            popular: true,
            icon: Sparkles,
            color: 'brand',
            gradient: 'from-brand-500 to-brand-600',
            features: [
                'Unlimited AI resumes',
                '500 Auto-applications/month',
                'Advanced Analytics',
                'Priority Support',
                'Cover Letter Generation'
            ]
        },
        max: {
            id: 'max',
            name: 'Max Hunter',
            price: billingCycle === 'monthly' ? 99 : 79,
            period: 'mo',
            popular: false,
            icon: Crown,
            color: 'violet',
            gradient: 'from-violet-600 to-violet-500',
            features: [
                'Unlimited Everything',
                'Dedicated Account Manager',
                'Interview Coaching AI',
                'API Access',
                'White-label Reports'
            ]
        }
    };

    const handlePayment = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsLoading(false);
            // navigate(ROUTES.DASHBOARD); 
        }, 2000);
    };

    const currentPlan = plans[selectedPlan];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-brand-100 selection:text-brand-900">
            <Navbar />

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl" />
            </div>

            <main className="relative pt-16 md:pt-20 lg:pt-24 pb-6 md:pb-12 lg:pb-16">
                <div className="container mx-auto px-3 sm:px-4 md:px-6">

                    {/* Section Header */}
                    <div className="text-left mb-4 md:mb-6">
                        <div className="inline-flex items-center gap-1.5 md:gap-2 py-1 md:py-1.5 mb-2 md:mb-3">
                            <div className="w-8 md:w-12 h-0.5 bg-brand-500" />
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-700">Secure Checkout</span>
                        </div>

                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-1.5 md:mb-2">
                            Complete your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">
                                purchase
                            </span>
                        </h1>

                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl">
                            Start automating your job search in minutes. Cancel anytime.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-4 md:gap-5">

                        {/* Main Form - Left Column (8 cols) */}
                        <div className="order-2 lg:order-1 lg:col-span-8 space-y-4 md:space-y-5 lg:space-y-6">

                            {/* Plan Selection Card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 lg:p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3 md:mb-2">
                                    <h2 className="text-base md:text-lg lg:text-xl font-bold text-slate-900">Select Your Plan</h2>

                                    {/* Billing Cycle Toggle */}
                                    <div className="bg-slate-50 p-0.5 md:p-1 rounded-lg md:rounded-xl inline-flex border border-slate-200">
                                        <button
                                            onClick={() => setBillingCycle('monthly')}
                                            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 ${billingCycle === 'monthly'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            onClick={() => setBillingCycle('yearly')}
                                            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-0.5 sm:gap-1 ${billingCycle === 'yearly'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            Yearly <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded-full font-bold">-20%</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Plan Cards */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    {Object.values(plans).map((plan) => {
                                        const isSelected = selectedPlan === plan.id;
                                        return (
                                            <div
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan.id)}
                                                className={`relative cursor-pointer rounded-lg md:rounded-xl p-3 sm:p-4 transition-all duration-200 border-2 flex flex-col group ${isSelected
                                                    ? `${plan.color === 'violet' ? 'border-violet-500 bg-violet-50/30' : 'border-brand-500 bg-brand-50/30'}`
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {plan.popular && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                                        Popular
                                                    </span>
                                                )}

                                                <span className={`font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 transition-colors ${isSelected ? `${plan.color === 'violet' ? 'text-violet-900' : 'text-brand-900'}` : 'text-slate-700'
                                                    }`}>
                                                    {plan.name}
                                                </span>

                                                <div className="flex items-baseline gap-0.5 mb-0.5">
                                                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium">$</span>
                                                    <span className="text-lg sm:text-xl font-bold text-slate-900">{plan.price}</span>
                                                    <span className="text-[10px] sm:text-xs text-slate-400">/mo</span>
                                                </div>

                                                {billingCycle === 'yearly' && (
                                                    <span className="text-[9px] text-emerald-600 font-semibold">Billed ${plan.price * 12}/year</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Payment Form Card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 lg:p-6 shadow-sm">
                                <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3 md:mb-4">Payment Information</h2>

                                <form onSubmit={handlePayment} className="space-y-3 md:space-y-4">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-slate-700">Card Details</Label>
                                            <div className="flex gap-1 opacity-60">
                                                <div className="h-3.5 w-6 bg-slate-200 rounded text-[7px] flex items-center justify-center text-slate-500 font-bold border border-slate-300">VISA</div>
                                                <div className="h-3.5 w-6 bg-slate-200 rounded text-[7px] flex items-center justify-center text-slate-500 font-bold border border-slate-300">MC</div>
                                            </div>
                                        </div>

                                        <div className="group border border-slate-200 rounded-lg md:rounded-xl overflow-hidden focus-within:border-brand-500 transition-all">
                                            <div className="p-2.5 sm:p-3 bg-white flex items-center gap-2 sm:gap-2.5 border-b border-slate-100 relative">
                                                <CreditCard className="text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Card number"
                                                    className="w-full text-xs sm:text-sm outline-none placeholder:text-slate-400 font-medium text-slate-700"
                                                />
                                                <Lock size={10} className="absolute right-3 text-emerald-500" />
                                            </div>
                                            <div className="flex divide-x divide-slate-100 bg-slate-50/50">
                                                <div className="w-1/2 p-2 sm:p-3">
                                                    <input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        className="w-full text-xs sm:text-sm outline-none placeholder:text-slate-400 text-center bg-transparent"
                                                    />
                                                </div>
                                                <div className="w-1/2 p-3.5">
                                                    <input
                                                        type="text"
                                                        placeholder="CVC"
                                                        className="w-full text-xs sm:text-sm outline-none placeholder:text-slate-400 text-center bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs sm:text-sm font-medium text-slate-700">Name on Card</Label>
                                        <Input placeholder="John Doe" className="h-9 sm:h-10 rounded-lg md:rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-500/20 bg-white text-xs sm:text-sm" />
                                    </div>

                                    <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg md:rounded-xl flex gap-2 sm:gap-2.5 border border-slate-100">
                                        <div className="mt-0.5 bg-emerald-100/50 p-1 rounded-full shrink-0 h-fit">
                                            <Shield className="text-emerald-600" size={12} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-bold text-slate-900">Secure Payment</h4>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                256-bit encrypted. We never store your card details.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full h-10 sm:h-11 md:h-12 text-white font-bold rounded-lg md:rounded-xl shadow-lg transition-all text-sm sm:text-base ${currentPlan.color === 'violet'
                                            ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20'
                                            : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            `Pay $${currentPlan.price * (billingCycle === 'yearly' ? 12 : 1)}`
                                        )}
                                    </Button>

                                    <p className="text-center text-[10px] text-slate-400">
                                        By continuing, you agree to our{' '}
                                        <a href="#" className="underline hover:text-slate-600">Terms</a> and{' '}
                                        <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
                                    </p>
                                </form>
                            </div>
                        </div>

                        {/* Order Summary Sidebar (4 cols) */}
                        <div className="order-1 lg:order-2 lg:col-span-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm lg:sticky lg:top-24">
                                <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2.5 md:mb-3">Order Summary</h3>

                                <div className="space-y-2.5 md:space-y-3 mb-4 md:mb-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{currentPlan.name}</p>
                                            <p className="text-xs text-slate-500">{billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} billing</p>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">${currentPlan.price}/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                                    </div>

                                    <div className="border-t border-slate-100 pt-2.5 md:pt-3 space-y-1 md:space-y-1.5">
                                        {currentPlan.features.slice(0, 3).map((feature, i) => (
                                            <div key={i} className="flex items-start gap-1.5">
                                                <Check size={13} className="text-brand-600 shrink-0 mt-0.5" />
                                                <span className="text-xs text-slate-600 leading-relaxed">{feature}</span>
                                            </div>
                                        ))}
                                        {currentPlan.features.length > 3 && (
                                            <p className="text-xs text-slate-400 pl-4">+{currentPlan.features.length - 3} more</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-2.5 md:pt-3 space-y-2 md:space-y-2.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Subtotal</span>
                                        <span className="font-medium text-slate-900">${currentPlan.price * (billingCycle === 'yearly' ? 12 : 1)}</span>
                                    </div>

                                    {billingCycle === 'yearly' && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-600 font-medium">Savings</span>
                                            <span className="font-medium text-emerald-600">-${Math.round(currentPlan.price * 12 * 0.2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end pt-2 md:pt-2.5 border-t border-slate-200">
                                        <span className="text-slate-600 text-xs sm:text-sm">Total</span>
                                        <div className="text-right">
                                            <span className="text-lg sm:text-xl font-bold text-slate-900">${currentPlan.price * (billingCycle === 'yearly' ? 12 : 1)}</span>
                                            <p className="text-[9px] text-slate-400">{billingCycle === 'yearly' ? 'billed annually' : 'per month'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Motivational Message */}
                            <div className="mt-4 md:mt-5 bg-white rounded-xl border border-brand-100 p-4 sm:p-5">
                                <div className="text-center mb-3 md:mb-4">
                                    <h4 className="text-sm md:text-base font-bold text-slate-900 mb-1.5 md:mb-2">Your Dream Job Awaits</h4>
                                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                                        Join thousands who've transformed their job search. Start applying to hundreds of roles while you sleep.
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-brand-200/50">
                                    <div className="text-center">
                                        <div className="text-base sm:text-lg font-bold text-brand-600">3x</div>
                                        <div className="text-[8px] sm:text-[9px] text-slate-500 leading-tight">More Interviews</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-base sm:text-lg font-bold text-brand-600">10k+</div>
                                        <div className="text-[8px] sm:text-[9px] text-slate-500 leading-tight">Happy Users</div>
                                    </div>
                                </div>

                                {/* Trust Badge */}
                                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-brand-200/50 flex items-center justify-center gap-1.5 md:gap-2">
                                    <Shield size={12} className="text-emerald-600" />
                                    <span className="text-[10px] text-slate-600 font-medium">Secure & encrypted payment</span>
                                </div>
                            </div>

                            {/* Support Link */}
                            <div className="mt-3 md:mt-4 text-center">
                                <p className="text-[9px] sm:text-[10px] text-slate-400 mb-1.5 md:mb-2">Need help deciding?</p>
                                <Button
                                    variant="outline"
                                    className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                                >
                                    Contact Support
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentPage;
