import React from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from './CartContext';
import { Badge } from '@/components/ui/badge';

interface CartButtonProps {
  onClick: () => void;
  variant?: 'default' | 'outline' | 'floating';
  size?: 'sm' | 'default' | 'lg';
}

const CartButton: React.FC<CartButtonProps> = ({
  onClick,
  variant = 'default',
  size = 'default'
}) => {
  const { totalItems, totalPrice } = useCart();

  if (variant === 'floating') {
    return (
      <Button
        onClick={onClick}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg p-4 h-14 w-14 flex items-center justify-center"
        variant="default"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 rounded-full"
          >
            {totalItems}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={`flex items-center ${totalItems > 0 ? 'gap-2' : ''}`}
    >
      <ShoppingCart className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      {totalItems > 0 && (
        <>
          <span>{totalItems}</span>
          <span className="hidden sm:inline-block">
            {` - $${totalPrice.toFixed(2)}`}
          </span>
        </>
      )}
    </Button>
  );
};

export default CartButton; 