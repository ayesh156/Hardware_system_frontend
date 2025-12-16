import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./lib/i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminLayout } from "./components/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { Invoices } from "./pages/Invoices";
import { CreateInvoice } from "./pages/CreateInvoice";
import { ViewInvoice } from "./pages/ViewInvoice";
import { EditInvoice } from "./pages/EditInvoice";
import { FinancialReports } from "./pages/FinancialReports";
import { Products } from "./pages/Products";
import { Categories } from "./pages/Categories";
import { Brands } from "./pages/Brands";
import { Customers } from "./pages/Customers";
import { Settings } from "./pages/Settings";
import { Help } from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <BrowserRouter>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/create" element={<CreateInvoice />} />
                <Route path="/invoices/:id" element={<ViewInvoice />} />
                <Route path="/invoices/:id/edit" element={<EditInvoice />} />
                <Route path="/financial-reports" element={<FinancialReports />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AdminLayout>
          </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
