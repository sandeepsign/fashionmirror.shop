import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-tshirt text-primary text-xl"></i>
              <span className="text-xl font-serif font-bold text-foreground">VirtualFit</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-studio">Studio</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-gallery">Gallery</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</a>
            <Button className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-get-started">
              Get Started
            </Button>
          </div>
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <i className="fas fa-bars text-xl"></i>
            </Button>
          </div>
        </div>
        
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-studio-mobile">Studio</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-gallery-mobile">Gallery</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing-mobile">Pricing</a>
              <Button className="bg-primary text-primary-foreground hover:opacity-90 w-full" data-testid="button-get-started-mobile">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
