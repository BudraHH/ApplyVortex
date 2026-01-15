import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ROUTES } from '@/routes/routes';
import { Button } from '@/components/ui/Button';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Track active section on scroll
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Define sections for each page
        const pageSections = {
            '/': ['hero', 'features', 'how-it-works', 'pricing'],
            '/about': ['about-hero', 'problem', 'solution', 'values', 'about-cta', 'contact']
        };

        const sections = pageSections[location.pathname] || [];

        sections.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [location.pathname]);

    const scrollToSection = (sectionId) => {
        setIsMobileMenuOpen(false);

        // Special handling for hero - always scroll to absolute top
        if (sectionId === 'hero' || sectionId === 'about-hero') {
            const targetPath = sectionId === 'hero' ? '/' : '/about';
            const scrollToTop = () => {
                document.body.dataset.navScrolling = 'true';
                const targetPosition = 0;

                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Monitor scroll progress and ensure we reach target
                    let checkCount = 0;
                    let lastPosition = window.scrollY;
                    let stuckCount = 0;
                    const maxChecks = 50;

                    const checkProgress = () => {
                        checkCount++;
                        const currentPos = window.scrollY;
                        const distance = Math.abs(currentPos - targetPosition);

                        const isMoving = Math.abs(currentPos - lastPosition) > 2;
                        if (!isMoving) {
                            stuckCount++;
                        } else {
                            stuckCount = 0;
                        }
                        lastPosition = currentPos;

                        if (distance <= 20 || checkCount >= maxChecks) {
                            if (distance > 5) {
                                window.scrollTo({
                                    top: targetPosition,
                                    behavior: 'auto'
                                });
                            }
                            window.history.replaceState(null, null, targetPath);
                            document.body.dataset.navScrolling = 'false';
                            return;
                        }

                        if (stuckCount >= 5 && distance > 50) {
                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'smooth'
                            });
                            stuckCount = 0;
                        }

                        setTimeout(checkProgress, 100);
                    };

                    setTimeout(checkProgress, 200);
                });
            };

            if (location.pathname === targetPath) {
                scrollToTop();
            } else {
                navigate(targetPath);
                setTimeout(() => {
                    scrollToTop();
                }, 100);
            }
            return;
        }

        // For other sections, use a robust scrollTo with completion check
        const performScroll = (targetElement) => {
            if (!targetElement) return;

            // Set flag to prevent scroll handlers from interfering
            document.body.dataset.navScrolling = 'true';

            // Calculate target position accounting for navbar
            const navbarHeight = window.innerWidth >= 1280 ? 80 : 64;

            // Get the element's absolute position in the document
            // Wait a tick to ensure DOM is ready
            requestAnimationFrame(() => {
                const rect = targetElement.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const elementTop = rect.top + scrollTop;
                const offsetPosition = Math.max(0, elementTop - navbarHeight);

                // Perform smooth scroll
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Monitor scroll progress and ensure we reach target
                let checkCount = 0;
                let lastPosition = window.scrollY;
                let stuckCount = 0;
                const maxChecks = 50; // 5 seconds max

                const checkProgress = () => {
                    checkCount++;
                    const currentPos = window.scrollY;
                    const distance = Math.abs(currentPos - offsetPosition);

                    // Check if scroll is progressing
                    const isMoving = Math.abs(currentPos - lastPosition) > 2;
                    if (!isMoving) {
                        stuckCount++;
                    } else {
                        stuckCount = 0;
                    }
                    lastPosition = currentPos;

                    // Success: within 20px of target
                    if (distance <= 20 || checkCount >= maxChecks) {
                        // Final precise adjustment if needed
                        if (distance > 5) {
                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'auto'
                            });
                        }
                        window.history.replaceState(null, null, `#${sectionId}`);
                        document.body.dataset.navScrolling = 'false';
                        return;
                    }

                    // If stuck for 5+ checks and still far from target, force scroll
                    if (stuckCount >= 5 && distance > 50) {
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                        stuckCount = 0;
                    }

                    // Continue checking
                    setTimeout(checkProgress, 100);
                };

                // Start monitoring after a short delay
                setTimeout(checkProgress, 200);
            });
        };

        const isSamePage = (location.pathname === '/' && ['hero', 'features', 'how-it-works', 'pricing'].includes(sectionId)) ||
            (location.pathname === '/about' && ['about-hero', 'problem', 'solution', 'values', 'about-cta', 'contact'].includes(sectionId));

        if (isSamePage) {
            const element = document.getElementById(sectionId);
            performScroll(element);
        } else {
            const targetPath = ['hero', 'features', 'how-it-works', 'pricing'].includes(sectionId) ? '/' : '/about';
            navigate(`${targetPath}#${sectionId}`);
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                performScroll(element);
            }, 100);
        }
    };

    const getNavLinks = () => {
        if (location.pathname === '/about') {
            return [
                { name: 'Home', path: '/', type: 'route' },
                { name: 'About', id: 'about-hero', type: 'anchor' },
                { name: 'Problem', id: 'problem', type: 'anchor' },
                { name: 'Solution', id: 'solution', type: 'anchor' },
                { name: 'Values', id: 'values', type: 'anchor' },
                { name: 'Join Us', id: 'about-cta', type: 'anchor' },
                { name: 'Contact', id: 'contact', type: 'anchor' },
            ];
        }
        return [
            { name: 'Home', id: 'hero', type: 'anchor' },
            { name: 'Features', id: 'features', type: 'anchor' },
            { name: 'How it Works', id: 'how-it-works', type: 'anchor' },
            { name: 'Pricing', id: 'pricing', type: 'anchor' },
            { name: 'About', path: '/about', type: 'route' },
        ];
    };

    const navLinks = getNavLinks();

    const isLinkActive = (link) => {
        if (link.type === 'route') {
            return location.pathname === link.path;
        }
        return activeSection === link.id;
    };

    const handleNavClick = (link) => {
        if (link.type === 'route') {
            navigate(link.path);
            setIsMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
            scrollToSection(link.id);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
            ? 'border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm'
            : 'bg-transparent'}`}>
            <div className="container mx-auto flex h-16 xl:h-20 items-center px-4 sm:px-6 lg:px-8 relative">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-2.5 group" onClick={(e) => {
                    if (location.pathname === '/') {
                        e.preventDefault();
                        scrollToSection('hero');
                    }
                }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles size={20} fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        ApplyVortex
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {navLinks.map((link, index) => {
                            const active = isLinkActive(link);
                            const isPersistent = ['Home', 'About'].includes(link.name);

                            // Stagger entry for non-persistent items to let the persistent ones slide first
                            const transitionDelay = isPersistent ? 0 : 0.2 + (index * 0.05);

                            return (
                                <motion.button
                                    layout="position"
                                    layoutId={`nav-item-${link.name}`}
                                    key={link.name}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        transition: {
                                            delay: transitionDelay,
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 25
                                        }
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.8,
                                        transition: { duration: 0.15 }
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                    onClick={() => handleNavClick(link)}
                                    className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 group ${active ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'
                                        }`}
                                >
                                    {link.name === 'About' && (<div className='bg-brand-500 h-4 w-[1px] inline-block align-middle mr-5' />)}
                                    <span className="relative z-10">
                                        {link.name}
                                        {active && (
                                            <motion.div
                                                layoutId="nav-active-bg"
                                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden lg:flex items-center gap-4 ml-auto">
                    <ThemeToggle />
                    <div className="h-4 w-px bg-slate-200 mx-2" />
                    <Button
                        as={Link}
                        to={ROUTES.LOGIN}
                        variant='outline'
                    // className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2"
                    >
                        Sign In
                    </Button>
                    <Button
                        as={Link}
                        to={ROUTES.SIGNUP}
                    // className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/20 px-6 rounded-xl"
                    >
                        Get Started
                    </Button>
                </div>

                {/* Mobile/Tablet Menu Controls */}
                <div className="flex lg:hidden items-center gap-3">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-xl transition-colors ${isMobileMenuOpen ? 'bg-slate-100 text-brand-600' : 'text-slate-600'}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </Button>
                </div>
            </div>

            {/* Mobile/Tablet Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 overflow-hidden shadow-2xl"
                    >
                        <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {navLinks.map((link, index) => {
                                    const active = isLinkActive(link);
                                    return (
                                        <motion.button
                                            key={link.name}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleNavClick(link)}
                                            className={`flex items-center justify-between p-4 rounded-xl font-semibold transition-all group ${active
                                                ? 'bg-brand-50 text-brand-600'
                                                : 'bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-600'
                                                }`}
                                        >
                                            {link.name}
                                            <ArrowRight className={`h-4 w-4 transition-all ${active
                                                ? 'opacity-100 translate-x-0'
                                                : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                                                }`} />
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="h-px bg-slate-100 w-full" />

                            <div className="flex flex-col gap-3">
                                <Link to={ROUTES.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl text-slate-600 hover:bg-slate-50 border-slate-200 font-bold"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                                <Link to={ROUTES.SIGNUP} onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button
                                        className="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-600/20"
                                    >
                                        Create Free Account
                                    </Button>
                                </Link>
                            </div>

                            <p className="text-center text-xs text-slate-400 font-medium">
                                Join 5,000+ applicants automating their search today.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
