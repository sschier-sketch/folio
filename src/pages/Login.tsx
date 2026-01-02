import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { Sparkles } from 'lucide-react';
import { Header } from '../components/Header';

export function Login() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100">
      <Header />

      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 mt-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <img src="/rentably-logo.svg" alt="Rentab.ly" className="h-16 w-auto" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
            Willkommen zurück
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Noch kein Konto?{' '}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Jetzt kostenlos registrieren
              <Sparkles className="w-4 h-4" />
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl border border-slate-200 rounded-2xl sm:px-10">
            <LoginForm onSuccess={() => window.location.href = '/dashboard'} />
          </div>
        </div>
      </div>
    </div>
  );
}