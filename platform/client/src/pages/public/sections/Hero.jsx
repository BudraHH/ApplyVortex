import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import ProductMockup from './ProductMockup';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useRef, useEffect, useState } from "react";

const Hero = () => {
    const sectionRef = useRef(null);
    const mockupRef = useRef(null);
    const progressRef = useRef(0);
    // Optimization: Remove granular state updates to prevent re-renders on every scroll frame
    // const [mockupProgress, setMockupProgress] = useState(0); 
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [showTaglines, setShowTaglines] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    useEffect(() => {
        if (!isDesktop) return;

        let rafId;
        const handleScroll = () => {
            if (!sectionRef.current || !mockupRef.current) return;

            const { top, height } = sectionRef.current.getBoundingClientRect();
            // Start animation when section hits top of viewport
            const windowHeight = window.innerHeight;
            // Scroll distance is the full height minus viewport (sticky behavior)
            const end = height - windowHeight;
            const scrollY = -top;

            let progress = scrollY / end;
            progress = Math.max(0, Math.min(1, progress));

            progressRef.current = progress;

            // Update DOM directly to enable CSS calculations (Fast)
            mockupRef.current.style.setProperty('--scroll', progress);

            // Optimization: Only trigger React updates when crossing thresholds
            // Threshold 1: Sidebar Expansion (at 0.5)
            const shouldExpand = progress > 0.5;
            setSidebarExpanded(prev => {
                if (prev !== shouldExpand) return shouldExpand;
                return prev;
            });

            // Threshold 2: Taglines Appearance (at 0.9)
            const shouldShowWrapper = progress > 0.9;
            setShowTaglines(prev => {
                if (prev !== shouldShowWrapper) return shouldShowWrapper;
                return prev;
            });
        };

        const onScroll = () => {
            if (document.body.dataset.navScrolling === 'true') return;
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(handleScroll);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(rafId);
        };
    }, [isDesktop]);


    return (
        <section id="hero" ref={sectionRef} className="relative w-full h-auto lg:h-[190vh] bg-white overflow-hidden pt-12 lg:pt-0 pb-12 lg:pb-0" >
            {/* Background Layers - static, no changes */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none">
                {/* ... existing background layers ... */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-50/30 rounded-full blur-[120px]"
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, delay: 0.3 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/20 rounded-full blur-[100px]"
                />

                <div className="absolute top-[20%] right-[15%] w-[40%] h-[40%] bg-brand-50/15 rounded-full blur-[80px]" />
                <div className="absolute bottom-[15%] left-[20%] w-[35%] h-[35%] bg-blue-50/10 rounded-full blur-[90px]" />

                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: `radial-gradient(#6366f1 0.5px, transparent 0.5px)`,
                        backgroundSize: '42px 42px',
                        maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                    }}
                />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-100/30 to-transparent rotate-[-15deg]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-100/20 to-transparent rotate-[15deg]" />

                <div className="absolute top-0 left-0 w-[200px] h-[1px] bg-gradient-to-r from-brand-500/20 to-transparent" />
                <div className="absolute bottom-0 right-0 w-[200px] h-[1px] bg-gradient-to-l from-blue-500/20 to-transparent" />
            </div>

            <div className="relative lg:sticky top-0 min-h-screen flex items-center pt-8 md:pt-16 lg:pt-0">
                <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-8 w-full">

                        {/* Left Column: Text Content */}
                        <div className="w-full lg:w-6/12 shrink-0 flex flex-col items-center text-center lg:items-start lg:text-left">
                            {/* Eyebrow Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex items-center gap-3"
                            >
                                <div className="h-px w-8 bg-brand-500/40" />
                                <span className="text-brand-600 font-bold text-xs uppercase whitespace-nowrap px-3 py-1.5 bg-brand-50/30">
                                    Intelligent Career Search
                                </span>
                                <div className="h-px flex-1 max-w-12 bg-brand-500/40" />
                            </motion.div>

                            {/* Main Heading */}
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="text-4xl xs:text-5xl sm:text-6xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-2"
                            >
                                Landing Your Dream Job{' '}
                                <br className="hidden 2xl:block" />
                                Just Got{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-10 text-brand-600">Automated.</span>
                                    <motion.span
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute bottom-2 left-0 h-3 bg-brand-100/50 -z-0"
                                        style={{ transform: 'skewX(-12deg)' }}
                                    />
                                </span>
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className="max-w-xl text-lg lg:text-xl text-slate-500 font-medium leading-relaxed mb-2"
                            >
                                Stop manually filling forms. ApplyVortex uses advanced AI to discover jobs, tailor your resume, and apply on your behalf—so you can focus on the interview.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col sm:flex-row mt-4 gap-4 w-full sm:w-auto"
                            >
                                <Button
                                    as={Link}
                                    to={ROUTES.SIGNUP}
                                    size="lg"
                                    className="group relative overflow-hidden px-8 py-6 text-base font-semibold shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Start Applying Free
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 px-8 py-6 text-base font-semibold transition-all duration-300 group"
                                >
                                    <Play className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                                    Watch How it Works
                                </Button>
                            </motion.div>

                            {/* Impact Stats */}
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.1,
                                            delayChildren: 0.4,
                                        },
                                    },
                                }}
                                initial="hidden"
                                animate="visible"
                                className="mt-8 lg:mt-10 flex flex-wrap justify-center lg:justify-start items-center gap-6 sm:gap-10 text-slate-900"
                            >
                                {/* Metric */}
                                <motion.div variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                                }}>
                                    <p className="text-xl sm:text-2xl font-semibold text-brand-600">15h+</p>
                                    <p className="text-xs text-slate-500">Saved weekly</p>
                                </motion.div>

                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, scaleY: 0 },
                                        visible: { opacity: 1, scaleY: 1, transition: { duration: 0.3 } }
                                    }}
                                    className="hidden sm:block w-px h-7 bg-slate-200"
                                />

                                <motion.div variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                                }}>
                                    <p className="text-xl sm:text-2xl font-semibold text-brand-600">3×</p>
                                    <p className="text-xs text-slate-500">More interviews</p>
                                </motion.div>

                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, scaleY: 0 },
                                        visible: { opacity: 1, scaleY: 1, transition: { duration: 0.3 } }
                                    }}
                                    className="hidden sm:block w-px h-7 bg-slate-200"
                                />

                                <motion.div variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                                }}>
                                    <p className="text-xl sm:text-2xl font-semibold text-brand-600">40%</p>
                                    <p className="text-xs text-slate-500">Response rate</p>
                                </motion.div>

                                {/* Trust signal */}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, x: -10 },
                                        visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
                                    }}
                                    className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-center sm:justify-start"
                                >
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                                    Runs locally. Your data stays on your machine.
                                </motion.div>
                            </motion.div>

                        </div>

                        {/* Right Column: ProductMockup */}
                        {/* 
                            Optimization: We use CSS variables for layout to decouple from React Reflows.
                            --scroll: 0 to 1
                         */}
                        <div
                            ref={mockupRef}
                            className={`w-full lg:w-6/12 mt-10 shrink-0 flex flex-col items-center ${isDesktop ? 'sticky-mockup-wrapper' : 'relative z-0'}`}
                            style={{
                                '--scroll': 0, // Default for SSR/Mobile
                                transformOrigin: 'top right'
                            }}
                        >
                            <style>{`
                                .sticky-mockup-wrapper {
                                    /* Logic: 
                                        Position: Relative -> Fixed -> Fixed? 
                                        Actually we want: relative until it hits, then absolute?
                                        Let's stick to the previous transforms but using Calc.
                                     */
                                    z-index: 10;
                                    
                                    /* 
                                     ANIMATION LOGIC
                                     Width: 60% -> 120%
                                     X: -180px -> -360px
                                     Y: 0px -> 850px
                                     Start: --scroll > 0.1? No, let's keep it simple 0-1 linear for now to stop staggering 
                                    */
                                    
                                    width: calc(45% + (var(--scroll) * 25%));
                                    transform: translate(
                                        calc(-5% + (var(--scroll) * -180px)), 
                                        calc(var(--scroll) * 850px)
                                    );
                                    
                                    /* Removed transition to ensure direct 1:1 scroll tracking without lag */
                                    /* transition: width 0.15s linear, transform 0.15s linear; */
                                    
                                    /* HACK: Position Absolute switch */
                                    /* In pure CSS variable world, usually we keep it fixed or sticky. 
                                       But previously we switched to Absolute. 
                                       Simplest way: Just keep it relative but transform heavily? 
                                       Or use 'position: absolute' if scroll > 0.1?
                                       We'll just handle position via simple boolean in react or CSS class?
                                       Let's keep it 'relative' but moving huge amounts.
                                    */
                                    position: absolute;
                                    right: 0;
                                    top: 0;
                                    /* Wait, initially it was relative. 
                                     If we make it absolute immediately, it overlaps text?
                                     Let's use a conditional class in JSX for position.
                                    */
                                }
                            `}</style>

                            <div className={`relative w-full flex items-center justify-center transition-all duration-300 ${isDesktop && showTaglines ? 'gap-8' : ''}`}>

                                {/* Left Tagline */}
                                <div
                                    className="hidden lg:block transition-all duration-500 ease-out"
                                    style={{
                                        opacity: isDesktop && showTaglines ? 1 : 0,
                                        transform: isDesktop && showTaglines ? 'translateX(0px)' : 'translateX(20px)',
                                        width: isDesktop && showTaglines ? '450px' : '0px',
                                        pointerEvents: 'none' // Prevent interaction when hidden
                                    }}
                                >
                                    <div className="text-right">
                                        <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                                            Invest <br />
                                            <span className="text-brand-600">time in Preparation</span>
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Stop wasting hours on forms. Focus on honing your craft.
                                        </p>
                                    </div>
                                </div>

                                {/* Mockup Container */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    className="relative w-full shrink-0"
                                >
                                    <div className="w-full relative z-10">
                                        <ProductMockup progress={sidebarExpanded ? 1 : 0} />
                                    </div>

                                    {/* Brand Watermark - Revealed behind mockup */}
                                    <motion.div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[-5] hidden lg:block pointer-events-none select-none"
                                        style={{
                                            // Optimization: Use CSS Calc instead of JS interpolation
                                            opacity: 'clamp(0, (var(--scroll) - 0.5) * 2, 0.1)'
                                        }}
                                    >
                                        <svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-12deg)' }}>
                                            <text x="300" y="300" textAnchor="middle" dominantBaseline="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="120" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-slate-900">
                                                FORGE
                                            </text>
                                        </svg>
                                    </motion.div>

                                    {/* Glow Backdrop */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-500/[0.03] blur-[100px] -z-10 rounded-full" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-blue-500/[0.02] blur-[120px] -z-20 rounded-full" />

                                    {/* Corner Glows */}
                                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-50/20 rounded-full blur-[60px] -z-10" />
                                    <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-50/15 rounded-full blur-[70px] -z-10" />
                                </motion.div>

                                {/* Right Tagline */}
                                <div
                                    className="hidden lg:block transition-all duration-500 ease-out"
                                    style={{
                                        opacity: isDesktop && showTaglines ? 1 : 0,
                                        transform: isDesktop && showTaglines ? 'translateX(0px)' : 'translateX(-20px)',
                                        width: isDesktop && showTaglines ? '250px' : '0px',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    <div className="text-left">
                                        <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                                            Set Preferences <br />
                                            <span className="text-brand-600">Quest Jobs</span>
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Define your path. Let our autonomous agents handle the hunt.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
