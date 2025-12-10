import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import TryOnWorkspace from "@/components/TryOnWorkspace";
import ResultsGallery from "@/components/ResultsGallery";
import LandingPage from "@/components/LandingPage";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FashionItem, TryOnResult } from "@shared/schema";
import { FashionItemInput, apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Show landing page for logged-out users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Logged-in users see the dashboard
  return <Dashboard />;
}

function Dashboard() {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [fashionImages, setFashionImages] = useState<File[]>([]);
  const [selectedFashionItems, setSelectedFashionItems] = useState<FashionItem[]>([]);
  const [allFashionItems, setAllFashionItems] = useState<FashionItemInput[]>([]);
  const [itemSelectionStates, setItemSelectionStates] = useState<boolean[]>([]);
  const [latestResults, setLatestResults] = useState<TryOnResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });
  const [verificationMessage, setVerificationMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Handle email verification URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verification = urlParams.get('verification');
    const email = urlParams.get('email');

    if (verification) {
      let message = '';
      let type: 'success' | 'error' | 'info' = 'info';

      switch (verification) {
        case 'success':
          message = `Email verified successfully! ${email ? `Welcome, ${email}!` : ''} You can now log in to your FashionMirror account.`;
          type = 'success';
          break;
        case 'already-verified':
          message = 'Your email is already verified! You can log in to your account.';
          type = 'info';
          break;
        case 'invalid':
          message = 'Invalid verification link. Please check your email for the correct link or register again.';
          type = 'error';
          break;
        case 'expired':
          message = 'Verification link has expired. Please register again to receive a new verification email.';
          type = 'error';
          break;
        case 'service-error':
          message = 'Service temporarily unavailable. Please try again later or contact support if the issue persists.';
          type = 'error';
          break;
        case 'error':
          message = 'Verification failed due to a technical error. Please try again or contact support.';
          type = 'error';
          break;
        default:
          break;
      }

      if (message) {
        setVerificationMessage({ type, message });

        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, []);

  const handleModelImageSelect = (file: File | null) => {
    setModelImage(file);
  };

  const handleFashionImagesSelect = async (files: File[]) => {
    if (files.length === 0) return;

    // Clear collection selections when uploading
    setSelectedFashionItems([]);

    // Analyze each image and create fashion items
    const newFashionItems: FashionItemInput[] = [];

    for (const file of files) {
      try {
        const analysis = await apiClient.analyzeFashionImage(file);
        newFashionItems.push({
          image: file,
          name: analysis.name,
          category: analysis.category,
          source: 'upload' as const
        });
      } catch (error) {
        console.error('Failed to analyze image:', error);
        // Use fallback values
        newFashionItems.push({
          image: file,
          name: file.name.split('.')[0] || `Fashion Item ${newFashionItems.length + 1}`,
          category: 'Custom',
          source: 'upload' as const
        });
      }
    }

    // Append to existing items
    setAllFashionItems(prev => [...prev, ...newFashionItems]);
    setItemSelectionStates(prev => [...prev, ...new Array(newFashionItems.length).fill(true)]);
    setFashionImages(prev => [...prev, ...files]);
  };

  const handleFashionItemSelect = (item: FashionItem) => {
    const isSelected = selectedFashionItems.some(selected => selected.id === item.id);
    let newSelectedItems: FashionItem[];

    if (isSelected) {
      // Deselect: remove from both lists
      newSelectedItems = selectedFashionItems.filter(selected => selected.id !== item.id);
      const indexToRemove = allFashionItems.findIndex(fi => fi.collectionId === item.id);
      if (indexToRemove !== -1) {
        setAllFashionItems(prev => prev.filter((_, i) => i !== indexToRemove));
        setItemSelectionStates(prev => prev.filter((_, i) => i !== indexToRemove));
      }
    } else {
      // Select: add to both lists
      newSelectedItems = [...selectedFashionItems, item];
      const newItem: FashionItemInput = {
        image: new File([], ''),
        name: item.name,
        category: item.category,
        source: 'collection' as const,
        collectionId: item.id
      };
      setAllFashionItems(prev => [...prev, newItem]);
      setItemSelectionStates(prev => [...prev, true]);
    }

    setSelectedFashionItems(newSelectedItems);
  };

  const handleResultsGenerated = (results: TryOnResult[]) => {
    setLatestResults(results.length > 0 ? [results[results.length - 1]] : []);
  };

  const handleGenerationProgress = (completed: number, total: number) => {
    setGenerationProgress({ completed, total });
  };

  const handleGenerationStart = () => {
    setIsGenerating(true);
  };

  const handleGenerationEnd = () => {
    setIsGenerating(false);
    setGenerationProgress({ completed: 0, total: 0 });
  };

  const handleItemRemove = (index: number) => {
    const removedItem = allFashionItems[index];

    // Remove from all fashion items
    const newFashionItems = allFashionItems.filter((_, i) => i !== index);
    const newSelectionStates = itemSelectionStates.filter((_, i) => i !== index);
    setAllFashionItems(newFashionItems);
    setItemSelectionStates(newSelectionStates);

    // If it was a collection item, remove from selectedFashionItems
    if (removedItem.source === 'collection' && removedItem.collectionId) {
      setSelectedFashionItems(prev => prev.filter(item => item.id !== removedItem.collectionId));
    }

    // If it was an upload, remove from fashionImages
    if (removedItem.source === 'upload') {
      setFashionImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemSelectionToggle = (index: number) => {
    const newSelectionStates = [...itemSelectionStates];
    newSelectionStates[index] = !newSelectionStates[index];
    setItemSelectionStates(newSelectionStates);
  };

  const getSelectedItemsCount = () => {
    return itemSelectionStates.filter(selected => selected).length;
  };

  const getSelectedFashionItems = () => {
    return allFashionItems.filter((_, index) => itemSelectionStates[index]);
  };

  const scrollToWorkspace = () => {
    const workspaceElement = document.getElementById('try-on-workspace');
    workspaceElement?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Verification Message */}
            {verificationMessage && (
              <div className="mb-8">
                <Alert className={
                  verificationMessage.type === 'success' ? 'border-green-200 bg-green-50' :
                  verificationMessage.type === 'error' ? 'border-red-200 bg-red-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertDescription className={
                    verificationMessage.type === 'success' ? 'text-green-700' :
                    verificationMessage.type === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }>
                    {verificationMessage.message}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              AI-Powered Fashion
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Try-On</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the future of fashion. Upload your photo, choose any outfit,
              and see yourself in it instantly with our advanced AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:opacity-90 text-lg px-8"
                onClick={scrollToWorkspace}
              >
                <i className="fas fa-sparkles mr-2"></i>
                Try It Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8"
              >
                <i className="fas fa-play mr-2"></i>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* How It Works */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-semibold text-foreground mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to see yourself in any outfit
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center space-y-4 p-6 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-camera text-primary text-2xl"></i>
            </div>
            <div>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-2">
                1
              </span>
              <h3 className="text-lg font-medium text-foreground">Upload Your Photo</h3>
              <p className="text-sm text-muted-foreground">
                Take or upload a clear photo of yourself
              </p>
            </div>
          </div>

          <div className="text-center space-y-4 p-6 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-tshirt text-accent text-2xl"></i>
            </div>
            <div>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-2">
                2
              </span>
              <h3 className="text-lg font-medium text-foreground">Choose Fashion Items</h3>
              <p className="text-sm text-muted-foreground">
                Upload items or browse our curated collection
              </p>
            </div>
          </div>

          <div className="text-center space-y-4 p-6 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-magic text-primary text-2xl"></i>
            </div>
            <div>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-2">
                3
              </span>
              <h3 className="text-lg font-medium text-foreground">See The Magic</h3>
              <p className="text-sm text-muted-foreground">
                Our AI generates your new look instantly
              </p>
            </div>
          </div>
        </div>

        {/* Consolidated Try-On Workspace */}
        <div id="try-on-workspace">
          <TryOnWorkspace
            modelImage={modelImage}
            allFashionItems={allFashionItems}
            selectedFashionItems={selectedFashionItems}
            itemSelectionStates={itemSelectionStates}
            selectedItemsCount={getSelectedItemsCount()}
            onResultsGenerated={handleResultsGenerated}
            onGenerationProgress={handleGenerationProgress}
            onGenerationStart={handleGenerationStart}
            onGenerationEnd={handleGenerationEnd}
            onItemRemove={handleItemRemove}
            onItemSelectionToggle={handleItemSelectionToggle}
            getSelectedFashionItems={getSelectedFashionItems}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onModelImageSelect={handleModelImageSelect}
            onFashionImagesSelect={handleFashionImagesSelect}
            onFashionItemSelect={handleFashionItemSelect}
          />
        </div>

        {/* Results Gallery */}
        <div id="results-gallery">
          <ResultsGallery latestResults={latestResults} />
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-muted py-12 border-t border-border">
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
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Virtual Try-On</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Fashion Gallery</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">API Access</a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Company</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">About</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Blog</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Careers</a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Support</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Help Center</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Contact</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors block">Privacy</a>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 FashionMirror. All rights reserved. Powered by Google Gemini 2.5 Flash Image.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
