import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://zlyrofuwxdabohjerrqq.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseXJvZnV3eGRhYm9oamVycnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzAyODIsImV4cCI6MjEwNzA0NjI4Mn0.eFA74_xEk5qhEnoY1WnxcNGPDHaG20b62LYCRPiRMO0';

export const supabase = createClient(supabaseUrl, supabaseKey);
