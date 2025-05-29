import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SuggestionProvider } from "@/contexts/SuggestionContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from '@/components/ui/ToastContainer';
import AppRoutes from '@/routes';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastProvider>
        <AuthProvider>
          <SuggestionProvider>
            <ToastContainer />
            <Router>
              <AppRoutes />
            </Router>
          </SuggestionProvider>
        </AuthProvider>
      </ToastProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
