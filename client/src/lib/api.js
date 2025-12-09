export class APIClient {
    baseUrl;
    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    }
    async getFashionItems() {
        const response = await fetch(`${this.baseUrl}/api/fashion-items`, {
            credentials: 'include' // Include session cookies
        });
        if (!response.ok) {
            throw new Error('Failed to fetch fashion items');
        }
        return response.json();
    }
    async getFashionItemsByCategory(category) {
        const response = await fetch(`${this.baseUrl}/api/fashion-items/category/${encodeURIComponent(category)}`, {
            credentials: 'include' // Include session cookies
        });
        if (!response.ok) {
            throw new Error('Failed to fetch fashion items by category');
        }
        return response.json();
    }
    async getTryOnResults() {
        const response = await fetch(`${this.baseUrl}/api/try-on-results`, {
            credentials: 'include' // Include session cookies
        });
        if (!response.ok) {
            throw new Error('Failed to fetch try-on results');
        }
        return response.json();
    }
    async generateTryOn(request) {
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
    async generateBatchTryOn(request) {
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
    async generateProgressiveTryOn(request) {
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
    async generateProgressiveStep(request) {
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
    async generateSimultaneousTryOn(request) {
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
    async getFashionItem(id) {
        const response = await fetch(`${this.baseUrl}/api/fashion-items/${encodeURIComponent(id)}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch fashion item');
        }
        return response.json();
    }
    async analyzeFashionImage(imageFile) {
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
    async saveFashionItem(imageFile, name, category, description) {
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
    async deleteFashionItem(id) {
        const response = await fetch(`${this.baseUrl}/api/fashion-items/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to delete fashion item');
        }
        return response.json();
    }
    async deleteTryOnResult(id) {
        const response = await fetch(`${this.baseUrl}/api/try-on-results/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to delete try-on result');
        }
        return response.json();
    }
    async healthCheck() {
        const response = await fetch(`${this.baseUrl}/api/health`);
        if (!response.ok) {
            throw new Error('Health check failed');
        }
        return response.json();
    }
    // Resend verification email
    async resendVerificationEmail(email) {
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
}
export const apiClient = new APIClient();
