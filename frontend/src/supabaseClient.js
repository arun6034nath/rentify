import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrffiievbajjzvuegyzm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZmZpaWV2YmFqanp2dWVneXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzkzNDgsImV4cCI6MjA5NDUxNTM0OH0.YjGRuzJOzWStENnQc_-Ec7V0rtTZaZbE8HyCxRtZxjs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
