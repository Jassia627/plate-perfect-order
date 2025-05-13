import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./hooks/use-auth";
import { CurrencyProvider } from "./hooks/use-currency";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DatabaseInitializer from "@/components/database/DatabaseInitializer";
import DatabaseErrorHandler from "@/components/database/DatabaseErrorHandler";
import React, { Suspense } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Tables from "./pages/Tables";
import Kitchen from "./pages/Kitchen";
import Menu from "./pages/Menu";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import Admin from "./pages/Admin";
import Cashier from "./pages/Cashier";
import NotFound from "./pages/NotFound";
import PublicMenu from "./pages/PublicMenu";
import PhonePrefixHelp from "./pages/PhonePrefixHelp";

// Carga perezosa de la página de diagnóstico
const Diagnostico = React.lazy(() => import('./pages/Diagnostico'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DatabaseInitializer>
              <DatabaseErrorHandler />
              <BrowserRouter>
                <Routes>
                  {/* Rutas públicas accesibles sin autenticación */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/menu/:adminId" element={<PublicMenu />} />
                  
                  {/* Rutas protegidas que requieren autenticación */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/tables" element={
                    <ProtectedRoute>
                      <Tables />
                    </ProtectedRoute>
                  } />
                  <Route path="/kitchen" element={
                    <ProtectedRoute>
                      <Kitchen />
                    </ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } />
                  <Route path="/menu" element={
                    <ProtectedRoute>
                      <Menu />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff" element={
                    <ProtectedRoute>
                      <Staff />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="/cashier" element={
                    <ProtectedRoute>
                      <Cashier />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/phone-prefix-help" element={
                    <ProtectedRoute>
                      <PhonePrefixHelp />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/diagnostico" element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Cargando diagnóstico...</div>}>
                        <Diagnostico />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Ruta de página no encontrada */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </DatabaseInitializer>
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
