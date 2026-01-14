import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldOff, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function AccountBanned() {
  const { banReason, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      signOut().then(() => {
        navigate("/");
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, [signOut, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-dark mb-3">
            Account gesperrt
          </h1>

          <p className="text-gray-600 mb-6">
            Ihr Account wurde aus Sicherheitsgründen gesperrt und Sie können sich nicht mehr anmelden.
          </p>

          {banReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-red-900 mb-1">Grund:</p>
              <p className="text-sm text-red-700">{banReason}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <Mail className="w-5 h-5 text-primary-blue mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-dark mb-1">
                  Fragen oder Einspruch?
                </p>
                <p className="text-sm text-gray-600">
                  Wenden Sie sich an unser Support-Team unter{" "}
                  <a
                    href="mailto:hallo@rentab.ly"
                    className="text-primary-blue hover:underline"
                  >
                    hallo@rentab.ly
                  </a>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-dark text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Abmelden
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Sie werden automatisch in 10 Sekunden abgemeldet
          </p>
        </div>
      </div>
    </div>
  );
}
