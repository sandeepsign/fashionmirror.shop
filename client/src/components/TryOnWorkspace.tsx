import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, FashionItemInput } from "@/lib/api";
import { FashionItem, TryOnResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [showStatusView, setShowStatusView] = useState(false); // Track whether to show status view
  const [textPrompt, setTextPrompt] = useState(''); // User's creative text prompt
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Reset status view when fashion items change (new items added/removed)
  useEffect(() => {
    if (allFashionItems.length > 0) {
      setShowStatusView(false); // Reset status view when items change
    }
  }, [allFashionItems.length]);

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
      setShowStatusView(true); // Show status view when generation starts
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
            textPrompt: textPrompt.trim() || undefined
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
        
        // Save final result to database using the progressive API
        const finalImageBlob = await fetch(stepResults[stepResults.length - 1]).then(r => r.blob());
        const finalImageFile = new File([finalImageBlob], 'final-result.jpg', { type: 'image/jpeg' });
        
        // Use the progressive API to properly save the result
        const savedResult = await apiClient.generateProgressiveTryOn({
          modelImage: modelImage!,
          fashionItems: fashionItems,
          textPrompt: textPrompt.trim() || undefined
        });

        // Create result object from saved result
        const finalResult = {
          id: savedResult.result?.id || `progressive-${Date.now()}`,
          createdAt: new Date(),
          userId: user?.id || null,
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
      // Keep showStatusView true after completion - don't reset it here
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
    setShowStatusView(false); // Reset status view when Generate is clicked
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
              {isGenerating ? "AI Processing" : showStatusView ? "Generation Complete" : "Fashion Items"}
            </h3>
            <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center relative">
              {isGenerating || showStatusView ? (
                <div className="space-y-4 p-4 h-full">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    {isGenerating && <div className="spinner mx-auto"></div>}
                    <p className="text-sm text-muted-foreground" data-testid="text-generating">
                      {isGenerating ? "Generating try-on results..." : "All items successfully applied!"}
                    </p>
                    {isGenerating && (
                      <p className="text-xs text-muted-foreground opacity-75">
                        Step {generationProgress.completed + 1} of {selectedItemsCount}
                      </p>
                    )}
                  </div>

                  {/* Fashion Items Status List */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {allFashionItems.map((item, index) => {
                      const isCompleted = showStatusView && !isGenerating ? true : index < generationProgress.completed;
                      const isProcessing = isGenerating && index === currentGeneratingIndex;
                      const isPending = isGenerating && index > currentGeneratingIndex;
                      
                      return (
                        <div 
                          key={index}
                          className={`fashion-status-item flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                            isCompleted ? 'bg-green-50 border-green-200' :
                            isProcessing ? 'bg-blue-50 border-blue-200 animate-pulse' :
                            'bg-gray-50 border-gray-200'
                          }`}
                          data-testid={`status-fashion-item-${index}`}
                        >
                          {/* Status Icon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-green-500' :
                            isProcessing ? 'bg-blue-500' :
                            'bg-gray-300'
                          }`}>
                            {isCompleted ? (
                              <i className="fas fa-check text-white text-sm"></i>
                            ) : isProcessing ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <i className="fas fa-clock text-white text-sm"></i>
                            )}
                          </div>

                          {/* Fashion Item Image */}
                          <img 
                            src={item.source === 'upload' ? 
                              URL.createObjectURL(item.image) : 
                              item.source === 'collection' && selectedFashionItems[index] ? 
                                selectedFashionItems[index].imageUrl : 
                                '/placeholder-fashion.jpg'
                            } 
                            alt={item.name} 
                            className={`w-12 h-12 object-cover rounded-md flex-shrink-0 transition-all duration-300 ${
                              isProcessing ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                            }`}
                            data-testid={`img-status-fashion-item-${index}`}
                          />

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm truncate transition-colors duration-300 ${
                              isCompleted ? 'text-green-700' :
                              isProcessing ? 'text-blue-700' :
                              'text-gray-600'
                            }`}>
                              {item.name}
                            </h4>
                            <p className={`text-xs transition-colors duration-300 ${
                              isCompleted ? 'text-green-600' :
                              isProcessing ? 'text-blue-600' :
                              'text-gray-500'
                            }`}>
                              {item.category}
                            </p>
                          </div>

                          {/* Status Text */}
                          <div className="text-right">
                            <p className={`text-xs font-medium transition-colors duration-300 ${
                              isCompleted ? 'text-green-700' :
                              isProcessing ? 'text-blue-700' :
                              'text-gray-500'
                            }`}>
                              {isCompleted ? 'Applied' :
                               isProcessing ? 'Processing...' :
                               'Waiting'}
                            </p>
                            {isProcessing && (
                              <p className="text-xs text-blue-600 animate-pulse">
                                AI Processing
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-border rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full transition-all duration-300" 
                        style={{ 
                          width: generationProgress.total > 0 ? 
                            `${(generationProgress.completed / generationProgress.total) * 100}%` : '0%' 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {isGenerating ? "Processing with Gemini 2.5 Flash Image" : "Processing Complete"}
                    </p>
                    {!isGenerating && showStatusView && (
                      <div className="text-center mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-4 py-1 h-7 border-muted-foreground/20 hover:bg-muted"
                          onClick={() => setShowStatusView(false)}
                          data-testid="button-clear-status"
                        >
                          <i className="fas fa-times mr-1 text-[10px]"></i>
                          Clear List
                        </Button>
                      </div>
                    )}
                  </div>
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
        
        {/* Text Prompt Input */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">Creative Instructions</h3>
              <p className="text-sm text-muted-foreground">
                Add custom instructions to control pose, background, setting, or any creative adjustments
              </p>
            </div>
            <div className="relative">
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="e.g. Change the pose to casual sitting, add a studio background, make it more elegant..."
                className="w-full p-4 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                rows={3}
                maxLength={500}
                data-testid="textarea-text-prompt"
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {textPrompt.length}/500
              </div>
            </div>
            {textPrompt && (
              <div className="flex items-center text-sm text-muted-foreground">
                <i className="fas fa-lightbulb mr-2"></i>
                Your creative instructions will be applied to the AI generation
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
