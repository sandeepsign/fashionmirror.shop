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

  const generateBatchTryOnMutation = useMutation({
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
      const results: TryOnResult[] = [];
      let currentModelImage = modelImage!; // Start with original model image
      
      onGenerationStart();
      onGenerationProgress(0, fashionItems.length);
      
      for (let i = 0; i < fashionItems.length; i++) {
        const item = fashionItems[i];
        // Find the original index in allFashionItems for progress display
        const originalIndex = allFashionItems.findIndex(originalItem => 
          originalItem.name === item.name && originalItem.category === item.category
        );
        setCurrentGeneratingIndex(originalIndex >= 0 ? originalIndex : i);
        
        try {
          const response = await apiClient.generateTryOn({
            modelImage: currentModelImage,
            fashionImage: item.image,
            fashionItemName: item.name,
            fashionCategory: item.category,
            userId: 'demo-user'
          });
          
          if (response.success && response.result) {
            results.push(response.result);
            
            // Convert the result image URL to a File for the next iteration
            if (i < fashionItems.length - 1) { // Not the last item
              const resultImageResponse = await fetch(response.result.resultImageUrl);
              const resultImageBlob = await resultImageResponse.blob();
              currentModelImage = new File([resultImageBlob], `progressive-result-${i}.jpg`, { type: 'image/jpeg' });
            }
            
            // Only show intermediate results for progress, final result will be the last one
            setResultImageUrls([response.result.resultImageUrl]);
          }
          
          onGenerationProgress(i + 1, fashionItems.length);
        } catch (error) {
          console.error(`Failed to generate try-on for item ${i}:`, error);
          toast({
            title: "Generation Failed",
            description: `Failed to generate try-on for ${item.name}`,
            variant: "destructive",
          });
          break; // Stop the progressive chain if one fails
        }
      }
      
      setCurrentGeneratingIndex(-1);
      onGenerationEnd();
      onResultsGenerated(results);
      
      if (results.length === fashionItems.length) {
        toast({
          title: "Progressive Try-On Complete!",
          description: `Final result shows all ${fashionItems.length} items worn together.`,
        });
      } else {
        toast({
          title: "Partial Generation",
          description: `Generated ${results.length} of ${fashionItems.length} items before stopping.`,
          variant: "destructive",
        });
      }
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
    generateBatchTryOnMutation.mutate();
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
          
          {/* Progressive Try-On Result */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground text-center">
              {isGenerating ? "Building Your Look..." : "Final Result"}
            </h3>
            <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center">
              {resultImageUrls.length > 0 ? (
                <div className="relative w-full h-full">
                  <img 
                    src={resultImageUrls[resultImageUrls.length - 1]} 
                    alt="Progressive try-on result" 
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
