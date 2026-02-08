import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TenantLogin from "../components/TenantLogin";
import TenantPortalMain from "../components/tenant-portal/TenantPortalMain";

const SESSION_KEY = "tenant_session";

export default function TenantPortalPage() {
  const { userId } = useParams<{ userId: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const expiryTime = new Date(session.expiry).getTime();
      if (Date.now() < expiryTime) {
        setIsAuthenticated(true);
        setTenantId(session.tenantId);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    if (userId) {
      const legacySession = localStorage.getItem(`tenant_session_${userId}`);
      if (legacySession && !savedSession) {
        const session = JSON.parse(legacySession);
        const expiryTime = new Date(session.expiry).getTime();
        if (Date.now() < expiryTime) {
          localStorage.setItem(SESSION_KEY, legacySession);
          setIsAuthenticated(true);
          setTenantId(session.tenantId);
        }
        localStorage.removeItem(`tenant_session_${userId}`);
      }
    }
  }, [userId]);

  const handleLoginSuccess = (id: string, email: string) => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ tenantId: id, email, expiry: expiry.toISOString() })
    );
    setIsAuthenticated(true);
    setTenantId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setTenantId(null);
  };

  if (!isAuthenticated || !tenantId) {
    return (
      <TenantLogin landlordId={userId} onLoginSuccess={handleLoginSuccess} />
    );
  }

  return <TenantPortalMain tenantId={tenantId} onLogout={handleLogout} />;
}
