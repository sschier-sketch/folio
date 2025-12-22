import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

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