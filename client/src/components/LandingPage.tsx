import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import BackgroundAnimation from "./BackgroundAnimation";
import { motion } from "framer-motion";

// Section definitions for navigation
const sections = [
    { id: 'hero', label: 'Home', icon: 'fa-home' },
    { id: 'features', label: 'How It Works', icon: 'fa-magic' },
    { id: 'benefits', label: 'Benefits', icon: 'fa-star' },
    { id: 'cta', label: 'Get Started', icon: 'fa-rocket' },
];

export default function LandingPage() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [activeSection, setActiveSection] = useState('hero');
    const { login } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);

    // Track which section is in view
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 3;

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scrollToNextSection = () => {
        const currentIndex = sections.findIndex(s => s.id === activeSection);
        const nextIndex = currentIndex + 1;
        if (nextIndex < sections.length) {
            scrollToSection(sections[nextIndex].id);
        }
    };

    const isLastSection = activeSection === sections[sections.length - 1].id;

    const openAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden text-foreground">
            {/* Background Animation restored */}
            <BackgroundAnimation />

            {/* Section Navigation Dots */}
            <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="group flex items-center gap-3"
                        aria-label={`Navigate to ${section.label}`}
                    >
                        <span className={`
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300
                            text-sm font-medium text-white/80 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full
                            translate-x-2 group-hover:translate-x-0 transition-transform duration-300
                        `}>
                            {section.label}
                        </span>
                        <span className={`
                            w-3 h-3 rounded-full transition-all duration-300
                            ${activeSection === section.id
                                ? 'bg-primary scale-125 shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                                : 'bg-white/30 group-hover:bg-white/60 group-hover:scale-110'}
                        `} />
                    </button>
                ))}
            </nav>

            {/* Hero Section - with integrated auth */}
            <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0 select-none opacity-80 mix-blend-overlay">
                    <img
                        src="/hero-bg.png"
                        alt="Fashion AI Hero"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30"></div>
                </div>
                {/* Fallback dark overlay */}
                <div className="absolute inset-0 z-0 bg-black/40"></div>

                {/* Top bar with logo and sign in - visible initially */}
                <div className="absolute top-0 left-0 right-0 z-20 px-6 py-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 drop-shadow-sm" style={{ fontFamily: '"Playfair Display", serif' }}>
                                FashionMirror
                            </span>
                        </div>
                        <button
                            onClick={() => openAuth('login')}
                            className="relative group px-6 py-2.5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105"
                        >
                            {/* Glossy glass background */}
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-full group-hover:bg-white/20 group-hover:border-white/40 transition-all duration-300" />
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            {/* Content */}
                            <span className="relative flex items-center gap-2 text-white font-medium text-sm">
                                <span>Sign In</span>
                                <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform duration-300"></i>
                            </span>
                        </button>
                    </div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="text-center max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h1 className="text-6xl md:text-8xl font-serif font-bold text-foreground mb-8 tracking-tight drop-shadow-2xl">
                                Style Yourself
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary/70 mt-4 leading-tight">
                                    With AI Precision
                                </span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto drop-shadow-lg font-light"
                        >
                            Experience the next generation of virtual try-on. Upload your photo and instantly see how any outfit looks on you before you buy.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="flex flex-col sm:flex-row gap-6 justify-center"
                        >
                            {/* Primary CTA - Try It on Now */}
                            <button
                                onClick={() => openAuth('register')}
                                className="relative group px-12 py-5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105"
                            >
                                {/* Glossy glass background - primary/gold tint */}
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-md border border-white/50 rounded-full group-hover:bg-white group-hover:border-white transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]" />
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                {/* Content */}
                                <span className="relative flex items-center justify-center gap-3 text-black font-semibold text-xl">
                                    <span>Try It on Now</span>
                                    <i className="fas fa-magic text-sm group-hover:rotate-12 transition-transform duration-300"></i>
                                </span>
                            </button>

                            {/* Secondary CTA - How It Works */}
                            <button
                                onClick={scrollToFeatures}
                                className="relative group px-12 py-5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105"
                            >
                                {/* Glossy glass background - darker */}
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-full group-hover:bg-white/20 group-hover:border-white/40 transition-all duration-300" />
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                {/* Content */}
                                <span className="relative flex items-center justify-center gap-3 text-white font-semibold text-xl">
                                    <span>How It Works</span>
                                    <i className="fas fa-play text-sm group-hover:translate-x-1 transition-transform duration-300"></i>
                                </span>
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 relative z-10">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="text-center mb-20"
                    >
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
                            Seamlessly Simple
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Transform your shopping experience in three easy steps
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-3 gap-10"
                    >
                        {[
                            {
                                img: "/step-upload.png",
                                title: "1. Upload Your Photo",
                                desc: "Take a quick full-body photo or upload an existing one. Our AI creates a precise 3D model of your body shape."
                            },
                            {
                                img: "/step-choose.png",
                                title: "2. Choose Your Style",
                                desc: "Browse our premium collection or upload images of clothes you want to try from any store."
                            },
                            {
                                img: "/step-transform.png",
                                title: "3. Instant Transformation",
                                desc: "Watch as our AI realistically drapes the clothing on your body, preserving textures and fit."
                            }
                        ].map((step, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="group relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/20 hover:bg-black/40 overflow-hidden"
                            >
                                <div className="mb-8 relative h-48 w-full rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                    <img src={step.img} alt={step.title} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-4 left-0 right-0 z-20">
                                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-white/10">
                                            <span className="text-lg font-bold text-primary">{index + 1}</span>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-semibold text-foreground mb-4 relative z-10">{step.title.split('. ')[1]}</h3>
                                <p className="text-muted-foreground leading-relaxed relative z-10">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-32 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8">
                                Why Shop With FashionMirror?
                            </h2>
                            <div className="space-y-8">
                                {[
                                    {
                                        title: "End the Return Cycle",
                                        desc: "Visualize the fit before you buy. Reduce your returns by up to 80% and shop with confidence."
                                    },
                                    {
                                        title: "Any Brand, Any Outfit",
                                        desc: "Not limited to one store. Upload screenshots from any retailer and see how they look on you."
                                    },
                                    {
                                        title: "Privacy First Design",
                                        desc: "Your photos are processed securely and automatically deleted. Your data stays yours."
                                    }
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-start space-x-6 group">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300">
                                            <i className="fas fa-check text-primary text-xl"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{benefit.title}</h4>
                                            <p className="text-muted-foreground text-lg">{benefit.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 group bg-black/30 backdrop-blur-md">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                                <img
                                    src="/benefits-visual.png"
                                    alt="Fashion Model"
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />

                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 max-w-xs mx-auto transform hover:scale-105 transition-transform duration-300">
                                        <div className="text-4xl mb-3">✨</div>
                                        <div className="text-2xl font-bold text-white mb-2">Try Before You Buy</div>
                                        <div className="text-white/70 text-sm">See yourself in any outfit instantly</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="cta" className="py-32 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent"></div>
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-8">
                            Your New Look Awaits
                        </h2>
                        <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light">
                            Join the revolution of smart shopping. No credit card required to start.
                        </p>
                        <Button
                            size="lg"
                            className="bg-primary text-primary-foreground px-16 py-8 text-xl font-medium hover:opacity-90 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-105 rounded-full"
                            onClick={() => openAuth('register')}
                        >
                            Start Free Trial
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black/60 backdrop-blur-lg border-t border-border pt-20 pb-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    FashionMirror
                                </span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Empowering shoppers with AI-driven confidence. See it, like it, know it fits.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground mb-6 text-lg">Platform</h3>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Virtual Try-On</a></li>
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Technology</a></li>
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground mb-6 text-lg">Company</h3>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground mb-6 text-lg">Legal</h3>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © 2025 FashionMirror. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><i className="fab fa-twitter text-xl"></i></a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><i className="fab fa-instagram text-xl"></i></a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><i className="fab fa-linkedin text-xl"></i></a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Bottom Scroll Arrows - shows until last section */}
            {!isLastSection && (
                <button
                    onClick={scrollToNextSection}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center group cursor-pointer"
                    aria-label="Scroll to next section"
                >
                    {/* Three stacked animated chevrons */}
                    <div className="flex flex-col items-center">
                        <motion.svg
                            animate={{ opacity: [0.3, 0.7, 0.3], y: [0, 3, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                            width="24" height="12" viewBox="0 0 24 12" fill="none"
                            className="text-white/50 group-hover:text-primary/70 transition-colors"
                        >
                            <path d="M2 2L12 10L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                        <motion.svg
                            animate={{ opacity: [0.5, 0.9, 0.5], y: [0, 3, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                            width="24" height="12" viewBox="0 0 24 12" fill="none"
                            className="-mt-1 text-white/70 group-hover:text-primary/90 transition-colors"
                        >
                            <path d="M2 2L12 10L22 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                        <motion.svg
                            animate={{ opacity: [0.7, 1, 0.7], y: [0, 3, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            width="24" height="12" viewBox="0 0 24 12" fill="none"
                            className="-mt-1 text-white group-hover:text-primary transition-colors"
                        >
                            <path d="M2 2L12 10L22 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                    </div>
                </button>
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLogin={login}
                initialMode={authMode}
            />
        </div>
    );
}
