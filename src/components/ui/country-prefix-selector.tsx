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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneCountryPrefixes, CountryPhoneInfo } from "./phone-country-prefixes";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./button";

interface CountryPrefixSelectorProps {
  value: string; // Número de teléfono completo incluyendo prefijo
  onValueChange: (value: string) => void;
  currencyCode: string; // Código de moneda seleccionado
  label?: string;
  placeholder?: string;
}

export const CountryPrefixSelector: React.FC<CountryPrefixSelectorProps> = ({
  value,
  onValueChange,
  currencyCode,
  label = "Número de teléfono",
  placeholder = "Ej: 612345678"
}) => {
  // Encontrar el país correspondiente a la moneda
  const selectedCountry = phoneCountryPrefixes.find(c => c.code === currencyCode) || phoneCountryPrefixes[0];
  
  // Estado para el país seleccionado
  const [country, setCountry] = React.useState<CountryPhoneInfo>(selectedCountry);
  
  // Actualizar el país cuando cambia la moneda
  React.useEffect(() => {
    const countryInfo = phoneCountryPrefixes.find(c => c.code === currencyCode);
    if (countryInfo) {
      setCountry(countryInfo);
    }
  }, [currencyCode]);
  
  // Extraer el número sin prefijo
  const getPhoneNumber = (fullNumber: string, prefix: string): string => {
    if (!fullNumber) return "";
    // Si el número comienza con el prefijo, quitarlo
    if (fullNumber.startsWith(prefix)) {
      return fullNumber.substring(prefix.length);
    }
    // Si comienza con + pero no es exactamente el prefijo
    if (fullNumber.startsWith("+")) {
      return fullNumber.replace(/^\+\d+/, "");
    }
    return fullNumber;
  };
  
  // Formatear el número completo con prefijo
  const formatFullNumber = (phoneNumber: string, prefix: string): string => {
    if (!phoneNumber) return prefix;
    // Limpiar el número (solo dígitos)
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    return `${prefix}${cleanNumber}`;
  };
  
  // Manejar cambio de país
  const handleCountryChange = (countryCode: string) => {
    const newCountry = phoneCountryPrefixes.find(c => c.code === countryCode) || phoneCountryPrefixes[0];
    setCountry(newCountry);
    
    // Actualizar el número con el nuevo prefijo
    const phoneNumber = getPhoneNumber(value, country.phonePrefix);
    onValueChange(formatFullNumber(phoneNumber, newCountry.phonePrefix));
  };
  
  // Manejar cambio en el campo de número
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    onValueChange(formatFullNumber(phoneNumber, country.phonePrefix));
  };
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
            <Link to="/phone-prefix-help" className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              <span>Ayuda con prefijos</span>
            </Link>
          </Button>
        </div>
      )}
      <div className="flex space-x-2">
        <div className="w-1/3">
          <Select value={country.code} onValueChange={handleCountryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un país">
                <div className="flex items-center">
                  <span className="mr-2">{country.flag}</span>
                  <span>{country.phonePrefix}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Países</SelectLabel>
                {phoneCountryPrefixes.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center">
                      <span className="mr-2">{country.flag}</span>
                      <span>{country.country} ({country.phonePrefix})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Input
          className="w-2/3"
          value={getPhoneNumber(value, country.phonePrefix)}
          onChange={handlePhoneChange}
          placeholder={placeholder}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Este número se usará para comunicaciones con clientes a través de WhatsApp
      </p>
    </div>
  );
};

export default CountryPrefixSelector; 