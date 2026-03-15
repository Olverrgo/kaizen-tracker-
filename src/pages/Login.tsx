import { useState } from 'react';
import { Target, Mail, Lock, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { signIn, signUp, signInWithGoogle, loading, error } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Kaizen Tracker</h1>
          <p className="text-gray-500 mt-2">
            Mejora continua • Meta: $500/dia
          </p>
        </div>

        {/* Auth Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesion'}
          </h2>

          {/* Error Message */}
          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {error || localError}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading
                ? 'Cargando...'
                : isSignUp
                ? 'Crear cuenta'
                : 'Iniciar sesion'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o continuar con</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Chrome className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Google</span>
          </button>

          {/* Toggle Sign Up / Sign In */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignUp ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              {isSignUp ? 'Inicia sesion' : 'Registrate'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Kaizen: Pequenos cambios, grandes resultados
        </p>
      </div>
    </div>
  );
}
