import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem } from '@/hooks/use-orders';

// Tipo para un item en el carrito
export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

// Tipo para los detalles de entrega
export interface DeliveryDetails {
  address: string;
  phone: string;
  name: string;
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | '';
  additionalInstructions: string;
}

// Interfaz del contexto del carrito
interface CartContextType {
  items: CartItem[];
  deliveryDetails: DeliveryDetails;
  addItem: (menuItem: MenuItem, quantity: number, notes: string) => void;
  updateItem: (id: string, quantity: number, notes: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateDeliveryDetails: (details: Partial<DeliveryDetails>) => void;
  totalItems: number;
  totalPrice: number;
}

// Valores por defecto para el contexto
const defaultDeliveryDetails: DeliveryDetails = {
  address: '',
  phone: '',
  name: '',
  paymentMethod: '',
  additionalInstructions: '',
};

// Crear el contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook personalizado para usar el contexto del carrito
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

// Componente proveedor del contexto
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>(defaultDeliveryDetails);

  // Cargar items del carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedDeliveryDetails = localStorage.getItem('deliveryDetails');
    
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error al cargar el carrito desde localStorage:', e);
      }
    }
    
    if (savedDeliveryDetails) {
      try {
        setDeliveryDetails(JSON.parse(savedDeliveryDetails));
      } catch (e) {
        console.error('Error al cargar los detalles de entrega desde localStorage:', e);
      }
    }
  }, []);

  // Guardar items del carrito en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Guardar detalles de entrega en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('deliveryDetails', JSON.stringify(deliveryDetails));
  }, [deliveryDetails]);

  // Añadir un item al carrito
  const addItem = (menuItem: MenuItem, quantity: number, notes: string) => {
    setItems(prevItems => {
      // Buscar si el item ya existe en el carrito
      const existingItemIndex = prevItems.findIndex(
        item => item.menuItem.id === menuItem.id
      );

      if (existingItemIndex >= 0) {
        // Si existe, actualizar la cantidad
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].notes = notes || updatedItems[existingItemIndex].notes;
        return updatedItems;
      } else {
        // Si no existe, añadirlo al carrito
        return [...prevItems, {
          id: menuItem.id,
          menuItem,
          quantity,
          notes: notes || ''
        }];
      }
    });
  };

  // Actualizar un item existente
  const updateItem = (id: string, quantity: number, notes: string) => {
    setItems(prevItems => {
      if (quantity <= 0) {
        // Si la cantidad es 0 o menos, eliminar el item
        return prevItems.filter(item => item.id !== id);
      }
      
      // Actualizar la cantidad y notas del item
      return prevItems.map(item => 
        item.id === id 
          ? { ...item, quantity, notes: notes || item.notes } 
          : item
      );
    });
  };

  // Eliminar un item del carrito
  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // Limpiar todo el carrito
  const clearCart = () => {
    setItems([]);
  };

  // Actualizar detalles de entrega
  const updateDeliveryDetails = (details: Partial<DeliveryDetails>) => {
    setDeliveryDetails(prev => ({ ...prev, ...details }));
  };

  // Calcular el total de items en el carrito
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  // Calcular el precio total
  const totalPrice = items.reduce(
    (total, item) => total + item.menuItem.price * item.quantity, 
    0
  );

  // Valores del contexto
  const value = {
    items,
    deliveryDetails,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    updateDeliveryDetails,
    totalItems,
    totalPrice
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 