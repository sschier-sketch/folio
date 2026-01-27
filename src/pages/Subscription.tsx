import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SubscriptionPlans } from '../components/subscription/SubscriptionPlans';

export function Subscription() {
  const navigate = useNavigate();

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

        <div className="max-w-5xl mx-auto">
          <SubscriptionPlans showCurrentPlanCard={true} />
        </div>
      </div>
    </div>
  );
}
