// Server auth wrapper — replaces Supabase server client with JWT-based session reading

import { getServerUser } from '@/lib/auth';

export async function createClient(type: 'public' | 'admin' = 'public') {
  return {
    auth: {
      getUser: async () => {
        const user = await getServerUser(type);
        if (!user) return { data: { user: null }, error: { message: 'Not authenticated' } };
        return { data: { user }, error: null };
      },

      getSession: async () => {
        const user = await getServerUser(type);
        if (!user) return { data: { session: null }, error: null };
        return { data: { session: { user } }, error: null };
      },
    },
  };
}

export const createPublicClient = () => createClient('public');
export const createAdminClient = () => createClient('admin');
