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
    const [authMode, setAuthMode] = useState('register');
    const [activeSection, setActiveSection] = useState('hero');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { login } = useAuth();
    const containerRef = useRef(null);
    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };
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
    const scrollToSection = (sectionId) => {
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
    const openAuth = (mode) => {
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
    return (<div className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
            {/* Background Animation - only in dark mode */}
            {isDarkMode && <BackgroundAnimation />}

            {/* Section Navigation Pills */}
            <nav className={`fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3 p-3 rounded-2xl backdrop-blur-md ${isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-gray-900/10 border border-gray-900/20 shadow-lg'}`}>
                {sections.map((section) => (<button key={section.id} onClick={() => scrollToSection(section.id)} className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${activeSection === section.id
                ? 'bg-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                : isDarkMode
                    ? 'bg-white/20 text-white hover:bg-white/40'
                    : 'bg-gray-900/20 text-gray-700 hover:bg-gray-900/40'}`} aria-label={`Navigate to ${section.label}`}>
                        <i className={`fas ${section.icon} text-sm`}></i>

                        {/* Tooltip */}
                        <span className={`
                            absolute right-full mr-3 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap
                            opacity-0 group-hover:opacity-100 transition-all duration-300
                            translate-x-2 group-hover:translate-x-0
                            ${isDarkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}
                        `}>
                            {section.label}
                        </span>
                    </button>))}
            </nav>

            {/* Hero Section - with integrated auth */}
            <section id="hero" className={`relative min-h-screen flex items-center justify-center overflow-hidden ${!isDarkMode ? 'bg-gradient-to-b from-gray-50 to-white' : ''}`}>
                {/* Background Image with Overlay - only in dark mode */}
                {isDarkMode && (<>
                        <div className="absolute inset-0 z-0 select-none opacity-80 mix-blend-overlay">
                            <img src="/hero-bg.png" alt="Fashion AI Hero" className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30"></div>
                        </div>
                        {/* Fallback dark overlay */}
                        <div className="absolute inset-0 z-0 bg-black/40"></div>
                    </>)}

                {/* Top bar with logo, dark mode toggle, and sign in */}
                <div className="absolute top-0 left-0 right-0 z-20 px-6 py-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className={`text-3xl font-bold tracking-tighter text-transparent bg-clip-text drop-shadow-sm ${isDarkMode ? 'bg-gradient-to-r from-white via-white to-white/70' : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600'}`} style={{ fontFamily: '"Playfair Display", serif' }}>
                                FashionMirror
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Dark/Light Mode Toggle */}
                            <button onClick={toggleDarkMode} className={`relative group flex items-center justify-center w-9 h-9 rounded-full overflow-hidden transition-all duration-300 hover:scale-110 ${isDarkMode
            ? 'bg-gradient-to-br from-yellow-400/30 to-orange-500/30 border border-yellow-400/50 hover:border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
            : 'bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/50 hover:border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'}`} aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                                <motion.div initial={false} animate={{ rotate: isDarkMode ? 0 : 360, scale: [1, 1.1, 1] }} transition={{ duration: 0.5, ease: "easeInOut" }} className="flex items-center justify-center">
                                    {isDarkMode ? (
        /* Sun with rays SVG */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                                            <circle cx="12" cy="12" r="4" fill="currentColor"/>
                                            <path d="M12 2V4M12 20V22M4 12H2M6.31 6.31L4.9 4.9M17.69 6.31L19.1 4.9M6.31 17.69L4.9 19.1M17.69 17.69L19.1 19.1M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>) : (
        /* Crescent moon SVG */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>)}
                                </motion.div>
                            </button>

                            {/* Sign In Button */}
                            <button onClick={() => openAuth('login')} className="relative group px-6 py-2.5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105">
                                {/* Glossy glass background */}
                                <div className={`absolute inset-0 backdrop-blur-md border rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/10 border-white/20 group-hover:bg-white/20 group-hover:border-white/40' : 'bg-gray-900/10 border-gray-900/20 group-hover:bg-gray-900/20 group-hover:border-gray-900/40'}`}/>
                                {/* Shine effect */}
                                <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ${isDarkMode ? 'via-white/10' : 'via-gray-900/10'}`}/>
                                {/* Content */}
                                <span className={`relative flex items-center gap-2 font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <span>Sign In</span>
                                    <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform duration-300"></i>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="text-center max-w-5xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                            <h1 className={`text-6xl md:text-8xl font-serif font-bold mb-8 tracking-tight ${isDarkMode ? 'text-white drop-shadow-2xl' : 'text-gray-900'}`}>
                                Style Yourself
                                <span className={`block text-transparent bg-clip-text mt-4 leading-tight ${isDarkMode ? 'bg-gradient-to-r from-primary via-white to-primary/70' : 'bg-gradient-to-r from-primary via-gray-900 to-primary/70'}`}>
                                    With AI Precision
                                </span>
                            </h1>
                        </motion.div>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className={`text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto font-light ${isDarkMode ? 'text-white/90 drop-shadow-lg' : 'text-gray-600'}`}>
                            Experience the next generation of virtual try-on. Upload your photo and instantly see how any outfit looks on you before you buy.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="flex flex-col sm:flex-row gap-6 justify-center">
                            {/* Primary CTA - Try It on Now */}
                            <button onClick={() => openAuth('register')} className="relative group px-12 py-5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105">
                                {/* Glossy glass background - primary/gold tint */}
                                <div className={`absolute inset-0 backdrop-blur-md border rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/90 border-white/50 group-hover:bg-white group-hover:border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]' : 'bg-gray-900 border-gray-900 group-hover:bg-gray-800 shadow-lg group-hover:shadow-xl'}`}/>
                                {/* Shine effect */}
                                <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ${isDarkMode ? 'via-white/50' : 'via-white/20'}`}/>
                                {/* Content */}
                                <span className={`relative flex items-center justify-center gap-3 font-semibold text-xl ${isDarkMode ? 'text-black' : 'text-white'}`}>
                                    <span>Try It on Now</span>
                                    <i className="fas fa-magic text-sm group-hover:rotate-12 transition-transform duration-300"></i>
                                </span>
                            </button>

                            {/* Secondary CTA - How It Works */}
                            <button onClick={scrollToFeatures} className="relative group px-12 py-5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105">
                                {/* Glossy glass background - darker */}
                                <div className={`absolute inset-0 backdrop-blur-md border rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/10 border-white/20 group-hover:bg-white/20 group-hover:border-white/40' : 'bg-gray-100 border-gray-300 group-hover:bg-gray-200 group-hover:border-gray-400'}`}/>
                                {/* Shine effect */}
                                <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ${isDarkMode ? 'via-white/10' : 'via-white/50'}`}/>
                                {/* Content */}
                                <span className={`relative flex items-center justify-center gap-3 font-semibold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <span>How It Works</span>
                                    <i className="fas fa-play text-sm group-hover:translate-x-1 transition-transform duration-300"></i>
                                </span>
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={`py-32 relative z-10 ${!isDarkMode ? 'bg-gray-50' : ''}`}>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={staggerContainer} className="text-center mb-20">
                        <motion.h2 variants={fadeInUp} className={`text-4xl md:text-5xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Seamlessly Simple
                        </motion.h2>
                        <motion.p variants={fadeInUp} className={`text-xl max-w-2xl mx-auto ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                            Transform your shopping experience in three easy steps
                        </motion.p>
                    </motion.div>

                    <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-10">
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
        ].map((step, index) => (<motion.div key={index} variants={fadeInUp} className={`group relative backdrop-blur-sm rounded-3xl p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${isDarkMode ? 'bg-black/20 border border-white/10 hover:border-primary/20 hover:bg-black/40' : 'bg-white border border-gray-200 hover:border-primary/30 hover:bg-gray-50 shadow-lg'}`}>
                                <div className="mb-8 relative h-48 w-full rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <div className={`absolute inset-0 z-10 ${isDarkMode ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-gradient-to-t from-gray-900/60 to-transparent'}`}></div>
                                    <img src={step.img} alt={step.title} className="w-full h-full object-cover"/>
                                    <div className="absolute bottom-4 left-0 right-0 z-20">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto backdrop-blur-md ${isDarkMode ? 'bg-primary/20 border border-white/10' : 'bg-primary/30 border border-primary/20'}`}>
                                            <span className="text-lg font-bold text-primary">{index + 1}</span>
                                        </div>
                                    </div>
                                </div>
                                <h3 className={`text-2xl font-semibold mb-4 relative z-10 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{step.title.split('. ')[1]}</h3>
                                <p className={`leading-relaxed relative z-10 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                                    {step.desc}
                                </p>
                            </motion.div>))}
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className={`py-32 relative z-10 overflow-hidden ${!isDarkMode ? 'bg-white' : ''}`}>
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-transparent via-black/20 to-transparent' : 'bg-gradient-to-b from-gray-50/50 via-transparent to-gray-50/50'}`}></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                            <h2 className={`text-4xl md:text-5xl font-serif font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
        ].map((benefit, index) => (<div key={index} className="flex items-start space-x-6 group">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300 ${isDarkMode ? 'bg-primary/10' : 'bg-primary/20'}`}>
                                            <i className="fas fa-check text-primary text-xl"></i>
                                        </div>
                                        <div>
                                            <h4 className={`text-xl font-semibold mb-2 group-hover:text-primary transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{benefit.title}</h4>
                                            <p className={`text-lg ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>{benefit.desc}</p>
                                        </div>
                                    </div>))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
                            <div className={`aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative group backdrop-blur-md ${isDarkMode ? 'border border-white/10 bg-black/30' : 'border border-gray-200 bg-gray-100'}`}>
                                <div className={`absolute inset-0 z-10 ${isDarkMode ? 'bg-gradient-to-t from-black/80 via-transparent to-transparent' : 'bg-gradient-to-t from-gray-900/60 via-transparent to-transparent'}`}></div>
                                <img src="/benefits-visual.png" alt="Fashion Model" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>

                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className={`text-center p-8 backdrop-blur-xl rounded-2xl max-w-xs mx-auto transform hover:scale-105 transition-transform duration-300 ${isDarkMode ? 'bg-black/40 border border-white/10' : 'bg-white/80 border border-gray-200 shadow-lg'}`}>
                                        <div className="text-4xl mb-3">✨</div>
                                        <div className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Try Before You Buy</div>
                                        <div className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>See yourself in any outfit instantly</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="cta" className={`py-32 relative z-10 ${!isDarkMode ? 'bg-gray-50' : ''}`}>
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-t from-primary/10 via-transparent to-transparent' : 'bg-gradient-to-t from-primary/5 via-transparent to-transparent'}`}></div>
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <h2 className={`text-5xl md:text-7xl font-serif font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Your New Look Awaits
                        </h2>
                        <p className={`text-2xl mb-12 max-w-3xl mx-auto font-light ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                            Join the revolution of smart shopping. No credit card required to start.
                        </p>
                        <Button size="lg" className={`px-16 py-8 text-xl font-medium transition-all duration-300 hover:scale-105 rounded-full ${isDarkMode ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-xl hover:shadow-2xl'}`} onClick={() => openAuth('register')}>
                            Start Free Trial
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`backdrop-blur-lg border-t pt-20 pb-10 relative z-10 ${isDarkMode ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className={`text-3xl font-bold tracking-tighter text-transparent bg-clip-text ${isDarkMode ? 'bg-gradient-to-r from-white via-gray-200 to-gray-400' : 'bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500'}`} style={{ fontFamily: '"Playfair Display", serif' }}>
                                    FashionMirror
                                </span>
                            </div>
                            <p className={`leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                                Empowering shoppers with AI-driven confidence. See it, like it, know it fits.
                            </p>
                        </div>

                        <div>
                            <h3 className={`font-semibold mb-6 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Platform</h3>
                            <ul className="space-y-4">
                                <li><a href="/technology" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Technology</a></li>
                                <li><a href="/docs" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Documentation</a></li>
                                <li><a href="/docs/api" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>API Reference</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className={`font-semibold mb-6 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Resources</h3>
                            <ul className="space-y-4">
                                <li><a href="/blog" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Blog</a></li>
                                <li><a href="/merchant/login" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Merchant Dashboard</a></li>
                                <li><a href="mailto:support@fashionmirror.shop" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Support</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className={`font-semibold mb-6 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Developers</h3>
                            <ul className="space-y-4">
                                <li><a href="/docs" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Quick Start</a></li>
                                <li><a href="/docs/api" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>API Docs</a></li>
                                <li><a href="https://github.com/fashionmirror" target="_blank" rel="noopener noreferrer" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>GitHub</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className={`border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 ${isDarkMode ? 'border-white/10' : 'border-gray-300'}`}>
                        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                            © 2025 FashionMirror. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}><i className="fab fa-twitter text-xl"></i></a>
                            <a href="#" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}><i className="fab fa-instagram text-xl"></i></a>
                            <a href="#" className={`hover:text-primary transition-colors ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}><i className="fab fa-linkedin text-xl"></i></a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Bottom Scroll Arrows - shows until last section */}
            {!isLastSection && (<button onClick={scrollToNextSection} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center group cursor-pointer" aria-label="Scroll to next section">
                    {/* Three stacked animated chevrons */}
                    <div className="flex flex-col items-center">
                        <motion.svg animate={{ opacity: [0.3, 0.7, 0.3], y: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0 }} width="24" height="12" viewBox="0 0 24 12" fill="none" className={`group-hover:text-primary/70 transition-colors ${isDarkMode ? 'text-white/50' : 'text-gray-400'}`}>
                            <path d="M2 2L12 10L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                        <motion.svg animate={{ opacity: [0.5, 0.9, 0.5], y: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} width="24" height="12" viewBox="0 0 24 12" fill="none" className={`-mt-1 group-hover:text-primary/90 transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                            <path d="M2 2L12 10L22 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                        <motion.svg animate={{ opacity: [0.7, 1, 0.7], y: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} width="24" height="12" viewBox="0 0 24 12" fill="none" className={`-mt-1 group-hover:text-primary transition-colors ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                            <path d="M2 2L12 10L22 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                    </div>
                </button>)}

            {/* Auth Modal */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={login} initialMode={authMode}/>
        </div>);
}
