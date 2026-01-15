import React from 'react';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import HowItWorks from './sections/HowItWorks';
import Features from './sections/Features';
import Pricing from './sections/Pricing';
import Footer from './sections/Footer';

import { useLocation } from 'react-router-dom';

const LandingPage = () => {
    const location = useLocation();

    // Handle hash scroll when location changes (including initial load)
    React.useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            if (id === 'hero') {
                // For hero, use robust scroll to top
                document.body.dataset.navScrolling = 'true';
                requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // Monitor and ensure completion
                    let checkCount = 0;
                    const maxChecks = 30;
                    const checkProgress = () => {
                        checkCount++;
                        if (window.scrollY <= 20 || checkCount >= maxChecks) {
                            if (window.scrollY > 5) {
                                window.scrollTo({ top: 0, behavior: 'auto' });
                            }
                            document.body.dataset.navScrolling = 'false';
                            return;
                        }
                        setTimeout(checkProgress, 100);
                    };
                    setTimeout(checkProgress, 200);
                });
            } else {
                const element = document.getElementById(id);
                if (element) {
                    document.body.dataset.navScrolling = 'true';
                    setTimeout(() => {
                        const navbarHeight = window.innerWidth >= 1280 ? 80 : 64;
                        const rect = element.getBoundingClientRect();
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        const elementTop = rect.top + scrollTop;
                        const offsetPosition = Math.max(0, elementTop - navbarHeight);

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });

                        // Ensure completion
                        let checkCount = 0;
                        const maxChecks = 30;
                        const checkProgress = () => {
                            checkCount++;
                            const currentPos = window.scrollY;
                            const distance = Math.abs(currentPos - offsetPosition);
                            if (distance <= 20 || checkCount >= maxChecks) {
                                if (distance > 5) {
                                    window.scrollTo({ top: offsetPosition, behavior: 'auto' });
                                }
                                document.body.dataset.navScrolling = 'false';
                                return;
                            }
                            setTimeout(checkProgress, 100);
                        };
                        setTimeout(checkProgress, 300);
                    }, 100);
                }
            }
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground custom-scrollbar">
            <Navbar />

            <main>
                <Hero />

                <Features />

                <HowItWorks />

                <Pricing />

                {/* Simple placeholder for content below fold */}
                <section className="text-center border-t border-border bg-slate-50 py-4 md:py-6">
                    <div className="container mx-auto px-4">
                        <p className="text-xs md:text-sm font-semibold text-brand-500 uppercase tracking-wider mb-1 md:mb-2">Trusted By</p>
                        <h2 className="text-lg md:text-2xl font-bold text-foreground">Empowering Developers Across India</h2>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
