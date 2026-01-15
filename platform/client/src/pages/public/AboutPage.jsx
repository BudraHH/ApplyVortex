import React from 'react';
import Navbar from './sections/Navbar';
import Footer from './sections/Footer';
import AboutHero from './about-sections/AboutHero';
import ProblemSection from './about-sections/ProblemSection';
import SolutionSection from './about-sections/SolutionSection';
import ValuesSection from './about-sections/ValuesSection';
import AboutCTA from './about-sections/AboutCTA';
import ContactSection from './about-sections/ContactSection';

const AboutPage = () => {
    // Handle initial hash scroll if arriving from another route
    React.useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.replace('#', '');
            if (id === 'about-hero') {
                // For hero/top, use robust scroll to top
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
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground custom-scrollbar">
            <Navbar />
            <main>
                <AboutHero />
                <ProblemSection />
                <SolutionSection />
                <ValuesSection />
                <AboutCTA />
                <ContactSection />
            </main>
            <Footer />
        </div>
    );
};

export default AboutPage;
