import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-tshirt text-primary text-xl"></i>
              <span className="text-xl font-serif font-bold text-foreground">FashionMirror</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-studio">Studio</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-gallery">Gallery</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</a>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-muted-foreground">
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-muted-foreground">
                    Role: {user?.role}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-primary text-primary-foreground hover:opacity-90" 
                data-testid="button-login"
              >
                Sign In
              </Button>
            )}
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
              
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Signed in as {user?.username}
                  </div>
                  <Button 
                    onClick={logout}
                    variant="outline" 
                    className="w-full text-red-600 border-red-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:opacity-90 w-full" 
                  data-testid="button-login-mobile"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={login}
      />
    </nav>
  );
}
