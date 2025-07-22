import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nbdygecyqbdujxndujdf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHlnZWN5cWJkdWp4bmR1amRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NDY3ODEsImV4cCI6MjA2NjQyMjc4MX0.kxgBmphQ0eY2Yv37sHSs_ychcUZib3FJlfZFolLfJtw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

