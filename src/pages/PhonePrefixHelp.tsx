import React from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CountryPrefixesInfo from "@/components/ui/country-prefixes-info";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, HelpCircle, Phone, MessageCircle } from "lucide-react";
import { phoneCountryPrefixes } from '@/components/ui/phone-country-prefixes';

const PhonePrefixHelp = () => {
  return (
    <MainLayout title="Ayuda de Prefijos Telefónicos" subtitle="Cómo funcionan los prefijos por país">
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Prefijos telefónicos automáticos</AlertTitle>
          <AlertDescription>
            Plate Perfect Order usa el prefijo telefónico del país según la moneda seleccionada en tu configuración.
            Esta página explica cómo funciona esta característica.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              ¿Cómo funciona?
            </CardTitle>
            <CardDescription>
              Detectamos automáticamente el prefijo telefónico del país basado en la moneda configurada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-medium text-lg">Funcionamiento:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <span className="font-medium">Selecciona la moneda:</span> En la configuración de tu restaurante, elige la moneda que utilizas (por ejemplo, COP para Colombia).
              </li>
              <li>
                <span className="font-medium">Prefijo automático:</span> El sistema detecta automáticamente que estás en Colombia y asigna el prefijo +57.
              </li>
              <li>
                <span className="font-medium">Formateo de WhatsApp:</span> Cuando un cliente hace un pedido, todos los números se formatean automáticamente con el prefijo correcto.
              </li>
              <li>
                <span className="font-medium">País personalizado:</span> Si deseas usar un prefijo diferente al de tu moneda, puedes seleccionarlo directamente en la configuración.
              </li>
            </ol>

            <div className="bg-muted p-4 rounded-md mt-4">
              <h3 className="font-medium flex items-center mb-2">
                <MessageCircle className="mr-2 h-5 w-5" />
                Ejemplo de uso
              </h3>
              <p className="text-sm mb-2">
                Si configuras tu moneda como <span className="font-mono">COP</span> (Peso Colombiano):
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>El cliente ve el prefijo +57 en el formulario de contacto</li>
                <li>Solo necesita introducir su número local (ej: 312456789)</li>
                <li>El sistema formatea automáticamente como +57312456789</li>
                <li>El mensaje de WhatsApp se envía al número correcto</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <CountryPrefixesInfo />
      </div>
    </MainLayout>
  );
};

export default PhonePrefixHelp; 