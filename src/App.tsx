import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const queryClient = new QueryClient();

// Initialize Google Auth for the Web platform
GoogleAuth.initialize({
  clientId: '776701945232-kfjjlrq1kiivtsov9re4hpj3e78cu1k2.apps.googleusercontent.com',
  scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
  grantOfflineAccess: true,
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner 
        closeButton 
        toastOptions={{
          classNames: {
            closeButton: "!right-4 !left-auto !top-1/2 !-translate-y-1/2 bg-background border-border"
          }
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;