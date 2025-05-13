import React from 'react';
import { formatCurrency, getCurrencyByCode } from './currency-selector';

interface FormattedPriceProps {
  amount: number;
  currencyCode: string;
  className?: string;
  showFlag?: boolean;
}

export const FormattedPrice: React.FC<FormattedPriceProps> = ({
  amount,
  currencyCode,
  className = '',
  showFlag = false
}) => {
  const currency = getCurrencyByCode(currencyCode);
  
  return (
    <span className={`inline-flex items-center ${className}`}>
      {showFlag && <span className="mr-1">{currency.flag}</span>}
      <span>{formatCurrency(amount, currencyCode)}</span>
    </span>
  );
};

export default FormattedPrice; 