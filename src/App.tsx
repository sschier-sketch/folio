import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { initReferralTracking } from "./lib/referralTracking";
import { trackReferralClick, getReferralCodeFromURL } from "./lib/referralClickTracking";
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
import TenantPortalPage from "./pages/TenantPortalPage";
import TenantPortalSetup from "./pages/TenantPortalSetup";
import TenantResetPassword from "./pages/TenantResetPassword";
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
import MarketingLayout from "./components/marketing/MarketingLayout";
import UeberUns from "./pages/UeberUns";
import Mietverwaltung from "./pages/funktionen/Mietverwaltung";
import Immobilienmanagement from "./pages/funktionen/Immobilienmanagement";
import Kommunikation from "./pages/funktionen/Kommunikation";
import Buchhaltung from "./pages/funktionen/Buchhaltung";
import Dokumente from "./pages/funktionen/Dokumente";
import Nebenkostenabrechnung from "./pages/funktionen/Nebenkostenabrechnung";
import Mieterportal from "./pages/funktionen/Mieterportal";
import Uebergabeprotokoll from "./pages/funktionen/Uebergabeprotokoll";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    if (
      (hash && hash.includes("type=recovery")) ||
      (search && search.includes("type=recovery"))
    ) {
      navigate("/reset-password" + hash, { replace: true });
      return;
    }

    if (
      location.pathname === "/" &&
      hash &&
      hash.includes("access_token=")
    ) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        const h = window.location.hash;
        navigate("/reset-password" + h, { replace: true });
      }
      if (event === "SIGNED_IN" && location.pathname === "/") {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
}

initReferralTracking();

const urlRefCode = getReferralCodeFromURL();
if (urlRefCode) {
  trackReferralClick(urlRefCode);
}

function App() {
  return (
    <GTMProvider>
      <Router>
        <ScrollToTop />
        <SeoHead />
        <AuthRedirectHandler />
        <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ueber-uns" element={<UeberUns />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/kontakt" element={<Contact />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/agb" element={<AGB />} />
          <Route path="/avv" element={<AVV />} />
          <Route path="/features" element={<Features />} />
          <Route path="/funktionen" element={<Features />} />
          <Route path="/funktionen/mietverwaltung" element={<Mietverwaltung />} />
          <Route path="/funktionen/immobilienmanagement" element={<Immobilienmanagement />} />
          <Route path="/funktionen/kommunikation" element={<Kommunikation />} />
          <Route path="/funktionen/buchhaltung" element={<Buchhaltung />} />
          <Route path="/funktionen/dokumente" element={<Dokumente />} />
          <Route path="/funktionen/nebenkostenabrechnung" element={<Nebenkostenabrechnung />} />
          <Route path="/funktionen/mieterportal" element={<Mieterportal />} />
          <Route path="/funktionen/uebergabeprotokoll" element={<Uebergabeprotokoll />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/preise" element={<Pricing />} />
          <Route path="/magazin" element={<Magazine />} />
          <Route path="/magazin/:slug" element={<MagazinePost />} />
          <Route path="/magazine" element={<Magazine />} />
          <Route path="/magazine/:slug" element={<MagazinePost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/confirm" element={<ResetPassword />} />
        </Route>
        <Route path="/mieterportal-aktivierung" element={<TenantPortalSetup />} />
        <Route path="/tenant-portal/reset-password" element={<TenantResetPassword />} />
        <Route path="/tenant-portal" element={<TenantPortalPage />} />
        <Route path="/tenant-portal/:userId" element={<TenantPortalPage />} />
        <Route path="/account-banned" element={<AccountBanned />} />
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
