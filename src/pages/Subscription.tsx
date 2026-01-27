import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Info, Loader2, ArrowLeft } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { PLANS, type PlanId, type BillingInterval, getPlanByStripePriceId, getStripePriceId, calculateYearlySavings } from '../config/plans';
import { createCheckoutSession, createPortalSession } from '../lib/stripe-api';

export function Subscription() {
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  const currentPlan = subscription?.price_id ? getPlanByStripePriceId(subscription.price_id) : null;
  const currentPlanId = currentPlan?.planId || 'basic';
  const currentInterval = currentPlan?.interval || 'month';
  const isActive = subscription?.subscription_status === 'active';

  const handleUpgrade = async (planId: PlanId, interval: BillingInterval) => {
    const priceId = getStripePriceId(planId, interval);
    if (!priceId) return;

    setLoading(priceId);
    try {
      const url = await createCheckoutSession({ priceId });
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Fehler beim Erstellen der Checkout-Session. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  const handleDowngrade = async () => {
    const basicPriceId = PLANS.basic.stripePriceId;
    if (!basicPriceId) return;

    setLoading(basicPriceId);
    setShowDowngradeModal(false);
    try {
      const url = await createCheckoutSession({ priceId: basicPriceId });
      window.location.href = url;
    } catch (error) {
      console.error('Error downgrading:', error);
      alert('Fehler beim Downgrade. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('portal');
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Fehler beim Öffnen des Kundenportals. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  const handleChangeBillingInterval = async (newInterval: BillingInterval) => {
    if (currentPlanId !== 'pro') return;

    const newPriceId = getStripePriceId('pro', newInterval);
    if (!newPriceId) return;

    setLoading(newPriceId);
    try {
      const url = await createCheckoutSession({ priceId: newPriceId });
      window.location.href = url;
    } catch (error) {
      console.error('Error changing billing interval:', error);
      alert('Fehler beim Wechseln des Abrechnungszeitraums. Bitte versuchen Sie es erneut.');
      setLoading(null);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const yearlySavings = calculateYearlySavings();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ihr Tarif</h1>
          <p className="text-lg text-gray-600">
            Verwalten Sie Ihr Abonnement und wählen Sie den passenden Plan
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Aktueller Tarif</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {PLANS[currentPlanId].name}
              </h2>
              <p className="text-gray-600 mt-1">
                {currentPlanId === 'pro' && currentInterval === 'year' ? 'Jährliche Abrechnung' :
                 currentPlanId === 'pro' ? 'Monatliche Abrechnung' : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {currentPlanId === 'basic' ? (
                  <>
                    {PLANS[currentPlanId].currencySymbol}0
                  </>
                ) : currentInterval === 'year' ? (
                  <>
                    {PLANS[currentPlanId].currencySymbol}
                    {((PLANS[currentPlanId].priceYearly || 0) / 12).toFixed(2)}
                    <span className="text-lg text-gray-500 font-normal">/Monat</span>
                  </>
                ) : (
                  <>
                    {PLANS[currentPlanId].currencySymbol}
                    {PLANS[currentPlanId].priceMonthly}
                    <span className="text-lg text-gray-500 font-normal">/Monat</span>
                  </>
                )}
              </div>
              {currentPlanId === 'pro' && currentInterval === 'year' && (
                <p className="text-sm text-green-600 mt-1">
                  Jährlich: {PLANS.pro.currencySymbol}{PLANS.pro.priceYearly}
                </p>
              )}
            </div>
          </div>

          {isActive && currentPlanId === 'pro' && (
            <button
              onClick={handleManageSubscription}
              disabled={loading === 'portal'}
              className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'portal' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird geladen...
                </>
              ) : (
                'Abo verwalten'
              )}
            </button>
          )}
        </div>

        {/* Subscription Status Info */}
        {subscription?.subscription_status && !isActive && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Zahlung ausstehend:</strong> Ihr Abonnement ist momentan nicht aktiv.
                Bitte überprüfen Sie Ihre Zahlungsinformationen.
              </p>
              <button
                onClick={handleManageSubscription}
                className="mt-2 text-sm text-yellow-900 underline hover:no-underline"
              >
                Zahlungsmethode aktualisieren
              </button>
            </div>
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentPlanId === 'basic' ? 'Upgraden Sie auf Pro' : 'Verfügbare Tarife'}
          </h2>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
          {/* Basic Plan */}
          {currentPlanId === 'pro' && (
            <div className="bg-white rounded-lg border-2 border-gray-200 p-8 hover:shadow-lg transition-all relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {PLANS.basic.name}
                </h3>
                <p className="text-gray-600">{PLANS.basic.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {PLANS.basic.currencySymbol}{PLANS.basic.priceMonthly}
                  </span>
                  <span className="text-gray-500">/Monat</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.basic.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowDowngradeModal(true)}
                disabled={!!loading}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zu Basic wechseln
              </button>
            </div>
          )}

          {/* Pro Plan */}
          {currentPlanId === 'basic' && (
            <div className="bg-white rounded-lg border-2 border-blue-500 p-8 hover:shadow-lg transition-all relative">
              {PLANS.pro.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-block px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                    Empfohlen
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {PLANS.pro.name}
                </h3>
                <p className="text-gray-600">{PLANS.pro.description}</p>
              </div>

              {/* Billing Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setBillingInterval('month')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      billingInterval === 'month'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monatlich
                  </button>
                  <button
                    onClick={() => setBillingInterval('year')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      billingInterval === 'year'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Jährlich
                    <span className="ml-1 text-xs text-green-600 font-semibold">
                      -{yearlySavings}%
                    </span>
                  </button>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {PLANS.pro.currencySymbol}
                    {billingInterval === 'month'
                      ? PLANS.pro.priceMonthly
                      : ((PLANS.pro.priceYearly || 0) / 12).toFixed(2)}
                  </span>
                  <span className="text-gray-500">/Monat</span>
                </div>
                {billingInterval === 'year' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Jährlich: {PLANS.pro.currencySymbol}{PLANS.pro.priceYearly}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('pro', billingInterval)}
                disabled={!!loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === getStripePriceId('pro', billingInterval) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  'Jetzt upgraden'
                )}
              </button>
            </div>
          )}

          {/* Pro Plan - For Pro Users (to switch billing) */}
          {currentPlanId === 'pro' && (
            <div className="bg-white rounded-lg border-2 border-blue-500 p-8 hover:shadow-lg transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-block px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                  Aktuell
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {PLANS.pro.name}
                </h3>
                <p className="text-gray-600">{PLANS.pro.description}</p>
              </div>

              {/* Billing Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setBillingInterval('month')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      billingInterval === 'month'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monatlich
                  </button>
                  <button
                    onClick={() => setBillingInterval('year')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      billingInterval === 'year'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Jährlich
                    <span className="ml-1 text-xs text-green-600 font-semibold">
                      -{yearlySavings}%
                    </span>
                  </button>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {PLANS.pro.currencySymbol}
                    {billingInterval === 'month'
                      ? PLANS.pro.priceMonthly
                      : ((PLANS.pro.priceYearly || 0) / 12).toFixed(2)}
                  </span>
                  <span className="text-gray-500">/Monat</span>
                </div>
                {billingInterval === 'year' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Jährlich: {PLANS.pro.currencySymbol}{PLANS.pro.priceYearly}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {currentInterval !== billingInterval && (
                <button
                  onClick={() => handleChangeBillingInterval(billingInterval)}
                  disabled={!!loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === getStripePriceId('pro', billingInterval) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird geladen...
                    </>
                  ) : (
                    <>
                      Auf {billingInterval === 'month' ? 'monatlich' : 'jährlich'} wechseln
                    </>
                  )}
                </button>
              )}

              {currentInterval === billingInterval && (
                <button
                  disabled
                  className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                >
                  Ihr aktueller Plan
                </button>
              )}
            </div>
          )}
        </div>

        {/* Trust Elements */}
        <div className="bg-gray-100 rounded-lg p-6 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Jederzeit kündbar:</strong> Sie können Ihr Abonnement jederzeit über das Kundenportal kündigen.
              </p>
              <p>
                <strong>Sichere Zahlung:</strong> Alle Zahlungen werden sicher über Stripe verarbeitet.
              </p>
              <p>
                <strong>Flexible Abrechnung:</strong> Wechseln Sie jederzeit zwischen monatlicher und jährlicher Abrechnung.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Auf Basic downgraden?
            </h3>
            <p className="text-gray-600 mb-6">
              Sind Sie sicher, dass Sie zu Basic wechseln möchten? Sie verlieren den Zugriff auf alle Pro-Features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDowngrade}
                disabled={!!loading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  'Ja, downgraden'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
