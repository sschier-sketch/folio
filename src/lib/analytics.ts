export async function trackSignupSuccess(): Promise<void> {
  if (typeof window === "undefined") return;

  const key = "rentably_signup_success_fired";
  try {
    if (window.sessionStorage?.getItem(key) === "1") return;
    window.sessionStorage?.setItem(key, "1");
  } catch {
    // sessionStorage may be blocked in rare cases
  }

  const eventId =
    typeof window.crypto !== "undefined" &&
    typeof (window.crypto as Crypto & { randomUUID?: () => string }).randomUUID === "function"
      ? (window.crypto as Crypto & { randomUUID: () => string }).randomUUID()
      : String(Date.now());

  (window as unknown as Record<string, unknown[]>).dataLayer =
    (window as unknown as Record<string, unknown[]>).dataLayer || [];
  (window as unknown as Record<string, Record<string, unknown>[]>).dataLayer.push({
    event: "rentably_signup_success",
    event_id: eventId,
  });

  try {
    const script = (window as unknown as Record<string, string>).__RENTABLY_SIGNUP_CUSTOM_SCRIPT__;
    if (typeof script === "string" && script.trim().length > 0) {
      new Function(script)();
    }
  } catch (err) {
    console.error("Custom Signup Tracking Script error:", err);
  }
}
