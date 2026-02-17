import { supabase } from "./supabase";

export interface RentPeriod {
  id: string;
  contract_id: string;
  user_id: string;
  effective_date: string;
  cold_rent: number;
  utilities: number;
  reason: "initial" | "increase" | "index" | "stepped" | "migration" | "manual" | "import";
  status: "active" | "planned";
  notes: string;
  vpi_old_month: string | null;
  vpi_old_value: number | null;
  vpi_new_month: string | null;
  vpi_new_value: number | null;
  created_at: string;
}

export interface CurrentRent {
  rent_period_id: string | null;
  cold_rent: number;
  utilities: number;
  effective_date: string;
  reason: string;
  period_status: string;
  vpi_old_month: string | null;
  vpi_old_value: number | null;
  vpi_new_month: string | null;
  vpi_new_value: number | null;
  notes: string | null;
}

export async function getCurrentRent(contractId: string, asOfDate?: string): Promise<CurrentRent | null> {
  const refDate = asOfDate || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("rent_history")
    .select("*")
    .eq("contract_id", contractId)
    .eq("status", "active")
    .lte("effective_date", refDate)
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return {
      rent_period_id: data.id,
      cold_rent: data.cold_rent,
      utilities: data.utilities,
      effective_date: data.effective_date,
      reason: data.reason,
      period_status: data.status || "active",
      vpi_old_month: data.vpi_old_month,
      vpi_old_value: data.vpi_old_value,
      vpi_new_month: data.vpi_new_month,
      vpi_new_value: data.vpi_new_value,
      notes: data.notes,
    };
  }

  const { data: fallback, error: fbError } = await supabase
    .from("rental_contracts")
    .select("monthly_rent, cold_rent, base_rent, additional_costs, utilities_advance, start_date, contract_start")
    .eq("id", contractId)
    .maybeSingle();

  if (fbError || !fallback) return null;

  const rent = fallback.monthly_rent || fallback.cold_rent || fallback.base_rent || 0;
  const utils = fallback.additional_costs || fallback.utilities_advance || 0;

  return {
    rent_period_id: null,
    cold_rent: rent,
    utilities: utils,
    effective_date: fallback.start_date || fallback.contract_start || "",
    reason: "migration",
    period_status: "active",
    vpi_old_month: null,
    vpi_old_value: null,
    vpi_new_month: null,
    vpi_new_value: null,
    notes: null,
  };
}

export async function getCurrentRentAmount(contractId: string, asOfDate?: string): Promise<number> {
  const period = await getCurrentRent(contractId, asOfDate);
  return period?.cold_rent ?? 0;
}

export async function getCurrentRentPeriod(contractId: string, asOfDate?: string): Promise<RentPeriod | null> {
  const refDate = asOfDate || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("rent_history")
    .select("*")
    .eq("contract_id", contractId)
    .eq("status", "active")
    .lte("effective_date", refDate)
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getRentPeriods(contractId: string): Promise<RentPeriod[]> {
  const { data, error } = await supabase
    .from("rent_history")
    .select("*")
    .eq("contract_id", contractId)
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getPlannedPeriods(contractId: string): Promise<RentPeriod[]> {
  const { data, error } = await supabase
    .from("rent_history")
    .select("*")
    .eq("contract_id", contractId)
    .eq("status", "planned")
    .order("effective_date", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getLatestVpiValues(contractId: string): Promise<{
  vpiOldMonth: string | null;
  vpiOldValue: number | null;
  vpiNewMonth: string | null;
  vpiNewValue: number | null;
} | null> {
  const { data, error } = await supabase
    .from("rent_history")
    .select("vpi_old_month, vpi_old_value, vpi_new_month, vpi_new_value")
    .eq("contract_id", contractId)
    .not("vpi_new_value", "is", null)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    vpiOldMonth: data.vpi_new_month,
    vpiOldValue: data.vpi_new_value,
    vpiNewMonth: null,
    vpiNewValue: null,
  };
}

export interface CreateRentPeriodParams {
  contractId: string;
  userId: string;
  effectiveDate: string;
  coldRent: number;
  utilities: number;
  reason: RentPeriod["reason"];
  status: "active" | "planned";
  notes?: string;
  vpiOldMonth?: string;
  vpiOldValue?: number;
  vpiNewMonth?: string;
  vpiNewValue?: number;
  syncToContract?: boolean;
}

export async function createRentPeriod(params: CreateRentPeriodParams): Promise<RentPeriod | null> {
  const { data: period, error: insertError } = await supabase
    .from("rent_history")
    .insert({
      contract_id: params.contractId,
      user_id: params.userId,
      effective_date: params.effectiveDate,
      cold_rent: params.coldRent,
      utilities: params.utilities,
      reason: params.reason,
      status: params.status,
      notes: params.notes || "",
      vpi_old_month: params.vpiOldMonth || null,
      vpi_old_value: params.vpiOldValue ?? null,
      vpi_new_month: params.vpiNewMonth || null,
      vpi_new_value: params.vpiNewValue ?? null,
    })
    .select()
    .maybeSingle();

  if (insertError || !period) return null;

  if (params.syncToContract && params.status === "active") {
    const today = new Date().toISOString().split("T")[0];
    if (params.effectiveDate <= today) {
      await supabase
        .from("rental_contracts")
        .update({
          monthly_rent: params.coldRent,
          base_rent: params.coldRent,
          cold_rent: params.coldRent,
          total_rent: params.coldRent + params.utilities,
        })
        .eq("id", params.contractId);
    }
  }

  return period;
}

export async function deletePlannedPeriod(periodId: string): Promise<boolean> {
  const { error } = await supabase
    .from("rent_history")
    .delete()
    .eq("id", periodId)
    .eq("status", "planned");

  return !error;
}
