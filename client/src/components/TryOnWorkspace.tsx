import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, FashionItemInput, ExtractedProductFromUrl } from "@/lib/api";
import { FashionItem, TryOnResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Image, Sparkles, Download, Plus, Trash2, X, ChevronLeft, ChevronRight, Palette, Check, Clock, Loader2, ClipboardPaste, BookmarkPlus, Link, Globe, ExternalLink } from "lucide-react";

// Helper function to convert data URL to File
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

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
  // New props for integrated upload
  onModelImageSelect: (file: File | null) => void;
  onFashionImagesSelect: (files: File[]) => void;
  onFashionItemSelect: (item: FashionItem) => void;
}

const categories = [
  { id: "all", label: "All" },
  { id: "professional", label: "Professional" },
  { id: "formal", label: "Formal" },
  { id: "casual", label: "Casual" },
  { id: "accessories", label: "Accessories" },
  { id: "footwear", label: "Footwear" }
];

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
  generationProgress,
  onModelImageSelect,
  onFashionImagesSelect,
  onFashionItemSelect
}: TryOnWorkspaceProps) {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [resultImageUrls, setResultImageUrls] = useState<string[]>([]);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number>(-1);
  const [currentViewingStep, setCurrentViewingStep] = useState(0);
  const [showStatusView, setShowStatusView] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [showCollectionBrowser, setShowCollectionBrowser] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [modelDragActive, setModelDragActive] = useState(false);
  const [fashionDragActive, setFashionDragActive] = useState(false);

  // URL input states
  const [showModelUrlInput, setShowModelUrlInput] = useState(false);
  const [modelUrlValue, setModelUrlValue] = useState('');
  const [isLoadingModelUrl, setIsLoadingModelUrl] = useState(false);

  const [showProductUrlModal, setShowProductUrlModal] = useState(false);
  const [productUrlValue, setProductUrlValue] = useState('');
  const [isLoadingProductUrl, setIsLoadingProductUrl] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProductFromUrl | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const modelInputRef = useRef<HTMLInputElement>(null);
  const fashionInputRef = useRef<HTMLInputElement>(null);
  const fashionUploadRef = useRef<HTMLDivElement>(null);

  // Fashion collection query
  const { data: fashionCollection } = useQuery({
    queryKey: ["/api/fashion-items", user?.id],
    queryFn: () => apiClient.getFashionItems(),
  });

  const filteredCollection = fashionCollection?.filter(item =>
    activeCategory === "all" || item.category.toLowerCase() === activeCategory
  ) || [];

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

  // Reset status view when fashion items change
  useEffect(() => {
    if (allFashionItems.length > 0) {
      setShowStatusView(false);
    }
  }, [allFashionItems.length]);

  // Model upload handlers
  const handleModelDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setModelDragActive(true);
    } else if (e.type === "dragleave") {
      setModelDragActive(false);
    }
  };

  const handleModelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModelDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      onModelImageSelect(files[0]);
    }
  };

  const handleModelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onModelImageSelect(files[0]);
    }
  };

  const handleModelClick = () => {
    modelInputRef.current?.click();
  };

  const handleChangeModel = () => {
    onModelImageSelect(null);
    setShowModelUrlInput(false);
    setModelUrlValue('');
    if (modelInputRef.current) {
      modelInputRef.current.value = '';
    }
  };

  // Model URL fetch handler - uses direct fetch to avoid module caching issues
  const handleFetchModelFromUrl = useCallback(async () => {
    if (!modelUrlValue.trim()) {
      toast({
        title: "URL required",
        description: "Please enter an image URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingModelUrl(true);
    try {
      // Direct fetch call to avoid Vite module caching issues
      const response = await fetch('/api/model-image/fetch-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: modelUrlValue.trim() }),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch image from URL');
      }

      if (result.success && result.imageDataUrl) {
        // Convert data URL to File object using local helper function
        const file = dataUrlToFile(result.imageDataUrl, `model-from-url-${Date.now()}.jpg`);
        onModelImageSelect(file);
        setShowModelUrlInput(false);
        setModelUrlValue('');

        toast({
          title: "Image loaded!",
          description: "Model photo fetched from URL successfully",
        });
      }
    } catch (error) {
      console.error('Failed to fetch model image:', error);
      toast({
        title: "Failed to fetch image",
        description: error instanceof Error ? error.message : "Could not fetch image from URL",
        variant: "destructive"
      });
    } finally {
      setIsLoadingModelUrl(false);
    }
  }, [modelUrlValue, onModelImageSelect, toast]);

  // Fashion upload handlers
  const handleFashionDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setFashionDragActive(true);
    } else if (e.type === "dragleave") {
      setFashionDragActive(false);
    }
  };

  const handleFashionDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFashionDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await addFashionImages(Array.from(files));
    }
  };

  const addFashionImages = useCallback(async (newFiles: File[]) => {
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({
        title: "No images found",
        description: "Please select valid image files",
        variant: "destructive"
      });
      return;
    }

    // Analyze each image and add to the list
    for (const file of imageFiles) {
      try {
        const analysis = await apiClient.analyzeFashionImage(file);
        const newItem: FashionItemInput = {
          image: file,
          name: analysis.name,
          category: analysis.category,
          source: 'upload' as const
        };
        // We need to trigger the parent to add this item
        onFashionImagesSelect([...imageFiles]);
      } catch (error) {
        console.error('Failed to analyze image:', error);
      }
    }

    toast({
      title: "Images added!",
      description: `Added ${imageFiles.length} fashion item${imageFiles.length > 1 ? 's' : ''}`,
    });
  }, [onFashionImagesSelect, toast]);

  const handleFashionFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFashionImagesSelect(Array.from(files));
    }
    if (fashionInputRef.current) {
      fashionInputRef.current.value = '';
    }
  };

  const handleFashionClick = () => {
    fashionInputRef.current?.click();
  };

  // Paste handler - directly reads from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      // Check if Clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast({
          title: "Clipboard not supported",
          description: "Your browser doesn't support clipboard access. Try using Ctrl+V / Cmd+V instead.",
          variant: "destructive"
        });
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];

      for (const clipboardItem of clipboardItems) {
        // Check if any type is an image
        const imageType = clipboardItem.types.find(type => type.startsWith('image/'));

        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          const timestamp = Date.now();
          const extension = imageType.split('/')[1] || 'png';
          const pastedFile = new File([blob], `pasted-fashion-${timestamp}.${extension}`, {
            type: imageType
          });
          imageFiles.push(pastedFile);
        }
      }

      if (imageFiles.length > 0) {
        onFashionImagesSelect(imageFiles);
        toast({
          title: "Image pasted!",
          description: `Added ${imageFiles.length} fashion item${imageFiles.length > 1 ? 's' : ''} from clipboard`,
        });
      } else {
        toast({
          title: "No image found",
          description: "Clipboard doesn't contain an image. Copy an image first, then click Paste Image.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Handle permission denied or other errors
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast({
          title: "Permission denied",
          description: "Please allow clipboard access or use Ctrl+V / Cmd+V to paste.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "No image found",
          description: "Clipboard doesn't contain an image. Copy an image first, then click Paste Image.",
          variant: "destructive"
        });
      }
    }
  }, [onFashionImagesSelect, toast]);

  // Product URL extraction handlers
  const handleExtractProductFromUrl = useCallback(async () => {
    if (!productUrlValue.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a product page URL or direct image URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingProductUrl(true);
    setExtractedProduct(null);

    try {
      // Direct fetch call instead of apiClient method to work around module caching issue
      const response = await fetch('/api/fashion-items/fetch-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: productUrlValue.trim() }),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract product from URL');
      }

      if (result.success && result.product) {
        setExtractedProduct(result.product);
        toast({
          title: "Product extracted!",
          description: `Found: ${result.product.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to extract product:', error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Could not extract product from URL",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProductUrl(false);
    }
  }, [productUrlValue, toast]);

  const handleAddExtractedProduct = useCallback(() => {
    if (!extractedProduct) return;

    // Convert the extracted product image to a File and add to fashion items
    const file = dataUrlToFile(extractedProduct.imageDataUrl, `${extractedProduct.name.replace(/\s+/g, '-')}-${Date.now()}.jpg`);

    onFashionImagesSelect([file]);

    toast({
      title: "Product added!",
      description: `${extractedProduct.name} added to try-on items`,
    });

    // Reset modal state
    setShowProductUrlModal(false);
    setProductUrlValue('');
    setExtractedProduct(null);
  }, [extractedProduct, onFashionImagesSelect, toast]);

  const handleCloseProductModal = useCallback(() => {
    setShowProductUrlModal(false);
    setProductUrlValue('');
    setExtractedProduct(null);
    setIsLoadingProductUrl(false);
  }, []);

  // Save to collection handler
  const handleSaveToCollection = useCallback(async (index: number) => {
    const item = allFashionItems[index];
    if (!item || item.source !== 'upload') return;

    try {
      await apiClient.saveFashionItem(item.image, item.name, item.category);

      // Invalidate and refetch the fashion items cache
      queryClient.invalidateQueries({ queryKey: ["/api/fashion-items", user?.id] });

      toast({
        title: "Added to Collection!",
        description: `${item.name} has been added to your fashion collection.`,
      });
    } catch (error) {
      console.error('Failed to save to collection:', error);
      toast({
        title: "Save Failed",
        description: "Could not add the item to your collection. Please try again.",
        variant: "destructive",
      });
    }
  }, [allFashionItems, queryClient, user?.id, toast]);

  // Generation mutation
  const generateSimultaneousTryOnMutation = useMutation({
    mutationFn: async () => {
      const selectedItems = getSelectedFashionItems();

      if (!modelImage || selectedItems.length === 0) {
        throw new Error("Model image and at least one selected fashion item are required");
      }

      const fashionItemsWithImages: FashionItemInput[] = [];

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        let fashionImageFile = item.image;

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
      setShowStatusView(true);
      onGenerationProgress(0, fashionItems.length);

      try {
        const stepResults: string[] = [];
        let currentModelImage = modelImage!;

        for (let i = 0; i < fashionItems.length; i++) {
          const item = fashionItems[i];
          setCurrentGeneratingIndex(i);

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

          const stepImageUrl = stepResponse.resultImageUrl;
          stepResults.push(stepImageUrl);
          setResultImageUrls([...stepResults]);
          setCurrentViewingStep(stepResults.length - 1);

          if (i < fashionItems.length - 1) {
            const response = await fetch(stepImageUrl);
            const blob = await response.blob();
            currentModelImage = new File([blob], `step-${i + 1}-result.jpg`, { type: 'image/jpeg' });
          }

          onGenerationProgress(i + 1, fashionItems.length);
        }

        const finalImageBlob = await fetch(stepResults[stepResults.length - 1]).then(r => r.blob());
        const finalImageFile = new File([finalImageBlob], 'final-result.jpg', { type: 'image/jpeg' });

        const savedResult = await apiClient.generateProgressiveTryOn({
          modelImage: modelImage!,
          fashionItems: fashionItems,
          textPrompt: textPrompt.trim() || undefined
        });

        const finalResult = {
          id: savedResult.result?.id || `progressive-${Date.now()}`,
          createdAt: new Date(),
          userId: user?.id || null,
          modelImageUrl: savedResult.result?.modelImageUrl || URL.createObjectURL(modelImage!),
          fashionImageUrl: savedResult.result?.fashionImageUrl || stepResults[stepResults.length - 1],
          resultImageUrl: savedResult.result?.resultImageUrl || stepResults[stepResults.length - 1],
          fashionItemName: savedResult.result?.fashionItemName || fashionItems.map(item => item.name).join(' + '),
          fashionCategory: savedResult.result?.fashionCategory || fashionItems.map(item => item.category).join(', '),
          metadata: {
            ...(savedResult.result?.metadata || {}),
            timestamp: new Date().toISOString(),
            generationType: 'progressive-step-by-step',
            stepResults: stepResults,
            textPrompt: textPrompt.trim() || undefined,
            fashionItems: fashionItems.map(item => ({
              name: item.name,
              category: item.category,
              source: item.source
            }))
          }
        };

        onResultsGenerated([finalResult]);
        setCurrentViewingStep(stepResults.length - 1);

        toast({
          title: "Try-on complete!",
          description: `Successfully applied ${fashionItems.length} fashion item${fashionItems.length > 1 ? 's' : ''}.`,
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
    setShowStatusView(false);
    generateSimultaneousTryOnMutation.mutate();
  };

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

  const hasSelectedItems = selectedItemsCount > 0;

  return (
    <section className="mb-16">
      {/* Collection Browser Modal */}
      <Dialog open={showCollectionBrowser} onOpenChange={setShowCollectionBrowser}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle>Browse Collection</DialogTitle>
          </DialogHeader>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 p-4 border-b border-border">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="rounded-full"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Collection grid */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCollection.map((item) => {
                const isSelected = selectedFashionItems.some(s => s.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => {
                      onFashionItemSelect(item);
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 bg-background/80 backdrop-blur-sm">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredCollection.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No items in this category</p>
            )}
          </div>

          <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCollectionBrowser(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product URL Extraction Modal */}
      <Dialog open={showProductUrlModal} onOpenChange={handleCloseProductModal}>
        <DialogContent className="max-w-md sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Add Fashion Item from URL
            </DialogTitle>
            <DialogDescription className="text-sm">
              Paste a product page URL (Amazon, Zara, etc.) or a direct image link. AI will extract the product details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Product or Image URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://amazon.com/product/... or https://example.com/image.jpg"
                  value={productUrlValue}
                  onChange={(e) => setProductUrlValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoadingProductUrl && handleExtractProductFromUrl()}
                  disabled={isLoadingProductUrl}
                  className="flex-1"
                />
                <Button
                  onClick={handleExtractProductFromUrl}
                  disabled={isLoadingProductUrl || !productUrlValue.trim()}
                >
                  {isLoadingProductUrl ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Extract'
                  )}
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingProductUrl && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Analyzing webpage...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
              </div>
            )}

            {/* Extracted Product Preview */}
            {extractedProduct && !isLoadingProductUrl && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                {/* Product Header with Image */}
                <div className="flex gap-4">
                  <img
                    src={extractedProduct.imageDataUrl}
                    alt={extractedProduct.name}
                    className="w-20 h-20 object-cover rounded-lg border border-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{extractedProduct.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{extractedProduct.category}</p>
                    {extractedProduct.price && (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                        {extractedProduct.price.currency} {extractedProduct.price.amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description - truncated */}
                {extractedProduct.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {extractedProduct.description}
                  </p>
                )}

                {/* Specifications */}
                {Object.keys(extractedProduct.specifications || {}).length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Specifications</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(extractedProduct.specifications)
                        .filter(([_, value]) => value)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-0.5 bg-muted rounded-md border border-border"
                          >
                            {key}: {value}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Source URL - properly truncated */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <a
                    href={extractedProduct.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-primary hover:underline max-w-full"
                  >
                    {new URL(extractedProduct.sourceUrl).hostname + new URL(extractedProduct.sourceUrl).pathname.slice(0, 40) + '...'}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCloseProductModal}>
              Cancel
            </Button>
            {extractedProduct && (
              <Button onClick={handleAddExtractedProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Try-On
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-gray-900 [.dashboard-light_&]:bg-gray-100 rounded-2xl p-6 border border-white/10 [.dashboard-light_&]:border-gray-300">
        {/* Main workspace layout */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Model Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Model Photo
            </h3>

            <input
              ref={modelInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleModelFileSelect}
            />

            <div
              className={`relative h-[400px] rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                modelDragActive
                  ? 'border-primary bg-primary/5'
                  : modelImageUrl
                    ? 'border-white/20 [.dashboard-light_&]:border-gray-300 bg-white/5 [.dashboard-light_&]:bg-gray-200/50'
                    : 'border-white/20 [.dashboard-light_&]:border-gray-300 hover:border-primary/50 bg-white/5 [.dashboard-light_&]:bg-gray-200/50'
              }`}
              onDragEnter={handleModelDrag}
              onDragLeave={handleModelDrag}
              onDragOver={handleModelDrag}
              onDrop={handleModelDrop}
              onClick={!modelImageUrl && !showModelUrlInput ? handleModelClick : undefined}
            >
              {modelImageUrl ? (
                <>
                  <img
                    src={modelImageUrl}
                    alt="Model photo"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-400" />
                        Model Ready
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeModel();
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </>
              ) : showModelUrlInput ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Link className="h-8 w-8 text-white/70 [.dashboard-light_&]:text-gray-600" />
                  </div>
                  <h4 className="font-medium text-white [.dashboard-light_&]:text-gray-900 mb-4">Enter Image URL</h4>
                  <div className="w-full max-w-sm space-y-3">
                    <Input
                      placeholder="https://example.com/photo.jpg"
                      value={modelUrlValue}
                      onChange={(e) => setModelUrlValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchModelFromUrl()}
                      className="bg-white/10 [.dashboard-light_&]:bg-white border-white/20 [.dashboard-light_&]:border-gray-300 text-white [.dashboard-light_&]:text-gray-900 placeholder:text-white/40 [.dashboard-light_&]:placeholder:text-gray-400"
                      disabled={isLoadingModelUrl}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowModelUrlInput(false);
                          setModelUrlValue('');
                        }}
                        className="flex-1 border-white/20 [.dashboard-light_&]:border-gray-300 text-white [.dashboard-light_&]:text-gray-700"
                        disabled={isLoadingModelUrl}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleFetchModelFromUrl}
                        className="flex-1 bg-primary text-primary-foreground"
                        disabled={isLoadingModelUrl || !modelUrlValue.trim()}
                      >
                        {isLoadingModelUrl ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Fetch Image
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 [.dashboard-light_&]:text-gray-400 mt-4">Paste a direct link to any image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-white/70 [.dashboard-light_&]:text-gray-600" />
                  </div>
                  <h4 className="font-medium text-white [.dashboard-light_&]:text-gray-900 mb-2">Drop your photo here</h4>
                  <p className="text-sm text-white/60 [.dashboard-light_&]:text-gray-500 mb-4">or click to browse</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-white [.dashboard-light_&]:bg-gray-900 text-gray-900 [.dashboard-light_&]:text-white hover:bg-white/90 [.dashboard-light_&]:hover:bg-gray-800">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Photo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowModelUrlInput(true);
                      }}
                      className="border-white/20 [.dashboard-light_&]:border-gray-300 text-white [.dashboard-light_&]:text-gray-700 hover:bg-white/10 [.dashboard-light_&]:hover:bg-gray-100"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Use URL
                    </Button>
                  </div>
                  <p className="text-xs text-white/40 [.dashboard-light_&]:text-gray-400 mt-3">JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Fashion Items */}
          <div className="space-y-4" ref={fashionUploadRef} tabIndex={0}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white [.dashboard-light_&]:text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Fashion Items
                {allFashionItems.length > 0 && (
                  <span className="text-sm text-white/60 [.dashboard-light_&]:text-gray-500">({allFashionItems.length})</span>
                )}
              </h3>
            </div>

            <input
              ref={fashionInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFashionFileSelect}
            />

            <div className={`h-[400px] rounded-xl border-2 border-dashed transition-all overflow-hidden ${
              fashionDragActive ? 'border-accent bg-accent/5' : 'border-white/20 [.dashboard-light_&]:border-gray-300 bg-white/5 [.dashboard-light_&]:bg-gray-200/50'
            }`}>
              {/* Add buttons bar */}
              <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/10 [.dashboard-light_&]:border-gray-300 bg-white/5 [.dashboard-light_&]:bg-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFashionClick}
                  className="border-white/20 [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:bg-white text-white [.dashboard-light_&]:text-gray-700 hover:bg-white/10 [.dashboard-light_&]:hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePasteFromClipboard}
                  className="border-white/20 [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:bg-white text-white [.dashboard-light_&]:text-gray-700 hover:bg-white/10 [.dashboard-light_&]:hover:bg-gray-100"
                >
                  <ClipboardPaste className="h-4 w-4 mr-1" />
                  Paste Image
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProductUrlModal(true)}
                  className="border-white/20 [.dashboard-light_&]:border-gray-300 [.dashboard-light_&]:bg-white text-white [.dashboard-light_&]:text-gray-700 hover:bg-white/10 [.dashboard-light_&]:hover:bg-gray-100"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  From URL
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowCollectionBrowser(true)}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Collection
                </Button>
              </div>

              {/* Fashion items list or drop zone */}
              <div
                className="h-[calc(100%-52px)] overflow-y-auto"
                onDragEnter={handleFashionDrag}
                onDragLeave={handleFashionDrag}
                onDragOver={handleFashionDrag}
                onDrop={handleFashionDrop}
              >
                {allFashionItems.length > 0 ? (
                  <div className="p-3 space-y-2">
                    {allFashionItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white/5 [.dashboard-light_&]:bg-white rounded-lg border border-white/10 [.dashboard-light_&]:border-gray-200 hover:border-primary/50 transition-all group"
                      >
                        <img
                          src={item.source === 'upload' ?
                            URL.createObjectURL(item.image) :
                            item.source === 'collection' && selectedFashionItems[index] ?
                              selectedFashionItems[index].imageUrl :
                              '/placeholder-fashion.jpg'
                          }
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white [.dashboard-light_&]:text-gray-900 text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-white/60 [.dashboard-light_&]:text-gray-500">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Add to Collection button - only for uploaded items */}
                          {item.source === 'upload' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveToCollection(index)}
                              className="h-7 px-2 text-xs bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 [.dashboard-dark_&]:from-pink-500/20 [.dashboard-dark_&]:via-purple-500/20 [.dashboard-dark_&]:to-indigo-500/20 text-purple-600 [.dashboard-dark_&]:text-purple-300 border border-purple-200/50 [.dashboard-dark_&]:border-purple-500/30 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-indigo-500/30 hover:border-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] hover:scale-105 transition-all duration-200 flex items-center gap-1.5 rounded-full"
                              title="Add to Collection"
                            >
                              <BookmarkPlus className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Add to Collection</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onItemRemove(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-accent" />
                    </div>
                    <p className="text-sm text-white/60 [.dashboard-light_&]:text-gray-600 mb-1">No fashion items yet</p>
                    <p className="text-xs text-white/40 [.dashboard-light_&]:text-gray-400">Upload, paste, or browse collection</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Creative Control */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-indigo-500/10 [.dashboard-dark_&]:from-purple-500/20 [.dashboard-dark_&]:via-pink-500/10 [.dashboard-dark_&]:to-indigo-500/20 border border-purple-300/30 [.dashboard-dark_&]:border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-purple-600 [.dashboard-dark_&]:text-purple-400" />
              <h4 className="text-sm font-semibold text-gray-800 [.dashboard-dark_&]:text-white">Creative Control</h4>
              <span className="text-xs text-purple-600 [.dashboard-dark_&]:text-purple-300 bg-purple-100 [.dashboard-dark_&]:bg-purple-900/50 px-2 py-0.5 rounded-full font-medium">Optional</span>
            </div>
            <textarea
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="e.g. Change pose to casual sitting, add elegant studio lighting, outdoor background..."
              className="w-full p-3 border border-purple-200 [.dashboard-dark_&]:border-purple-700/50 rounded-lg bg-white [.dashboard-dark_&]:bg-gray-900/90 text-gray-800 [.dashboard-dark_&]:text-gray-100 placeholder:text-gray-400 [.dashboard-dark_&]:placeholder:text-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 [.dashboard-dark_&]:focus:border-purple-500 transition-all"
              rows={2}
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500 [.dashboard-dark_&]:text-gray-400">{textPrompt.length}/500</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-8 py-3 font-semibold hover:opacity-90 shadow-lg"
            onClick={handleGenerate}
            disabled={!modelImage || selectedItemsCount === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating magic {generationProgress.completed}/{generationProgress.total}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Mirror.me
              </>
            )}
          </Button>
        </div>

        {/* Results Area */}
        {(isGenerating || resultImageUrls.length > 0 || showStatusView) && (
          <div className="border-t border-gray-200 [.dashboard-dark_&]:border-white/10 pt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Progress/Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 [.dashboard-dark_&]:text-white">
                  {isGenerating ? "Crafting Your New Look..." : "Looking Fabulous!"}
                </h3>

                <div className="space-y-2">
                  {allFashionItems.map((item, index) => {
                    const isCompleted = showStatusView && !isGenerating ? true : index < generationProgress.completed;
                    const isProcessing = isGenerating && index === currentGeneratingIndex;

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          isCompleted ? 'bg-green-50 [.dashboard-dark_&]:bg-green-900/20 border-green-200 [.dashboard-dark_&]:border-green-800' :
                          isProcessing ? 'bg-blue-50 [.dashboard-dark_&]:bg-blue-900/20 border-blue-200 [.dashboard-dark_&]:border-blue-800 animate-pulse' :
                          'bg-gray-100 [.dashboard-dark_&]:bg-white/5 border-gray-200 [.dashboard-dark_&]:border-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-green-500' :
                          isProcessing ? 'bg-blue-500' :
                          'bg-muted-foreground/30'
                        }`}>
                          {isCompleted ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : isProcessing ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4 text-white" />
                          )}
                        </div>

                        <img
                          src={item.source === 'upload' ?
                            URL.createObjectURL(item.image) :
                            item.source === 'collection' && selectedFashionItems[index] ?
                              selectedFashionItems[index].imageUrl :
                              '/placeholder-fashion.jpg'
                          }
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-gray-900 [.dashboard-dark_&]:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500 [.dashboard-dark_&]:text-gray-400">{item.category}</p>
                        </div>

                        <span className={`text-xs font-medium ${
                          isCompleted ? 'text-green-600 [.dashboard-dark_&]:text-green-400' :
                          isProcessing ? 'text-blue-600 [.dashboard-dark_&]:text-blue-400' :
                          'text-gray-500 [.dashboard-dark_&]:text-gray-400'
                        }`}>
                          {isCompleted ? 'Applied' : isProcessing ? 'Processing' : 'Waiting'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="w-full h-2 bg-gray-200 [.dashboard-dark_&]:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-300"
                      style={{
                        width: generationProgress.total > 0 ?
                          `${(generationProgress.completed / generationProgress.total) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 [.dashboard-dark_&]:text-gray-400 text-center">
                    {isGenerating ? "Hold tight, magic is happening..." : "You're going to love this!"}
                  </p>
                </div>
              </div>

              {/* Result Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 [.dashboard-dark_&]:text-white">Result Preview</h3>

                <div className="relative h-[350px] bg-gray-200 [.dashboard-dark_&]:bg-gray-800 rounded-xl overflow-hidden">
                  {resultImageUrls.length > 0 ? (
                    <>
                      <img
                        src={resultImageUrls[currentViewingStep]}
                        alt={`Step ${currentViewingStep + 1} result`}
                        className="w-full h-full object-contain"
                      />

                      {resultImageUrls.length > 1 && (
                        <>
                          <button
                            onClick={goToPreviousStep}
                            disabled={currentViewingStep === 0}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full disabled:opacity-30 transition-all"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={goToNextStep}
                            disabled={currentViewingStep === resultImageUrls.length - 1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full disabled:opacity-30 transition-all"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {resultImageUrls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentViewingStep(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentViewingStep ? 'bg-primary' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Sparkles className="h-8 w-8 text-gray-400 [.dashboard-dark_&]:text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500 [.dashboard-dark_&]:text-gray-400">Result will appear here</p>
                    </div>
                  )}
                </div>

                {resultImageUrls.length > 0 && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleDownloadFinal}
                      className="px-6"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Final Result
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
