import { TryOnResult, FashionItem } from "@shared/schema";

console.log('[API] api.ts module loading - VERSION 3 - with fetchModelImageFromUrl and fetchProductFromUrl');

export interface FashionItemInput {
  image: File;
  name: string;
  category: string;
  source: 'upload' | 'collection';
  collectionId?: string;
}

export interface GenerateTryOnRequest {
  modelImage: File;
  fashionImage: File;
  fashionItemName: string;
  fashionCategory: string;
  textPrompt?: string;
}

export interface GenerateBatchTryOnRequest {
  modelImage: File;
  fashionItems: FashionItemInput[];
  textPrompt?: string;
}

export interface BatchTryOnResult {
  success: boolean;
  results?: TryOnResult[];
  processing?: boolean;
  completed?: number;
  total?: number;
  error?: string;
}

export interface GenerateTryOnResponse {
  success: boolean;
  result?: TryOnResult;
  error?: string;
}

export interface GenerateSimultaneousTryOnRequest {
  modelImage: File;
  fashionItems: FashionItemInput[];
  textPrompt?: string;
}

export interface SimultaneousTryOnResult {
  success: boolean;
  result?: TryOnResult;
  error?: string;
  stepResults?: string[]; // Array of intermediate result URLs
}

export interface ResendVerificationResponse {
  message: string;
  error?: string;
}

// URL-based image fetching interfaces
export interface FetchModelImageFromUrlResponse {
  success: boolean;
  imageDataUrl: string;
  mimeType: string;
  size: number;
  originalUrl: string;
  error?: string;
}

export interface ExtractedProductFromUrl {
  name: string;
  category: string;
  description: string;
  specifications: {
    material?: string;
    fit?: string;
    care?: string;
    color?: string;
    style?: string;
    [key: string]: string | undefined;
  };
  imageDataUrl: string;
  sourceUrl: string;
  price?: {
    amount: number;
    currency: string;
  };
}

export interface FetchProductFromUrlResponse {
  success: boolean;
  product?: ExtractedProductFromUrl;
  error?: string;
}

export interface ValidateUrlResponse {
  valid: boolean;
  error?: string;
}

export interface ProgressiveStepRequest {
  modelImage: File;
  fashionImage: File;
  fashionItemName: string;
  fashionCategory: string;
  stepNumber: number;
  textPrompt?: string;
}

export interface ProgressiveStepResult {
  success: boolean;
  stepNumber: number;
  resultImageUrl: string;
  error?: string;
}

export interface GenerateProgressiveTryOnRequest {
  modelImage: File;
  fashionItems: FashionItemInput[];
  textPrompt?: string;
}

export interface ProgressiveTryOnResult {
  success: boolean;
  result?: TryOnResult;
  error?: string;
  stepResults?: string[];
}

