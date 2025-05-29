import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'sonner'
import { SuggestionProvider } from './contexts/SuggestionContext'

createRoot(document.getElementById("root")!).render(
  <SuggestionProvider>
    <App />
    <Toaster richColors position="top-right" />
  </SuggestionProvider>
);
