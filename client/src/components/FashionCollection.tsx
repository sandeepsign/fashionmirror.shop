import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { FashionItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: fashionItems, isLoading, error } = useQuery({
    queryKey: ["/api/fashion-items"],
    queryFn: () => apiClient.getFashionItems(),
  });

  const filteredItems = fashionItems?.filter(item => 
    activeCategory === "all" || item.category.toLowerCase() === activeCategory
  ) || [];

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
            className={`fashion-card rounded-xl overflow-hidden cursor-pointer ${
              selectedItems.some(selected => selected.id === item.id) ? "selected" : ""
            }`}
            onClick={() => onItemSelect(item)}
            data-testid={`card-fashion-${item.id}`}
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
