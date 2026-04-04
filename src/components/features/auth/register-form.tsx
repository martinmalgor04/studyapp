'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { GoogleAuthButton } from './google-auth-button';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/login');
      }
    } catch {
      setError('Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-error-container/20 p-4">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      <div className="space-y-4 rounded-md shadow-sm">
        <div>
          <label htmlFor="name" className="sr-only">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="relative block w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:z-10 focus:border-tertiary focus:outline-none focus:ring-tertiary/30 sm:text-sm"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:z-10 focus:border-tertiary focus:outline-none focus:ring-tertiary/30 sm:text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="relative block w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:z-10 focus:border-tertiary focus:outline-none focus:ring-tertiary/30 sm:text-sm"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-tertiary px-4 py-2 text-sm font-medium text-on-tertiary hover:bg-tertiary-dim focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface px-2 text-on-surface-variant">O continuar con</span>
        </div>
      </div>

      <GoogleAuthButton label="Registrarse con Google" />

      <div className="text-center text-sm">
        <span className="text-on-surface-variant">¿Ya tienes cuenta? </span>
        <Link href="/login" className="font-medium text-tertiary hover:text-tertiary-dim">
          Inicia sesión
        </Link>
      </div>
    </form>
  );
}
