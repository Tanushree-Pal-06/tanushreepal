/**
 * DeskFlow - Support Ticket System
 * Supabase Client Configuration
 * 
 * Author: Tanushree Pal
 * Roll No: 0827AL231132
 * Email: tanushreepal230408@acropolis.in
 * DOB: 06/10/2005
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables are not set.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: { persistSession: false },
  }
);
