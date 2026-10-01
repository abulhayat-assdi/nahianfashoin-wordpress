// Re-export the singleton client for legacy imports from '@/lib/supabase'
import { createClient } from './supabase/client';

export const supabase = createClient();
