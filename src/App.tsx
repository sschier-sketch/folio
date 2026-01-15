import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ResetPassword } from "./pages/ResetPassword";
import Dashboard from "./components/Dashboard";
import { Subscription } from "./pages/Subscription";
import { SubscriptionSuccess } from "./pages/SubscriptionSuccess";
import { SubscriptionCancelled } from "./pages/SubscriptionCancelled";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import LandingPage from "./components/LandingPage";
import { Admin } from "./pages/Admin";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import TenantPortalPage from "./pages/TenantPortalPage";
import { AccountBanned } from "./pages/AccountBanned";
import { supabase } from "./lib/supabase";
import { GTMProvider } from "./components/GTMProvider";

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

function App() {
  return (
    <GTMProvider>
      <Router>
        <PasswordRecoveryHandler />
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/confirm" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/support" element={<Support />} />
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
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription/success"
          element={
            <ProtectedRoute>
              <SubscriptionSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription/cancelled"
          element={
            <ProtectedRoute>
              <SubscriptionCancelled />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Router>
    </GTMProvider>
  );
}

export default App;
