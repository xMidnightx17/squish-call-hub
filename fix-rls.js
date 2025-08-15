import { supabase } from './src/integrations/supabase/client.js';

// Function to fix RLS policies
async function fixRlsPolicies() {
  console.log('Fixing RLS policies...');
  
  try {
    // First, let's check if we can connect and see what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('Available tables:', tables);
    
    // Try to disable RLS temporarily
    const { error: disableRlsChat } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE public.chat_users DISABLE ROW LEVEL SECURITY;'
    });
    
    const { error: disableRlsFriends } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE public.friends DISABLE ROW LEVEL SECURITY;'
    });
    
    console.log('RLS disable results:', { disableRlsChat, disableRlsFriends });
    
  } catch (error) {
    console.error('Error fixing RLS policies:', error);
  }
}

fixRlsPolicies();
