import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ModelUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
}

export default function ModelUpload({ onImageSelect, selectedImage }: ModelUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      onImageSelect(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChangePhoto = () => {
    setPreviewUrl(null);
    onImageSelect(null as any);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">Upload Your Photo</h2>
        <p className="text-muted-foreground">Upload a clear photo of yourself for the best try-on results</p>
      </div>
      
      {!previewUrl ? (
        <div
          className={`upload-zone rounded-xl p-8 text-center cursor-pointer ${
            dragActive ? 'border-primary bg-primary/5' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          data-testid="upload-zone-model"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleInputChange}
            data-testid="input-model-image"
          />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-user text-primary text-2xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">Drop your photo here</h3>
              <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
              <Button className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-choose-file-model">
                Choose File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Supports JPG, PNG up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="image-preview rounded-xl p-6" data-testid="model-preview">
          <img 
            src={previewUrl} 
            alt="Model preview" 
            className="w-full h-80 object-contain rounded-lg"
            data-testid="img-model-preview"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground" data-testid="text-model-ready">Model Ready</span>
            <Button 
              variant="link" 
              className="text-primary hover:text-primary/80 text-sm p-0"
              onClick={handleChangePhoto}
              data-testid="button-change-photo"
            >
              Change Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
