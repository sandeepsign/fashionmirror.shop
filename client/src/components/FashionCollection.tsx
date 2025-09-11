import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { FashionItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface FashionCollectionProps {
  onItemSelect: (item: FashionItem) => void;
  selectedItems: FashionItem[];
}

const categories = [
  { id: "all", label: "All Items" },
  { id: "professional", label: "Professional" },
  { id: "formal", label: "Formal" },
  { id: "casual", label: "Casual" },
  { id: "accessories", label: "Accessories" },
  { id: "footwear", label: "Footwear" }
];

export default function FashionCollection({ onItemSelect, selectedItems }: FashionCollectionProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: fashionItems, isLoading, error } = useQuery({
    queryKey: ["/api/fashion-items", user?.id],
    queryFn: () => apiClient.getFashionItems(),
  });

  const filteredItems = fashionItems?.filter(item => 
    activeCategory === "all" || item.category.toLowerCase() === activeCategory
  ) || [];

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this fashion item? This action cannot be undone.")) {
      return;
    }

    try {
      await apiClient.deleteFashionItem(itemId);
      // Invalidate and refetch fashion items
      queryClient.invalidateQueries({ queryKey: ["/api/fashion-items"] });
    } catch (error) {
      console.error("Failed to delete fashion item:", error);
      alert("Failed to delete the fashion item. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">Curated Fashion Collection</h2>
          <p className="text-muted-foreground">Try on our handpicked selection of trending fashion items</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <Skeleton key={category.id} className="h-10 w-24" />
          ))}
        </div>
        
        <div className="fashion-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
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
          <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">Curated Fashion Collection</h2>
          <p className="text-destructive">Failed to load fashion items. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">Curated Fashion Collection</h2>
        <p className="text-muted-foreground">Try on our handpicked selection of trending fashion items</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "secondary"}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              activeCategory === category.id 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
            onClick={() => setActiveCategory(category.id)}
            data-testid={`button-category-${category.id}`}
          >
            {category.label}
          </Button>
        ))}
      </div>
      
      <div className="fashion-grid">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`fashion-card rounded-xl overflow-hidden relative group ${
              selectedItems.some(selected => selected.id === item.id) ? "selected" : ""
            }`}
            data-testid={`card-fashion-${item.id}`}
          >
            <div
              className="cursor-pointer"
              onClick={() => onItemSelect(item)}
            >
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-64 object-cover"
                data-testid={`img-fashion-${item.id}`}
              />
              <div className="p-4">
                <h3 className="font-medium text-foreground mb-1" data-testid={`text-fashion-name-${item.id}`}>
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid={`text-fashion-category-${item.id}`}>
                  {item.category}
                </p>
              </div>
            </div>
            
            {/* Delete button - only show for user's own items */}
            {user && item.userId === user.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                data-testid={`button-delete-${item.id}`}
                title="Delete this item"
              >
                <i className="fas fa-trash text-sm"></i>
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground" data-testid="text-no-items">
            No fashion items found in this category.
          </p>
        </div>
      )}
    </section>
  );
}
