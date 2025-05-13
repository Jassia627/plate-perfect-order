import { Currency } from './currency-selector';

// Mapa de prefijos telefónicos para países latinoamericanos
export interface CountryPhoneInfo {
  code: string;       // Código de moneda
  country: string;    // Nombre del país
  phonePrefix: string; // Prefijo telefónico con formato +XX
  flag: string;       // Bandera del país
}

// Lista de prefijos telefónicos por país (basado en el código de moneda)
export const phoneCountryPrefixes: CountryPhoneInfo[] = [
  {
    code: "EUR",
    country: "España",
    phonePrefix: "+34",
    flag: "🇪🇸"
  },
  {
    code: "ARS",
    country: "Argentina",
    phonePrefix: "+54",
    flag: "🇦🇷"
  },
  {
    code: "BOB",
    country: "Bolivia",
    phonePrefix: "+591",
    flag: "🇧🇴"
  },
  {
    code: "BRL",
    country: "Brasil",
    phonePrefix: "+55",
    flag: "🇧🇷"
  },
  {
    code: "CLP",
    country: "Chile",
    phonePrefix: "+56",
    flag: "🇨🇱"
  },
  {
    code: "COP",
    country: "Colombia",
    phonePrefix: "+57",
    flag: "🇨🇴"
  },
  {
    code: "CRC",
    country: "Costa Rica",
    phonePrefix: "+506",
    flag: "🇨🇷"
  },
  {
    code: "CUP",
    country: "Cuba",
    phonePrefix: "+53",
    flag: "🇨🇺"
  },
  {
    code: "DOP",
    country: "República Dominicana",
    phonePrefix: "+1",
    flag: "🇩🇴"
  },
  {
    code: "USD",
    country: "Ecuador",
    phonePrefix: "+593",
    flag: "🇪🇨"
  },
  {
    code: "GTQ",
    country: "Guatemala",
    phonePrefix: "+502",
    flag: "🇬🇹"
  },
  {
    code: "HNL",
    country: "Honduras",
    phonePrefix: "+504",
    flag: "🇭🇳"
  },
  {
    code: "MXN",
    country: "México",
    phonePrefix: "+52",
    flag: "🇲🇽"
  },
  {
    code: "NIO",
    country: "Nicaragua",
    phonePrefix: "+505",
    flag: "🇳🇮"
  },
  {
    code: "PAB",
    country: "Panamá",
    phonePrefix: "+507",
    flag: "🇵🇦"
  },
  {
    code: "PEN",
    country: "Perú",
    phonePrefix: "+51",
    flag: "🇵🇪"
  },
  {
    code: "PYG",
    country: "Paraguay",
    phonePrefix: "+595",
    flag: "🇵🇾"
  },
  {
    code: "UYU",
    country: "Uruguay",
    phonePrefix: "+598",
    flag: "🇺🇾"
  },
  {
    code: "VES",
    country: "Venezuela",
    phonePrefix: "+58",
    flag: "🇻🇪"
  }
];

// Función para obtener el prefijo telefónico a partir del código de moneda
export const getPhonePrefixByCurrencyCode = (currencyCode: string): string => {
  const countryInfo = phoneCountryPrefixes.find(info => info.code === currencyCode);
  return countryInfo?.phonePrefix || "+34"; // Devuelve el prefijo español como valor predeterminado
};

// Función para obtener toda la información del país a partir del código de moneda
export const getCountryInfoByCurrencyCode = (currencyCode: string): CountryPhoneInfo => {
  return phoneCountryPrefixes.find(info => info.code === currencyCode) || phoneCountryPrefixes[0];
};

// Función para formatear un número de teléfono con el prefijo correcto
export const formatPhoneNumberWithCountryCode = (phoneNumber: string, currencyCode: string): string => {
  const prefix = getPhonePrefixByCurrencyCode(currencyCode);
  
  // Eliminar cualquier prefijo existente y caracteres no numéricos
  const cleanNumber = phoneNumber.replace(/^\+\d+/, '').replace(/\D/g, '');
  
  return `${prefix}${cleanNumber}`;
}; 