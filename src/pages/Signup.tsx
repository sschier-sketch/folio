import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { SignupForm } from "../components/auth/SignupForm";
import { useAuth } from "../hooks/useAuth";
import {
  Building2,
  Sparkles,
  Check,
  Zap,
  Users,
  TrendingUp,
  Shield,
  Gift,
  Trophy,
} from "lucide-react";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { RefLink } from "../components/common/RefLink";
import { getReferralCode } from "../lib/referralTracking";
import { trackReferralClick, getReferralCodeFromURL } from "../lib/referralClickTracking";

export function Signup() {
  const { user, loading } = useAuth();
  const [hasReferralCode, setHasReferralCode] = useState(false);

  useEffect(() => {
    const refCode = getReferralCode();
    setHasReferralCode(!!refCode);

    const urlRefCode = getReferralCodeFromURL();
    if (urlRefCode) {
      trackReferralClick(urlRefCode);
    }
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {" "}
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />{" "}
      </div>
    );
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50">
      {" "}
      <Header />{" "}
      <div className="py-12 px-4 sm:px-6 lg:px-8 mt-16">
        {" "}
        <div className="max-w-6xl mx-auto">
          {" "}
          <div className="text-center mb-8">
            {" "}
            {hasReferralCode ? (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300 rounded-full px-6 py-3 mb-4 shadow-sm">
                {" "}
                <Gift className="w-5 h-5 text-emerald-600" />{" "}
                <span className="text-sm font-bold text-emerald-900">
                  🎉 Sie erhalten 2 Monate PRO gratis!
                </span>{" "}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-full px-4 py-2 mb-4">
                {" "}
                <Trophy className="w-4 h-4 text-amber-600" />{" "}
                <span className="text-sm font-semibold text-amber-800">
                  Kostenlos starten & sofort loslegen
                </span>{" "}
              </div>
            )}{" "}
            <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-4">
              {" "}
              Erstellen Sie Ihr{" "}
              <span className="bg-gradient-to-r from-primary-blue to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Rentably-Konto{" "}
              </span>{" "}
            </h1>{" "}
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {" "}
              In weniger als 60 Sekunden zum professionellen
              Immobilien-Management{" "}
            </p>{" "}
          </div>{" "}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {" "}
            <div className="order-2 lg:order-1 space-y-6">
              {" "}
              <div className="bg-gradient-to-br from-primary-blue to-primary-blue rounded-full p-8 text-white">
                {" "}
                <div className="flex items-center gap-3 mb-6">
                  {" "}
                  <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                    {" "}
                    <Sparkles className="w-6 h-6" />{" "}
                  </div>{" "}
                  <h3 className="text-2xl font-bold">Was Sie erwartet</h3>{" "}
                </div>{" "}
                <div className="space-y-4">
                  {" "}
                  <div className="flex items-start gap-3 bg-white/10 rounded-lg p-4 backdrop-blur">
                    {" "}
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      {" "}
                      <Check className="w-5 h-5 text-white" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-semibold mb-1">
                        Unbegrenzt Objekte & Mieter
                      </h4>{" "}
                      <p className="text-sm text-primary-blue/20">
                        Verwalten Sie beliebig viele Immobilien und Mieter -
                        komplett kostenlos
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-start gap-3 bg-white/10 rounded-lg p-4 backdrop-blur">
                    {" "}
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      {" "}
                      <Check className="w-5 h-5 text-white" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-semibold mb-1">
                        Sofort einsatzbereit
                      </h4>{" "}
                      <p className="text-sm text-primary-blue/20">
                        Keine Wartezeit - direkt nach der Registrierung loslegen
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-start gap-3 bg-white/10 rounded-lg p-4 backdrop-blur">
                    {" "}
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      {" "}
                      <Check className="w-5 h-5 text-white" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-semibold mb-1">
                        Keine Kreditkarte nötig
                      </h4>{" "}
                      <p className="text-sm text-primary-blue/20">
                        Starten Sie risikofrei ohne Zahlungsinformationen
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div className="bg-white rounded p-6 hover:transition-shadow">
                  {" "}
                  <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center mb-3">
                    {" "}
                    <Building2 className="w-5 h-5 text-primary-blue" />{" "}
                  </div>{" "}
                  <h4 className="font-semibold text-dark mb-1">
                    Objektverwaltung
                  </h4>{" "}
                  <p className="text-sm text-gray-400">
                    Alle Immobilien im Blick
                  </p>{" "}
                </div>{" "}
                <div className="bg-white rounded p-6 hover:transition-shadow">
                  {" "}
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                    {" "}
                    <Users className="w-5 h-5 text-emerald-600" />{" "}
                  </div>{" "}
                  <h4 className="font-semibold text-dark mb-1">
                    Mieterverwaltung
                  </h4>{" "}
                  <p className="text-sm text-gray-400">
                    Zentrale Datenverwaltung
                  </p>{" "}
                </div>{" "}
                <div className="bg-white rounded p-6 hover:transition-shadow">
                  {" "}
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                    {" "}
                    <TrendingUp className="w-5 h-5 text-amber-600" />{" "}
                  </div>{" "}
                  <h4 className="font-semibold text-dark mb-1">
                    Renditeanalyse
                  </h4>{" "}
                  <p className="text-sm text-gray-400">
                    Profitabilität tracken
                  </p>{" "}
                </div>{" "}
                <div className="bg-white rounded p-6 hover:transition-shadow">
                  {" "}
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-3">
                    {" "}
                    <Shield className="w-5 h-5 text-violet-600" />{" "}
                  </div>{" "}
                  <h4 className="font-semibold text-dark mb-1">100% Sicher</h4>{" "}
                  <p className="text-sm text-gray-400">DSGVO-konform</p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-full p-6">
                {" "}
                <div className="flex items-start gap-3">
                  {" "}
                  <Gift className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />{" "}
                  <div>
                    {" "}
                    <h4 className="font-semibold text-dark mb-1">
                      Pro-Features für nur 9 EUR/Monat
                    </h4>{" "}
                    <p className="text-sm text-gray-400">
                      {" "}
                      Upgraden Sie später für Ticketsystem, automatische
                      Mieterhöhungs-Erinnerungen und erweiterte Analysen{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="order-1 lg:order-2">
              {" "}
              <div className="bg-white rounded-md p-8 sticky top-24">
                {" "}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {" "}
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-blue to-primary-blue rounded-full flex items-center justify-center">
                    {" "}
                    <Zap className="w-6 h-6 text-white" />{" "}
                  </div>{" "}
                  <h2 className="text-2xl font-bold text-dark">
                    Schnellstart
                  </h2>{" "}
                </div>{" "}
                <SignupForm
                  onSuccess={() => (window.location.href = "/dashboard")}
                />{" "}
                <div className="mt-6 pt-6 border-t text-center">
                  {" "}
                  <p className="text-sm text-gray-400">
                    {" "}
                    Bereits registriert?{" "}
                    <RefLink
                      to="/login"
                      className="font-semibold text-primary-blue hover:text-primary-blue"
                    >
                      {" "}
                      Jetzt anmelden{" "}
                    </RefLink>{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <Footer />
    </div>
  );
}
