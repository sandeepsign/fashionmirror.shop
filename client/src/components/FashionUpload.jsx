import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
export default function FashionUpload({ onImagesSelect, selectedImages, onBrowseCollection }) {
    const [dragActive, setDragActive] = useState(false);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [itemNames, setItemNames] = useState([]);
    const [itemCategories, setItemCategories] = useState([]);
    const [analyzingItems, setAnalyzingItems] = useState([]);
    const [hoveredItemIndex, setHoveredItemIndex] = useState(null);
    const inputRef = useRef(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        }
        else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
    };
    // Unified function to add images from any source (file selection, paste, drag & drop)
    const addImages = useCallback(async (newFiles) => {
        const imageFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            toast({
                title: "No images found",
                description: "Please select or paste valid image files",
                variant: "destructive"
            });
            return;
        }
        // Add to existing images
        const existingFiles = selectedImages || [];
        const allFiles = [...existingFiles, ...imageFiles];
        const startIndex = existingFiles.length;
        // Update all states
        onImagesSelect(allFiles);
        // Add new preview URLs
        const existingUrls = previewUrls || [];
        const newUrls = imageFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls([...existingUrls, ...newUrls]);
        // Add initial names and categories
        const existingNames = itemNames || [];
        const newNames = imageFiles.map(file => file.name.split('.')[0]);
        setItemNames([...existingNames, ...newNames]);
        const existingCategories = itemCategories || [];
        const newCategories = imageFiles.map(() => 'Analyzing...');
        setItemCategories([...existingCategories, ...newCategories]);
        const existingAnalyzing = analyzingItems || [];
        const newAnalyzing = imageFiles.map(() => true);
        setAnalyzingItems([...existingAnalyzing, ...newAnalyzing]);
        // Show success toast
        toast({
            title: "Images added!",
            description: `Added ${imageFiles.length} fashion item${imageFiles.length > 1 ? 's' : ''} for analysis`,
        });
        // Analyze each new image with AI
        imageFiles.forEach(async (file, relativeIndex) => {
            const absoluteIndex = startIndex + relativeIndex;
            try {
                const analysis = await apiClient.analyzeFashionImage(file);
                // Update the specific item's data
                setItemNames(prev => {
                    const newNames = [...prev];
                    newNames[absoluteIndex] = analysis.name;
                    return newNames;
                });
                setItemCategories(prev => {
                    const newCategories = [...prev];
                    newCategories[absoluteIndex] = analysis.category;
                    return newCategories;
                });
                setAnalyzingItems(prev => {
                    const newAnalyzing = [...prev];
                    newAnalyzing[absoluteIndex] = false;
                    return newAnalyzing;
                });
            }
            catch (error) {
                console.error('Failed to analyze image:', error);
                // Set fallback values on error
                setItemCategories(prev => {
                    const newCategories = [...prev];
                    newCategories[absoluteIndex] = 'Fashion Item';
                    return newCategories;
                });
                setAnalyzingItems(prev => {
                    const newAnalyzing = [...prev];
                    newAnalyzing[absoluteIndex] = false;
                    return newAnalyzing;
                });
            }
        });
    }, [selectedImages, previewUrls, itemNames, itemCategories, analyzingItems, onImagesSelect, toast]);
    const handleFileSelect = async (files) => {
        await addImages(Array.from(files));
    };
    const handleInputChange = (e) => {
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
    const handleRemoveItem = (index) => {
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
    const handleSaveToCollection = async (index) => {
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
        }
        catch (error) {
            console.error('Failed to save to collection:', error);
            toast({
                title: "Save Failed",
                description: "Could not save the item to your collection. Please try again.",
                variant: "destructive",
            });
        }
    };
    // State for paste UI feedback
    const [showPastePrompt, setShowPastePrompt] = useState(false);
    const pasteAreaRef = useRef(null);
    // Handle paste button click - show focused paste area
    const handlePasteButton = useCallback(() => {
        setShowPastePrompt(true);
        // Focus the paste area so Ctrl+V works
        setTimeout(() => {
            pasteAreaRef.current?.focus();
        }, 100);
        // Auto-hide after 10 seconds if no paste occurs
        setTimeout(() => {
            setShowPastePrompt(false);
        }, 10000);
    }, []);
    // Handle paste events (from Ctrl+V or right-click paste)
    const handlePaste = useCallback((e) => {
        // Check if we're in a text input - if so, don't interfere
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true') && activeElement !== pasteAreaRef.current) {
            return; // Let normal text paste work
        }
        e.preventDefault();
        setShowPastePrompt(false); // Hide prompt once paste is attempted
        const items = e.clipboardData?.items;
        if (!items) {
            toast({
                title: "Paste failed",
                description: "Please copy an image first, then try again",
                variant: "destructive"
            });
            return;
        }
        const imageFiles = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
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
            addImages(imageFiles);
        }
        else {
            toast({
                title: "No image found",
                description: "Please copy an image to your clipboard first",
                variant: "destructive"
            });
        }
    }, [addImages, toast]);
    // Set up component-scoped paste event listener
    const uploadContainerRef = useRef(null);
    useEffect(() => {
        const uploadContainer = uploadContainerRef.current;
        if (!uploadContainer)
            return;
        // Add paste listener to the upload container
        uploadContainer.addEventListener('paste', handlePaste);
        return () => {
            uploadContainer.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);
    return (<div ref={uploadContainerRef} className="space-y-6" tabIndex={0}>
      <div className="text-center">
        <h2 className="text-2xl font-serif font-semibold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 mb-2">Choose Fashion Item</h2>
        <p className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-600">Upload a garment or accessory to try on</p>
      </div>
      
      {/* Paste prompt overlay */}
      {showPastePrompt && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div ref={pasteAreaRef} className="bg-background border border-accent rounded-lg p-8 text-center max-w-md mx-4" tabIndex={0}>
            <div className="space-y-4">
              <div className="text-2xl">📋</div>
              <h3 className="text-lg font-semibold">Paste Your Image</h3>
              <p className="text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+V</kbd> or{' '}
                <kbd className="px-2 py-1 bg-muted rounded text-sm">Cmd+V</kbd> to paste your image
              </p>
              <Button variant="outline" onClick={() => setShowPastePrompt(false)} className="mt-4">
                Cancel
              </Button>
            </div>
          </div>
        </div>)}
      
      {previewUrls.length === 0 ? (<div className={`upload-zone rounded-xl p-8 text-center cursor-pointer [.dashboard-dark_&]:border-white/20 [.dashboard-light_&]:border-gray-300 border-2 border-dashed [.dashboard-dark_&]:bg-black/20 [.dashboard-light_&]:bg-gray-50 ${dragActive ? 'border-primary bg-primary/5' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={handleClick} data-testid="upload-zone-fashion">
          <input ref={inputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleInputChange} data-testid="input-fashion-image"/>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-tshirt text-primary text-2xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 mb-2">Drop fashion items here</h3>
              <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500 mb-4">Upload multiple items, paste with Ctrl+V, or browse our curated collection</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={(e) => {
                e.stopPropagation();
                handleClick();
            }} data-testid="button-upload-fashion">
                  <i className="fas fa-upload mr-2"></i>
                  Upload Files
                </Button>
                
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={(e) => {
                e.stopPropagation();
                handlePasteButton();
            }} data-testid="button-paste-fashion">
                  <i className="fas fa-paste mr-2"></i>
                  Paste Image
                </Button>
                
                <Button className="bg-accent text-accent-foreground hover:opacity-90" onClick={(e) => {
                e.stopPropagation();
                onBrowseCollection();
            }} data-testid="button-browse-collection">
                  <i className="fas fa-store mr-2"></i>
                  Browse Collection
                </Button>
              </div>
            </div>
            <p className="text-xs [.dashboard-dark_&]:text-white/50 [.dashboard-light_&]:text-gray-400">Supports multiple images, clothing, accessories, shoes</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">
              <i className="fas fa-keyboard"></i>
              <span>Or press Ctrl+V (Cmd+V) to paste images</span>
            </div>
          </div>
        </div>) : (<div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">
              {previewUrls.length} Fashion Item{previewUrls.length > 1 ? 's' : ''} Selected
            </span>
            <Button variant="link" className="text-primary hover:text-primary/80 text-sm p-0" onClick={handleChangeItems} data-testid="button-change-items">
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto">
            {previewUrls.map((url, index) => (<div key={index} className="image-preview rounded-lg p-3 relative group [.dashboard-dark_&]:bg-black/30 [.dashboard-light_&]:bg-gray-100 border [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:border-gray-200" data-testid={`fashion-preview-${index}`} onMouseEnter={() => setHoveredItemIndex(index)} onMouseLeave={() => setHoveredItemIndex(null)}>
                <img src={url} alt={`Fashion item ${index + 1}`} className="w-full h-32 object-cover rounded-lg cursor-pointer" data-testid={`img-fashion-preview-${index}`}/>
                <button onClick={() => handleRemoveItem(index)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20" data-testid={`button-remove-item-${index}`}>
                  ×
                </button>
                <div className="mt-2 space-y-1">
                  <span className="text-xs font-medium [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 truncate block" data-testid={`text-fashion-name-${index}`}>
                    {analyzingItems[index] ? (<span className="flex items-center gap-1">
                        <i className="fas fa-sparkles animate-pulse text-primary"></i>
                        AI Analyzing...
                      </span>) : (itemNames[index] || `Item ${index + 1}`)}
                  </span>
                  <span className="text-xs [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500 block">
                    {itemCategories[index] || 'Unknown Category'}
                  </span>
                  {!analyzingItems[index] && itemCategories[index] && itemCategories[index] !== 'Unknown Category' && (<Button variant="ghost" size="sm" className="h-6 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-0" onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToCollection(index);
                    }} data-testid={`button-save-collection-${index}`}>
                      <i className="fas fa-plus mr-1 text-[10px]"></i>
                      Add to Collection
                    </Button>)}
                </div>
                
                {/* Hover Flyout */}
                {hoveredItemIndex === index && (<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm mx-4">
                      <img src={url} alt={`Fashion item ${index + 1} - Full view`} className="w-full max-h-80 object-contain rounded-lg" data-testid={`img-fashion-flyout-${index}`}/>
                      <div className="mt-3 text-center">
                        <span className="text-sm font-medium text-gray-800 block">
                          {itemNames[index] || `Item ${index + 1}`}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 block">
                          Hover to view full image
                        </span>
                      </div>
                    </div>
                  </div>)}
              </div>))}
          </div>
        </div>)}
    </div>);
}
