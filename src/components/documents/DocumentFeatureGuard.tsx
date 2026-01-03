import { ReactNode } from "react";
import { useSubscription } from "../../hooks/useSubscription";

interface DocumentFeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function DocumentFeatureGuard({
  feature,
  children,
  fallback,
}: DocumentFeatureGuardProps) {
  const { isPro } = useSubscription();

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
}
