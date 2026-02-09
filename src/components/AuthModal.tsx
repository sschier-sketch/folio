import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/Button";
interface AuthModalProps {
  onClose: () => void;
}
export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Ungültige E-Mail oder Passwort");
        } else if (error.message.includes("User already registered")) {
          setError("Diese E-Mail ist bereits registriert");
        } else {
          setError(error.message);
        }
      } else {
        if (!isLogin) {
          setError("");
        }
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {" "}
      <div className="bg-white rounded-md w-full max-w-md relative">
        {" "}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-400 transition-colors"
        >
          {" "}
          <X className="w-6 h-6" />{" "}
        </button>{" "}
        <div className="p-8">
          {" "}
          <div className="flex items-center mb-6">
            {" "}
            <img
              src="/rentably-logo.svg"
              alt="Rentably"
              className="h-8 w-auto"
            />{" "}
          </div>{" "}
          <h2 className="text-2xl font-bold text-dark mb-2">
            {" "}
            {isLogin ? "Willkommen zurück" : "Account erstellen"}{" "}
          </h2>{" "}
          <p className="text-gray-400 mb-6">
            {" "}
            {isLogin
              ? "Melden Sie sich an, um auf Ihr Dashboard zuzugreifen"
              : "Erstellen Sie einen kostenlosen Account und starten Sie sofort"}{" "}
          </p>{" "}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {" "}
              {error}{" "}
            </div>
          )}{" "}
          <form onSubmit={handleSubmit} className="space-y-4">
            {" "}
            <div>
              {" "}
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                {" "}
                E-Mail{" "}
              </label>{" "}
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue transition-all"
                placeholder="ihre@email.de"
                required
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                {" "}
                Passwort{" "}
              </label>{" "}
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />{" "}
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-300">
                  Mindestens 6 Zeichen
                </p>
              )}{" "}
            </div>{" "}
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              fullWidth
            >
              {" "}
              {loading
                ? "Bitte warten..."
                : isLogin
                  ? "Anmelden"
                  : "Account erstellen"}{" "}
            </Button>{" "}
          </form>{" "}
          <div className="mt-6 text-center">
            {" "}
            <Button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              variant="text-danger"
            >
              {" "}
              {isLogin
                ? "Noch kein Account? Jetzt registrieren"
                : "Bereits registriert? Jetzt anmelden"}{" "}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
