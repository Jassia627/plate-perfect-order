import React from "react";
import { phoneCountryPrefixes } from "./phone-country-prefixes";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall, Phone, Globe } from "lucide-react";

const CountryPrefixesInfo: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PhoneCall className="mr-2 h-5 w-5" />
          Prefijos Telefónicos por País
        </CardTitle>
        <CardDescription>
          Esta tabla muestra los prefijos telefónicos internacionales para cada país soportado.
          El prefijo se selecciona automáticamente según la moneda configurada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Lista de prefijos telefónicos por país</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Bandera</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Prefijo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phoneCountryPrefixes.map((country) => (
              <TableRow key={country.code}>
                <TableCell className="text-xl">{country.flag}</TableCell>
                <TableCell>{country.country}</TableCell>
                <TableCell>{country.code}</TableCell>
                <TableCell className="font-mono">{country.phonePrefix}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CountryPrefixesInfo; 