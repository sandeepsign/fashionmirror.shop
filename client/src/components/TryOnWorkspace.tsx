import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, FashionItemInput } from "@/lib/api";
import { FashionItem, TryOnResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TryOnWorkspaceProps {
  modelImage: File | null;
  allFashionItems: FashionItemInput[];
  selectedFashionItems: FashionItem[];
  itemSelectionStates: boolean[];
  selectedItemsCount: number;
  onResultsGenerated: (results: TryOnResult[]) => void;
  onGenerationProgress: (completed: number, total: number) => void;
  onGenerationStart: () => void;
  onGenerationEnd: () => void;
  onItemRemove: (index: number) => void;
  onItemSelectionToggle: (index: number) => void;
  getSelectedFashionItems: () => FashionItemInput[];
  isGenerating: boolean;
  generationProgress: { completed: number; total: number };
}

export default function TryOnWorkspace({ 
  modelImage, 
  allFashionItems,
  selectedFashionItems,
  itemSelectionStates,
  selectedItemsCount,
  onResultsGenerated,
  onGenerationProgress,
  onGenerationStart,
  onGenerationEnd,
  onItemRemove,
  onItemSelectionToggle,
  getSelectedFashionItems,
  isGenerating,
  generationProgress
}: TryOnWorkspaceProps) {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [resultImageUrls, setResultImageUrls] = useState<string[]>([]);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number>(-1);
  const [currentViewingStep, setCurrentViewingStep] = useState(0); // Track which step image is being viewed
  const { toast } = useToast();

  // Create preview URL for model image
  useEffect(() => {
    if (modelImage) {
      const url = URL.createObjectURL(modelImage);
      setModelImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setModelImageUrl(null);
    }
  }, [modelImage]);

  const generateSimultaneousTryOnMutation = useMutation({
    mutationFn: async () => {
      const selectedItems = getSelectedFashionItems();
      
      if (!modelImage || selectedItems.length === 0) {
        throw new Error("Model image and at least one selected fashion item are required");
      }

      // Prepare fashion items with actual image files
      const fashionItemsWithImages: FashionItemInput[] = [];
      
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        let fashionImageFile = item.image;
        
        // If it's from collection, fetch the image
        if (item.source === 'collection' && item.collectionId) {
          const collectionItem = await apiClient.getFashionItem(item.collectionId);
          const response = await fetch(collectionItem.imageUrl);
          const blob = await response.blob();
          fashionImageFile = new File([blob], `${item.name}.jpg`, { type: 'image/jpeg' });
        }
        
        fashionItemsWithImages.push({
          ...item,
          image: fashionImageFile
        });
      }

      return { fashionItems: fashionItemsWithImages };
    },
    onSuccess: async ({ fashionItems }) => {
      onGenerationStart();
      onGenerationProgress(0, fashionItems.length);
      
      try {
        const stepResults: string[] = [];
        let currentModelImage = modelImage!;
        
        // Generate each step sequentially
        for (let i = 0; i < fashionItems.length; i++) {
          const item = fashionItems[i];
          setCurrentGeneratingIndex(i);
          
          console.log(`Starting step ${i + 1}: ${item.name}`);
          
          // Generate this step using the result from the previous step as input
          const stepResponse = await apiClient.generateProgressiveStep({
            modelImage: currentModelImage,
            fashionImage: item.image,
            fashionItemName: item.name,
            fashionCategory: item.category,
            stepNumber: i + 1,
            userId: 'demo-user'
          });
          
          if (!stepResponse.success) {
            throw new Error(stepResponse.error || `Failed to generate step ${i + 1}`);
          }
          
          // Convert base64 result to blob and create File for next step
          const stepImageUrl = `data:image/jpeg;base64,${stepResponse.resultImageBase64}`;
          stepResults.push(stepImageUrl);
          
          // Update UI to show current step result
          setResultImageUrls([...stepResults]);
          
          // Auto-navigate to the latest generated step
          setCurrentViewingStep(stepResults.length - 1);
          
          // Create file from base64 for next step
          if (i < fashionItems.length - 1) {
            const response = await fetch(stepImageUrl);
            const blob = await response.blob();
            currentModelImage = new File([blob], `step-${i + 1}-result.jpg`, { type: 'image/jpeg' });
          }
          
          onGenerationProgress(i + 1, fashionItems.length);
          
          console.log(`Completed step ${i + 1}: ${item.name}`);
        }
        
        // Create final result object
        const finalResult = {
          id: `progressive-${Date.now()}`,
          createdAt: new Date(),
          userId: 'demo-user',
          modelImageUrl: URL.createObjectURL(modelImage!),
          fashionImageUrl: stepResults[stepResults.length - 1],
          resultImageUrl: stepResults[stepResults.length - 1],
          fashionItemName: fashionItems.map(item => item.name).join(' + '),
          fashionCategory: fashionItems.map(item => item.category).join(', '),
          metadata: {
            timestamp: new Date().toISOString(),
            generationType: 'progressive-step-by-step',
            stepResults: stepResults
          }
        };
        
        onResultsGenerated([finalResult]);
        
        // Set to final result when generation is complete
        setCurrentViewingStep(stepResults.length - 1);
        
        toast({
          title: "Try-on complete!",
          description: `Successfully applied ${fashionItems.length} fashion item${fashionItems.length > 1 ? 's' : ''} progressively in ${stepResults.length} steps.`,
        });
        
      } catch (error) {
        console.error('Failed to generate progressive try-on:', error);
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Failed to generate progressive try-on",
          variant: "destructive",
        });
      }
      
      setCurrentGeneratingIndex(-1);
      onGenerationEnd();
    },
    onError: (error) => {
      console.error("Batch try-on generation failed:", error);
      setCurrentGeneratingIndex(-1);
      onGenerationEnd();
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate try-on results",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    setResultImageUrls([]);
    setCurrentViewingStep(0);
    generateSimultaneousTryOnMutation.mutate();
  };

  // Navigation functions for step images
  const goToPreviousStep = () => {
    setCurrentViewingStep(prev => Math.max(0, prev - 1));
  };

  const goToNextStep = () => {
    setCurrentViewingStep(prev => Math.min(resultImageUrls.length - 1, prev + 1));
  };

  const handleDownloadFinal = () => {
    if (resultImageUrls.length > 0) {
      const finalResultUrl = resultImageUrls[resultImageUrls.length - 1];
      const link = document.createElement('a');
      link.href = finalResultUrl;
      link.download = `virtual-try-on-final-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Check if we can generate based on model image and selected items
  const hasSelectedItems = selectedItemsCount > 0;

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">AI Try-On Studio</h2>
        <p className="text-muted-foreground">See how your selected fashion items look on you</p>
      </div>
      
      <div className="bg-card rounded-2xl p-8 border border-border">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Original Photo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground text-center">Original Photo</h3>
            <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center">
              {modelImageUrl ? (
                <img 
                  src={modelImageUrl} 
                  alt="Original model photo" 
                  className="w-full h-full object-contain rounded-xl"
                  data-testid="img-original-photo"
                />
              ) : (
                <div className="text-center space-y-2">
                  <i className="fas fa-user text-muted-foreground text-4xl"></i>
                  <p className="text-sm text-muted-foreground" data-testid="text-no-model">
                    Upload a model photo
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Processing/Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground text-center">
              {isGenerating ? "AI Processing" : "Fashion Items"}
            </h3>
            <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center relative">
              {isGenerating ? (
                <div className="text-center space-y-4">
                  <div className="spinner mx-auto"></div>
                  <p className="text-sm text-muted-foreground" data-testid="text-generating">
                    Generating try-on results...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentGeneratingIndex >= 0 ? 
                      `Adding ${allFashionItems[currentGeneratingIndex].name} to look...` :
                      'Preparing generation with selected items...'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground opacity-75">
                    Step {generationProgress.completed + 1} of {selectedItemsCount}
                  </p>
                  <div className="w-32 h-2 bg-border rounded-full mx-auto">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all duration-300" 
                      style={{ 
                        width: generationProgress.total > 0 ? 
                          `${(generationProgress.completed / generationProgress.total) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Processing with Gemini 2.5 Flash Image
                  </p>
                </div>
              ) : allFashionItems.length > 0 ? (
                <div className="p-4 h-full overflow-y-auto space-y-2">
                  {allFashionItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="fashion-item-row flex items-center gap-3 p-3 bg-white rounded-lg border border-border hover:bg-muted cursor-pointer transition-all duration-200 group"
                      onClick={() => onItemRemove(index)}
                      data-testid={`row-fashion-item-${index}`}
                    >
                      <img 
                        src={item.source === 'upload' ? 
                          URL.createObjectURL(item.image) : 
                          item.source === 'collection' && selectedFashionItems[index] ? 
                            selectedFashionItems[index].imageUrl : 
                            '/placeholder-fashion.jpg'
                        } 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                        data-testid={`img-fashion-item-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm truncate group-hover:text-primary">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <div className="flex items-center text-muted-foreground group-hover:text-destructive">
                        <i className="fas fa-times text-sm"></i>
                      </div>
                    </div>
                  ))}
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">
                      Click any item to remove it from the selection
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <i className="fas fa-tshirt text-muted-foreground text-4xl"></i>
                  <p className="text-sm text-muted-foreground" data-testid="text-no-fashion">
                    Select fashion items
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Progressive Try-On Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground text-center">
              {isGenerating ? "Building Your Look..." : "Progressive Steps"}
            </h3>
            
            <div className="relative">
              {/* Single Image Display */}
              <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center">
                {resultImageUrls.length > 0 ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={resultImageUrls[currentViewingStep] || resultImageUrls[resultImageUrls.length - 1]} 
                      alt={`Step ${currentViewingStep + 1} result`} 
                      className="w-full h-full object-contain rounded-xl"
                      data-testid="img-progressive-result"
                    />
                    {isGenerating && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                        {generationProgress.completed}/{generationProgress.total} items
                      </div>
                    )}
                    {!isGenerating && allFashionItems.length > 1 && (
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                        Wearing {allFashionItems.length} items
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <i className="fas fa-magic text-muted-foreground text-4xl"></i>
                    <p className="text-sm text-muted-foreground" data-testid="text-no-result">
                      {(modelImage && selectedItemsCount > 0) ? "Ready to build your look" : "Waiting for inputs"}
                    </p>
                    {selectedItemsCount > 1 && modelImage && (
                      <p className="text-xs text-muted-foreground">
                        Will layer {selectedItemsCount} items progressively
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Controls - Only show if multiple results exist */}
              {resultImageUrls.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <button
                    onClick={goToPreviousStep}
                    disabled={currentViewingStep === 0}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    data-testid="btn-previous-step"
                  >
                    <i className="fas fa-chevron-left text-sm"></i>
                  </button>

                  {/* Right Arrow */}
                  <button
                    onClick={goToNextStep}
                    disabled={currentViewingStep === resultImageUrls.length - 1}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    data-testid="btn-next-step"
                  >
                    <i className="fas fa-chevron-right text-sm"></i>
                  </button>
                </>
              )}
            </div>

            {/* Step Indicator */}
            {resultImageUrls.length > 1 && (
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Step {currentViewingStep + 1} of {resultImageUrls.length}
                  {currentViewingStep === resultImageUrls.length - 1 && (
                    <span className="ml-1 text-primary">(Final)</span>
                  )}
                </p>
                
                {/* Step Dots Indicator */}
                <div className="flex justify-center space-x-2">
                  {resultImageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentViewingStep(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentViewingStep
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      data-testid={`step-dot-${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button 
            className="bg-primary text-primary-foreground px-8 py-3 font-medium hover:opacity-90" 
            onClick={handleGenerate}
            disabled={!modelImage || selectedItemsCount === 0 || isGenerating}
            data-testid="button-generate-try-on"
          >
            <i className="fas fa-magic mr-2"></i>
            {isGenerating ? 
              `Generating ${generationProgress.completed}/${generationProgress.total}...` : 
              selectedItemsCount > 0 ?
                `Generate with ${selectedItemsCount} ${selectedItemsCount === 1 ? 'Item' : 'Items'}` :
                'Generate Progressive Look'
            }
          </Button>
          <Button 
            variant="outline" 
            className="px-8 py-3 font-medium"
            onClick={handleDownloadFinal}
            disabled={resultImageUrls.length === 0}
            data-testid="button-download-final"
          >
            <i className="fas fa-download mr-2"></i>
            Download Final Result
          </Button>
        </div>
      </div>
    </section>
  );
}
