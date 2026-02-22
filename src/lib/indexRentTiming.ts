export type TimingStatus = "NOW_OPTIMAL" | "BEFORE_WINDOW" | "MISSED_WINDOW" | "UNKNOWN";

export interface DeliveryTiming {
  timingStatus: TimingStatus;
  nextEarliestEffectiveFrom: string;
  serviceWindowStart: string;
  serviceWindowEnd: string;
  nextEffectiveIfSendToday: string;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function lastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

export function computeDeliveryTiming(
  possibleSince: string | null | undefined,
  today?: Date
): DeliveryTiming | null {
  if (!possibleSince) return null;

  const now = today || new Date();
  const todayStr = toDateStr(now);

  const possibleDate = new Date(possibleSince);
  if (isNaN(possibleDate.getTime())) return null;

  const nextEarliestEffective = firstOfMonth(possibleDate);
  if (nextEarliestEffective < possibleDate) {
    nextEarliestEffective.setMonth(nextEarliestEffective.getMonth() + 1);
  }

  const windowMonth = new Date(nextEarliestEffective.getFullYear(), nextEarliestEffective.getMonth() - 2, 1);
  const serviceWindowStart = firstOfMonth(windowMonth);
  const serviceWindowEnd = lastOfMonth(windowMonth);

  const sendTodayEffectiveMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const nextEffectiveIfSendToday = toDateStr(sendTodayEffectiveMonth);

  const swStartStr = toDateStr(serviceWindowStart);
  const swEndStr = toDateStr(serviceWindowEnd);

  let timingStatus: TimingStatus;
  if (todayStr >= swStartStr && todayStr <= swEndStr) {
    timingStatus = "NOW_OPTIMAL";
  } else if (todayStr < swStartStr) {
    timingStatus = "BEFORE_WINDOW";
  } else {
    timingStatus = "MISSED_WINDOW";
  }

  return {
    timingStatus,
    nextEarliestEffectiveFrom: toDateStr(nextEarliestEffective),
    serviceWindowStart: swStartStr,
    serviceWindowEnd: swEndStr,
    nextEffectiveIfSendToday,
  };
}

export function formatDateDE(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
