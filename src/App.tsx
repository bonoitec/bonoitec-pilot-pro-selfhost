import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

// Landing pages
import LandingLayout from "@/components/landing/LandingLayout";
import Landing from "./pages/Landing";
import LandingFonctionnalites from "./pages/LandingFonctionnalites";
import LandingTarifs from "./pages/LandingTarifs";
import LandingBlog from "./pages/LandingBlog";
import LandingSupport from "./pages/LandingSupport";
import LandingSupportDetail from "./pages/LandingSupportDetail";
import LandingContact from "./pages/LandingContact";

// App pages
import Index from "./pages/Index";
import Repairs from "./pages/Repairs";
import Clients from "./pages/Clients";
import Devices from "./pages/Devices";
import Stock from "./pages/Stock";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Technicians from "./pages/Technicians";
import Statistics from "./pages/Statistics";
import AIAssistant from "./pages/AIAssistant";
import SettingsPage from "./pages/SettingsPage";
import RepairLibrary from "./pages/RepairLibrary";
import QRDeposit from "./pages/QRDeposit";
import IMEIScanner from "./pages/IMEIScanner";
import DeviceCatalog from "./pages/DeviceCatalog";
import RepairTracking from "./pages/RepairTracking";
import DepositForm from "./pages/DepositForm";
import Services from "./pages/Services";
import Articles from "./pages/Articles";
import StockAlerts from "./pages/StockAlerts";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public landing pages */}
            <Route element={<LandingLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/fonctionnalites" element={<LandingFonctionnalites />} />
              <Route path="/tarifs" element={<LandingTarifs />} />
              <Route path="/blog" element={<LandingBlog />} />
              <Route path="/support" element={<LandingSupport />} />
              <Route path="/support/:slug" element={<LandingSupportDetail />} />
              <Route path="/contact" element={<LandingContact />} />
            </Route>

            {/* Auth pages */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/repair/:code" element={<RepairTracking />} />
            <Route path="/deposit/:code" element={<DepositForm />} />

            {/* Protected app pages */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/repairs" element={<Repairs />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/technicians" element={<Technicians />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/repair-library" element={<RepairLibrary />} />
              <Route path="/qr-deposit" element={<QRDeposit />} />
              <Route path="/imei-scanner" element={<IMEIScanner />} />
              <Route path="/device-catalog" element={<DeviceCatalog />} />
              <Route path="/services" element={<Services />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/stock-alerts" element={<StockAlerts />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