export class APIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  }

  async getFashionItems(): Promise<FashionItem[]> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items`, {
      credentials: 'include' // Include session cookies
    });
    if (!response.ok) {
      throw new Error('Failed to fetch fashion items');
    }
    return response.json();
  }

  async getFashionItemsByCategory(category: string): Promise<FashionItem[]> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items/category/${encodeURIComponent(category)}`, {
      credentials: 'include' // Include session cookies
    });
    if (!response.ok) {
      throw new Error('Failed to fetch fashion items by category');
    }
    return response.json();
  }

  async getTryOnResults(): Promise<TryOnResult[]> {
    const response = await fetch(`${this.baseUrl}/api/try-on-results`, {
      credentials: 'include' // Include session cookies
    });
    if (!response.ok) {
      throw new Error('Failed to fetch try-on results');
    }
    return response.json();
  }

  async generateTryOn(request: GenerateTryOnRequest): Promise<GenerateTryOnResponse> {
    const formData = new FormData();
    formData.append('modelImage', request.modelImage);
    formData.append('fashionImage', request.fashionImage);
    formData.append('fashionItemName', request.fashionItemName);
    formData.append('fashionCategory', request.fashionCategory);
    if (request.textPrompt) {
      formData.append('textPrompt', request.textPrompt);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate try-on');
    }

    return response.json();
  }

  async generateBatchTryOn(request: GenerateBatchTryOnRequest): Promise<BatchTryOnResult> {
    const formData = new FormData();
    
    // Append model image first
    formData.append('files', request.modelImage);
    
    // Append fashion item images
    request.fashionItems.forEach((item, index) => {
      formData.append('files', item.image);
      formData.append(`fashionItems[${index}][name]`, item.name);
      formData.append(`fashionItems[${index}][category]`, item.category);
      formData.append(`fashionItems[${index}][source]`, item.source);
      if (item.collectionId) {
        formData.append(`fashionItems[${index}][collectionId]`, item.collectionId);
      }
    });
    
    // Add text prompt if provided
    if (request.textPrompt) {
      formData.append('textPrompt', request.textPrompt);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate-batch`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate batch try-on');
    }

    return response.json();
  }

  async generateProgressiveTryOn(request: GenerateProgressiveTryOnRequest): Promise<ProgressiveTryOnResult> {
    const formData = new FormData();
    
    // Append model image first
    formData.append('files', request.modelImage);
    
    // Append fashion item images
    request.fashionItems.forEach((item, index) => {
      formData.append('files', item.image);
      formData.append(`fashionItems[${index}][name]`, item.name);
      formData.append(`fashionItems[${index}][category]`, item.category);
      formData.append(`fashionItems[${index}][source]`, item.source);
      if (item.collectionId) {
        formData.append(`fashionItems[${index}][collectionId]`, item.collectionId);
      }
    });
    
    // Add text prompt if provided
    if (request.textPrompt) {
      formData.append('textPrompt', request.textPrompt);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate-progressive`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate progressive try-on');
    }

    return response.json();
  }

  async generateProgressiveStep(request: ProgressiveStepRequest): Promise<ProgressiveStepResult> {
    const formData = new FormData();
    
    formData.append('modelImage', request.modelImage);
    formData.append('fashionImage', request.fashionImage);
    formData.append('fashionItemName', request.fashionItemName);
    formData.append('fashionCategory', request.fashionCategory);
    formData.append('stepNumber', request.stepNumber.toString());
    if (request.textPrompt) {
      formData.append('textPrompt', request.textPrompt);
    }
    

    const response = await fetch(`${this.baseUrl}/api/try-on/generate-step`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate progressive step');
    }

    return response.json();
  }

  async generateSimultaneousTryOn(request: GenerateSimultaneousTryOnRequest): Promise<SimultaneousTryOnResult> {
    const formData = new FormData();
    
    // Append model image first
    formData.append('files', request.modelImage);
    
    // Append fashion item images
    request.fashionItems.forEach((item, index) => {
      formData.append('files', item.image);
      formData.append(`fashionItems[${index}][name]`, item.name);
      formData.append(`fashionItems[${index}][category]`, item.category);
      formData.append(`fashionItems[${index}][source]`, item.source);
      if (item.collectionId) {
        formData.append(`fashionItems[${index}][collectionId]`, item.collectionId);
      }
    });
    
    // Add text prompt if provided
    if (request.textPrompt) {
      formData.append('textPrompt', request.textPrompt);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate-simultaneous`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate simultaneous try-on');
    }

    return response.json();
  }

  async getFashionItem(id: string): Promise<FashionItem> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items/${encodeURIComponent(id)}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch fashion item');
    }
    return response.json();
  }

  async analyzeFashionImage(imageFile: File): Promise<{ name: string; category: string; description?: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/fashion-items/analyze`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to analyze fashion image');
    }
    return response.json();
  }

  async saveFashionItem(imageFile: File, name: string, category: string, description?: string): Promise<FashionItem> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', name);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${this.baseUrl}/api/fashion-items`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to save fashion item');
    }
    return response.json();
  }

  async deleteFashionItem(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to delete fashion item');
    }
    return response.json();
  }

  async deleteTryOnResult(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/try-on-results/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to delete try-on result');
    }
    return response.json();
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<ResendVerificationResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to resend verification email");
    }

    return data;
  }

  // ============================================
  // URL-BASED IMAGE FETCHING METHODS
  // ============================================

  /**
   * Fetch a model image from a URL
   * Returns base64 data URL that can be used directly
   */
  async fetchModelImageFromUrl(url: string): Promise<FetchModelImageFromUrlResponse> {
    const response = await fetch(`${this.baseUrl}/api/model-image/fetch-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch image from URL');
    }

    return data;
  }

  /**
   * Extract a fashion product from a URL (product page or direct image)
   * Uses AI to intelligently extract product info from e-commerce pages
   */
  async fetchProductFromUrl(url: string): Promise<FetchProductFromUrlResponse> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items/fetch-from-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to extract product from URL');
    }

    return data;
  }

  /**
   * Validate a URL before fetching
   */
  async validateUrl(url: string): Promise<ValidateUrlResponse> {
    const response = await fetch(`${this.baseUrl}/api/validate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      credentials: 'include'
    });

    return response.json();
  }

  /**
   * Helper to convert a data URL to a File object
   */
  dataUrlToFile(dataUrl: string, filename: string): File {
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
}

export const apiClient = new APIClient();

// Debug: log available methods on apiClient
console.log('[API Client] Methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(apiClient)).filter(m => m !== 'constructor'));
