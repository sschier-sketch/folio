import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isBanned } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {" "}
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />{" "}
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (isBanned) {
    return <Navigate to="/account-banned" replace />;
  }
  return <>{children}</>;
}
