import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { initReferralTracking } from "./lib/referralTracking";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ResetPassword } from "./pages/ResetPassword";
import Dashboard from "./components/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import { Datenschutz } from "./pages/Datenschutz";
import { AGB } from "./pages/AGB";
import { AVV } from "./pages/AVV";
import LandingPage from "./components/LandingPage";
import { Admin } from "./pages/Admin";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import TenantPortalPage from "./pages/TenantPortalPage";
import { AccountBanned } from "./pages/AccountBanned";
import { supabase } from "./lib/supabase";
import { GTMProvider } from "./components/GTMProvider";
import SeoHead from "./components/SeoHead";
import OperatingCostWizardStep1 from "./components/billing/OperatingCostWizardStep1";
import OperatingCostWizardStep2 from "./components/billing/OperatingCostWizardStep2";
import OperatingCostWizardStep3 from "./components/billing/OperatingCostWizardStep3";
import AdminMagazinePostEditor from "./components/admin/AdminMagazinePostEditor";
import { Magazine } from "./pages/Magazine";
import { MagazinePost } from "./pages/MagazinePost";

function PasswordRecoveryHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkForRecovery = () => {
      const hash = window.location.hash;
      const search = window.location.search;

      if (
        (hash && hash.includes("type=recovery")) ||
        (search && search.includes("type=recovery"))
      ) {
        navigate("/reset-password" + hash, { replace: true });
      }
    };

    checkForRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        const hash = window.location.hash;
        navigate("/reset-password" + hash, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

initReferralTracking();

function App() {
  return (
    <GTMProvider>
      <Router>
        <SeoHead />
        <PasswordRecoveryHandler />
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/confirm" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb" element={<AGB />} />
        <Route path="/avv" element={<AVV />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/support" element={<Support />} />
        <Route path="/tenant-portal/:userId" element={<TenantPortalPage />} />
        <Route path="/account-banned" element={<AccountBanned />} />
        <Route path="/magazin" element={<Magazine />} />
        <Route path="/magazin/:slug" element={<MagazinePost />} />
        <Route path="/magazine" element={<Magazine />} />
        <Route path="/magazine/:slug" element={<MagazinePost />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/subscription" element={<Navigate to="/dashboard?view=settings-billing" replace />} />
        <Route path="/subscription/success" element={<Navigate to="/dashboard?payment=success" replace />} />
        <Route path="/subscription/cancelled" element={<Navigate to="/dashboard?view=settings-billing" replace />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/abrechnungen/betriebskosten/neu"
          element={
            <ProtectedRoute>
              <OperatingCostWizardStep1 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/abrechnungen/betriebskosten/:id/kosten"
          element={
            <ProtectedRoute>
              <OperatingCostWizardStep2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/abrechnungen/betriebskosten/:id/versand"
          element={
            <ProtectedRoute>
              <OperatingCostWizardStep3 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/magazine/posts/new"
          element={
            <ProtectedRoute>
              <AdminMagazinePostEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/magazine/posts/:postId/edit"
          element={
            <ProtectedRoute>
              <AdminMagazinePostEditor />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Router>
    </GTMProvider>
  );
}

export default App;
