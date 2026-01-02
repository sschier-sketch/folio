import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function SubscriptionSuccess() {
  useEffect(() => {
    // Clear any checkout-related data from localStorage if needed
    localStorage.removeItem('checkout_session_id');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h2>
          
          <p className="text-gray-600 mb-8">
            Thank you for your subscription. Your account has been upgraded and you now have access to all premium features.
          </p>

          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            
            <Link
              to="/subscription"
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Subscription Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}