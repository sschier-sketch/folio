import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import Dashboard from './components/Dashboard';
import { Subscription } from './pages/Subscription';
import { SubscriptionSuccess } from './pages/SubscriptionSuccess';
import { ProtectedRoute } from './components/ProtectedRoute';
import Contact from './pages/Contact';
import Impressum from './pages/Impressum';
import LandingPage from './components/LandingPage';
import { Admin } from './pages/Admin';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Support from './pages/Support';
import { PasswordResetModal } from './components/auth/PasswordResetModal';
import { useAuth } from './hooks/useAuth';

function App() {
  const { showPasswordReset, setShowPasswordReset } = useAuth();

  return (
    <Router>
      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/support" element={<Support />} />
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
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;