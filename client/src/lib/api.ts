import { TryOnResult, FashionItem } from "@shared/schema";

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
  userId?: string;
}

export interface GenerateBatchTryOnRequest {
  modelImage: File;
  fashionItems: FashionItemInput[];
  userId?: string;
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
  userId?: string;
}

export interface SimultaneousTryOnResult {
  success: boolean;
  result?: TryOnResult;
  error?: string;
  stepResults?: string[]; // Array of base64 encoded intermediate results
}

export class APIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  }

  async getFashionItems(): Promise<FashionItem[]> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items`);
    if (!response.ok) {
      throw new Error('Failed to fetch fashion items');
    }
    return response.json();
  }

  async getFashionItemsByCategory(category: string): Promise<FashionItem[]> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items/category/${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch fashion items by category');
    }
    return response.json();
  }

  async getTryOnResults(userId?: string): Promise<TryOnResult[]> {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${this.baseUrl}/api/try-on-results${params}`);
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
    if (request.userId) {
      formData.append('userId', request.userId);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate`, {
      method: 'POST',
      body: formData,
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
    
    if (request.userId) {
      formData.append('userId', request.userId);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate-batch`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate batch try-on');
    }

    return response.json();
  }

  async generateProgressiveTryOn(request: GenerateSimultaneousTryOnRequest): Promise<SimultaneousTryOnResult> {
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
    
    if (request.userId) {
      formData.append('userId', request.userId);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate-progressive`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate progressive try-on');
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
    
    if (request.userId) {
      formData.append('userId', request.userId);
    }

    const response = await fetch(`${this.baseUrl}/api/try-on/generate-simultaneous`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate simultaneous try-on');
    }

    return response.json();
  }

  async getFashionItem(id: string): Promise<FashionItem> {
    const response = await fetch(`${this.baseUrl}/api/fashion-items/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch fashion item');
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
}

export const apiClient = new APIClient();
