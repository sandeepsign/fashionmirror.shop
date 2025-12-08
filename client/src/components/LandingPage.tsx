import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import BackgroundAnimation from "./BackgroundAnimation";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [showFloatingNav, setShowFloatingNav] = useState(false);
    const { login } = useAuth();

    // Show floating nav after scrolling past hero section
    useEffect(() => {
        const handleScroll = () => {
            setShowFloatingNav(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

            {/* Floating Navigation Pill - appears on scroll */}
            <AnimatePresence>
                {showFloatingNav && (
                    <motion.nav
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
                            <div className="flex items-center space-x-2 pr-3 border-r border-white/10">
                                <i className="fas fa-tshirt text-primary text-lg"></i>
                                <span className="text-lg font-serif font-bold text-foreground">FashionMirror</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground text-sm rounded-full"
                                onClick={() => openAuth('login')}
                            >
                                Sign In
                            </Button>
                            <Button
                                size="sm"
                                className="bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 rounded-full px-4"
                                onClick={() => openAuth('register')}
                            >
                                Get Started
                            </Button>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            {/* Hero Section - with integrated auth */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
                        <div className="flex items-center space-x-2">
                            <i className="fas fa-tshirt text-primary text-2xl"></i>
                            <span className="text-2xl font-serif font-bold text-foreground tracking-wide">FashionMirror</span>
                        </div>
                        <button
                            onClick={() => openAuth('login')}
                            className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <span>Sign In</span>
                            <i className="fas fa-arrow-right text-xs"></i>
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
                            <Button
                                size="lg"
                                className="bg-primary text-primary-foreground px-12 py-8 text-xl font-medium hover:opacity-90 transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] hover:scale-105 rounded-full"
                                onClick={() => openAuth('register')}
                            >
                                Try It on Now
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="px-12 py-8 text-xl font-medium border-white/30 bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all duration-300 rounded-full hover:border-white/60"
                                onClick={scrollToFeatures}
                            >
                                How It Works
                            </Button>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Down Arrow */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 10, 0] }}
                    transition={{ delay: 1, duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer"
                    onClick={scrollToFeatures}
                >
                    <i className="fas fa-chevron-down text-3xl text-white/50 hover:text-white transition-colors"></i>
                </motion.div>
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
            <section className="py-32 relative z-10 overflow-hidden">
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
                                        <div className="text-5xl font-bold text-green-400 mb-2">98%</div>
                                        <div className="text-white font-medium text-lg">Format Match</div>
                                        <div className="w-full h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
                                            <div className="w-[98%] h-full bg-green-400 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative z-10">
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
                            <div className="flex items-center space-x-2">
                                <i className="fas fa-tshirt text-primary text-xl"></i>
                                <span className="text-2xl font-serif font-bold text-foreground">FashionMirror</span>
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
