import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Definición de monedas latinoamericanas
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
}

// Lista de monedas latinoamericanas y España
export const latinCurrencies: Currency[] = [
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    country: "España",
    flag: "🇪🇸"
  },
  {
    code: "ARS",
    name: "Peso Argentino",
    symbol: "$",
    country: "Argentina",
    flag: "🇦🇷"
  },
  {
    code: "BOB",
    name: "Boliviano",
    symbol: "Bs.",
    country: "Bolivia",
    flag: "🇧🇴"
  },
  {
    code: "BRL",
    name: "Real Brasileño",
    symbol: "R$",
    country: "Brasil",
    flag: "🇧🇷"
  },
  {
    code: "CLP",
    name: "Peso Chileno",
    symbol: "$",
    country: "Chile",
    flag: "🇨🇱"
  },
  {
    code: "COP",
    name: "Peso Colombiano",
    symbol: "$",
    country: "Colombia",
    flag: "🇨🇴"
  },
  {
    code: "CRC",
    name: "Colón Costarricense",
    symbol: "₡",
    country: "Costa Rica",
    flag: "🇨🇷"
  },
  {
    code: "CUP",
    name: "Peso Cubano",
    symbol: "₱",
    country: "Cuba",
    flag: "🇨🇺"
  },
  {
    code: "DOP",
    name: "Peso Dominicano",
    symbol: "RD$",
    country: "República Dominicana",
    flag: "🇩🇴"
  },
  {
    code: "USD",
    name: "Dólar Estadounidense",
    symbol: "$",
    country: "Ecuador",
    flag: "🇪🇨"
  },
  {
    code: "GTQ",
    name: "Quetzal",
    symbol: "Q",
    country: "Guatemala",
    flag: "🇬🇹"
  },
  {
    code: "HNL",
    name: "Lempira",
    symbol: "L",
    country: "Honduras",
    flag: "🇭🇳"
  },
  {
    code: "MXN",
    name: "Peso Mexicano",
    symbol: "$",
    country: "México",
    flag: "🇲🇽"
  },
  {
    code: "NIO",
    name: "Córdoba",
    symbol: "C$",
    country: "Nicaragua",
    flag: "🇳🇮"
  },
  {
    code: "PAB",
    name: "Balboa",
    symbol: "B/.",
    country: "Panamá",
    flag: "🇵🇦"
  },
  {
    code: "PEN",
    name: "Sol",
    symbol: "S/",
    country: "Perú",
    flag: "🇵🇪"
  },
  {
    code: "PYG",
    name: "Guaraní",
    symbol: "₲",
    country: "Paraguay",
    flag: "🇵🇾"
  },
  {
    code: "UYU",
    name: "Peso Uruguayo",
    symbol: "$U",
    country: "Uruguay",
    flag: "🇺🇾"
  },
  {
    code: "VES",
    name: "Bolívar Soberano",
    symbol: "Bs.",
    country: "Venezuela",
    flag: "🇻🇪"
  }
];

// Funciones de utilidad para trabajar con monedas
export const getCurrencyByCode = (code: string): Currency => {
  return latinCurrencies.find(currency => currency.code === code) || latinCurrencies[0];
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  return `${currency.symbol} ${amount.toFixed(2)}`;
};

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onValueChange
}) => {
  const selectedCurrency = getCurrencyByCode(value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Seleccionar moneda">
          <div className="flex items-center">
            <span className="mr-2 text-lg">{selectedCurrency.flag}</span>
            <span>{selectedCurrency.code} - {selectedCurrency.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Monedas</SelectLabel>
          {latinCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center">
                <span className="mr-2 text-lg">{currency.flag}</span>
                <span>
                  <span className="font-medium">{currency.code}</span> - {currency.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector; 