import React from 'react';
import { Sparkles, Twitter, Github, Linkedin, Heart, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';

const Footer = () => {
    const scrollToTop = () => {
        // Set flag to prevent scroll handlers from interfering
        document.body.dataset.navScrolling = 'true';

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            const targetPosition = 0;

            // Perform smooth scroll
            window.scrollTo({
                top: targetPosition,
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
                const distance = Math.abs(currentPos - targetPosition);

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
                            top: targetPosition,
                            behavior: 'auto'
                        });
                    }
                    window.history.replaceState(null, null, '/');
                    document.body.dataset.navScrolling = 'false';
                    return;
                }

                // If stuck for 5+ checks and still far from target, force scroll
                if (stuckCount >= 5 && distance > 50) {
                    window.scrollTo({
                        top: targetPosition,
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

    return (
        <footer className="border-t border-border bg-background py-6 md:py-8 lg:py-12">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4 lg:gap-y-12">

                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                                <Sparkles size={16} fill="currentColor" className="md:w-[18px] md:h-[18px]" />
                            </div>
                            <span className="text-lg md:text-xl font-bold text-foreground">ApplyVortex</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-4 max-w-sm">
                            AI-powered job application platform designed to help developers landing their dream jobs faster and smarter.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-muted-foreground hover:text-brand-400 transition-colors"><Twitter size={18} className="md:w-5 md:h-5" /></a>
                            <a href="#" className="text-muted-foreground hover:text-brand-400 transition-colors"><Github size={18} className="md:w-5 md:h-5" /></a>
                            <a href="#" className="text-muted-foreground hover:text-brand-400 transition-colors"><Linkedin size={18} className="md:w-5 md:h-5" /></a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h3 className="text-xs md:text-sm font-semibold text-foreground uppercase tracking-wider mb-3 md:mb-4">Product</h3>
                        <ul className="space-y-2 md:space-y-3">
                            <li><Link to={ROUTES.ABOUT} className="text-xs md:text-sm text-muted-foreground hover:text-foreground">About</Link></li>
                            <li><Link to="/#features" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
                            <li><Link to="/#pricing" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Integrations</Link></li>
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Changelog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs md:text-sm font-semibold text-foreground uppercase tracking-wider mb-3 md:mb-4">Resources</h3>
                        <ul className="space-y-2 md:space-y-3">
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Docs</Link></li>
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Community</Link></li>
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs md:text-sm font-semibold text-foreground uppercase tracking-wider mb-3 md:mb-4">Legal</h3>
                        <ul className="space-y-2 md:space-y-3">
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                            <li><Link to="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border flex flex-col md:flex-row items-center justify-between mt-6 pt-6 gap-3 md:mt-8 md:pt-8 md:gap-4">
                    <p className="text-xs md:text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ApplyVortex. All rights reserved.</p>
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2 md:gap-4">
                        Made with <Heart size={12} className="text-red-500 fill-current md:w-[14px] md:h-[14px]" /> in India
                    </p>
                    <button
                        onClick={scrollToTop}
                        className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-brand-500 transition-colors group"
                        aria-label="Scroll to top"
                    >
                        <span className="hidden sm:inline">Back to top</span>
                        <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
