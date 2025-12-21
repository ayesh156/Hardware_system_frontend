import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./lib/i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminLayout } from "./components/AdminLayout";

// Eager load Dashboard (landing page)
import { Dashboard } from "./pages/Dashboard";

// Lazy load all other pages
const Invoices = lazy(() => import("./pages/Invoices").then(m => ({ default: m.Invoices })));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice").then(m => ({ default: m.CreateInvoice })));
const QuickCheckout = lazy(() => import("./pages/QuickCheckout").then(m => ({ default: m.QuickCheckout })));
const BarcodeLabels = lazy(() => import("./pages/BarcodeLabels").then(m => ({ default: m.BarcodeLabels })));
const ViewInvoice = lazy(() => import("./pages/ViewInvoice").then(m => ({ default: m.ViewInvoice })));
const EditInvoice = lazy(() => import("./pages/EditInvoice").then(m => ({ default: m.EditInvoice })));
const FinancialReports = lazy(() => import("./pages/FinancialReports").then(m => ({ default: m.FinancialReports })));
const Products = lazy(() => import("./pages/Products").then(m => ({ default: m.Products })));
const Categories = lazy(() => import("./pages/Categories").then(m => ({ default: m.Categories })));
const Brands = lazy(() => import("./pages/Brands").then(m => ({ default: m.Brands })));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Customers = lazy(() => import("./pages/Customers").then(m => ({ default: m.Customers })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const Help = lazy(() => import("./pages/Help").then(m => ({ default: m.Help })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AdminLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/invoices/create" element={<CreateInvoice />} />
                  <Route path="/invoices/quick-checkout" element={<QuickCheckout />} />
                  <Route path="/invoices/:id" element={<ViewInvoice />} />
                  <Route path="/invoices/:id/edit" element={<EditInvoice />} />
                  <Route path="/financial-reports" element={<FinancialReports />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/barcode-labels" element={<BarcodeLabels />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<Help />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AdminLayout>
          </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
