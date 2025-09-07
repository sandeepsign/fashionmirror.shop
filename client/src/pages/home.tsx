import { useState } from "react";
import Navigation from "@/components/Navigation";
import ModelUpload from "@/components/ModelUpload";
import FashionUpload from "@/components/FashionUpload";
import FashionCollection from "@/components/FashionCollection";
import TryOnWorkspace from "@/components/TryOnWorkspace";
import ResultsGallery from "@/components/ResultsGallery";
import LoadingModal from "@/components/LoadingModal";
import { Button } from "@/components/ui/button";
import { FashionItem, TryOnResult } from "@shared/schema";
import { FashionItemInput } from "@/lib/api";

export default function Home() {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [fashionImages, setFashionImages] = useState<File[]>([]);
  const [selectedFashionItems, setSelectedFashionItems] = useState<FashionItem[]>([]);
  const [allFashionItems, setAllFashionItems] = useState<FashionItemInput[]>([]);
  const [itemSelectionStates, setItemSelectionStates] = useState<boolean[]>([]);
  const [latestResults, setLatestResults] = useState<TryOnResult[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });

  const handleModelImageSelect = (file: File) => {
    setModelImage(file);
    if (file) setCurrentStep(2);
  };

  const handleFashionImagesSelect = (files: File[]) => {
    setFashionImages(files);
    // Convert uploaded files to FashionItemInput format
    const newFashionItems: FashionItemInput[] = files.map((file, index) => ({
      image: file,
      name: file.name.split('.')[0] || `Fashion Item ${index + 1}`,
      category: 'Custom',
      source: 'upload' as const
    }));
    setAllFashionItems(newFashionItems);
    setItemSelectionStates(new Array(newFashionItems.length).fill(true)); // Select all by default
    setSelectedFashionItems([]); // Clear collection selection
    if (files.length > 0) setCurrentStep(3);
  };

  const handleFashionItemSelect = (item: FashionItem) => {
    const isSelected = selectedFashionItems.some(selected => selected.id === item.id);
    let newSelectedItems: FashionItem[];
    
    if (isSelected) {
      // Remove item if already selected
      newSelectedItems = selectedFashionItems.filter(selected => selected.id !== item.id);
    } else {
      // Add item to selection
      newSelectedItems = [...selectedFashionItems, item];
    }
    
    setSelectedFashionItems(newSelectedItems);
    
    // Convert selected collection items to FashionItemInput format
    const collectionFashionItems: FashionItemInput[] = newSelectedItems.map(collectionItem => ({
      image: new File([], ''), // Will be fetched later
      name: collectionItem.name,
      category: collectionItem.category,
      source: 'collection' as const,
      collectionId: collectionItem.id
    }));
    
    setAllFashionItems(collectionFashionItems);
    setItemSelectionStates(new Array(collectionFashionItems.length).fill(true)); // Select all by default
    setFashionImages([]); // Clear custom uploads
    if (newSelectedItems.length > 0) setCurrentStep(3);
  };

  const handleBrowseCollection = () => {
    // Scroll to fashion collection
    const collectionElement = document.getElementById('fashion-collection');
    collectionElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResultsGenerated = (results: TryOnResult[]) => {
    // For progressive layering, we only care about the final result
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
    const newFashionItems = allFashionItems.filter((_, i) => i !== index);
    const newSelectionStates = itemSelectionStates.filter((_, i) => i !== index);
    setAllFashionItems(newFashionItems);
    setItemSelectionStates(newSelectionStates);
    
    // If removing from collection items, also update selectedFashionItems
    if (allFashionItems.length > 0 && allFashionItems[0].source === 'collection') {
      const newSelectedItems = selectedFashionItems.filter((_, i) => i !== index);
      setSelectedFashionItems(newSelectedItems);
    }
    
    // If removing from uploaded items, also update fashionImages
    if (allFashionItems.length > 0 && allFashionItems[0].source === 'upload') {
      const newFashionImages = fashionImages.filter((_, i) => i !== index);
      setFashionImages(newFashionImages);
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

  const scrollToUpload = () => {
    const uploadElement = document.getElementById('upload-section');
    uploadElement?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              AI-Powered Fashion
              <span className="text-primary"> Try-On Studio</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience the future of fashion with progressive layering technology. 
              Upload your photo and multiple garments to see complete outfits built layer by layer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-primary text-primary-foreground px-8 py-4 text-lg font-medium hover:opacity-90"
                onClick={scrollToUpload}
                data-testid="button-start-try-on"
              >
                Start Virtual Try-On
              </Button>
              <Button 
                variant="outline" 
                className="px-8 py-4 text-lg font-medium"
                onClick={() => {
                  const galleryElement = document.getElementById('results-gallery');
                  galleryElement?.scrollIntoView({ behavior: 'smooth' });
                }}
                data-testid="button-view-examples"
              >
                View Examples
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} rounded-full flex items-center justify-center text-sm font-medium`}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                Upload Model
              </span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} rounded-full flex items-center justify-center text-sm font-medium`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                Select Fashion
              </span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} rounded-full flex items-center justify-center text-sm font-medium`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                Generate
              </span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div id="upload-section" className="grid lg:grid-cols-2 gap-12 mb-16">
          <ModelUpload 
            onImageSelect={handleModelImageSelect}
            selectedImage={modelImage}
          />
          <FashionUpload 
            onImagesSelect={handleFashionImagesSelect}
            selectedImages={fashionImages}
            onBrowseCollection={handleBrowseCollection}
          />
        </div>

        {/* Fashion Collection */}
        <div id="fashion-collection">
          <FashionCollection 
            onItemSelect={handleFashionItemSelect}
            selectedItems={selectedFashionItems}
          />
        </div>

        {/* Try-On Workspace */}
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
                <span className="text-lg font-serif font-bold text-foreground">VirtualFit</span>
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
              © 2025 VirtualFit. All rights reserved. Powered by Google Gemini 2.5 Flash Image.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
