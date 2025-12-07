import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const { login } = useAuth();

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <i className="fas fa-tshirt text-primary text-xl"></i>
              <span className="text-xl font-serif font-bold text-foreground">FashionMirror</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => openAuth('login')}
              >
                Sign In
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => openAuth('register')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 tracking-tight">
              Try Before You Buy
              <span className="block text-primary mt-2">Powered by AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              Upload your photo and see yourself in any outfit instantly.
              Our AI creates realistic virtual try-ons in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground px-10 py-6 text-lg font-medium hover:opacity-90"
                onClick={() => openAuth('register')}
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-10 py-6 text-lg font-medium border-border"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to see yourself in any outfit
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-card border border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-camera text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">1. Upload Your Photo</h3>
              <p className="text-muted-foreground">
                Take a full-body photo or upload an existing one. Our AI works best with clear, well-lit images.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card border border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-tshirt text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">2. Choose Outfits</h3>
              <p className="text-muted-foreground">
                Browse our collection or upload your own clothing items. Mix and match to create complete looks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card border border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-magic text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">3. See the Magic</h3>
              <p className="text-muted-foreground">
                Our AI generates realistic try-on images in seconds. Download, share, or shop with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                Shop Smarter, Not Harder
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-accent text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">No More Returns</h4>
                    <p className="text-muted-foreground">See exactly how clothes look on you before purchasing. Reduce returns by up to 80%.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-accent text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Save Time</h4>
                    <p className="text-muted-foreground">Try dozens of outfits in minutes from the comfort of your home.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-accent text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Perfect Fit</h4>
                    <p className="text-muted-foreground">Our AI understands body proportions to show realistic fits and draping.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-accent text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Privacy First</h4>
                    <p className="text-muted-foreground">Your photos are processed securely and never shared. Delete anytime.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <i className="fas fa-wand-magic-sparkles text-6xl text-primary/50 mb-4"></i>
                  <p className="text-muted-foreground">AI-Powered Virtual Try-On</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
            Ready to Transform Your Shopping?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of fashion-forward shoppers who never buy the wrong outfit.
          </p>
          <Button
            size="lg"
            className="bg-primary text-primary-foreground px-12 py-6 text-lg font-medium hover:opacity-90"
            onClick={() => openAuth('register')}
          >
            Create Free Account
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Start trying on clothes in minutes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-tshirt text-primary"></i>
                <span className="text-lg font-serif font-bold text-foreground">FashionMirror</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The future of fashion try-on, powered by cutting-edge AI technology.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Product</h3>
              <div className="space-y-2 text-sm">
                <span className="text-muted-foreground block">Virtual Try-On</span>
                <span className="text-muted-foreground block">Fashion Gallery</span>
                <span className="text-muted-foreground block">API Access</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Company</h3>
              <div className="space-y-2 text-sm">
                <span className="text-muted-foreground block">About</span>
                <span className="text-muted-foreground block">Blog</span>
                <span className="text-muted-foreground block">Careers</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Support</h3>
              <div className="space-y-2 text-sm">
                <span className="text-muted-foreground block">Help Center</span>
                <span className="text-muted-foreground block">Contact</span>
                <span className="text-muted-foreground block">Privacy</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 FashionMirror. All rights reserved. Powered by Google Gemini AI.
            </p>
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
