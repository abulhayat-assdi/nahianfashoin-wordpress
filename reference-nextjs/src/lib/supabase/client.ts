// Auth client wrapper — replaces Supabase browser client with JWT-based API calls

export function createClient(type: 'public' | 'admin' = 'public') {
  const loginEndpoint = type === 'admin' ? '/api/auth/admin/login' : '/api/auth/login';
  const logoutEndpoint = type === 'admin' ? '/api/auth/admin/logout' : '/api/auth/logout';
  const sessionEndpoint = type === 'admin' ? '/api/auth/admin/session' : '/api/auth/session';

  return {
    auth: {
      getSession: async () => {
        try {
          const res = await fetch(sessionEndpoint, { credentials: 'include' });
          if (!res.ok) return { data: { session: null }, error: null };
          const data = await res.json();
          return { data: { session: data.user ? { user: data.user } : null }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      },

      getUser: async () => {
        try {
          const res = await fetch(sessionEndpoint, { credentials: 'include' });
          if (!res.ok) return { data: { user: null }, error: null };
          const data = await res.json();
          return { data: { user: data.user || null }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      },

      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const res = await fetch(loginEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: { message: data.error || 'Login failed' } };
        return { data: { user: data.user, session: { user: data.user } }, error: null };
      },

      signOut: async () => {
        await fetch(logoutEndpoint, { method: 'POST', credentials: 'include' });
        return { error: null };
      },

      onAuthStateChange: (_callback: (event: string, session: any) => void) => {
        // No realtime — returns a no-op subscription
        return {
          data: {
            subscription: { unsubscribe: () => {} },
          },
        };
      },
    },
  };
}

export const createPublicClient = () => createClient('public');
export const createAdminClient = () => createClient('admin');
