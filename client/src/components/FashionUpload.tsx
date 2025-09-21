import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface FashionUploadProps {
  onImagesSelect: (files: File[]) => void;
  selectedImages: File[];
  onBrowseCollection: () => void;
}

export default function FashionUpload({ onImagesSelect, selectedImages, onBrowseCollection }: FashionUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [itemNames, setItemNames] = useState<string[]>([]);
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [analyzingItems, setAnalyzingItems] = useState<boolean[]>([]);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileSelect = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onImagesSelect(imageFiles);
      const urls = imageFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      
      // Initialize arrays for the new files
      const initialNames = imageFiles.map(file => file.name.split('.')[0]);
      const initialCategories = imageFiles.map(() => 'Analyzing...');
      const analyzingStates = imageFiles.map(() => true);
      
      setItemNames(initialNames);
      setItemCategories(initialCategories);
      setAnalyzingItems(analyzingStates);
      
      // Analyze each image with AI
      imageFiles.forEach(async (file, index) => {
        try {
          const analysis = await apiClient.analyzeFashionImage(file);
          
          // Update the specific item's data
          setItemNames(prev => {
            const newNames = [...prev];
            newNames[index] = analysis.name;
            return newNames;
          });
          
          setItemCategories(prev => {
            const newCategories = [...prev];
            newCategories[index] = analysis.category;
            return newCategories;
          });
          
          setAnalyzingItems(prev => {
            const newAnalyzing = [...prev];
            newAnalyzing[index] = false;
            return newAnalyzing;
          });
          
        } catch (error) {
          console.error('Failed to analyze image:', error);
          
          // Set fallback values on error
          setItemCategories(prev => {
            const newCategories = [...prev];
            newCategories[index] = 'Fashion Item';
            return newCategories;
          });
          
          setAnalyzingItems(prev => {
            const newAnalyzing = [...prev];
            newAnalyzing[index] = false;
            return newAnalyzing;
          });
        }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChangeItems = () => {
    setPreviewUrls([]);
    setItemNames([]);
    setItemCategories([]);
    setAnalyzingItems([]);
    onImagesSelect([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemoveItem = (index: number) => {
    const newUrls = previewUrls.filter((_, i) => i !== index);
    const newNames = itemNames.filter((_, i) => i !== index);
    const newCategories = itemCategories.filter((_, i) => i !== index);
    const newAnalyzing = analyzingItems.filter((_, i) => i !== index);
    const newFiles = selectedImages.filter((_, i) => i !== index);
    
    setPreviewUrls(newUrls);
    setItemNames(newNames);
    setItemCategories(newCategories);
    setAnalyzingItems(newAnalyzing);
    onImagesSelect(newFiles);
  };

  const handleSaveToCollection = async (index: number) => {
    try {
      const file = selectedImages[index];
      const name = itemNames[index];
      const category = itemCategories[index];
      
      await apiClient.saveFashionItem(file, name, category);
      
      // Invalidate and refetch the fashion items cache to show the new item immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/fashion-items"] });
      
      toast({
        title: "Saved to Collection!",
        description: `${name} has been added to your browsable fashion collection.`,
      });
      
    } catch (error) {
      console.error('Failed to save to collection:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the item to your collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasteButton = useCallback(async () => {
    try {
      // First try to request clipboard permissions
      const permission = await navigator.permissions.query({name: 'clipboard-read' as PermissionName});
      
      if (permission.state === 'denied') {
        toast({
          title: "Clipboard access denied",
          description: "Copy an image and use Ctrl+V to paste instead",
          variant: "destructive"
        });
        return;
      }
      
      // Try to read from clipboard
      if (!navigator.clipboard?.read) {
        throw new Error('Clipboard API not supported');
      }
      
      const clipboardData = await navigator.clipboard.read();
      const imageFiles: File[] = [];
      
      for (const item of clipboardData) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const timestamp = Date.now();
            const extension = type.split('/')[1] || 'png';
            const file = new File([blob], `pasted-fashion-${timestamp}.${extension}`, {
              type: type
            });
            imageFiles.push(file);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        // Add to existing images
        const existingFiles = selectedImages || [];
        const allFiles = [...existingFiles, ...imageFiles];
        
        onImagesSelect(allFiles);
        
        // Update preview URLs
        const existingUrls = previewUrls || [];
        const newUrls = imageFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls([...existingUrls, ...newUrls]);
        
        // Update item names
        const existingNames = itemNames || [];
        const newNames = imageFiles.map(file => file.name.split('.')[0]);
        setItemNames([...existingNames, ...newNames]);
        
        toast({
          title: "Fashion item pasted!",
          description: `Added ${imageFiles.length} fashion item${imageFiles.length > 1 ? 's' : ''} from clipboard`,
        });
      } else {
        toast({
          title: "No image found",
          description: "Please copy an image to your clipboard first",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Use Ctrl+V instead",
        description: "Copy an image and press Ctrl+V (or Cmd+V on Mac) to paste",
      });
    }
  }, [selectedImages, previewUrls, itemNames, onImagesSelect, toast, setPreviewUrls, setItemNames]);

  const handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if the item is an image
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Create a proper filename for the pasted image
          const timestamp = Date.now();
          const extension = item.type.split('/')[1] || 'png';
          const pastedFile = new File([file], `pasted-fashion-${timestamp}.${extension}`, {
            type: item.type
          });
          imageFiles.push(pastedFile);
        }
      }
    }
    
    if (imageFiles.length > 0) {
      // Add to existing images instead of replacing
      const existingFiles = selectedImages || [];
      const allFiles = [...existingFiles, ...imageFiles];
      
      onImagesSelect(allFiles);
      
      // Update preview URLs
      const existingUrls = previewUrls || [];
      const newUrls = imageFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls([...existingUrls, ...newUrls]);
      
      // Update item names
      const existingNames = itemNames || [];
      const newNames = imageFiles.map(file => file.name.split('.')[0]);
      setItemNames([...existingNames, ...newNames]);
      
      toast({
        title: "Fashion item pasted!",
        description: `Added ${imageFiles.length} fashion item${imageFiles.length > 1 ? 's' : ''} from clipboard`,
      });
    } else {
      toast({
        title: "No image found",
        description: "Please copy an image to your clipboard first",
        variant: "destructive"
      });
    }
  };

  // Set up paste event listener
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check for Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Only handle paste if we're not in an input field
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          // Trigger the paste functionality
          await handlePasteButton();
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImages, previewUrls, itemNames, handlePasteButton]); // Added handlePasteButton to dependencies

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">Choose Fashion Item</h2>
        <p className="text-muted-foreground">Upload a garment or accessory to try on</p>
      </div>
      
      {previewUrls.length === 0 ? (
        <div
          className={`upload-zone rounded-xl p-8 text-center cursor-pointer ${
            dragActive ? 'border-accent bg-accent/5' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          data-testid="upload-zone-fashion"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            data-testid="input-fashion-image"
          />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-tshirt text-accent text-2xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">Drop fashion items here</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload multiple items, paste with Ctrl+V, or browse our curated collection</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="bg-primary text-primary-foreground hover:opacity-90" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  data-testid="button-upload-fashion"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload Files
                </Button>
                
                <Button 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteButton();
                  }}
                  data-testid="button-paste-fashion"
                >
                  <i className="fas fa-paste mr-2"></i>
                  Paste Image
                </Button>
                
                <Button 
                  className="bg-accent text-accent-foreground hover:opacity-90" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onBrowseCollection();
                  }}
                  data-testid="button-browse-collection"
                >
                  <i className="fas fa-store mr-2"></i>
                  Browse Collection
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Supports multiple images, clothing, accessories, shoes</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground/80">
              <i className="fas fa-keyboard"></i>
              <span>Or press Ctrl+V (Cmd+V) to paste images</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {previewUrls.length} Fashion Item{previewUrls.length > 1 ? 's' : ''} Selected
            </span>
            <Button 
              variant="link" 
              className="text-accent hover:text-accent/80 text-sm p-0"
              onClick={handleChangeItems}
              data-testid="button-change-items"
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto">
            {previewUrls.map((url, index) => (
              <div 
                key={index} 
                className="image-preview rounded-lg p-3 relative group" 
                data-testid={`fashion-preview-${index}`}
                onMouseEnter={() => setHoveredItemIndex(index)}
                onMouseLeave={() => setHoveredItemIndex(null)}
              >
                <img 
                  src={url} 
                  alt={`Fashion item ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg cursor-pointer"
                  data-testid={`img-fashion-preview-${index}`}
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  data-testid={`button-remove-item-${index}`}
                >
                  ×
                </button>
                <div className="mt-2 space-y-1">
                  <span className="text-xs font-medium text-foreground truncate block" data-testid={`text-fashion-name-${index}`}>
                    {analyzingItems[index] ? (
                      <span className="flex items-center gap-1">
                        <i className="fas fa-sparkles animate-pulse text-primary"></i>
                        AI Analyzing...
                      </span>
                    ) : (
                      itemNames[index] || `Item ${index + 1}`
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {itemCategories[index] || 'Unknown Category'}
                  </span>
                  {!analyzingItems[index] && itemCategories[index] && itemCategories[index] !== 'Unknown Category' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToCollection(index);
                      }}
                      data-testid={`button-save-collection-${index}`}
                    >
                      <i className="fas fa-plus mr-1 text-[10px]"></i>
                      Add to Collection
                    </Button>
                  )}
                </div>
                
                {/* Hover Flyout */}
                {hoveredItemIndex === index && (
                  <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm mx-4">
                      <img 
                        src={url} 
                        alt={`Fashion item ${index + 1} - Full view`}
                        className="w-full max-h-80 object-contain rounded-lg"
                        data-testid={`img-fashion-flyout-${index}`}
                      />
                      <div className="mt-3 text-center">
                        <span className="text-sm font-medium text-gray-800 block">
                          {itemNames[index] || `Item ${index + 1}`}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 block">
                          Hover to view full image
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
