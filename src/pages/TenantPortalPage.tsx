import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TenantLogin from "../components/TenantLogin";
import TenantPortalMain from "../components/tenant-portal/TenantPortalMain";

export default function TenantPortalPage() {
  const { userId } = useParams<{ userId: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem(`tenant_session_${userId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const expiryTime = new Date(session.expiry).getTime();
      if (Date.now() < expiryTime) {
        setIsAuthenticated(true);
        setTenantId(session.tenantId);
      } else {
        localStorage.removeItem(`tenant_session_${userId}`);
      }
    }
  }, [userId]);

  const handleLoginSuccess = (id: string, email: string) => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    localStorage.setItem(
      `tenant_session_${userId}`,
      JSON.stringify({ tenantId: id, email, expiry: expiry.toISOString() })
    );
    setIsAuthenticated(true);
    setTenantId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem(`tenant_session_${userId}`);
    setIsAuthenticated(false);
    setTenantId(null);
  };

  if (!isAuthenticated || !tenantId) {
    return (
      <TenantLogin landlordId={userId!} onLoginSuccess={handleLoginSuccess} />
    );
  }

  return <TenantPortalMain tenantId={tenantId} onLogout={handleLogout} />;
}
