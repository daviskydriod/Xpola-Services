// FILE PATH: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider }       from '@/contexts/ThemeContext';
import { CountryProvider }     from '@/contexts/CountryContext';
import { CartProvider }        from '@/contexts/CartContext';
import { AdminProvider }       from '@/contexts/AdminContext';
import { AuthProvider }        from '@/contexts/AuthContext';
import { MaintenanceProvider, useMaintenance } from '@/contexts/MaintenanceContext';
import ProtectedRoute          from '@/components/ProtectedRoute';
import MaintenancePage         from '@/pages/MaintenancePage';

import Index        from '@/pages/Index';
import VerifyEmail from './pages/VerifyEmail';
import Services     from '@/pages/Services';
import About        from '@/pages/About';
import Contact      from '@/pages/Contact';
import Login        from '@/pages/Login';
import Account      from '@/pages/Account';
import Shop         from '@/pages/Shop';
import ShopCategory from '@/pages/ShopCategory';
import ProductDetail from '@/pages/ProductDetail';
import Checkout     from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import AdminLogin     from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import PaymentVerify from '@/pages/PaymentVerify';
import CanadaComingSoon from '@/pages/CanadaComingSoon';
import Projects     from '@/pages/Projects';


import ConsultingNigeria   from '@/pages/nigeria/ConsultingService';
import OilGasNigeria       from '@/pages/nigeria/OilGasService';
import ConstructionNigeria from '@/pages/nigeria/ConstructionService';
import MiningNigeria       from '@/pages/nigeria/MiningService';
import CommerceNigeria     from '@/pages/nigeria/CommerceService';
import EcommerceNigeria    from '@/pages/nigeria/EcommerceService';
import LogisticsNigeria    from '@/pages/nigeria/LogisticsService';
import ConsultingCanada from '@/pages/canada/ConsultingService';
import OperationsCanada from '@/pages/canada/OperationsService';
import LogisticsCanada  from '@/pages/canada/LogisticsService';
import TradeCanada      from '@/pages/canada/TradeService';
import CommunityCanada  from '@/pages/canada/CommunityService';

import PrivacyPolicy   from '@/pages/PrivacyPolicy';
import TermsOfService  from '@/pages/TermsOfService';
import CookiePolicy    from '@/pages/CookiePolicy';
import CookieConsent   from '@/components/CookieConsent';
import { MARKET_CONFIG } from '@/config/markets';

import './styles/globals.css';

// Maintenance guard wraps all public routes
const PublicRoutes = () => {
  const { maintenance, loading } = useMaintenance();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <svg className="w-8 h-8 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  if (maintenance) return <MaintenancePage />;

  return (
    <Routes>
      <Route path="/"         element={<Index />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/services" element={<Services />} />
      <Route path="/about"    element={<About />} />
      {MARKET_CONFIG.projectsEnabled && <Route path="/projects" element={<Projects />} />}
      <Route path="/contact"  element={<Contact />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/account"  element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/shop/product/:id" element={<ProductDetail />} />
      <Route path="/payment/verify" element={<ProtectedRoute><PaymentVerify /></ProtectedRoute>} />
      <Route path="/checkout"      element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      
      <Route path="/order-success" element={<OrderSuccess />} />

      {/* Legal pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms"   element={<TermsOfService />} />
      <Route path="/cookies" element={<CookiePolicy />} />

      {/* Nigeria */}
      <Route path="/nigeria"          element={<Index />} />
      <Route path="/nigeria/about"    element={<About />} />
      <Route path="/nigeria/services" element={<Services />} />
      {MARKET_CONFIG.projectsEnabled && <Route path="/nigeria/projects" element={<Projects />} />}
      <Route path="/nigeria/contact"  element={<Contact />} />
      <Route path="/nigeria/shop"            element={<Shop />} />
      <Route path="/nigeria/shop/categories" element={<ShopCategory />} />
      <Route path="/nigeria/checkout"        element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/nigeria/services/consulting"   element={<ConsultingNigeria />} />
      <Route path="/nigeria/services/oil-gas"      element={<OilGasNigeria />} />
      <Route path="/nigeria/services/construction" element={<ConstructionNigeria />} />
      <Route path="/nigeria/services/mining"       element={<MiningNigeria />} />
      <Route path="/nigeria/services/commerce"     element={<CommerceNigeria />} />
      <Route path="/nigeria/services/ecommerce"    element={<EcommerceNigeria />} />
      <Route path="/nigeria/services/logistics"    element={<LogisticsNigeria />} />

      {/* Canada information and service pages remain live. Only the marketplace is gated. */}
      <Route path="/canada"          element={<Index />} />
      <Route path="/canada/about"    element={<About />} />
      <Route path="/canada/services" element={<Services />} />
      {MARKET_CONFIG.projectsEnabled && <Route path="/canada/projects" element={<Projects />} />}
      <Route path="/canada/contact"  element={<Contact />} />
      {!MARKET_CONFIG.canadaEnabled && <Route path="/canada/shop/*" element={<CanadaComingSoon />} />}
      {!MARKET_CONFIG.canadaEnabled && <Route path="/canada/checkout" element={<CanadaComingSoon />} />}
      {MARKET_CONFIG.canadaEnabled && <>
        <Route path="/canada/shop"            element={<Shop />} />
        <Route path="/canada/shop/categories" element={<ShopCategory />} />
        <Route path="/canada/checkout"        element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      </>}
      <Route path="/canada/services/consulting" element={<ConsultingCanada />} />
      <Route path="/canada/services/operations" element={<OperationsCanada />} />
      <Route path="/canada/services/logistics"  element={<LogisticsCanada />} />
      <Route path="/canada/services/trade"      element={<TradeCanada />} />
      <Route path="/canada/services/community"  element={<CommunityCanada />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MaintenanceProvider>
        <CountryProvider>
          <CartProvider>
            <AdminProvider>
              <AuthProvider>
                <Routes>
                  {/* Admin — always accessible, bypasses maintenance */}
                  <Route path="/admin"           element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  {/* Everything else goes through maintenance guard */}
                  <Route path="/*" element={<PublicRoutes />} />
                </Routes>
                <CookieConsent />
              </AuthProvider>
            </AdminProvider>
          </CartProvider>
        </CountryProvider>
      </MaintenanceProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
