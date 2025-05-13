import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettings } from './use-settings';
import { getCurrencyByCode, Currency } from '@/components/ui/currency-selector';
import { getPhonePrefixByCurrencyCode, getCountryInfoByCurrencyCode, CountryPhoneInfo } from '@/components/ui/phone-country-prefixes';

interface CurrencyContextType {
  currency: Currency;
  currencyCode: string;
  formatPrice: (amount: number) => string;
  loading: boolean;
  phonePrefix: string;
  countryInfo: CountryPhoneInfo;
  formatPhoneNumber: (phoneNumber: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currencyCode, setCurrencyCode] = useState<string>('EUR');
  const [loading, setLoading] = useState(true);
  
  // Obtener la configuración del restaurante para la moneda
  const { data: restaurantData, loading: settingsLoading } = useSettings('restaurantSettings', {
    name: '',
    phone: '',
    address: '',
    description: '',
    darkMode: false,
    autoPrint: false,
    currency: 'EUR',
  });
  
  useEffect(() => {
    if (!settingsLoading && restaurantData?.currency) {
      setCurrencyCode(restaurantData.currency);
      setLoading(false);
    } else if (!settingsLoading) {
      setLoading(false);
    }
  }, [restaurantData, settingsLoading]);
  
  const currency = getCurrencyByCode(currencyCode);
  const phonePrefix = getPhonePrefixByCurrencyCode(currencyCode);
  const countryInfo = getCountryInfoByCurrencyCode(currencyCode);
  
  const formatPrice = (amount: number): string => {
    return `${currency.symbol} ${amount.toFixed(2)}`;
  };
  
  const formatPhoneNumber = (phoneNumber: string): string => {
    // Eliminar cualquier prefijo existente y caracteres no numéricos
    const cleanNumber = phoneNumber.replace(/^\+\d+/, '').replace(/\D/g, '');
    return `${phonePrefix}${cleanNumber}`;
  };
  
  const value = {
    currency,
    currencyCode,
    formatPrice,
    loading,
    phonePrefix,
    countryInfo,
    formatPhoneNumber
  };
  
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  
  return context;
}; 