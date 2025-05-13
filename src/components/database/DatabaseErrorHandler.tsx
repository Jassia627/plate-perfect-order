import React, { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import AddCurrencyColumn from './AddCurrencyColumn';

type ErrorType = 'missing_currency_column' | 'none' | 'unknown';

export const DatabaseErrorHandler = () => {
  const [errorType, setErrorType] = useState<ErrorType>('none');
  
  // Intentar usar useSettings para ver si hay errores
  const { error } = useSettings('restaurantSettings', {
    name: 'Test',
    phone: '',
    address: '',
    description: '',
    darkMode: false,
    autoPrint: false,
    currency: 'EUR',
  });
  
  useEffect(() => {
    if (error) {
      // Comprobar si es el error específico de columna faltante
      if (error.includes("Could not find the 'currency' column")) {
        setErrorType('missing_currency_column');
      } else {
        setErrorType('unknown');
      }
    } else {
      setErrorType('none');
    }
  }, [error]);
  
  // Si no hay error, no mostrar nada
  if (errorType === 'none') {
    return null;
  }
  
  // Error de columna faltante
  if (errorType === 'missing_currency_column') {
    return <AddCurrencyColumn />;
  }
  
  // Otros errores
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 my-4">
      <h3 className="text-lg font-semibold text-yellow-800">Error de base de datos</h3>
      <p className="text-yellow-700">{error}</p>
      <p className="text-sm mt-2">Por favor, contacta al soporte técnico si este error persiste.</p>
    </div>
  );
};

export default DatabaseErrorHandler; 