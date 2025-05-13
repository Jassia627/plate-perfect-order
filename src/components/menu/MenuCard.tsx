
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags: string[];
  available: boolean;
};

type MenuCardProps = {
  items: MenuItem[];
  categories: string[];
  onAddToOrder?: (item: MenuItem) => void;
};

const MenuCard = ({ items, categories, onAddToOrder }: MenuCardProps) => {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Filtramos por categoría y tags activos
  const filteredItems = items.filter((item) => {
    // Primero filtramos por categoría
    if (item.category !== activeCategory) return false;
    
    // Si no hay filtros activos, mostramos todo
    if (activeFilters.length === 0) return true;
    
    // Si hay filtros activos, verificamos que el ítem tenga al menos uno
    return item.tags.some(tag => activeFilters.includes(tag));
  });

  // Tags disponibles en esta categoría
  const availableTags = [...new Set(
    items
      .filter(item => item.category === activeCategory)
      .flatMap(item => item.tags)
  )];

  const toggleFilter = (tag: string) => {
    if (activeFilters.includes(tag)) {
      setActiveFilters(activeFilters.filter(t => t !== tag));
    } else {
      setActiveFilters([...activeFilters, tag]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Menú Digital</CardTitle>
        <CardDescription>
          Explore nuestro menú y agregue ítems a su orden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue={categories[0]} 
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="w-full"
        >
          <TabsList className="mb-4 w-full overflow-x-auto flex justify-start">
            {categories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="min-w-max"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Filtros por etiqueta */}
          <div className="mb-4 flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={activeFilters.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
          
          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="w-1/3 bg-cover bg-center" 
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                      <div className="w-2/3 flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <span className="font-bold">${item.price.toFixed(2)}</span>
                          </div>
                          <CardDescription className="text-xs line-clamp-2">
                            {item.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 pt-0">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-0">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className={cn(
                              "w-full",
                              !item.available && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={!item.available}
                            onClick={() => onAddToOrder?.(item)}
                          >
                            {item.available ? "Agregar" : "No disponible"}
                          </Button>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MenuCard;
