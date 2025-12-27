import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mypuvkzsgwanilduniup.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      stripe_user_subscriptions: {
        Row: {
          customer_id: string | null;
          subscription_id: string | null;
          subscription_status: string | null;
          price_id: string | null;
          current_period_start: number | null;
          current_period_end: number | null;
          cancel_at_period_end: boolean | null;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
        };
        Insert: never;
        Update: never;
      };
      stripe_user_orders: {
        Row: {
          customer_id: string | null;
          order_id: number | null;
          checkout_session_id: string | null;
          payment_intent_id: string | null;
          amount_subtotal: number | null;
          amount_total: number | null;
          currency: string | null;
          payment_status: string | null;
          order_status: string | null;
          order_date: string | null;
        };
        Insert: never;
        Update: never;
      };
    };
    Views: {
      stripe_user_subscriptions: {
        Row: {
          customer_id: string | null;
          subscription_id: string | null;
          subscription_status: string | null;
          price_id: string | null;
          current_period_start: number | null;
          current_period_end: number | null;
          cancel_at_period_end: boolean | null;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
        };
      };
      stripe_user_orders: {
        Row: {
          customer_id: string | null;
          order_id: number | null;
          checkout_session_id: string | null;
          payment_intent_id: string | null;
          amount_subtotal: number | null;
          amount_total: number | null;
          currency: string | null;
          payment_status: string | null;
          order_status: string | null;
          order_date: string | null;
        };
      };
    };
  };
};