import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SuggestionProvider } from "@/contexts/SuggestionContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from '@/components/ui/ToastContainer';
import AppRoutes from '@/routes';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/contexts/AuthContext';

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();
  useOnlineStatus();
  
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <SuggestionProvider>
              <ToastContainer />
              <AppContent />
            </SuggestionProvider>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
