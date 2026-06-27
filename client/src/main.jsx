import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

// Self-hosted fonts (no external <link>): Inter for UI, JetBrains Mono for data.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';

// Bootstrap styles — imported once here so the whole app is styled
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
// Expo-inspired theme — loaded last so it overrides Bootstrap defaults
import './styles/expo-theme.css';

import AppRoutes from './AppRoutes.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter turns on page navigation for the whole app */}
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);