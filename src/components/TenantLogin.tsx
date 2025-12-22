import { useState } from 'react';
import { LogIn, Key, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword, generateSalt, verifyPassword } from '../lib/passwordUtils';

interface TenantLoginProps {
  landlordId: string;
  onLoginSuccess: (tenantId: string, tenantEmail: string) => void;
}

export default function TenantLogin({ landlordId, onLoginSuccess }: TenantLoginProps) {
  const [mode, setMode] = useState<'login' | 'setup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: allTenants, error: allFetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('email', email.toLowerCase().trim());

      if (allFetchError) throw allFetchError;

      if (!allTenants || allTenants.length === 0) {
        setError('Kein Mieter mit dieser E-Mail-Adresse gefunden. Bitte wenden Sie sich an Ihren Vermieter.');
        setLoading(false);
        return;
      }

      const tenant = allTenants.find(t => t.user_id === landlordId);

      if (!tenant) {
        setError('Diese E-Mail-Adresse ist für einen anderen Vermieter registriert. Bitte verwenden Sie den korrekten Portal-Link, den Sie von Ihrem Vermieter erhalten haben.');
        setLoading(false);
        return;
      }

      const tenants = tenant;

      if (!tenants.password_hash || !tenants.password_salt) {
        setMode('setup');
        setLoading(false);
        return;
      }

      const isValid = await verifyPassword(
        password,
        tenants.password_salt,
        tenants.password_hash
      );

      if (!isValid) {
        setError('Falsches Passwort.');
        setLoading(false);
        return;
      }

      await supabase
        .from('tenants')
        .update({ last_login: new Date().toISOString() })
        .eq('id', tenants.id);

      onLoginSuccess(tenants.id, tenants.email);
    } catch (err) {
      console.error('Login error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    try {
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', landlordId)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!tenant) {
        setError('Kein Mieter mit dieser E-Mail-Adresse gefunden.');
        setLoading(false);
        return;
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);

      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          password_hash: hash,
          password_salt: salt,
          last_login: new Date().toISOString(),
        })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      onLoginSuccess(tenant.id, tenant.email);
    } catch (err) {
      console.error('Setup password error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    try {
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', landlordId)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!tenant) {
        setError('Kein Mieter mit dieser E-Mail-Adresse gefunden.');
        setLoading(false);
        return;
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);

      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          password_hash: hash,
          password_salt: salt,
        })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      setSuccessMessage('Passwort erfolgreich zurückgesetzt! Sie können sich jetzt anmelden.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMode('login');
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mieter-Portal</h1>
          <p className="text-slate-600">
            {mode === 'login' && 'Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an'}
            {mode === 'setup' && 'Richten Sie Ihr Passwort ein'}
            {mode === 'reset' && 'Setzen Sie Ihr Passwort zurück'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
            {successMessage}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="ihre.email@beispiel.de"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Passwort
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError('');
                  setPassword('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Passwort vergessen?
              </button>
            </div>
          </form>
        )}

        {mode === 'setup' && (
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm mb-4">
              Sie haben noch kein Passwort eingerichtet. Bitte wählen Sie ein sicheres Passwort.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Neues Passwort
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Mindestens 6 Zeichen"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Passwort wiederholen"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Einrichten...' : 'Passwort einrichten'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-slate-600 hover:text-slate-700 transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm mb-4">
              Geben Sie Ihre E-Mail-Adresse und ein neues Passwort ein.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="ihre.email@beispiel.de"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Neues Passwort
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Mindestens 6 Zeichen"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Passwort wiederholen"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Zurücksetzen...' : 'Passwort zurücksetzen'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-slate-600 hover:text-slate-700 transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
