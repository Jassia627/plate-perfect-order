import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, ShoppingBag, Plus } from "lucide-react";
import { MenuItem, MenuCategory } from "@/hooks/use-orders";
import { useCurrency } from "@/hooks/use-currency";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicMenuItemProps {
  item: MenuItem;
  category?: MenuCategory | null;
  onClick: () => void;
}

const PublicMenuItem: React.FC<PublicMenuItemProps> = ({ 
  item, 
  category,
  onClick 
}) => {
  const { formatPrice, currency, countryInfo } = useCurrency();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
      onClick={onClick}
    >
      {item.image_url && !imageError ? (
        <div className="aspect-[4/3] w-full overflow-hidden relative">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
          )}
          <img 
            src={item.image_url} 
            alt={item.name}
            className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center">
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-3 flex-grow">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {category && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {category.name}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs py-0 h-5">
                {countryInfo.flag} {formatPrice(item.price)}
              </Badge>
            </div>
            {item.description && (
              <p className="text-gray-600 text-xs mt-2 line-clamp-2">{item.description}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 flex-shrink-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicMenuItem; 