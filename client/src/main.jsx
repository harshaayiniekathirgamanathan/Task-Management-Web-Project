import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

// Bootstrap styles — imported once here so the whole app is styled
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import AppRoutes from './AppRoutes.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter turns on page navigation for the whole app */}
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);