import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xomfckumrvrsuvamqrcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvbWZja3VtcnZyc3V2YW1xcmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MTA5MzksImV4cCI6MjA2NDE4NjkzOX0.rkhj9tm0U8h_qBHwGAL6ie6qQecaJ2FNEChi5gw6P8s';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}); 