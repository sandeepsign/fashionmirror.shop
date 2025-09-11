import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiClient } from "@/lib/api";
import { TryOnResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface ResultsGalleryProps {
  latestResults?: TryOnResult[];
}

export default function ResultsGallery({ latestResults = [] }: ResultsGalleryProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: results, isLoading, error } = useQuery({
    queryKey: ["/api/try-on-results", user?.id],
    queryFn: () => apiClient.getTryOnResults(),
    enabled: !!user?.id, // Only fetch when user is authenticated
  });

  // Combine latest results with existing results, avoiding duplicates
  const allResults = useMemo(() => {
    const existing = results || [];
    const newResults = latestResults.filter(latest => 
      !existing.find(r => r.id === latest.id)
    );
    return [...newResults, ...existing];
  }, [results, latestResults]);

  const handleView = (result: TryOnResult) => {
    // Open result image in a new window/tab
    window.open(result.resultImageUrl, '_blank');
  };

  const handleShare = async (result: TryOnResult) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Virtual Try-On: ${result.fashionItemName}`,
          text: `Check out how I look wearing ${result.fashionItemName}!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // Could show a toast here
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm("Are you sure you want to delete this try-on result? This action cannot be undone.")) {
      return;
    }

    try {
      await apiClient.deleteTryOnResult(resultId);
      // Invalidate and refetch try-on results
      queryClient.invalidateQueries({ queryKey: ["/api/try-on-results"] });
    } catch (error) {
      console.error("Failed to delete try-on result:", error);
      alert("Failed to delete the try-on result. Please try again.");
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">Your Try-On Gallery</h2>
          <p className="text-muted-foreground">View and manage your AI-generated fashion try-ons</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
              <Skeleton className="w-full h-64" />
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">Your Try-On Gallery</h2>
          <p className="text-destructive">Failed to load your try-on results.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">Your Try-On Gallery</h2>
        <p className="text-muted-foreground">View and manage your AI-generated fashion try-ons</p>
      </div>
      
      {allResults.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <i className="fas fa-images text-muted-foreground text-4xl mb-4"></i>
          <p className="text-muted-foreground mb-2" data-testid="text-no-results">
            No try-on results yet
          </p>
          <p className="text-sm text-muted-foreground">
            Generate your first virtual try-on to see it here!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allResults.map((result, index) => (
            <div 
              key={result.id} 
              className="bg-card rounded-xl overflow-hidden shadow-lg border border-border relative group"
              data-testid={`card-result-${index}`}
            >
              <img 
                src={result.resultImageUrl} 
                alt={`Try-on result: ${result.fashionItemName}`} 
                className="w-full h-64 object-cover"
                data-testid={`img-result-${index}`}
              />
              
              {/* Delete button */}
              <button
                onClick={() => handleDelete(result.id)}
                className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                data-testid={`button-delete-result-${index}`}
                title="Delete this result"
              >
                <i className="fas fa-trash text-sm"></i>
              </button>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground" data-testid={`text-result-name-${index}`}>
                    {result.fashionItemName}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid={`text-result-time-${index}`}>
                    {formatTimeAgo(new Date(result.createdAt))}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                    onClick={() => handleView(result)}
                    data-testid={`button-view-${index}`}
                  >
                    <i className="fas fa-eye mr-1"></i>View
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleShare(result)}
                    data-testid={`button-share-${index}`}
                  >
                    <i className="fas fa-share mr-1"></i>Share
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
